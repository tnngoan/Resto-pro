import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsUUID,
  IsEnum,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class OrderItemInput {
  @IsUUID()
  menuItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modifications?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @IsOptional()
  @IsUUID()
  tableId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  covers?: number;

  @IsOptional()
  isRush?: boolean;

  @IsOptional()
  isVip?: boolean;

  @IsOptional()
  @IsUUID()
  serverId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
