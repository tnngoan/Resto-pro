import { Module } from '@nestjs/common';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { VNPayProvider } from './providers/vnpay.provider';
import { MoMoProvider } from './providers/momo.provider';
import { ZaloPayProvider } from './providers/zalopay.provider';

@Module({
  imports: [PrismaModule, OrdersModule],
  providers: [PaymentsService, VNPayProvider, MoMoProvider, ZaloPayProvider],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
