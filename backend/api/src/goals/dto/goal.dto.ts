import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGoalDto {
  @ApiProperty({ example: 'New MacBook Pro M3' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 2000000.00, description: 'Target savings goal amount' })
  @IsNumber()
  @Min(1.00)
  targetAmount: number;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;
}

export class ContributeGoalDto {
  @ApiProperty({ example: 100000.00, description: 'Contribution amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
