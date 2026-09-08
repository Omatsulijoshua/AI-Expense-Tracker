import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { ChatQueryDto } from './dto/ai-assistant.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('ai-assistant')
@UseGuards(JwtAuthGuard)
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Get('suggestions')
  async getSuggestions() {
    return this.aiAssistantService.getSuggestions();
  }

  @Post('chat')
  async processChatQuery(
    @CurrentUser('id') userId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: ChatQueryDto,
  ) {
    return this.aiAssistantService.processChatQuery(userId, workspaceId, dto);
  }
}
