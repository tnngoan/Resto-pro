import { IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class PaymentDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
