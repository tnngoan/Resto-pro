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
import { Logger } from '@nestjs/common';

export interface LowStockPayload {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  minStock: number;
  unit: string;
  timestamp: string;
}

@WebSocketGateway({
  namespace: 'inventory',
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
    credentials: true,
  },
})
export class InventoryGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('InventoryGateway');

  // Track connected clients by restaurant
  private connectedClients: Map<string, Set<string>> = new Map();

  afterInit(server: Server) {
    this.logger.log('Inventory WebSocket gateway initialized');
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

  /**
   * Subscribe to inventory alerts for a specific restaurant.
   * Owner/manager dashboard joins this room to receive low-stock alerts.
   */
  @SubscribeMessage('inventory:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { restaurantId: string },
  ) {
    const roomKey = `restaurant-${payload.restaurantId}`;
    client.join(roomKey);

    if (!this.connectedClients.has(payload.restaurantId)) {
      this.connectedClients.set(payload.restaurantId, new Set());
    }
    this.connectedClients.get(payload.restaurantId)!.add(client.id);

    this.logger.log(
      `Client ${client.id} joined inventory room: ${roomKey}`,
    );

    client.emit('inventory:joined', {
      restaurantId: payload.restaurantId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Unsubscribe from inventory alerts.
   */
  @SubscribeMessage('inventory:leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { restaurantId: string },
  ) {
    const roomKey = `restaurant-${payload.restaurantId}`;
    client.leave(roomKey);

    if (this.connectedClients.has(payload.restaurantId)) {
      this.connectedClients.get(payload.restaurantId)!.delete(client.id);
    }

    this.logger.log(
      `Client ${client.id} left inventory room: ${roomKey}`,
    );
  }

  /**
   * Broadcast low-stock alert to the owner/manager dashboard room.
   * Called by InventoryService when a stock level crosses below the threshold.
   */
  broadcastLowStock(restaurantId: string, payload: LowStockPayload) {
    const roomKey = `restaurant-${restaurantId}`;
    this.server.to(roomKey).emit('inventory:low_stock', payload);

    this.logger.warn(
      `Low stock alert broadcasted: ${payload.ingredientName} ` +
        `(${payload.currentStock} ${payload.unit}) to ${roomKey}`,
    );
  }

  /**
   * Broadcast stock update (for real-time dashboard refresh).
   */
  broadcastStockUpdate(
    restaurantId: string,
    payload: {
      ingredientId: string;
      ingredientName: string;
      currentStock: number;
      unit: string;
      type: string;
    },
  ) {
    const roomKey = `restaurant-${restaurantId}`;
    this.server.to(roomKey).emit('inventory:stock_updated', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get count of connected clients for a restaurant.
   */
  getConnectedClients(restaurantId: string): number {
    return this.connectedClients.get(restaurantId)?.size ?? 0;
  }
}
