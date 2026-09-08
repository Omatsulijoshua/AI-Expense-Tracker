import { Test, TestingModule } from '@nestjs/testing';
import { ImportsService } from './imports.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ImportsService', () => {
  let service: ImportsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    account: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ImportsService>(ImportsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('parseFileContent', () => {
    it('should throw BadRequestException if file content is empty', async () => {
      await expect(service.parseFileContent({ fileContent: '   ' })).rejects.toThrow(BadRequestException);
    });

    it('should parse CSV lines and auto detect headers and sample rows', async () => {
      const csvData = `Date,Amount,Description,Category\n2026-03-01,150.00,Groceries,Food\n2026-03-02,50.00,Taxi,Transport`;
      const result = await service.parseFileContent({ fileContent: csvData });

      expect(result.headers).toEqual(['Date', 'Amount', 'Description', 'Category']);
      expect(result.totalRows).toBe(2);
      expect(result.autoMapping.dateColumnIndex).toBe(0);
      expect(result.autoMapping.amountColumnIndex).toBe(1);
      expect(result.autoMapping.descriptionColumnIndex).toBe(2);
    });
  });

  describe('previewImport', () => {
    it('should throw NotFoundException if account does not exist', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(null);

      await expect(
        service.previewImport('user-1', 'ws-1', {
          fileContent: 'Date,Amount,Desc\n2026-01-01,100,Test',
          accountId: 'invalid-acc',
          columnMapping: { dateColumnIndex: 0, amountColumnIndex: 1, descriptionColumnIndex: 2 },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should detect duplicate transaction based on date and amount', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue({
        id: 'acc-1',
        name: 'Checking Account',
      });
      mockPrismaService.transaction.findMany.mockResolvedValue([
        {
          id: 'tx-existing',
          transactionDate: new Date('2026-03-01T00:00:00.000Z'),
          amount: 150.00,
          description: 'Existing Grocery',
          externalTransactionId: null,
        },
      ]);

      const csvData = `Date,Amount,Description\n2026-03-01,150.00,Groceries`;
      const result = await service.previewImport('user-1', 'ws-1', {
        fileContent: csvData,
        accountId: 'acc-1',
        columnMapping: { dateColumnIndex: 0, amountColumnIndex: 1, descriptionColumnIndex: 2 },
      });

      expect(result.totalRows).toBe(1);
      expect(result.duplicateRows).toBe(1);
      expect(result.rows[0].isDuplicate).toBe(true);
    });
  });

  describe('executeImport', () => {
    it('should create transactions and update account balance', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue({
        id: 'acc-1',
        currency: 'NGN',
        currentBalance: 1000.0,
      });
      mockPrismaService.transaction.create.mockResolvedValue({ id: 'tx-new' });
      mockPrismaService.account.update.mockResolvedValue({
        id: 'acc-1',
        currentBalance: 850.0,
      });

      const result = await service.executeImport('user-1', 'ws-1', {
        accountId: 'acc-1',
        rows: [
          {
            transactionDate: '2026-03-01T00:00:00.000Z',
            amount: 150.0,
            description: 'New Expense',
            type: 'EXPENSE',
            isValid: true,
            isDuplicate: false,
          },
        ],
      });

      expect(result.importedCount).toBe(1);
      expect(result.accountBalance).toBe(850.0);
    });
  });
});
