import { Injectable } from '@nestjs/common';
import { IFinancialProvider, ExternalAccount, ExternalTransaction } from './financial-provider.interface';

@Injectable()
export class MockSandboxProvider implements IFinancialProvider {
  getProviderName(): string {
    return 'MONO_SANDBOX';
  }

  async generateConnectToken(userId: string): Promise<{ connectUrl: string; sessionToken: string }> {
    const sessionToken = `sandbox_sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return {
      connectUrl: `https://connect.sandbox.mono.co/?token=${sessionToken}&user=${userId}`,
      sessionToken,
    };
  }

  async exchangeToken(publicToken: string): Promise<{ connectionId: string; institutionName: string; accessToken: string }> {
    const connectionId = `conn_${Date.now()}`;
    const accessToken = `sandbox_sk_${Date.now()}_${publicToken}`;
    return {
      connectionId,
      institutionName: 'GTBank (Sandbox)',
      accessToken,
    };
  }

  async fetchAccounts(accessToken: string): Promise<ExternalAccount[]> {
    return [
      {
        id: `ext_acc_1_${accessToken.slice(-6)}`,
        name: 'Savings Account',
        type: 'SAVINGS_ACCOUNT',
        institutionName: 'GTBank (Sandbox)',
        currency: 'NGN',
        balance: 450000.0,
        accountNumberMask: '****5678',
      },
      {
        id: `ext_acc_2_${accessToken.slice(-6)}`,
        name: 'Credit Card',
        type: 'CREDIT_CARD',
        institutionName: 'GTBank (Sandbox)',
        currency: 'NGN',
        balance: 125000.0,
        accountNumberMask: '****1234',
      },
    ];
  }

  async fetchTransactions(accessToken: string, fromDate?: Date): Promise<ExternalTransaction[]> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return [
      {
        externalId: `tx_sandbox_1_${accessToken.slice(-4)}`,
        amount: 25000.0,
        type: 'EXPENSE',
        date: yesterday,
        description: 'Jumia Online Store',
        merchant: 'Jumia Technologies',
        category: 'Shopping',
      },
      {
        externalId: `tx_sandbox_2_${accessToken.slice(-4)}`,
        amount: 150000.0,
        type: 'INCOME',
        date: now,
        description: 'Client Salary Transfer',
        merchant: 'Acme Corp',
        category: 'Salary',
      },
    ];
  }
}
