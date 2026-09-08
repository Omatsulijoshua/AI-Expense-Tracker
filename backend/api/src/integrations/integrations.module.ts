import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { MockSandboxProvider } from './adapters/mock-sandbox-provider';

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService, MockSandboxProvider],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
