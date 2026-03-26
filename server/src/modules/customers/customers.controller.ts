import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CustomersService } from './customers.service';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async findAll(@CurrentUser() user: any) {
    return this.customersService.findAll(user.restaurantId);
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async createOrUpdate(
    @Body() customerDto: any,
    @CurrentUser() user: any,
  ) {
    return this.customersService.createOrUpdate(user.restaurantId, customerDto);
  }

  @Get(':id/orders')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async getOrderHistory(@Param('id') id: string) {
    return this.customersService.getOrderHistory(id);
  }

  @Patch(':id/loyalty-points/add')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async addLoyaltyPoints(
    @Param('id') id: string,
    @Body('points') points: number,
  ) {
    return this.customersService.addLoyaltyPoints(id, points);
  }

  @Patch(':id/loyalty-points/redeem')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async redeemLoyaltyPoints(
    @Param('id') id: string,
    @Body('points') points: number,
  ) {
    return this.customersService.redeemLoyaltyPoints(id, points);
  }

  @Post('promotions')
  @Roles('OWNER', 'MANAGER')
  async createPromotion(
    @Body() promotionDto: any,
    @CurrentUser() user: any,
  ) {
    return this.customersService.createPromotion(
      user.restaurantId,
      promotionDto,
    );
  }

  @Post('orders/:orderId/apply-promotion')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async applyPromotion(
    @Param('orderId') orderId: string,
    @Body('promotionId') promotionId: string,
  ) {
    return this.customersService.applyPromotion(orderId, promotionId);
  }
}
