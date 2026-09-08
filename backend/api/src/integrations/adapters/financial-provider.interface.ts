export interface ExternalAccount {
  id: string;
  name: string;
  type: string; // 'BANK_ACCOUNT' | 'CREDIT_CARD' | 'SAVINGS_ACCOUNT' | etc.
  institutionName: string;
  currency: string;
  balance: number;
  accountNumberMask?: string;
}

export interface ExternalTransaction {
  externalId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: Date;
  description: string;
  merchant?: string;
  category?: string;
}

export interface IFinancialProvider {
  getProviderName(): string;

  generateConnectToken(userId: string): Promise<{ connectUrl: string; sessionToken: string }>;

  exchangeToken(publicToken: string): Promise<{
    connectionId: string;
    institutionName: string;
    accessToken: string;
  }>;

  fetchAccounts(accessToken: string): Promise<ExternalAccount[]>;

  fetchTransactions(accessToken: string, fromDate?: Date): Promise<ExternalTransaction[]>;
}
