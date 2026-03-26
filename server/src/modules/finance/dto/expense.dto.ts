import {
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
  IsOptional,
  Min,
  MinLength,
} from 'class-validator';

export enum ExpenseCategory {
  FOOD_PURCHASE = 'FOOD_PURCHASE',
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  STAFF_WAGES = 'STAFF_WAGES',
  MARKETING = 'MARKETING',
  EQUIPMENT = 'EQUIPMENT',
  OTHER = 'OTHER',
}

export class CreateExpenseDto {
  @IsString()
  @MinLength(1)
  description: string;

  @IsInt()
  @Min(1)
  amount: number; // VND integer

  @IsEnum(ExpenseCategory, {
    message:
      'category must be one of: FOOD_PURCHASE, RENT, UTILITIES, STAFF_WAGES, MARKETING, EQUIPMENT, OTHER',
  })
  category: ExpenseCategory;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
