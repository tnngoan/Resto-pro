import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';

export enum StockUpdateType {
  IN = 'IN',
  ADJUSTMENT = 'ADJUSTMENT',
}

export class StockUpdateDto {
  @IsNumber()
  quantity: number; // for IN: amount to add; for ADJUSTMENT: new absolute stock level

  @IsEnum(StockUpdateType)
  type: StockUpdateType;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerUnit?: number; // override cost for this shipment (VND)
}
