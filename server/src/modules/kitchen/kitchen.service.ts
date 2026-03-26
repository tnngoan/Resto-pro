import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { KitchenGateway } from './kitchen.gateway';
import { OrderStatus, OrderItemStatus, KitchenStation } from '@prisma/client';

@Injectable()
export class KitchenService {
  constructor(
    private prisma: PrismaService,
    private kitchenGateway: KitchenGateway,
  ) {}

  /**
   * Get all active kitchen orders (CONFIRMED, PREPARING, READY status)
   * grouped by station with optional station filter
   */
  async getKitchenOrders(restaurantId: string, station?: KitchenStation) {
    const where: any = {
      restaurantId,
      status: {
        in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY],
      },
    };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                nameIt: true,
                prepTimeMinutes: true,
                station: true,
              },
            },
            preparedByUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        table: {
          select: {
            id: true,
            name: true,
            zone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Filter items by station if specified, else return all
    const processedOrders = orders.map((order) => {
      let items = order.orderItems;

      if (station) {
        items = items.filter((item) => item.station === station);
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        isRush: order.isRush,
        isVip: order.isVip,
        covers: order.covers,
        table: order.table,
        createdAt: order.createdAt,
        items: items.map((item) => ({
          id: item.id,
          menuItem: {
            id: item.menuItem.id,
            name: item.menuItem.name,
            nameIt: item.menuItem.nameIt,
            prepTimeMinutes: item.menuItem.prepTimeMinutes,
            station: item.menuItem.station,
          },
          quantity: item.quantity,
          status: item.status,
          modifications: item.modifications,
          notes: item.notes,
          preparedAt: item.preparedAt,
          preparedBy: item.preparedByUser
            ? {
                id: item.preparedByUser.id,
                name: item.preparedByUser.name,
              }
            : null,
        })),
      };
    });

    // Filter out orders with no items if station was specified
    const filteredOrders = station
      ? processedOrders.filter((order) => order.items.length > 0)
      : processedOrders;

    // Group by station if no specific station filter
    if (!station) {
      const grouped: Record<string, any[]> = {};

      for (const order of filteredOrders) {
        for (const item of order.items) {
          const stationKey = item.menuItem.station;
          if (!grouped[stationKey]) {
            grouped[stationKey] = [];
          }

          const existingOrder = grouped[stationKey].find((o) => o.id === order.id);
          if (existingOrder) {
            existingOrder.items.push(item);
          } else {
            grouped[stationKey].push({
              ...order,
              items: [item],
            });
          }
        }
      }

      return {
        data: grouped,
      };
    }

    return {
      data: filteredOrders,
    };
  }

  /**
   * Get orders by specific station
   */
  async getOrdersByStation(restaurantId: string, station: KitchenStation) {
    return this.getKitchenOrders(restaurantId, station);
  }

  /**
   * Update order item status and broadcast via WebSocket
   */
  async updateItemStatus(orderId: string, itemId: string, status: OrderItemStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.orderId !== orderId) {
      throw new NotFoundException('Order item not found');
    }

    const updated = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: {
        status,
        ...(status === OrderItemStatus.READY && {
          preparedAt: new Date(),
        }),
        ...(status === OrderItemStatus.SERVED && {
          servedAt: new Date(),
        }),
      },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            nameIt: true,
          },
        },
      },
    });

    // Broadcast item status change
    this.kitchenGateway.broadcastItemStatusChanged(order.restaurantId, {
      orderId,
      itemId,
      itemName: updated.menuItem.name,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });

    // Check if all items are ready and auto-update order
    const allItems = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    const allReady = allItems.every(
      (oi) =>
        oi.status === OrderItemStatus.READY ||
        oi.status === OrderItemStatus.SERVED ||
        oi.status === OrderItemStatus.CANCELLED,
    );

    if (allReady && order.status === OrderStatus.PREPARING) {
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.READY },
      });

      // Broadcast order status change
      this.kitchenGateway.broadcastOrderUpdate(order.restaurantId, {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt,
      });
    }

    return {
      data: {
        id: updated.id,
        status: updated.status,
        preparedAt: updated.preparedAt,
      },
    };
  }

  /**
   * Mark single item as ready
   */
  async markItemReady(orderId: string, itemId: string) {
    return this.updateItemStatus(orderId, itemId, OrderItemStatus.READY);
  }

  /**
   * Mark single item as served
   */
  async markItemServed(orderId: string, itemId: string) {
    return this.updateItemStatus(orderId, itemId, OrderItemStatus.SERVED);
  }

  /**
   * Bump order - mark all items as READY and move order to top
   */
  async bumpOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update all pending/preparing items to ready
    await this.prisma.orderItem.updateMany({
      where: {
        orderId,
        status: {
          in: [OrderItemStatus.PENDING, OrderItemStatus.PREPARING],
        },
      },
      data: {
        status: OrderItemStatus.READY,
        preparedAt: new Date(),
      },
    });

    // Update order status to READY
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.READY,
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Broadcast bump event
    this.kitchenGateway.broadcastOrderUpdate(order.restaurantId, {
      id: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      bumped: true,
      updatedAt: updated.updatedAt,
    });

    return {
      data: {
        id: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.status,
        itemsReady: updated.orderItems.length,
      },
    };
  }

  /**
   * Mark menu item as 86'd (out of stock)
   */
  async markOutOfStock(menuItemId: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    const updated = await this.prisma.menuItem.update({
      where: { id: menuItemId },
      data: { is86d: true },
    });

    // Broadcast item out of stock
    this.kitchenGateway.broadcastItemStatusChanged(item.restaurantId, {
      menuItemId: updated.id,
      menuItemName: updated.name,
      is86d: true,
      updatedAt: updated.updatedAt,
    });

    return {
      data: {
        id: updated.id,
        name: updated.name,
        is86d: updated.is86d,
      },
    };
  }
}
