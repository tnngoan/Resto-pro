import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { KitchenGateway } from '../kitchen/kitchen.gateway';
import { InventoryService } from '../inventory/inventory.service';
import { CreateOrderDto, OrderItemInput } from './dto/create-order.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaymentDto } from './dto/payment.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrderStatus, OrderItemStatus, TableStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger('OrdersService');

  constructor(
    private prisma: PrismaService,
    private readonly kitchenGateway: KitchenGateway,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Valid order status transitions
   */
  private readonly validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.PLACED, OrderStatus.CANCELLED],
    [OrderStatus.PLACED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
    [OrderStatus.READY]: [OrderStatus.SERVED, OrderStatus.CANCELLED],
    [OrderStatus.SERVED]: [OrderStatus.PAID],
    [OrderStatus.PAID]: [OrderStatus.COMPLETED],
    [OrderStatus.COMPLETED]: [],
    [OrderStatus.CANCELLED]: [],
  };

  /**
   * Create a new order with items
   */
  async createOrder(restaurantId: string, data: CreateOrderDto) {
    // Fetch restaurant to get VAT rate
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Fetch all menu items for the order
    const menuItemIds = data.items.map((item) => item.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('Some menu items not found or invalid');
    }

    // Calculate totals (all in VND as integers)
    let subtotal = 0;
    const orderItemsData: any[] = [];

    for (const item of data.items) {
      const menuItem = menuItems.find((m) => m.id === item.menuItemId);
      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        nameIt: menuItem.nameIt,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice: itemTotal,
        station: menuItem.station,
        modifications: item.modifications || [],
        notes: item.notes,
        status: OrderItemStatus.PENDING,
        sortOrder: orderItemsData.length,
      });
    }

    const discountAmount = data.discountAmount || 0;
    const vatAmount = Math.round((subtotal - discountAmount) * (restaurant.vatRate / 100));
    const total = subtotal - discountAmount + vatAmount;

    // If table is specified, verify it belongs to restaurant and update its status
    if (data.tableId) {
      const table = await this.prisma.table.findUnique({
        where: { id: data.tableId },
      });

      if (!table || table.restaurantId !== restaurantId) {
        throw new BadRequestException('Invalid table for this restaurant');
      }
    }

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        restaurantId,
        tableId: data.tableId,
        status: OrderStatus.PLACED,
        subtotal,
        vatAmount,
        discountAmount,
        total,
        notes: data.notes,
        covers: data.covers || 1,
        isRush: data.isRush || false,
        isVip: data.isVip || false,
        serverId: data.serverId,
        customerId: data.customerId,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                nameIt: true,
                station: true,
              },
            },
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
    });

    // Update table status to OCCUPIED if assigned
    if (data.tableId) {
      await this.prisma.table.update({
        where: { id: data.tableId },
        data: {
          status: TableStatus.OCCUPIED,
          currentOrderId: order.id,
          currentCovers: data.covers || 1,
          seatedAt: new Date(),
        },
      });
    }

    // ── WebSocket: Emit order:new so the KDS board shows it immediately ──
    this.kitchenGateway.emitNewOrder(restaurantId, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableId: order.table?.id,
      tableName: order.table?.name,
      items: order.orderItems.map((item: any) => ({
        id: item.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        notes: item.notes,
        station: item.menuItem.station,
        status: item.status,
      })),
      placedAt: order.createdAt.toISOString(),
    });

    // Also emit status_changed for dashboard consistency
    this.kitchenGateway.emitOrderStatusChanged(restaurantId, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableId: order.table?.id,
      tableName: order.table?.name,
      status: OrderStatus.PLACED,
      previousStatus: 'NEW',
      updatedAt: order.createdAt.toISOString(),
    });

    return {
      data: this.formatOrder(order),
    };
  }

  /**
   * Get orders with pagination and filtering
   */
  async getOrders(restaurantId: string, filters?: OrderQueryDto) {
    const limit = filters?.limit ?? 20;
    const where: any = {
      restaurantId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.tableId) {
      where.tableId = filters.tableId;
    }

    // Date range filtering
    if (filters?.dateFrom) {
      where.createdAt = {
        gte: new Date(filters.dateFrom),
      };
    }

    if (filters?.dateTo) {
      if (where.createdAt) {
        where.createdAt.lte = new Date(filters.dateTo);
      } else {
        where.createdAt = {
          lte: new Date(filters.dateTo),
        };
      }
    }

    // Cursor-based pagination
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
                station: true,
              },
            },
          },
        },
        table: {
          select: {
            id: true,
            name: true,
            zone: true,
          },
        },
        server: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1,
      ...(filters?.cursor && {
        skip: 1,
        cursor: {
          id: filters.cursor,
        },
      }),
    });

    const hasMore = orders.length > limit;
    const data = hasMore ? orders.slice(0, -1) : orders;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return {
      data: data.map((order) => this.formatOrder(order)),
      meta: {
        total: data.length,
        hasMore,
        nextCursor,
      },
    };
  }

  /**
   * Get single order
   */
  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                nameIt: true,
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
        },
        table: {
          select: {
            id: true,
            name: true,
            zone: true,
          },
        },
        server: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      data: this.formatOrder(order),
    };
  }

  /**
   * Update order status with state machine validation
   */
  async updateOrderStatus(id: string, statusData: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate transition
    const validNextStatuses = this.validTransitions[order.status];
    if (!validNextStatuses.includes(statusData.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${statusData.status}`,
      );
    }

    // Capture previous status before the update
    const previousStatus = order.status;

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: statusData.status,
        ...(statusData.status === OrderStatus.PAID && {
          paidAt: new Date(),
        }),
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                nameIt: true,
                station: true,
              },
            },
          },
        },
        table: true,
      },
    });

    // If order is paid, release the table
    if (statusData.status === OrderStatus.PAID && updated.tableId) {
      await this.prisma.table.update({
        where: { id: updated.tableId },
        data: {
          status: TableStatus.AVAILABLE,
          currentOrderId: null,
          currentCovers: 0,
          seatedAt: null,
        },
      });
    }

    // ── WebSocket: Emit status change to all relevant rooms ──
    this.kitchenGateway.emitOrderStatusChanged(updated.restaurantId, {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      tableId: updated.table?.id,
      tableName: updated.table?.name,
      status: statusData.status,
      previousStatus,
      updatedAt: updated.updatedAt.toISOString(),
    });

    // ── Inventory: Deduct ingredients when kitchen starts preparing ──
    // Idempotency guard: only deduct once per order (guards against retries/bugs)
    if (statusData.status === OrderStatus.PREPARING && !order.inventoryDeducted) {
      try {
        await this.deductOrderInventory(updated);

        // Mark order as deducted — prevents double-deduction on retries
        await this.prisma.order.update({
          where: { id },
          data: {
            inventoryDeducted: true,
            inventoryDeductedAt: new Date(),
          },
        });
      } catch (error: any) {
        // CRITICAL: Never block the kitchen for inventory errors.
        // The order status is already updated — just log and continue.
        this.logger.error(
          `Failed to deduct inventory for order ${id}: ${error?.message || error}`,
          error?.stack,
        );
      }
    }

    return {
      data: this.formatOrder(updated),
    };
  }

  /**
   * Update individual order item status
   */
  async updateOrderItemStatus(itemId: string, status: OrderItemStatus) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    // Mark as prepared if moving to READY
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
    });

    // Check if all items in the order are ready
    const order = await this.prisma.order.findUnique({
      where: { id: item.orderId },
      include: {
        orderItems: true,
        table: true,
      },
    });

    // ── WebSocket: Emit item-level status change ──
    this.kitchenGateway.emitOrderItemStatusChanged(order.restaurantId, {
      orderId: order.id,
      orderItemId: updated.id,
      menuItemName: updated.name || 'Unknown',
      status,
      tableId: order.table?.id,
    });

    // Auto-update order status if all items are ready
    if (
      order.status === OrderStatus.PREPARING &&
      order.orderItems.every(
        (oi) =>
          oi.status === OrderItemStatus.READY ||
          oi.status === OrderItemStatus.SERVED ||
          oi.status === OrderItemStatus.CANCELLED,
      )
    ) {
      const previousOrderStatus = order.status;

      await this.prisma.order.update({
        where: { id: item.orderId },
        data: {
          status: OrderStatus.READY,
        },
      });

      // ── WebSocket: Emit auto-READY status change ──
      this.kitchenGateway.emitOrderStatusChanged(order.restaurantId, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableId: order.table?.id,
        tableName: order.table?.name,
        status: OrderStatus.READY,
        previousStatus: previousOrderStatus,
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      data: {
        id: updated.id,
        status: updated.status,
        preparedAt: updated.preparedAt,
        servedAt: updated.servedAt,
      },
    };
  }

  /**
   * Add item to existing order
   */
  async addItemToOrder(orderId: string, data: AddOrderItemDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Cannot add items to completed or cancelled orders
    if ([OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException('Cannot add items to this order');
    }

    // Fetch menu item
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: data.menuItemId },
    });

    if (!menuItem || menuItem.restaurantId !== order.restaurantId) {
      throw new BadRequestException('Menu item not found');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: order.restaurantId },
    });

    const itemTotal = menuItem.price * data.quantity;
    const newSubtotal = order.subtotal + itemTotal;
    const newVatAmount = Math.round((newSubtotal - order.discountAmount) * (restaurant.vatRate / 100));
    const newTotal = newSubtotal - order.discountAmount + newVatAmount;

    // Add item to order
    await this.prisma.orderItem.create({
      data: {
        orderId,
        menuItemId: menuItem.id,
        name: menuItem.name,
        nameIt: menuItem.nameIt,
        quantity: data.quantity,
        unitPrice: menuItem.price,
        totalPrice: itemTotal,
        station: menuItem.station,
        modifications: data.modifications || [],
        notes: data.notes,
        sortOrder: order.orderItems.length,
      },
    });

    // Update order totals
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal: newSubtotal,
        vatAmount: newVatAmount,
        total: newTotal,
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                nameIt: true,
                station: true,
              },
            },
          },
        },
        table: true,
      },
    });

    // ── WebSocket: Emit updated order so kitchen sees the new item ──
    this.kitchenGateway.emitOrderStatusChanged(order.restaurantId, {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      tableId: updated.table?.id,
      tableName: updated.table?.name,
      status: updated.status,
      previousStatus: updated.status, // status didn't change, but items did
      updatedAt: updated.updatedAt.toISOString(),
    });

    return {
      data: this.formatOrder(updated),
    };
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: string, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.PAID || order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel paid or completed orders');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledReason: reason,
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                nameIt: true,
                station: true,
              },
            },
          },
        },
        table: true,
      },
    });

    // Release table if occupied
    if (updated.tableId) {
      await this.prisma.table.update({
        where: { id: updated.tableId },
        data: {
          status: TableStatus.AVAILABLE,
          currentOrderId: null,
          currentCovers: 0,
          seatedAt: null,
        },
      });
    }

    // ── WebSocket: Emit cancellation to all rooms ──
    this.kitchenGateway.emitOrderStatusChanged(updated.restaurantId, {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      tableId: updated.table?.id,
      tableName: updated.table?.name,
      status: OrderStatus.CANCELLED,
      previousStatus: order.status,
      updatedAt: updated.updatedAt.toISOString(),
    });

    return {
      data: this.formatOrder(updated),
    };
  }

  /**
   * Process payment
   */
  async processPayment(id: string, data: PaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.SERVED) {
      throw new BadRequestException('Order must be served before payment');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.PAID,
        paymentMethod: data.paymentMethod,
        paidAt: new Date(),
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                nameIt: true,
                station: true,
              },
            },
          },
        },
        table: true,
      },
    });

    // Release table
    if (updated.tableId) {
      await this.prisma.table.update({
        where: { id: updated.tableId },
        data: {
          status: TableStatus.AVAILABLE,
          currentOrderId: null,
          currentCovers: 0,
          seatedAt: null,
        },
      });
    }

    // Update daily revenue cache for dashboard
    await this.updateDailyRevenue(order.restaurantId, updated);

    // ── WebSocket: Emit payment/status change to all rooms ──
    this.kitchenGateway.emitOrderStatusChanged(updated.restaurantId, {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      tableId: updated.table?.id,
      tableName: updated.table?.name,
      status: OrderStatus.PAID,
      previousStatus: order.status,
      updatedAt: updated.updatedAt.toISOString(),
    });

    return {
      data: this.formatOrder(updated),
    };
  }

  /**
   * Deduct ingredients for all non-cancelled items in this order.
   *
   * CRITICAL BUSINESS RULE: Never block the kitchen.
   * - Each item deduction is independent — one failure must NOT prevent others.
   * - Errors are logged but never re-thrown to the caller.
   * - Manual reconciliation is always better than stopping orders.
   *
   * Uses Promise.allSettled so all deductions run in parallel and failures
   * are isolated per-item.
   */
  private async deductOrderInventory(
    order: { id: string; restaurantId: string; orderItems: Array<{ menuItemId: string; quantity: number; status: string }> },
  ): Promise<void> {
    // Filter out cancelled items — they should not consume stock
    const activeItems = order.orderItems.filter(
      (item) => item.status !== OrderItemStatus.CANCELLED,
    );

    if (activeItems.length === 0) {
      this.logger.warn(`Order ${order.id} has no active items to deduct stock for.`);
      return;
    }

    const results = await Promise.allSettled(
      activeItems.map((item) =>
        this.inventoryService.deductRecipe(
          item.menuItemId,
          item.quantity,
          order.id,
        ),
      ),
    );

    // Log any failures — never throw, kitchen must not be blocked
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const item = activeItems[index];
        this.logger.error(
          `Inventory deduction failed for menuItem ${item.menuItemId} ` +
          `(order ${order.id}, qty ${item.quantity}): ${result.reason?.message || result.reason}`,
          result.reason?.stack,
        );
        // TODO: Emit dashboard alert so staff can reconcile manually
      }
    });
  }

  /**
   * Upsert DailyRevenue cache record after each payment.
   * Uses Vietnam timezone (UTC+7) to determine the calendar date.
   */
  private async updateDailyRevenue(restaurantId: string, order: any) {
    // Determine today's date in Vietnam timezone
    const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const dateStr = vnNow.toISOString().slice(0, 10);
    const date = new Date(dateStr);

    // Build payment method revenue fields
    const paymentField = this.getPaymentRevenueField(order.paymentMethod);

    await this.prisma.dailyRevenue.upsert({
      where: {
        restaurantId_date: { restaurantId, date },
      },
      create: {
        restaurantId,
        date,
        totalRevenue: order.total,
        totalOrders: 1,
        totalCovers: order.covers || 1,
        avgTicket: order.total,
        [paymentField]: order.total,
        totalVat: order.vatAmount || 0,
        totalDiscounts: order.discountAmount || 0,
      },
      update: {
        totalRevenue: { increment: order.total },
        totalOrders: { increment: 1 },
        totalCovers: { increment: order.covers || 1 },
        [paymentField]: { increment: order.total },
        totalVat: { increment: order.vatAmount || 0 },
        totalDiscounts: { increment: order.discountAmount || 0 },
        // Recalculate avg ticket after increment
        // (will be approximate — closePeriod recalculates precisely)
      },
    });
  }

  /**
   * Maps PaymentMethod enum to the DailyRevenue column name.
   */
  private getPaymentRevenueField(
    method: string | null | undefined,
  ): string {
    const map: Record<string, string> = {
      CASH: 'cashRevenue',
      VNPAY: 'vnpayRevenue',
      MOMO: 'momoRevenue',
      ZALOPAY: 'zalopayRevenue',
      CARD: 'cardRevenue',
      BANK_TRANSFER: 'bankTransferRevenue',
    };
    return map[method || 'CASH'] || 'cashRevenue';
  }

  /**
   * Format order for API response
   */
  private formatOrder(order: any) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal,
      vatAmount: order.vatAmount,
      discountAmount: order.discountAmount,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
      covers: order.covers,
      isRush: order.isRush,
      isVip: order.isVip,
      notes: order.notes,
      cancelledReason: order.cancelledReason,
      table: order.table
        ? {
            id: order.table.id,
            name: order.table.name,
            zone: order.table.zone,
          }
        : null,
      server: order.server
        ? {
            id: order.server.id,
            name: order.server.name,
          }
        : null,
      items: order.orderItems.map((item: any) => ({
        id: item.id,
        menuItem: {
          id: item.menuItem.id,
          name: item.menuItem.name,
          nameIt: item.menuItem.nameIt,
          station: item.menuItem.station,
        },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        status: item.status,
        modifications: item.modifications,
        notes: item.notes,
        preparedAt: item.preparedAt,
        servedAt: item.servedAt,
        preparedBy: item.preparedByUser
          ? {
              id: item.preparedByUser.id,
              name: item.preparedByUser.name,
            }
          : null,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
