import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MockSandboxProvider } from './adapters/mock-sandbox-provider';
import { ExchangeTokenDto, WebhookEventDto } from './dto/integrations.dto';
import { AccountType, TransactionType, TransactionSource } from '@prisma/client';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mockSandboxProvider: MockSandboxProvider,
  ) {}

  async generateConnectToken(userId: string) {
    return this.mockSandboxProvider.generateConnectToken(userId);
  }

  async exchangeToken(userId: string, workspaceId: string, dto: ExchangeTokenDto) {
    const exchangeResult = await this.mockSandboxProvider.exchangeToken(dto.publicToken);

    // Fetch accounts from provider
    const extAccounts = await this.mockSandboxProvider.fetchAccounts(exchangeResult.accessToken);
    const extTransactions = await this.mockSandboxProvider.fetchTransactions(exchangeResult.accessToken);

    const createdAccounts = [];

    await this.prisma.$transaction(async (tx) => {
      for (const extAcc of extAccounts) {
        let accType: AccountType = AccountType.BANK_ACCOUNT;
        if (extAcc.type === 'SAVINGS_ACCOUNT') accType = AccountType.SAVINGS_ACCOUNT;
        if (extAcc.type === 'CREDIT_CARD') accType = AccountType.CREDIT_CARD;

        const dbAccount = await tx.account.create({
          data: {
            userId,
            workspaceId,
            name: `${extAcc.institutionName} - ${extAcc.name}`,
            type: accType,
            institution: extAcc.institutionName,
            currency: extAcc.currency,
            openingBalance: extAcc.balance,
            currentBalance: extAcc.balance,
            availableBalance: extAcc.balance,
            isConnected: true,
            providerId: exchangeResult.connectionId,
          },
        });
        createdAccounts.push(dbAccount);

        // Ingest initial transactions
        for (const extTx of extTransactions) {
          await tx.transaction.create({
            data: {
              userId,
              workspaceId,
              accountId: dbAccount.id,
              type: extTx.type as TransactionType,
              amount: extTx.amount,
              currency: extAcc.currency,
              merchant: extTx.merchant,
              description: extTx.description,
              transactionDate: extTx.date,
              externalTransactionId: `${extTx.externalId}_${dbAccount.id}`,
              source: TransactionSource.API,
              status: 'COMPLETED',
            },
          });
        }
      }
    });

    return {
      message: `Successfully connected ${exchangeResult.institutionName}`,
      connectionId: exchangeResult.connectionId,
      institutionName: exchangeResult.institutionName,
      accountsConnected: createdAccounts.length,
    };
  }

  async getConnections(userId: string) {
    const connectedAccounts = await this.prisma.account.findMany({
      where: { userId, isConnected: true },
      select: {
        id: true,
        name: true,
        type: true,
        institution: true,
        currency: true,
        currentBalance: true,
        providerId: true,
        updatedAt: true,
      },
    });

    // Group by providerId / institution
    const connectionsMap = new Map<string, any>();
    for (const acc of connectedAccounts) {
      const connId = acc.providerId || 'unknown';
      if (!connectionsMap.has(connId)) {
        connectionsMap.set(connId, {
          connectionId: connId,
          institutionName: acc.institution || 'Linked Bank',
          status: 'CONNECTED',
          lastSyncedAt: acc.updatedAt,
          accounts: [],
        });
      }
      connectionsMap.get(connId).accounts.push(acc);
    }

    return Array.from(connectionsMap.values());
  }

  async syncConnection(userId: string, workspaceId: string, connectionId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, workspaceId, providerId: connectionId, isConnected: true },
    });

    if (accounts.length === 0) {
      throw new NotFoundException('Connected institution not found');
    }

    const dummyAccessToken = `token_${connectionId}`;
    const extTransactions = await this.mockSandboxProvider.fetchTransactions(dummyAccessToken);

    let syncedCount = 0;

    for (const account of accounts) {
      for (const extTx of extTransactions) {
        const extId = `${extTx.externalId}_${account.id}_sync`;

        const existing = await this.prisma.transaction.findFirst({
          where: { externalTransactionId: extId },
        });

        if (!existing) {
          await this.prisma.transaction.create({
            data: {
              userId,
              workspaceId,
              accountId: account.id,
              type: extTx.type as TransactionType,
              amount: extTx.amount,
              currency: account.currency,
              merchant: extTx.merchant,
              description: extTx.description,
              transactionDate: extTx.date,
              externalTransactionId: extId,
              source: TransactionSource.API,
              status: 'COMPLETED',
            },
          });
          syncedCount++;
        }
      }

      await this.prisma.account.update({
        where: { id: account.id },
        data: { updatedAt: new Date() },
      });
    }

    return {
      message: 'Account sync complete',
      connectionId,
      newTransactionsCount: syncedCount,
      syncedAt: new Date(),
    };
  }

  async handleWebhook(providerName: string, payload: WebhookEventDto) {
    if (!payload.connectionId) {
      throw new BadRequestException('Missing connectionId in webhook payload');
    }

    const accounts = await this.prisma.account.findMany({
      where: { providerId: payload.connectionId, isConnected: true },
    });

    if (accounts.length === 0) {
      return { status: 'IGNORED', reason: 'No matching connection ID found' };
    }

    const firstAcc = accounts[0];
    await this.syncConnection(firstAcc.userId, firstAcc.workspaceId, payload.connectionId);

    return { status: 'PROCESSED', event: payload.event, connectionId: payload.connectionId };
  }
}
