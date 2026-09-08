import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    workspace: {
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    workspaceMember: {
      findFirst: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mocked-jwt-token'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-jwt-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if user email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@example.com' });

      await expect(
        service.register({
          name: 'John',
          email: 'existing@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully register a new user and provision default workspace', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        currency: 'NGN',
        country: 'Nigeria',
        createdAt: new Date(),
      });
      mockPrismaService.workspace.create.mockResolvedValue({
        id: 'workspace-123',
        name: "John Doe's Personal Workspace",
        type: 'PERSONAL',
      });
      mockPrismaService.session.create.mockResolvedValue({ id: 'session-123' });

      const result = await service.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result.user.id).toBe('user-123');
      expect(result.defaultWorkspace.id).toBe('workspace-123');
      expect(result.accessToken).toBe('mocked-jwt-token');
      expect(result.refreshToken).toBe('mocked-jwt-token');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for invalid email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: hashedPassword,
        memberships: [],
      });

      await expect(
        service.login({ email: 'user@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should authenticate valid credentials and return JWT tokens', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'John',
        email: 'user@example.com',
        passwordHash: hashedPassword,
        currency: 'NGN',
        country: 'Nigeria',
        createdAt: new Date(),
        memberships: [{ workspaceId: 'ws-123' }],
      });
      mockPrismaService.session.create.mockResolvedValue({ id: 's-1' });

      const result = await service.login({ email: 'user@example.com', password: 'correctpassword' });

      expect(result.user.id).toBe('user-1');
      expect(result.accessToken).toBe('mocked-jwt-token');
    });
  });
});
