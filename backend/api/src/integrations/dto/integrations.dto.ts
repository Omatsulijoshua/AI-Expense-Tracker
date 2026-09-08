import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class ConnectBankDto {
  @IsOptional()
  @IsString()
  providerName?: string;
}

export class ExchangeTokenDto {
  @IsString()
  @IsNotEmpty()
  publicToken: string;

  @IsOptional()
  @IsString()
  providerName?: string;
}

export class SyncConnectionDto {
  @IsString()
  @IsNotEmpty()
  connectionId: string;
}

export class WebhookEventDto {
  @IsString()
  @IsNotEmpty()
  event: string; // 'account.updated' | 'transaction.created' | etc.

  @IsString()
  @IsNotEmpty()
  connectionId: string;

  @IsOptional()
  @IsObject()
  data?: any;
}
