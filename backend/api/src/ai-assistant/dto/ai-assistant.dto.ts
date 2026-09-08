import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ChatQueryDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class ToolCallExecutedDto {
  toolName: string;
  parameters: any;
  resultSummary: string;
}

export class ChatResponseDto {
  reply: string;
  toolsExecuted: ToolCallExecutedDto[];
  evidenceData?: any;
}
