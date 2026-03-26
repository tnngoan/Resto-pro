import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
