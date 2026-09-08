import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCashFlowSummary', () => {
    it('should calculate total inflow, outflow, and net cash flow', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        { amount: new Prisma.Decimal(100000), type: 'INCOME', transactionDate: new Date('2026-09-01') },
        { amount: new Prisma.Decimal(25000), type: 'EXPENSE', transactionDate: new Date('2026-09-02') },
        { amount: new Prisma.Decimal(15000), type: 'EXPENSE', transactionDate: new Date('2026-09-03') },
      ]);

      const result = await service.getCashFlowSummary('user-1', { period: 'THIS_MONTH' as any });

      expect(result.totalInflow).toBe(100000);
      expect(result.totalOutflow).toBe(40000);
      expect(result.netCashFlow).toBe(60000);
      expect(result.timeSeries.length).toBe(3);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should group transactions by category and calculate percentage shares', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        { amount: new Prisma.Decimal(30000), type: 'EXPENSE', categoryId: 'cat-1', category: { name: 'Food', icon: 'restaurant', color: '#FF5722' } },
        { amount: new Prisma.Decimal(10000), type: 'EXPENSE', categoryId: 'cat-1', category: { name: 'Food', icon: 'restaurant', color: '#FF5722' } },
        { amount: new Prisma.Decimal(10000), type: 'EXPENSE', categoryId: 'cat-2', category: { name: 'Transport', icon: 'car', color: '#2196F3' } },
      ]);

      const result = await service.getCategoryBreakdown('user-1', { period: 'THIS_MONTH' as any });

      expect(result.grandTotal).toBe(50000);
      expect(result.categoriesCount).toBe(2);
      expect(result.items[0].name).toBe('Food');
      expect(result.items[0].amount).toBe(40000);
      expect(result.items[0].percentage).toBe(80);
    });
  });
});
