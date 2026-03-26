import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('profit-and-loss')
  @Roles('OWNER', 'MANAGER')
  async getProfitAndLoss(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.generateProfitAndLoss(
      user.restaurantId,
      startDate,
      endDate,
    );
  }

  @Get('cash-flow')
  @Roles('OWNER', 'MANAGER')
  async getCashFlow(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.generateCashFlow(
      user.restaurantId,
      startDate,
      endDate,
    );
  }

  @Get('food-cost')
  @Roles('OWNER', 'MANAGER')
  async getFoodCostReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.generateFoodCostReport(
      user.restaurantId,
      startDate,
      endDate,
    );
  }

  @Get('menu-engineering')
  @Roles('OWNER', 'MANAGER')
  async getMenuEngineering(@CurrentUser() user: any) {
    return this.reportsService.generateMenuEngineering(user.restaurantId);
  }

  @Get('inventory')
  @Roles('OWNER', 'MANAGER')
  async getInventoryReport(@CurrentUser() user: any) {
    return this.reportsService.generateInventoryReport(user.restaurantId);
  }

  @Get('accounting/:type')
  @Roles('OWNER', 'MANAGER')
  async getAccountingReport(
    @Param('type') type: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.generateAccountingReport(
      user.restaurantId,
      type,
      startDate,
      endDate,
    );
  }

  @Post('custom')
  @Roles('OWNER', 'MANAGER')
  async getCustomReport(
    @Body('query') query: string,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.generateCustomReport(user.restaurantId, query);
  }

  @Post('export')
  @Roles('OWNER', 'MANAGER')
  async exportReport(
    @Body('reportData') reportData: any,
    @Body('format') format: string,
    @Res() res: Response,
  ) {
    const exportedData = await this.reportsService.exportReport(reportData, format);
    return res.send(exportedData);
  }
}
