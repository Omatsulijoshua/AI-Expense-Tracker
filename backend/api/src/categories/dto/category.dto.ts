import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionTypeDto {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Groceries' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: TransactionTypeDto, example: TransactionTypeDto.EXPENSE })
  @IsEnum(TransactionTypeDto)
  type: TransactionTypeDto;

  @ApiPropertyOptional({ example: 'shopping_cart' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '#4CAF50' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Parent category ID for subcategories' })
  @IsOptional()
  @IsString()
  parentId?: string;
}
