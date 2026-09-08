import { Test, TestingModule } from '@nestjs/testing';
import { VoiceService } from './voice.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VoiceService', () => {
  let service: VoiceService;
  let prisma: PrismaService;

  const mockPrismaService = {
    account: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<VoiceService>(VoiceService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should parse voice expense transcript and extract intent', async () => {
    mockPrismaService.account.findMany.mockResolvedValue([
      { id: 'acc-1', name: 'GTBank Savings', currency: 'NGN' },
    ]);
    mockPrismaService.category.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'Groceries' },
    ]);

    const res = await service.processVoiceInput('user-1', 'ws-1', {
      transcriptText: 'Spent 12500 Naira on groceries at Shoprite',
    });

    expect(res.extractedIntent.type).toBe('EXPENSE');
    expect(res.extractedIntent.amount).toBe(12500);
    expect(res.extractedIntent.merchant).toBe('Shoprite');
    expect(res.extractedIntent.matchedCategoryName).toBe('Groceries');
    expect(res.confidence).toBe(0.96);
  });

  it('should parse voice income transcript', async () => {
    mockPrismaService.account.findMany.mockResolvedValue([
      { id: 'acc-1', name: 'Zenith Bank', currency: 'NGN' },
    ]);
    mockPrismaService.category.findMany.mockResolvedValue([]);

    const res = await service.processVoiceInput('user-1', 'ws-1', {
      transcriptText: 'Received 150000 Naira freelance salary',
    });

    expect(res.extractedIntent.type).toBe('INCOME');
    expect(res.extractedIntent.amount).toBe(150000);
  });

  it('should confirm voice transaction and record in database', async () => {
    mockPrismaService.account.findFirst.mockResolvedValue({ id: 'acc-1', currency: 'NGN' });
    mockPrismaService.transaction.create.mockResolvedValue({ id: 'tx-voice-1' });
    mockPrismaService.account.update.mockResolvedValue({ id: 'acc-1', currentBalance: 37500 });

    const result = await service.confirmVoiceTransaction('user-1', 'ws-1', {
      accountId: 'acc-1',
      amount: 12500,
      description: 'Spent on groceries',
      merchant: 'Shoprite',
      type: 'EXPENSE',
    });

    expect(result.transaction.id).toBe('tx-voice-1');
    expect(result.accountBalance).toBe(37500);
  });
});
