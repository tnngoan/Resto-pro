import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { KitchenService } from './kitchen.service';
import { KitchenStation } from '@prisma/client';

@Controller('kitchen')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KitchenController {
  constructor(private kitchenService: KitchenService) {}

  /**
   * Get all active kitchen orders grouped by station
   */
  @Get('orders')
  @Roles('OWNER', 'MANAGER', 'KITCHEN')
  async getKitchenOrders(
    @Query('station') station?: KitchenStation,
    @CurrentUser() user: any,
  ) {
    return this.kitchenService.getKitchenOrders(user.restaurantId, station);
  }

  /**
   * Get orders by specific station
   */
  @Get('station/:station')
  @Roles('OWNER', 'MANAGER', 'KITCHEN')
  async getByStation(
    @Param('station') station: string,
    @CurrentUser() user: any,
  ) {
    return this.kitchenService.getOrdersByStation(
      user.restaurantId,
      station as KitchenStation,
    );
  }

  /**
   * Update individual order item status
   */
  @Patch('orders/:orderId/items/:itemId/status')
  @Roles('KITCHEN')
  async updateItemStatus(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body('status') status: string,
  ) {
    return this.kitchenService.updateItemStatus(orderId, itemId, status as any);
  }

  /**
   * Mark single item as ready
   */
  @Patch('orders/:orderId/items/:itemId/ready')
  @Roles('KITCHEN')
  async markReady(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.kitchenService.markItemReady(orderId, itemId);
  }

  /**
   * Mark single item as served
   */
  @Patch('orders/:orderId/items/:itemId/served')
  @Roles('KITCHEN')
  async markServed(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.kitchenService.markItemServed(orderId, itemId);
  }

  /**
   * Bump order - mark all items as ready (for VIP/rush orders)
   */
  @Post('orders/:orderId/bump')
  @Roles('OWNER', 'MANAGER')
  async bumpOrder(@Param('orderId') orderId: string) {
    return this.kitchenService.bumpOrder(orderId);
  }

  /**
   * Mark menu item as 86'd (out of stock)
   */
  @Patch('items/:itemId/86d')
  @Roles('KITCHEN', 'OWNER', 'MANAGER')
  async markOutOfStock(
    @Param('itemId') itemId: string,
    @Body('is86d') is86d: boolean = true,
  ) {
    return this.kitchenService.markOutOfStock(itemId);
  }
}
