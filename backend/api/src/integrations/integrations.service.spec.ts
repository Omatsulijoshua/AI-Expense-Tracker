import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationsService } from './integrations.service';
import { PrismaService } from '../prisma/prisma.service';
import { MockSandboxProvider } from './adapters/mock-sandbox-provider';

describe('IntegrationsService', () => {
  let service: IntegrationsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    account: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        MockSandboxProvider,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should generate a bank connect token', async () => {
    const res = await service.generateConnectToken('user-1');
    expect(res.connectUrl).toContain('mono.co');
    expect(res.sessionToken).toBeDefined();
  });

  it('should exchange public token and create connected accounts', async () => {
    mockPrismaService.account.create.mockResolvedValue({
      id: 'acc-linked-1',
      name: 'GTBank (Sandbox) - Savings',
    });
    mockPrismaService.transaction.create.mockResolvedValue({ id: 'tx-synced-1' });

    const res = await service.exchangeToken('user-1', 'ws-1', {
      publicToken: 'public_sandbox_123',
    });

    expect(res.institutionName).toBe('GTBank (Sandbox)');
    expect(res.accountsConnected).toBe(2);
  });

  it('should fetch active bank connections', async () => {
    mockPrismaService.account.findMany.mockResolvedValue([
      {
        id: 'acc-1',
        name: 'GTBank Savings',
        providerId: 'conn_100',
        institution: 'GTBank',
        updatedAt: new Date(),
      },
    ]);

    const connections = await service.getConnections('user-1');
    expect(connections.length).toBe(1);
    expect(connections[0].institutionName).toBe('GTBank');
  });
});
