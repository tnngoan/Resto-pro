import {
  IsArray,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StockCountItem {
  @IsUUID()
  ingredientId: string;

  @IsNumber()
  @Min(0)
  actualQuantity: number;
}

export class StockCountDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockCountItem)
  counts: StockCountItem[];
}
