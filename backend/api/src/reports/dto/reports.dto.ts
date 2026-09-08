import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum GranularityDto {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum ReportPeriodDto {
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  THIS_YEAR = 'THIS_YEAR',
  CUSTOM = 'CUSTOM',
}

export class ReportsQueryDto {
  @ApiPropertyOptional({ enum: ReportPeriodDto, example: ReportPeriodDto.THIS_MONTH })
  @IsOptional()
  @IsEnum(ReportPeriodDto)
  period?: ReportPeriodDto;

  @ApiPropertyOptional({ enum: GranularityDto, example: GranularityDto.DAILY })
  @IsOptional()
  @IsEnum(GranularityDto)
  granularity?: GranularityDto;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;
}
