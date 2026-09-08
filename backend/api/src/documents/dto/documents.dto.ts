import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  fileContentBase64: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class AnalyzeReceiptDto {
  @IsString()
  @IsNotEmpty()
  documentId: string;
}

export class ConfirmReceiptTransactionDto {
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
  type?: 'INCOME' | 'EXPENSE';
}
