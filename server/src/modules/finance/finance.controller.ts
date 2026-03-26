import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { FinanceService } from './finance.service';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get('daily-summary')
  @Roles('OWNER', 'MANAGER')
  async getDailySummary(
    @Query('date') date: string,
    @CurrentUser() user: any,
  ) {
    return this.financeService.getDailySummary(user.restaurantId, date);
  }

  @Get('revenue-trends')
  @Roles('OWNER', 'MANAGER')
  async getRevenueTrends(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.financeService.getRevenueTrends(
      user.restaurantId,
      startDate,
      endDate,
    );
  }

  @Get('payment-breakdown')
  @Roles('OWNER', 'MANAGER')
  async getPaymentBreakdown(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.financeService.getPaymentBreakdown(
      user.restaurantId,
      startDate,
      endDate,
    );
  }

  @Get('top-items')
  @Roles('OWNER', 'MANAGER')
  async getTopItems(
    @Query('limit') limit: number = 10,
    @CurrentUser() user: any,
  ) {
    return this.financeService.getTopItems(user.restaurantId, limit);
  }

  @Get('expenses')
  @Roles('OWNER', 'MANAGER')
  async getExpenseSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.financeService.getExpenseSummary(
      user.restaurantId,
      startDate,
      endDate,
    );
  }

  @Post('expenses')
  @Roles('OWNER', 'MANAGER')
  async recordExpense(
    @Body() expenseDto: any,
    @CurrentUser() user: any,
  ) {
    return this.financeService.recordExpense(user.restaurantId, expenseDto);
  }

  @Get('trial-balance')
  @Roles('OWNER', 'MANAGER')
  async getTrialBalance(@CurrentUser() user: any) {
    return this.financeService.getTrialBalance(user.restaurantId);
  }

  @Post('close-period')
  @Roles('OWNER')
  async closePeriod(
    @Body('periodEnd') periodEnd: string,
    @CurrentUser() user: any,
  ) {
    return this.financeService.closePeriod(user.restaurantId, periodEnd);
  }
}
