import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { KitchenModule } from '../kitchen/kitchen.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, KitchenModule, InventoryModule],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
