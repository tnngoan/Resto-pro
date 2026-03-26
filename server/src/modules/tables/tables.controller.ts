import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { UpdateTableStatusDto } from './dto/update-table-status.dto';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TablesController {
  constructor(private tablesService: TablesService) {}

  // GET /tables — list all tables for the restaurant
  @Get()
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async findAll(@CurrentUser() user: any) {
    return this.tablesService.findAll(user.restaurantId);
  }

  // GET /tables/:id — get single table with current order details
  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tablesService.findOne(id);
  }

  // POST /tables — create a new table (OWNER/MANAGER only)
  @Post()
  @Roles('OWNER', 'MANAGER')
  async create(
    @Body() createTableDto: CreateTableDto,
    @CurrentUser() user: any,
  ) {
    return this.tablesService.create(user.restaurantId, createTableDto);
  }

  // PATCH /tables/:id — update table properties (OWNER/MANAGER only)
  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTableDto: UpdateTableDto,
  ) {
    return this.tablesService.update(id, updateTableDto);
  }

  // PATCH /tables/:id/status — update table status (state machine)
  @Patch(':id/status')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() statusDto: UpdateTableStatusDto,
  ) {
    return this.tablesService.updateStatus(id, statusDto.status);
  }

  // PATCH /tables/:id/assign-order — assign an order to a table
  @Patch(':id/assign-order')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async assignOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.tablesService.assignOrder(id, orderId);
  }

  // PATCH /tables/:id/release — release table after payment
  @Patch(':id/release')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async releaseTable(@Param('id', ParseUUIDPipe) id: string) {
    return this.tablesService.releaseTable(id);
  }

  // GET /tables/:id/qr-code — generate QR code for customer self-ordering
  @Get(':id/qr-code')
  @Roles('OWNER', 'MANAGER')
  async getQrCode(@Param('id', ParseUUIDPipe) id: string) {
    return this.tablesService.generateQrCode(id);
  }

  // DELETE /tables/:id — soft-delete a table (OWNER/MANAGER only)
  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.tablesService.delete(id);
  }
}
