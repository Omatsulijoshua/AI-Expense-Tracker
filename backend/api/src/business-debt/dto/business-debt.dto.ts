import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Role, WorkspaceType } from '@prisma/client';

export class CreateDebtDto {
  @IsString()
  @IsNotEmpty()
  person: string;

  @IsString()
  @IsNotEmpty()
  type: 'I_OWE' | 'OWED_TO_ME';

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  dueDate?: string;
}

export class RecordDebtPaymentDto {
  @IsNumber()
  amount: number;
}

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(WorkspaceType)
  type: WorkspaceType;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class AddWorkspaceMemberDto {
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @IsString()
  @IsNotEmpty()
  targetUserId: string;

  @IsEnum(Role)
  role: Role;
}
