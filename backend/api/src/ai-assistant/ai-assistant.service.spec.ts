import { Test, TestingModule } from '@nestjs/testing';
import { AiAssistantService } from './ai-assistant.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AiAssistantService', () => {
  let service: AiAssistantService;
  let prisma: PrismaService;

  const mockPrismaService = {
    account: {
      findMany: jest.fn(),
    },
    bill: {
      findMany: jest.fn(),
    },
    budget: {
      findMany: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAssistantService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AiAssistantService>(AiAssistantService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should return initial prompt suggestions', async () => {
    const suggestions = await service.getSuggestions();
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toContain('net worth');
  });

  it('should execute net worth tool when asked about net worth', async () => {
    mockPrismaService.account.findMany.mockResolvedValue([
      { id: 'acc-1', name: 'GTBank', currentBalance: 250000 },
      { id: 'acc-2', name: 'Zenith', currentBalance: 150000 },
    ]);

    const res = await service.processChatQuery('user-1', 'ws-1', {
      message: 'What is my total net worth across all accounts?',
    });

    expect(res.toolsExecuted.length).toBe(1);
    expect(res.toolsExecuted[0].toolName).toBe('query_net_worth');
    expect(res.reply).toContain('400,000.00');
  });

  it('should execute upcoming bills tool when asked about bills due', async () => {
    mockPrismaService.bill.findMany.mockResolvedValue([
      { id: 'bill-1', name: 'Electricity', amount: 15000, status: 'UPCOMING', dueDate: new Date('2026-04-01') },
    ]);

    const res = await service.processChatQuery('user-1', 'ws-1', {
      message: 'Do I have any upcoming bills due soon?',
    });

    expect(res.toolsExecuted[0].toolName).toBe('query_upcoming_bills');
    expect(res.reply).toContain('Electricity');
    expect(res.reply).toContain('15,000.00');
  });

  it('should execute spending breakdown tool by default', async () => {
    mockPrismaService.transaction.findMany.mockResolvedValue([
      { id: 'tx-1', amount: 12000, category: { name: 'Food' } },
      { id: 'tx-2', amount: 5000, category: { name: 'Transport' } },
    ]);

    const res = await service.processChatQuery('user-1', 'ws-1', {
      message: 'Show me my general spending summary',
    });

    expect(res.toolsExecuted[0].toolName).toBe('query_spending_by_category');
    expect(res.reply).toContain('17,000.00');
    expect(res.reply).toContain('Food');
  });
});
