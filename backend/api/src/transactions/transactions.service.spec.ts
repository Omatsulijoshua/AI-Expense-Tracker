import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    account: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    transactionTransfer: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTransaction', () => {
    it('should throw NotFoundException if target account does not exist', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(null);

      await expect(
        service.createTransaction('user-1', 'ws-1', {
          accountId: 'nonexistent-acc',
          type: 'EXPENSE' as any,
          amount: 5000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create EXPENSE and decrement account balance', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue({
        id: 'acc-1',
        currency: 'NGN',
        currentBalance: new Prisma.Decimal(50000),
      });

      mockPrismaService.transaction.create.mockResolvedValue({
        id: 'tx-1',
        amount: new Prisma.Decimal(5000),
        type: 'EXPENSE',
      });

      mockPrismaService.account.update.mockResolvedValue({
        id: 'acc-1',
        currentBalance: new Prisma.Decimal(45000),
      });

      const result = await service.createTransaction('user-1', 'ws-1', {
        accountId: 'acc-1',
        type: 'EXPENSE' as any,
        amount: 5000,
        description: 'Groceries',
      });

      expect(result.transaction.id).toBe('tx-1');
      expect(result.updatedAccountBalance.toString()).toBe('45000');
    });
  });

  describe('createTransfer', () => {
    it('should throw BadRequestException if source and destination accounts are identical', async () => {
      await expect(
        service.createTransfer('user-1', 'ws-1', {
          sourceAccountId: 'acc-1',
          destinationAccountId: 'acc-1',
          amount: 10000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should execute linked transfer updating source and destination account balances', async () => {
      mockPrismaService.account.findFirst
        .mockResolvedValueOnce({ id: 'acc-1', name: 'GTBank', currency: 'NGN' })
        .mockResolvedValueOnce({ id: 'acc-2', name: 'Cash Wallet', currency: 'NGN' });

      mockPrismaService.transaction.create
        .mockResolvedValueOnce({ id: 'tx-out', amount: new Prisma.Decimal(10000) })
        .mockResolvedValueOnce({ id: 'tx-in', amount: new Prisma.Decimal(10000) });

      mockPrismaService.transactionTransfer.create.mockResolvedValue({ id: 'link-1' });

      mockPrismaService.account.update
        .mockResolvedValueOnce({ id: 'acc-1', currentBalance: new Prisma.Decimal(40000) })
        .mockResolvedValueOnce({ id: 'acc-2', currentBalance: new Prisma.Decimal(15000) });

      const result = await service.createTransfer('user-1', 'ws-1', {
        sourceAccountId: 'acc-1',
        destinationAccountId: 'acc-2',
        amount: 10000,
      });

      expect(result.transferLink.id).toBe('link-1');
      expect(result.sourceBalance.toString()).toBe('40000');
      expect(result.destinationBalance.toString()).toBe('15000');
    });
  });
});
