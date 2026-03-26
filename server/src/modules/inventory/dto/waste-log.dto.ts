import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  Min,
} from 'class-validator';

export enum WasteReason {
  EXPIRED = 'EXPIRED',
  DROPPED = 'DROPPED',
  OVERCOOKED = 'OVERCOOKED',
  SPOILED = 'SPOILED',
  OTHER = 'OTHER',
}

export class WasteLogDto {
  @IsUUID()
  ingredientId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsEnum(WasteReason)
  reason: WasteReason;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
