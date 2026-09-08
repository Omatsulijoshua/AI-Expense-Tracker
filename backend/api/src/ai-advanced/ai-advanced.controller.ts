import { Controller, Get, UseGuards } from '@nestjs/common';
import { AiAdvancedService } from './ai-advanced.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('ai-advanced')
@UseGuards(JwtAuthGuard)
export class AiAdvancedController {
  constructor(private readonly aiAdvancedService: AiAdvancedService) {}

  @Get('anomalies')
  async detectAnomalies(
    @CurrentUser('id') userId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.aiAdvancedService.detectAnomalies(userId, workspaceId);
  }

  @Get('subscriptions')
  async detectSubscriptions(
    @CurrentUser('id') userId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.aiAdvancedService.detectSubscriptions(userId, workspaceId);
  }

  @Get('forecast')
  async generateForecast(
    @CurrentUser('id') userId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.aiAdvancedService.generateForecast(userId, workspaceId);
  }

  @Get('health-score')
  async calculateHealthScore(
    @CurrentUser('id') userId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.aiAdvancedService.calculateHealthScore(userId, workspaceId);
  }
}
