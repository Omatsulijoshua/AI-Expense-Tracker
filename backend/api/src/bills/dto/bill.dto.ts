import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BillStatusDto {
  UPCOMING = 'UPCOMING',
  DUE_TODAY = 'DUE_TODAY',
  OVERDUE = 'OVERDUE',
  PAID = 'PAID',
}

export class CreateBillDto {
  @ApiProperty({ example: 'Electricity Bill (EKEDC)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 25000.00, description: 'Bill amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-09-15T00:00:00.000Z' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 'MONTHLY' })
  @IsOptional()
  @IsString()
  frequency?: string;
}

export class PayBillDto {
  @ApiPropertyOptional({ description: 'Account ID to pay bill from and record expense transaction' })
  @IsOptional()
  @IsString()
  accountId?: string;
}
