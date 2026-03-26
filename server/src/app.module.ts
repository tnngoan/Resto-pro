import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { SupabaseModule } from '@/common/supabase/supabase.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { KitchenModule } from '@/modules/kitchen/kitchen.module';
import { MenuModule } from '@/modules/menu/menu.module';
import { TablesModule } from '@/modules/tables/tables.module';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { FinanceModule } from '@/modules/finance/finance.module';
import { CustomersModule } from '@/modules/customers/customers.module';
import { StaffModule } from '@/modules/staff/staff.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { PaymentsModule } from '@/modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    OrdersModule,
    KitchenModule,
    MenuModule,
    TablesModule,
    InventoryModule,
    FinanceModule,
    CustomersModule,
    StaffModule,
    ReportsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
