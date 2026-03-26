import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  Min,
  IsUUID,
} from 'class-validator';
import { KitchenStation } from '@prisma/client';

export class CreateMenuItemDto {
  @IsString()
  name: string;

  @IsString()
  nameIt: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionIt?: string;

  @IsNumber()
  @Min(0)
  price: number; // in VND, stored as integer

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsEnum(KitchenStation)
  station?: KitchenStation;

  @IsOptional()
  @IsNumber()
  @Min(1)
  prepTimeMinutes?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergens?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
