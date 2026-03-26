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
  server: Server;

  private readonly logger = new Logger('KitchenGateway');

  // Track connected clients by restaurant
  private connectedClients: Map<string, Set<string>> = new Map();

  afterInit(server: Server) {
    this.logger.log('Kitchen WebSocket gateway initialized');
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
   * Subscribe to kitchen orders for a specific restaurant
   */
  @SubscribeMessage('kitchen:join')
  handleJoinKitchen(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { restaurantId: string },
  ) {
    const roomKey = `kitchen-${payload.restaurantId}`;
    client.join(roomKey);

    // Track connected client
    if (!this.connectedClients.has(payload.restaurantId)) {
      this.connectedClients.set(payload.restaurantId, new Set());
    }
    this.connectedClients.get(payload.restaurantId).add(client.id);

    this.logger.log(
      `Client ${client.id} joined kitchen room: ${roomKey}`,
    );

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
    const roomKey = `kitchen-${payload.restaurantId}`;
    client.leave(roomKey);

    if (this.connectedClients.has(payload.restaurantId)) {
      this.connectedClients.get(payload.restaurantId).delete(client.id);
    }

    this.logger.log(
      `Client ${client.id} left kitchen room: ${roomKey}`,
    );
  }

  /**
   * Broadcast when a new order is placed
   */
  broadcastOrderCreated(restaurantId: string, order: any) {
    const roomKey = `kitchen-${restaurantId}`;
    this.server.to(roomKey).emit('order:created', {
      order,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Order created broadcasted: ${order.id} to ${roomKey}`);
  }

  /**
   * Broadcast when order status changes
   */
  broadcastOrderUpdate(restaurantId: string, orderUpdate: any) {
    const roomKey = `kitchen-${restaurantId}`;
    this.server.to(roomKey).emit('order:status_changed', {
      ...orderUpdate,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(
      `Order update broadcasted: ${orderUpdate.id} to ${roomKey}`,
    );
  }

  /**
   * Broadcast when order item status changes
   */
  broadcastItemStatusChanged(restaurantId: string, itemUpdate: any) {
    const roomKey = `kitchen-${restaurantId}`;
    this.server.to(roomKey).emit('item:status_changed', {
      ...itemUpdate,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(
      `Item status update broadcasted to ${roomKey}`,
    );
  }

  /**
   * Get count of connected clients for a restaurant
   */
  getConnectedClients(restaurantId: string): number {
    return this.connectedClients.get(restaurantId)?.size ?? 0;
  }
}
