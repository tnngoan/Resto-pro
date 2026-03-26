import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';

export class AddOrderItemDto {
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
