import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { FinanceModule } from '@/modules/finance/finance.module';

@Module({
  imports: [PrismaModule, FinanceModule],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
