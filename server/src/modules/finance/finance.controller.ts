import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { FinanceService } from './finance.service';
import { RevenueQueryDto } from './dto/revenue-query.dto';
import { CreateExpenseDto } from './dto/expense.dto';

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
    // Default to today (Vietnam time) if no date provided
    const effectiveDate =
      date || new Date().toISOString().slice(0, 10);
    return this.financeService.getDailySummary(
      user.restaurantId,
      effectiveDate,
    );
  }

  @Get('revenue-trends')
  @Roles('OWNER', 'MANAGER')
  async getRevenueTrends(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('granularity') granularity: 'day' | 'week' | 'month' = 'day',
    @CurrentUser() user: any,
  ) {
    return this.financeService.getRevenueTrends(
      user.restaurantId,
      startDate,
      endDate,
      granularity,
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
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit: number = 10,
    @CurrentUser() user: any,
  ) {
    return this.financeService.getTopItems(
      user.restaurantId,
      startDate,
      endDate,
      limit,
    );
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
    @Body() expenseDto: CreateExpenseDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.recordExpense(
      user.restaurantId,
      expenseDto,
      user.id,
    );
  }

  @Get('trial-balance')
  @Roles('OWNER', 'MANAGER')
  async getTrialBalance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.financeService.getTrialBalance(
      user.restaurantId,
      startDate,
      endDate,
    );
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
