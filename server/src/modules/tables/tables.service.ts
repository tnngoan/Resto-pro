import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { TableStatus, OrderStatus } from '@prisma/client';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // Valid table status transitions (state machine)
  // -------------------------------------------------------------------------
  private readonly validTransitions: Record<TableStatus, TableStatus[]> = {
    [TableStatus.AVAILABLE]: [TableStatus.OCCUPIED, TableStatus.RESERVED],
    [TableStatus.OCCUPIED]: [TableStatus.NEEDS_ATTENTION, TableStatus.CLEANING],
    [TableStatus.RESERVED]: [TableStatus.OCCUPIED, TableStatus.AVAILABLE],
    [TableStatus.NEEDS_ATTENTION]: [TableStatus.OCCUPIED, TableStatus.CLEANING],
    [TableStatus.CLEANING]: [TableStatus.AVAILABLE],
  };

  // -------------------------------------------------------------------------
  // findAll — list all active tables for a restaurant
  // -------------------------------------------------------------------------
  async findAll(restaurantId: string) {
    const tables = await this.prisma.table.findMany({
      where: {
        restaurantId,
        isActive: true,
      },
      include: {
        orders: {
          where: {
            status: {
              notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.PAID],
            },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            covers: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { zone: 'asc' },
        { name: 'asc' },
      ],
    });

    return {
      data: tables.map((table: any) => this.formatTable(table)),
    };
  }

  // -------------------------------------------------------------------------
  // findOne — single table with full current order details
  // -------------------------------------------------------------------------
  async findOne(id: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, isActive: true },
      include: {
        orders: {
          where: {
            status: {
              notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.PAID],
            },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
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
            server: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }

    return {
      data: this.formatTableDetailed(table),
    };
  }

  // -------------------------------------------------------------------------
  // create — add a new table to a restaurant
  // -------------------------------------------------------------------------
  async create(restaurantId: string, data: CreateTableDto) {
    // Check for duplicate table name within the same restaurant
    const existing = await this.prisma.table.findFirst({
      where: {
        restaurantId,
        name: data.name,
        isActive: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Table "${data.name}" already exists in this restaurant`,
      );
    }

    const table = await this.prisma.table.create({
      data: {
        restaurantId,
        name: data.name,
        capacity: data.capacity,
        zone: data.zone || 'Tang 1',
        positionX: data.positionX,
        positionY: data.positionY,
        status: TableStatus.AVAILABLE,
      },
    });

    return {
      data: this.formatTable(table),
    };
  }

  // -------------------------------------------------------------------------
  // update — modify table properties (name, capacity, zone, position)
  // -------------------------------------------------------------------------
  async update(id: string, data: UpdateTableDto) {
    const table = await this.prisma.table.findFirst({
      where: { id, isActive: true },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }

    // If renaming, check for duplicate name within the same restaurant
    if (data.name && data.name !== table.name) {
      const duplicate = await this.prisma.table.findFirst({
        where: {
          restaurantId: table.restaurantId,
          name: data.name,
          isActive: true,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Table "${data.name}" already exists in this restaurant`,
        );
      }
    }

    const updated = await this.prisma.table.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.zone !== undefined && { zone: data.zone }),
        ...(data.positionX !== undefined && { positionX: data.positionX }),
        ...(data.positionY !== undefined && { positionY: data.positionY }),
      },
    });

    return {
      data: this.formatTable(updated),
    };
  }

  // -------------------------------------------------------------------------
  // updateStatus — change table status with state machine validation
  // -------------------------------------------------------------------------
  async updateStatus(id: string, status: TableStatus) {
    const table = await this.prisma.table.findFirst({
      where: { id, isActive: true },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }

    // Validate the transition using state machine
    const allowedNextStatuses = this.validTransitions[table.status];
    if (!allowedNextStatuses.includes(status)) {
      throw new BadRequestException(
        `Cannot transition table from "${table.status}" to "${status}". ` +
        `Allowed transitions: ${allowedNextStatuses.join(', ') || 'none'}`,
      );
    }

    const updated = await this.prisma.table.update({
      where: { id },
      data: {
        status,
        // Clear seated info when table becomes available
        ...(status === TableStatus.AVAILABLE && {
          currentOrderId: null,
          currentCovers: 0,
          seatedAt: null,
        }),
      },
    });

    return {
      data: this.formatTable(updated),
    };
  }

  // -------------------------------------------------------------------------
  // assignOrder — link an order to a table and mark as OCCUPIED
  // -------------------------------------------------------------------------
  async assignOrder(tableId: string, orderId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, isActive: true },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID "${tableId}" not found`);
    }

    // Table must be AVAILABLE or RESERVED to accept an order
    if (
      table.status !== TableStatus.AVAILABLE &&
      table.status !== TableStatus.RESERVED
    ) {
      throw new BadRequestException(
        `Table "${table.name}" is currently "${table.status}" and cannot accept a new order. ` +
        `Table must be AVAILABLE or RESERVED.`,
      );
    }

    // Verify the order exists and belongs to the same restaurant
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    if (order.restaurantId !== table.restaurantId) {
      throw new BadRequestException(
        'Order does not belong to the same restaurant as the table',
      );
    }

    // Link order to table and update statuses
    const [updatedTable] = await this.prisma.$transaction([
      this.prisma.table.update({
        where: { id: tableId },
        data: {
          status: TableStatus.OCCUPIED,
          currentOrderId: orderId,
          currentCovers: order.covers,
          seatedAt: new Date(),
        },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          tableId,
        },
      }),
    ]);

    return {
      data: this.formatTable(updatedTable),
    };
  }

  // -------------------------------------------------------------------------
  // releaseTable — called after order is completed/paid
  // Sets status to CLEANING (staff must clean before AVAILABLE)
  // -------------------------------------------------------------------------
  async releaseTable(id: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, isActive: true },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }

    if (table.status !== TableStatus.OCCUPIED && table.status !== TableStatus.NEEDS_ATTENTION) {
      throw new BadRequestException(
        `Table "${table.name}" is "${table.status}" — only OCCUPIED or NEEDS_ATTENTION tables can be released`,
      );
    }

    const updated = await this.prisma.table.update({
      where: { id },
      data: {
        status: TableStatus.CLEANING,
        currentOrderId: null,
        currentCovers: 0,
        seatedAt: null,
      },
    });

    return {
      data: this.formatTable(updated),
    };
  }

  // -------------------------------------------------------------------------
  // generateQrCode — create a QR code for customer self-ordering
  // Generates a new session token each time (rotates old QR codes)
  // -------------------------------------------------------------------------
  async generateQrCode(tableId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, isActive: true },
      include: {
        restaurant: {
          select: { slug: true },
        },
      },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID "${tableId}" not found`);
    }

    // Generate a new session token (rotates the old one, expiring old QR codes)
    const sessionToken = uuidv4();

    // Store the session token on the table record for future validation
    await this.prisma.table.update({
      where: { id: tableId },
      data: { qrCode: sessionToken },
    });

    // Build the customer-facing URL
    // Format: https://[CUSTOMER_APP_URL]/scan?table=[tableId]&token=[sessionToken]
    const customerAppUrl =
      process.env.CUSTOMER_APP_URL || `https://${table.restaurant.slug}.restopro.vn`;
    const qrUrl = `${customerAppUrl}/scan?table=${tableId}&token=${sessionToken}`;

    // Generate QR code as data URL (base64-encoded PNG)
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H', // High error correction for restaurant environments
    });

    return {
      data: {
        tableId,
        tableName: table.name,
        qrCodeDataUrl,
        qrUrl,
        sessionToken,
      },
    };
  }

  // -------------------------------------------------------------------------
  // delete — soft-delete a table (set isActive = false)
  // -------------------------------------------------------------------------
  async delete(id: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, isActive: true },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }

    // Cannot delete a table that has an active order
    if (table.status === TableStatus.OCCUPIED) {
      throw new BadRequestException(
        `Cannot delete table "${table.name}" — it currently has an active order. ` +
        `Release the table first by completing or cancelling the order.`,
      );
    }

    await this.prisma.table.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      data: { id, deleted: true },
    };
  }

  // =========================================================================
  // Private helper: format table for list responses
  // =========================================================================
  private formatTable(table: any) {
    const currentOrder = table.orders?.[0] || null;

    return {
      id: table.id,
      name: table.name,
      capacity: table.capacity,
      zone: table.zone,
      status: table.status,
      positionX: table.positionX,
      positionY: table.positionY,
      currentOrderId: table.currentOrderId,
      currentCovers: table.currentCovers,
      seatedAt: table.seatedAt,
      currentOrder: currentOrder
        ? {
            id: currentOrder.id,
            orderNumber: currentOrder.orderNumber,
            status: currentOrder.status,
            total: currentOrder.total,
            covers: currentOrder.covers,
            createdAt: currentOrder.createdAt,
          }
        : null,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
    };
  }

  // =========================================================================
  // Private helper: format table for detailed single-table responses
  // =========================================================================
  private formatTableDetailed(table: any) {
    const currentOrder = table.orders?.[0] || null;

    return {
      id: table.id,
      name: table.name,
      capacity: table.capacity,
      zone: table.zone,
      status: table.status,
      positionX: table.positionX,
      positionY: table.positionY,
      currentOrderId: table.currentOrderId,
      currentCovers: table.currentCovers,
      seatedAt: table.seatedAt,
      currentOrder: currentOrder
        ? {
            id: currentOrder.id,
            orderNumber: currentOrder.orderNumber,
            status: currentOrder.status,
            subtotal: currentOrder.subtotal,
            vatAmount: currentOrder.vatAmount,
            discountAmount: currentOrder.discountAmount,
            total: currentOrder.total,
            covers: currentOrder.covers,
            notes: currentOrder.notes,
            server: currentOrder.server
              ? { id: currentOrder.server.id, name: currentOrder.server.name }
              : null,
            items: currentOrder.orderItems?.map((item: any) => ({
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
            })) || [],
            createdAt: currentOrder.createdAt,
            updatedAt: currentOrder.updatedAt,
          }
        : null,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
    };
  }
}
