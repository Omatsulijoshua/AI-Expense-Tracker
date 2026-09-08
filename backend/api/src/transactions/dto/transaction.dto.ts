import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionTypeDto {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum TransactionSourceDto {
  MANUAL = 'MANUAL',
  API = 'API',
  VOICE = 'VOICE',
  IMAGE = 'IMAGE',
  IMPORT = 'IMPORT',
  SYSTEM = 'SYSTEM',
}

export class CreateTransactionDto {
  @ApiProperty({ description: 'Account ID' })
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ enum: TransactionTypeDto, example: TransactionTypeDto.EXPENSE })
  @IsEnum(TransactionTypeDto)
  type: TransactionTypeDto;

  @ApiProperty({ example: 15000.00, description: 'Transaction amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Shoprite Supermarket' })
  @IsOptional()
  @IsString()
  merchant?: string;

  @ApiPropertyOptional({ example: 'Weekly Groceries' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-09-08T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({ example: 'Debit Card' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'REF123456789' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ enum: TransactionSourceDto, example: TransactionSourceDto.MANUAL })
  @IsOptional()
  @IsEnum(TransactionSourceDto)
  source?: TransactionSourceDto;

  @ApiPropertyOptional({ example: 'Family shopping' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateTransferDto {
  @ApiProperty({ description: 'Source Account ID (Outflow)' })
  @IsString()
  @IsNotEmpty()
  sourceAccountId: string;

  @ApiProperty({ description: 'Destination Account ID (Inflow)' })
  @IsString()
  @IsNotEmpty()
  destinationAccountId: string;

  @ApiProperty({ example: 50000.00, description: 'Transfer amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'Transfer from GTBank to Cash Wallet' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-09-08T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;
}

export class TransactionQueryDto {
  @ApiPropertyOptional({ enum: TransactionTypeDto })
  @IsOptional()
  @IsEnum(TransactionTypeDto)
  type?: TransactionTypeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  limit?: number;
}
