import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { RolesGuard } from './roles.guard';
import { RateLimiterGuard } from './rate-limiter.guard';

@Module({
  providers: [SecurityService, RolesGuard, RateLimiterGuard],
  exports: [SecurityService, RolesGuard, RateLimiterGuard],
})
export class SecurityModule {}
