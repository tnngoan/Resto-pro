import {
  IsString,
  IsInt,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateTableDto {
  @IsString()
  @MaxLength(20)
  name: string; // e.g. "Ban 01", "VIP 1", "Bar 3"

  @IsInt()
  @Min(1)
  capacity: number; // seats

  @IsOptional()
  @IsString()
  zone?: string; // e.g. "Tang 1", "San vuon", "VIP"

  @IsOptional()
  @IsNumber()
  positionX?: number; // for floor plan drag-and-drop

  @IsOptional()
  @IsNumber()
  positionY?: number;
}
