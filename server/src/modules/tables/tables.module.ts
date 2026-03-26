import { Module } from '@nestjs/common';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { KitchenModule } from '../kitchen/kitchen.module';

@Module({
  imports: [PrismaModule, KitchenModule],
  providers: [TablesService],
  controllers: [TablesController],
  exports: [TablesService],
})
export class TablesModule {}
