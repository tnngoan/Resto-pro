import { IsEnum, IsUUID, IsOptional, IsString } from 'class-validator';

/**
 * Supported e-wallet payment methods.
 * CASH and BANK_TRANSFER are handled directly in the orders module —
 * they don't need gateway integration.
 */
export enum EWalletMethod {
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  ZALOPAY = 'ZALOPAY',
}

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsEnum(EWalletMethod, {
    message: 'method must be one of: VNPAY, MOMO, ZALOPAY',
  })
  method: EWalletMethod;

  @IsOptional()
  @IsString()
  returnUrl?: string;
}
