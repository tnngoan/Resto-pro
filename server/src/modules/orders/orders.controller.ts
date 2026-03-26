import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaymentDto } from './dto/payment.dto';
import { OrderQueryDto } from './dto/order-query.dto';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  /**
   * Get paginated orders list
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF', 'KITCHEN')
  async findAll(@Query() filters: OrderQueryDto, @CurrentUser() user: any) {
    return this.ordersService.getOrders(user.restaurantId, filters);
  }

  /**
   * Get single order details
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF', 'KITCHEN')
  async findOne(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }

  /**
   * Create new order
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.createOrder(user.restaurantId, createOrderDto);
  }

  /**
   * Update order status
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF', 'KITCHEN')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, updateStatusDto);
  }

  /**
   * Update individual order item status
   */
  @Patch(':id/items/:itemId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('KITCHEN')
  async updateItemStatus(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body('status') status: string,
  ) {
    return this.ordersService.updateOrderItemStatus(itemId, status as any);
  }

  /**
   * Add item to existing order
   */
  @Post(':id/items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async addItem(
    @Param('id') id: string,
    @Body() addItemDto: AddOrderItemDto,
  ) {
    return this.ordersService.addItemToOrder(id, addItemDto);
  }

  /**
   * Process payment
   */
  @Post(':id/payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async processPayment(
    @Param('id') id: string,
    @Body() paymentDto: PaymentDto,
  ) {
    return this.ordersService.processPayment(id, paymentDto);
  }

  /**
   * Cancel order
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.cancelOrder(id, reason || 'Cancelled by user');
  }
}
