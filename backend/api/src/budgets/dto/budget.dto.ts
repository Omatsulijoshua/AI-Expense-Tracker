import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BudgetCategoryAllocationDto {
  @ApiProperty({ description: 'Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 100000.00, description: 'Allocated budget amount' })
  @IsNumber()
  @Min(0.01)
  allocated: number;
}

export class CreateBudgetDto {
  @ApiProperty({ example: 'Monthly Household Budget' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 250000.00, description: 'Total overall budget limit' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-09-30T23:59:59.000Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ type: [BudgetCategoryAllocationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetCategoryAllocationDto)
  categories: BudgetCategoryAllocationDto[];
}
