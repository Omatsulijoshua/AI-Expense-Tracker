import { IsString, IsNotEmpty, IsOptional, IsObject, IsArray, IsNumber } from 'class-validator';

export class ParseImportDto {
  @IsString()
  @IsNotEmpty()
  fileContent: string;
}

export class ColumnMappingDto {
  @IsNumber()
  dateColumnIndex: number;

  @IsNumber()
  amountColumnIndex: number;

  @IsNumber()
  descriptionColumnIndex: number;

  @IsOptional()
  @IsNumber()
  categoryColumnIndex?: number;

  @IsOptional()
  @IsNumber()
  typeColumnIndex?: number;

  @IsOptional()
  @IsNumber()
  externalIdColumnIndex?: number;
}

export class PreviewImportDto {
  @IsString()
  @IsNotEmpty()
  fileContent: string;

  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsObject()
  columnMapping: ColumnMappingDto;
}

export class ImportRowItemDto {
  transactionDate: string;
  amount: number;
  description: string;
  type?: 'INCOME' | 'EXPENSE';
  categoryId?: string;
  externalTransactionId?: string;
  isDuplicate?: boolean;
  duplicateReason?: string;
  isValid: boolean;
  validationError?: string;
}

export class ExecuteImportDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsArray()
  rows: ImportRowItemDto[];
}
