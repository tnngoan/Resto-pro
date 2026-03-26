import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryGateway } from './inventory.gateway';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { KitchenModule } from '../kitchen/kitchen.module';

@Module({
  imports: [PrismaModule, KitchenModule],
  providers: [InventoryService, InventoryGateway],
  controllers: [InventoryController],
  exports: [InventoryService], // Exported so KitchenService can call deductRecipe
})
export class InventoryModule {}
