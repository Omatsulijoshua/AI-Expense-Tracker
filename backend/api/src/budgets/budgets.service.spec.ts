import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsService } from './budgets.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Prisma } from '@prisma/client';

describe('BudgetsService', () => {
  let service: BudgetsService;

  const mockPrismaService = {
    budget: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
  };

  const mockNotificationsService = {
    dispatchNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateBudgetStatus', () => {
    it('should calculate category spent vs allocated and dispatch alert when percentage >= 90%', async () => {
      mockPrismaService.budget.findFirst.mockResolvedValue({
        id: 'b-1',
        name: 'September Budget',
        amount: new Prisma.Decimal(100000),
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-30'),
        categories: [
          {
            categoryId: 'cat-food',
            allocated: new Prisma.Decimal(50000),
            category: { name: 'Food & Dining', icon: 'restaurant' },
          },
        ],
      });

      mockPrismaService.transaction.findMany.mockResolvedValue([
        { amount: new Prisma.Decimal(46000), categoryId: 'cat-food', type: 'EXPENSE' },
      ]);

      const result = await service.evaluateBudgetStatus('user-1', 'b-1');

      expect(result.totalSpent).toBe(46000);
      expect(result.categoryAllocations[0].percentage).toBe(92);
      expect(mockNotificationsService.dispatchNotification).toHaveBeenCalledWith(
        'user-1',
        expect.stringContaining('90% Threshold'),
        expect.any(String),
        'BUDGET_WARNING',
      );
    });
  });
});
