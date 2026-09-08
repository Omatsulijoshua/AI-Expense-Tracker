import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class ProcessVoiceInputDto {
  @IsOptional()
  @IsString()
  audioBase64?: string;

  @IsOptional()
  @IsString()
  transcriptText?: string;
}

export class ConfirmVoiceTransactionDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  merchant?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}
