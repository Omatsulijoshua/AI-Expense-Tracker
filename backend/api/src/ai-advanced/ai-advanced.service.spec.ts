import { Test, TestingModule } from '@nestjs/testing';
import { AiAdvancedService } from './ai-advanced.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AiAdvancedService', () => {
  let service: AiAdvancedService;
  let prisma: PrismaService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
    bill: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAdvancedService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AiAdvancedService>(AiAdvancedService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should detect high amount spending anomalies', async () => {
    mockPrismaService.transaction.findMany.mockResolvedValue([
      { id: 'tx-1', amount: 150000, merchant: 'Luxury Store', description: 'Watch', transactionDate: new Date() },
      { id: 'tx-2', amount: 5000, merchant: 'Grocery', description: 'Food', transactionDate: new Date() },
      { id: 'tx-3', amount: 4000, merchant: 'Cafe', description: 'Coffee', transactionDate: new Date() },
    ]);

    const anomalies = await service.detectAnomalies('user-1', 'ws-1');
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].merchant).toBe('Luxury Store');
  });

  it('should detect recurring subscriptions', async () => {
    const now = new Date();
    const prevMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    mockPrismaService.transaction.findMany.mockResolvedValue([
      { id: 'tx-1', amount: 4500, merchant: 'Netflix', transactionDate: now, category: { name: 'Entertainment' } },
      { id: 'tx-2', amount: 4500, merchant: 'Netflix', transactionDate: prevMonth, category: { name: 'Entertainment' } },
    ]);

    const subs = await service.detectSubscriptions('user-1', 'ws-1');
    expect(subs.length).toBeGreaterThan(0);
    expect(subs[0].merchant).toContain('Netflix');
  });

  it('should generate 30-day cash flow forecast points', async () => {
    mockPrismaService.account.findMany.mockResolvedValue([
      { id: 'acc-1', currentBalance: 200000 },
    ]);

    const points = await service.generateForecast('user-1', 'ws-1');
    expect(points.length).toBe(7); // Day 0, 5, 10, 15, 20, 25, 30
    expect(points[0].projectedBalance).toBe(200000);
  });

  it('should calculate financial health score', async () => {
    mockPrismaService.account.findMany.mockResolvedValue([
      { id: 'acc-1', currentBalance: 150000 },
    ]);
    mockPrismaService.bill.findMany.mockResolvedValue([]);

    const scoreResult = await service.calculateHealthScore('user-1', 'ws-1');
    expect(scoreResult.score).toBeGreaterThanOrEqual(80);
    expect(scoreResult.rating).toBe('EXCELLENT');
  });
});
