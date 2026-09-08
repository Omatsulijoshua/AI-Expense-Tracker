import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { ProcessVoiceInputDto, ConfirmVoiceTransactionDto } from './dto/voice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('voice')
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('parse')
  async processVoiceInput(
    @CurrentUser('id') userId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: ProcessVoiceInputDto,
  ) {
    return this.voiceService.processVoiceInput(userId, workspaceId, dto);
  }

  @Post('confirm')
  async confirmVoiceTransaction(
    @CurrentUser('id') userId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: ConfirmVoiceTransactionDto,
  ) {
    return this.voiceService.confirmVoiceTransaction(userId, workspaceId, dto);
  }
}
