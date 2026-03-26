import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger, Optional } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

// ─────────────────────────────────────────────────────────────────────────────
// Payload interfaces for type safety across service calls
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderStatusChangedPayload {
  orderId: string;
  orderNumber?: number;
  tableId?: string;
  tableName?: string;
  status: string;
  previousStatus: string;
  updatedAt: string;
}

export interface OrderItemStatusChangedPayload {
  orderId: string;
  orderItemId: string;
  menuItemName: string;
  status: string;
  tableId?: string;
}

export interface TableStatusChangedPayload {
  tableId: string;
  status: string;
  tableName: string;
}

export interface LowStockAlertPayload {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
}

export interface Alert86dPayload {
  menuItemId: string;
  menuItemName: string;
  reason: string;
}

export interface ItemAvailablePayload {
  menuItemId: string;
  menuItemName: string;
}

@WebSocketGateway({
  namespace: 'kitchen',
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
    credentials: true,
  },
})
export class KitchenGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger('KitchenGateway');

  // Track connected clients by restaurant
  private connectedClients: Map<string, Set<string>> = new Map();

  constructor(
    @Optional() @Inject('REDIS_PUB_CLIENT') private readonly pubClient?: Redis,
    @Optional() @Inject('REDIS_SUB_CLIENT') private readonly subClient?: Redis,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle hooks
  // ─────────────────────────────────────────────────────────────────────────

  afterInit(server: Server) {
    // Attach Redis adapter when both pub/sub clients are available.
    // This distributes Socket.IO events across multiple server instances
    // (horizontal scaling) and survives brief server restarts.
    // Falls back to default in-memory adapter for single-instance local dev.
    if (this.pubClient && this.subClient) {
      server.adapter(createAdapter(this.pubClient, this.subClient));
      this.logger.log('Kitchen WebSocket gateway initialized with Redis adapter');
    } else {
      this.logger.warn(
        'Kitchen WebSocket gateway initialized WITHOUT Redis adapter (in-memory only). ' +
        'Set REDIS_URL in .env.local for multi-instance support.',
      );
    }
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up client from tracking
    this.connectedClients.forEach((clients) => {
      clients.delete(client.id);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Room management — clients subscribe to specific rooms
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Subscribe to kitchen orders for a specific restaurant.
   * Used by KDS (Kitchen Display System) screens.
   * Joins both `kitchen-{id}` and `restaurant-{id}` rooms.
   */
  @SubscribeMessage('kitchen:join')
  handleJoinKitchen(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { restaurantId: string },
  ) {
    const kitchenRoom = `kitchen-${payload.restaurantId}`;
    const restaurantRoom = `restaurant-${payload.restaurantId}`;

    client.join(kitchenRoom);
    client.join(restaurantRoom);

    // Track connected client
    if (!this.connectedClients.has(payload.restaurantId)) {
      this.connectedClients.set(payload.restaurantId, new Set());
    }
    this.connectedClients.get(payload.restaurantId)!.add(client.id);

    this.logger.log(`Client ${client.id} joined kitchen room: ${kitchenRoom}`);

    client.emit('kitchen:joined', {
      restaurantId: payload.restaurantId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Unsubscribe from kitchen orders
   */
  @SubscribeMessage('kitchen:leave')
  handleLeaveKitchen(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { restaurantId: string },
  ) {
    const kitchenRoom = `kitchen-${payload.restaurantId}`;
    const restaurantRoom = `restaurant-${payload.restaurantId}`;

    client.leave(kitchenRoom);
    client.leave(restaurantRoom);

    if (this.connectedClients.has(payload.restaurantId)) {
      this.connectedClients.get(payload.restaurantId)!.delete(client.id);
    }

    this.logger.log(`Client ${client.id} left kitchen room: ${kitchenRoom}`);
  }

  /**
   * Subscribe to all restaurant-level events (POS dashboard, owner dashboard).
   */
  @SubscribeMessage('restaurant:join')
  handleRestaurantJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { restaurantId: string },
  ) {
    client.join(`restaurant-${payload.restaurantId}`);
    this.logger.log(
      `Client ${client.id} joined restaurant room: restaurant-${payload.restaurantId}`,
    );
  }

  /**
   * Subscribe to customer-facing events (QR-code PWA tab).
   * Joins both the customer-wide room and the table-specific room.
   */
  @SubscribeMessage('customer:join')
  handleCustomerJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { restaurantId: string; tableId: string },
  ) {
    client.join(`customer-${payload.restaurantId}`);
    client.join(`table-${payload.tableId}`);
    this.logger.log(
      `Client ${client.id} joined customer rooms: customer-${payload.restaurantId}, table-${payload.tableId}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Emission methods — called by services after DB writes
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * New order placed → kitchen sees it immediately on the KDS board.
   * Emitted when order status transitions to PLACED.
   */
  emitNewOrder(restaurantId: string, order: any) {
    this.server.to(`kitchen-${restaurantId}`).emit('order:new', {
      ...order,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Emitted order:new to kitchen-${restaurantId} (order ${order.orderId})`);
  }

  /**
   * Order status changed → kitchen display + POS dashboard + customer tab.
   * This is the primary broadcast — fires on EVERY status transition.
   */
  emitOrderStatusChanged(restaurantId: string, payload: OrderStatusChangedPayload) {
    const event = {
      ...payload,
      timestamp: new Date().toISOString(),
    };

    // Kitchen display
    this.server.to(`kitchen-${restaurantId}`).emit('order:status_changed', event);
    // Owner/POS dashboard
    this.server.to(`restaurant-${restaurantId}`).emit('order:status_changed', event);
    // Table-specific (customer PWA tab)
    if (payload.tableId) {
      this.server.to(`table-${payload.tableId}`).emit('order:status_changed', event);
    }

    this.logger.log(
      `Emitted order:status_changed (${payload.previousStatus} → ${payload.status}) for order ${payload.orderId}`,
    );
  }

  /**
   * Individual order item status changed (e.g., one dish is ready).
   */
  emitOrderItemStatusChanged(restaurantId: string, payload: OrderItemStatusChangedPayload) {
    const event = {
      ...payload,
      timestamp: new Date().toISOString(),
    };

    this.server.to(`kitchen-${restaurantId}`).emit('order:item_status_changed', event);
    if (payload.tableId) {
      this.server.to(`table-${payload.tableId}`).emit('order:item_status_changed', event);
    }

    this.logger.log(
      `Emitted order:item_status_changed for item ${payload.orderItemId} (${payload.status})`,
    );
  }

  /**
   * Table status changed (free/occupied/cleaning) → POS dashboard.
   */
  emitTableStatusChanged(restaurantId: string, payload: TableStatusChangedPayload) {
    this.server.to(`restaurant-${restaurantId}`).emit('table:status_changed', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(
      `Emitted table:status_changed for table ${payload.tableName} (${payload.status})`,
    );
  }

  /**
   * Low stock alert → owner/manager dashboard.
   * Sent when an ingredient crosses below its minimum threshold.
   */
  emitLowStockAlert(restaurantId: string, payload: LowStockAlertPayload) {
    this.server.to(`restaurant-${restaurantId}`).emit('inventory:low_stock', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.logger.warn(
      `Emitted inventory:low_stock: ${payload.ingredientName} ` +
      `(${payload.currentStock} ${payload.unit})`,
    );
  }

  /**
   * Item 86'd (out of stock) → kitchen, customer QR menu, and dashboard all update.
   */
  emit86dAlert(restaurantId: string, payload: Alert86dPayload) {
    const event = {
      ...payload,
      timestamp: new Date().toISOString(),
    };

    this.server.to(`restaurant-${restaurantId}`).emit('menu:item_86d', event);
    this.server.to(`kitchen-${restaurantId}`).emit('menu:item_86d', event);
    this.server.to(`customer-${restaurantId}`).emit('menu:item_86d', event);

    this.logger.warn(`Emitted menu:item_86d for ${payload.menuItemName} — ${payload.reason}`);
  }

  /**
   * Item un-86'd (stock replenished) → re-enable on all clients.
   */
  emitItemAvailable(restaurantId: string, payload: ItemAvailablePayload) {
    const event = {
      ...payload,
      timestamp: new Date().toISOString(),
    };

    this.server.to(`restaurant-${restaurantId}`).emit('menu:item_available', event);
    this.server.to(`kitchen-${restaurantId}`).emit('menu:item_available', event);
    this.server.to(`customer-${restaurantId}`).emit('menu:item_available', event);

    this.logger.log(`Emitted menu:item_available for ${payload.menuItemName}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Legacy broadcast methods — kept for backward compatibility with
  // KitchenService which already calls these
  // ─────────────────────────────────────────────────────────────────────────

  /** Broadcast when a new order is placed (legacy — used by KitchenService) */
  broadcastOrderCreated(restaurantId: string, order: any) {
    const roomKey = `kitchen-${restaurantId}`;
    this.server.to(roomKey).emit('order:created', {
      order,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Order created broadcasted: ${order.id} to ${roomKey}`);
  }

  /** Broadcast when order status changes (legacy — used by KitchenService) */
  broadcastOrderUpdate(restaurantId: string, orderUpdate: any) {
    const roomKey = `kitchen-${restaurantId}`;
    this.server.to(roomKey).emit('order:status_changed', {
      ...orderUpdate,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Order update broadcasted: ${orderUpdate.id} to ${roomKey}`);
  }

  /** Broadcast when order item status changes (legacy — used by KitchenService) */
  broadcastItemStatusChanged(restaurantId: string, itemUpdate: any) {
    const roomKey = `kitchen-${restaurantId}`;
    this.server.to(roomKey).emit('item:status_changed', {
      ...itemUpdate,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Item status update broadcasted to ${roomKey}`);
  }

  /**
   * Get count of connected clients for a restaurant
   */
  getConnectedClients(restaurantId: string): number {
    return this.connectedClients.get(restaurantId)?.size ?? 0;
  }
}
