import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    document: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    documentExtraction: {
      create: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should upload document metadata', async () => {
    mockPrismaService.document.create.mockResolvedValue({
      id: 'doc-1',
      filename: 'receipt.jpg',
      fileSize: 1024,
    });

    const doc = await service.uploadDocument('user-1', {
      filename: 'receipt.jpg',
      fileContentBase64: 'aGVsbG8=',
    });

    expect(doc.id).toBe('doc-1');
  });

  it('should analyze receipt and create extraction record', async () => {
    mockPrismaService.document.findFirst.mockResolvedValue({
      id: 'doc-1',
      filename: 'grocery_receipt.jpg',
    });
    mockPrismaService.documentExtraction.create.mockResolvedValue({
      id: 'ext-1',
      confidence: 0.94,
    });

    const result = await service.analyzeReceipt('user-1', 'doc-1');

    expect(result.extractedData.merchant).toBe('Shoprite Supermarket');
    expect(result.confidence).toBe(0.94);
  });

  it('should confirm receipt and create expense transaction', async () => {
    mockPrismaService.document.findFirst.mockResolvedValue({ id: 'doc-1' });
    mockPrismaService.account.findFirst.mockResolvedValue({ id: 'acc-1', currency: 'NGN' });
    mockPrismaService.transaction.create.mockResolvedValue({ id: 'tx-image-1' });
    mockPrismaService.account.update.mockResolvedValue({ id: 'acc-1', currentBalance: 8000 });

    const result = await service.confirmReceiptTransaction('user-1', 'ws-1', 'doc-1', {
      accountId: 'acc-1',
      amount: 2000,
      description: 'Groceries from receipt',
      merchant: 'Shoprite',
    });

    expect(result.transaction.id).toBe('tx-image-1');
    expect(result.accountBalance).toBe(8000);
  });
});
