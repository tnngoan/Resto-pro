import {
  IsString,
  IsNumber,
  IsArray,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecipeIngredientInput {
  @IsUUID()
  ingredientId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number; // quantity per 1 serving
}

export class CreateRecipeDto {
  @IsUUID()
  menuItemId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientInput)
  ingredients: RecipeIngredientInput[];
}
