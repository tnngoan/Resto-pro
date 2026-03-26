import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { KitchenModule } from '../kitchen/kitchen.module';

@Module({
  imports: [PrismaModule, KitchenModule],
  providers: [MenuService],
  controllers: [MenuController],
})
export class MenuModule {}
