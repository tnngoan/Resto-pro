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
import { StaffService } from './staff.service';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  @Roles('OWNER', 'MANAGER')
  async findAll(@CurrentUser() user: any) {
    return this.staffService.findAll(user.restaurantId);
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER')
  async findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Post()
  @Roles('OWNER', 'MANAGER')
  async create(@Body() createStaffDto: any, @CurrentUser() user: any) {
    return this.staffService.create(user.restaurantId, createStaffDto);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  async update(@Param('id') id: string, @Body() updateStaffDto: any) {
    return this.staffService.update(id, updateStaffDto);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  async delete(@Param('id') id: string) {
    return this.staffService.delete(id);
  }

  @Get('schedule/range')
  @Roles('OWNER', 'MANAGER')
  async getSchedule(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.staffService.getSchedule(user.restaurantId, startDate, endDate);
  }

  @Post('shifts')
  @Roles('OWNER', 'MANAGER')
  async createShift(
    @Body() createShiftDto: any,
    @CurrentUser() user: any,
  ) {
    return this.staffService.createShift(user.restaurantId, createShiftDto);
  }

  @Post(':id/clock-in')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async clockIn(@Param('id') id: string) {
    return this.staffService.clockIn(id);
  }

  @Post(':id/clock-out')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async clockOut(@Param('id') id: string) {
    return this.staffService.clockOut(id);
  }

  @Get('payroll/summary')
  @Roles('OWNER', 'MANAGER')
  async getPayrollSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.staffService.getPayrollSummary(
      user.restaurantId,
      startDate,
      endDate,
    );
  }
}
