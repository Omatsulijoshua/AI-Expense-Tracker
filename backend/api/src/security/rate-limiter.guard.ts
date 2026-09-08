import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator';

interface RequestTracker {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private readonly storage = new Map<string, RequestTracker>();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const ttlSeconds = options?.ttlSeconds || 60;
    const maxLimit = options?.limit || 60;

    const req = context.switchToHttp().getRequest();
    const clientKey = req.user?.id || req.ip || '127.0.0.1';
    const now = Date.now();

    let tracker = this.storage.get(clientKey);
    if (!tracker || tracker.resetTime < now) {
      tracker = {
        count: 1,
        resetTime: now + ttlSeconds * 1000,
      };
      this.storage.set(clientKey, tracker);
      return true;
    }

    if (tracker.count >= maxLimit) {
      throw new HttpException(
        `Too Many Requests: Rate limit of ${maxLimit} requests per ${ttlSeconds} seconds exceeded.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    tracker.count++;
    return true;
  }
}
