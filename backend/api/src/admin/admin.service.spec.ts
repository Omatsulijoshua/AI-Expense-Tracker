import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    documentExtraction: {
      count: jest.fn(),
    },
    transaction: {
      count: jest.fn(),
    },
    auditLog: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return a list of user admin views with account and transaction counts', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          currency: 'NGN',
          isEmailVerified: true,
          createdAt: new Date(),
          _count: { accounts: 2, transactions: 15 },
        },
      ]);

      const result = await service.getUsers();
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual('user-1');
      expect(result[0].accountsCount).toEqual(2);
      expect(result[0].transactionsCount).toEqual(15);
      expect(result[0].isLocked).toBeFalsy();
    });
  });

  describe('updateUserStatus', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserStatus('nonexistent', { isLocked: true }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update user lock status and log admin action', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        isEmailVerified: false,
        updatedAt: new Date(),
      });
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      const res = await service.updateUserStatus('user-1', { isLocked: true });

      expect(res.isLocked).toBeTruthy();
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('getSystemHealth', () => {
    it('should return operational system health report', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const health = await service.getSystemHealth();

      expect(health.status).toEqual('OPERATIONAL');
      expect(health.databaseStatus).toEqual('CONNECTED');
      expect(health.providers.length).toBeGreaterThan(0);
    });
  });

  describe('getAiMetrics', () => {
    it('should return computed AI usage metrics and estimated token costs', async () => {
      mockPrismaService.documentExtraction.count.mockResolvedValue(15);
      mockPrismaService.transaction.count.mockResolvedValue(10);
      mockPrismaService.auditLog.count.mockResolvedValue(30);

      const metrics = await service.getAiMetrics();

      expect(metrics.totalScans).toEqual(15);
      expect(metrics.totalVoiceParses).toEqual(10);
      expect(metrics.totalAssistantQueries).toEqual(30);
      expect(metrics.totalTokensUsed).toBeGreaterThan(0);
      expect(metrics.totalEstimatedCostUsd).toBeGreaterThan(0);
      expect(metrics.breakdown).toHaveLength(3);
    });
  });

  describe('getAuditLogs', () => {
    it('should return mapped audit log entries', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          actorId: 'admin-1',
          action: 'UPDATE_USER',
          entity: 'USER',
          entityId: 'user-1',
          metadata: '{"reason":"security"}',
          createdAt: new Date(),
          actor: { email: 'admin@system.com', name: 'System Admin' },
        },
      ]);

      const logs = await service.getAuditLogs({ limit: 10 });

      expect(logs).toHaveLength(1);
      expect(logs[0].action).toEqual('UPDATE_USER');
      expect(logs[0].metadata).toEqual({ reason: 'security' });
    });
  });
});
