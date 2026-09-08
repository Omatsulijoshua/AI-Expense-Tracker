import { Module } from '@nestjs/common';
import { AiAdvancedService } from './ai-advanced.service';
import { AiAdvancedController } from './ai-advanced.controller';

@Module({
  controllers: [AiAdvancedController],
  providers: [AiAdvancedService],
  exports: [AiAdvancedService],
})
export class AiAdvancedModule {}
