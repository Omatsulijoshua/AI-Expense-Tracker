import { Test, TestingModule } from '@nestjs/testing';
import { BusinessDebtService } from './business-debt.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('BusinessDebtService', () => {
  let service: BusinessDebtService;
  let prisma: PrismaService;

  const mockPrismaService = {
    debt: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    debtPayment: {
      create: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
    workspace: {
      create: jest.fn(),
    },
    workspaceMember: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessDebtService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BusinessDebtService>(BusinessDebtService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should create a debt record', async () => {
    mockPrismaService.debt.create.mockResolvedValue({
      id: 'debt-1',
      person: 'John Doe',
      amount: 50000,
      remaining: 50000,
    });

    const res = await service.createDebt('user-1', {
      person: 'John Doe',
      type: 'I_OWE',
      amount: 50000,
    });

    expect(res.id).toBe('debt-1');
  });

  it('should record debt payment and reduce remaining debt balance', async () => {
    mockPrismaService.debt.findFirst.mockResolvedValue({
      id: 'debt-1',
      remaining: 50000,
    });
    mockPrismaService.debtPayment.create.mockResolvedValue({ id: 'pay-1' });
    mockPrismaService.debt.update.mockResolvedValue({ id: 'debt-1', remaining: 30000 });

    const res = await service.recordDebtPayment('user-1', 'debt-1', { amount: 20000 });
    expect(res.payment.id).toBe('pay-1');
  });

  it('should throw BadRequestException if payment exceeds remaining balance', async () => {
    mockPrismaService.debt.findFirst.mockResolvedValue({
      id: 'debt-1',
      remaining: 10000,
    });

    await expect(service.recordDebtPayment('user-1', 'debt-1', { amount: 20000 })).rejects.toThrow(BadRequestException);
  });

  it('should calculate assets vs liabilities net worth summary', async () => {
    mockPrismaService.account.findMany.mockResolvedValue([
      { id: 'acc-1', type: 'BANK_ACCOUNT', currentBalance: 200000 },
      { id: 'acc-2', type: 'CREDIT_CARD', currentBalance: 50000 },
    ]);
    mockPrismaService.debt.findMany.mockResolvedValue([
      { type: 'OWED_TO_ME', remaining: 30000 },
      { type: 'I_OWE', remaining: 20000 },
    ]);

    const summary = await service.getAssetsLiabilitiesSummary('user-1', 'ws-1');

    expect(summary.assets.totalAssets).toBe(230000); // 200k bank + 30k receivable
    expect(summary.liabilities.totalLiabilities).toBe(70000); // 50k credit + 20k payable
    expect(summary.netWorth).toBe(160000); // 230k - 70k
  });
});
