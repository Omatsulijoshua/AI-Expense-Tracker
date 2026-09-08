import { Test, TestingModule } from '@nestjs/testing';
import { SecurityService } from './security.service';
import { RolesGuard } from './roles.guard';
import { RateLimiterGuard } from './rate-limiter.guard';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ForbiddenException, HttpException } from '@nestjs/common';

describe('Security Suite', () => {
  let securityService: SecurityService;
  let rolesGuard: RolesGuard;
  let rateLimiterGuard: RateLimiterGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecurityService, RolesGuard, RateLimiterGuard, Reflector],
    }).compile();

    securityService = module.get<SecurityService>(SecurityService);
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    rateLimiterGuard = module.get<RateLimiterGuard>(RateLimiterGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('SecurityService (PII Scrubber & AES-256)', () => {
    it('should redact emails, phone numbers, and credit cards from AI prompt text', () => {
      const rawText =
        'User john.doe@example.com paid with card 4111111111111111 and phone 2348012345678.';
      const sanitized = securityService.sanitizeForAi(rawText);

      expect(sanitized).not.toContain('john.doe@example.com');
      expect(sanitized).not.toContain('4111111111111111');
      expect(sanitized).toContain('[REDACTED_EMAIL]');
      expect(sanitized).toContain('[REDACTED_CARD]');
    });

    it('should encrypt and decrypt sensitive data payload using AES-256', () => {
      const secretPayload = 'mono_oauth_access_token_xyz99';
      const encrypted = securityService.encryptData(secretPayload);

      expect(encrypted).not.toEqual(secretPayload);
      expect(encrypted).toContain(':');

      const decrypted = securityService.decryptData(encrypted);
      expect(decrypted).toEqual(secretPayload);
    });
  });

  describe('RolesGuard (RBAC)', () => {
    it('should allow access if handler has no required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const context: any = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: Role.MEMBER } }),
        }),
      };

      expect(rolesGuard.canActivate(context)).toBeTruthy();
    });

    it('should throw ForbiddenException if user lacks required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const context: any = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: Role.MEMBER } }),
        }),
      };

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow access if user has required role or is OWNER', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const context: any = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: Role.OWNER } }),
        }),
      };

      expect(rolesGuard.canActivate(context)).toBeTruthy();
    });
  });

  describe('RateLimiterGuard (Sliding Window)', () => {
    it('should allow requests up to the limit and throw 429 when exceeded', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue({ ttlSeconds: 60, limit: 2 });

      const context: any = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ ip: '192.168.1.1' }),
        }),
      };

      expect(rateLimiterGuard.canActivate(context)).toBeTruthy(); // Request 1
      expect(rateLimiterGuard.canActivate(context)).toBeTruthy(); // Request 2

      expect(() => rateLimiterGuard.canActivate(context)).toThrow(
        HttpException,
      ); // Request 3 -> Exceeded
    });
  });
});
