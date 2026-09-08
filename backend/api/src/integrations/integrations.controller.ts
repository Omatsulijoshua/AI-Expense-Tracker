import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { ConnectBankDto, ExchangeTokenDto, SyncConnectionDto, WebhookEventDto } from './dto/integrations.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('connect-token')
  @UseGuards(JwtAuthGuard)
  async getConnectToken(@CurrentUser('id') userId: string) {
    return this.integrationsService.generateConnectToken(userId);
  }

  @Post('exchange-token')
  @UseGuards(JwtAuthGuard)
  async exchangeToken(
    @CurrentUser('id') userId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: ExchangeTokenDto,
  ) {
    return this.integrationsService.exchangeToken(userId, workspaceId, dto);
  }

  @Get('connections')
  @UseGuards(JwtAuthGuard)
  async getConnections(@CurrentUser('id') userId: string) {
    return this.integrationsService.getConnections(userId);
  }

  @Post('sync/:connectionId')
  @UseGuards(JwtAuthGuard)
  async syncConnection(
    @CurrentUser('id') userId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Param('connectionId') connectionId: string,
  ) {
    return this.integrationsService.syncConnection(userId, workspaceId, connectionId);
  }

  @Post('webhooks/:provider')
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: WebhookEventDto,
  ) {
    return this.integrationsService.handleWebhook(provider, payload);
  }
}
