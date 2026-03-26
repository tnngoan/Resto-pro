import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  name: string; // e.g. "Thịt bò", "Rau muống"

  @IsString()
  unit: string; // e.g. "kg", "gram", "lít", "cái", "bó"

  @IsNumber()
  @Min(0)
  currentStock: number; // initial stock in unit

  @IsNumber()
  @Min(0)
  minStock: number; // alert threshold

  @IsNumber()
  @Min(0)
  costPerUnit: number; // integer VND per unit (e.g. 250000 per kg)

  @IsOptional()
  @IsString()
  supplierName?: string;
}
