import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AccountTypeDto {
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  CASH_WALLET = 'CASH_WALLET',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
  SAVINGS_ACCOUNT = 'SAVINGS_ACCOUNT',
  INVESTMENT_ACCOUNT = 'INVESTMENT_ACCOUNT',
  MOBILE_WALLET = 'MOBILE_WALLET',
  BUSINESS_ACCOUNT = 'BUSINESS_ACCOUNT',
  OTHER = 'OTHER',
}

export class CreateAccountDto {
  @ApiProperty({ example: 'GTBank Salary Account' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AccountTypeDto, example: AccountTypeDto.BANK_ACCOUNT })
  @IsEnum(AccountTypeDto)
  type: AccountTypeDto;

  @ApiPropertyOptional({ example: 'Guaranty Trust Bank' })
  @IsOptional()
  @IsString()
  institution?: string;

  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 10000.00, description: 'Opening balance' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  openingBalance?: number;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'GTBank Savings' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Guaranty Trust Bank' })
  @IsOptional()
  @IsString()
  institution?: string;
}
