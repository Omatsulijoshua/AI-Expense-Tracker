import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUserStatusDto {
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsString()
  role?: string;
}

export class UserAdminViewDto {
  id: string;
  name: string;
  email: string;
  currency: string;
  isLocked: boolean;
  accountsCount: number;
  transactionsCount: number;
  createdAt: Date;
}

export interface ProviderHealthDto {
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'SANDBOX';
  latencyMs: number;
  lastSyncAt: Date;
}

export interface SystemHealthDto {
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
  databaseStatus: 'CONNECTED' | 'DISCONNECTED';
  redisQueueStatus: 'ONLINE' | 'PAUSED' | 'OFFLINE';
  pendingQueueJobs: number;
  providers: ProviderHealthDto[];
  timestamp: Date;
}

export interface AiFeatureCostDto {
  feature: string;
  usageCount: number;
  estimatedTokens: number;
  estimatedCostUsd: number;
}

export interface AiMetricsDto {
  totalScans: number;
  totalVoiceParses: number;
  totalAssistantQueries: number;
  totalTokensUsed: number;
  totalEstimatedCostUsd: number;
  breakdown: AiFeatureCostDto[];
}

export class AuditLogQueryDto {
  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  entity?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

export interface AuditLogViewDto {
  id: string;
  actorId: string | null;
  actorEmail?: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: any;
  createdAt: Date;
}
