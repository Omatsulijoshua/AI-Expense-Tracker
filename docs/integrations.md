# Expense Tracker — Financial Integrations & Provider Abstraction Layer

## 1. Provider Abstraction Interface
All bank and financial API providers implement the abstract `FinancialProvider` interface:

```typescript
export interface FinancialProvider {
  connect(credentials: AuthCredentials): Promise<ConnectionResult>;
  getAccounts(connectionId: string): Promise<AccountData[]>;
  getBalances(connectionId: string): Promise<BalanceData[]>;
  getTransactions(connectionId: string, fromDate: Date): Promise<NormalizedTransaction[]>;
  refreshConnection(connectionId: string): Promise<boolean>;
  disconnect(connectionId: string): Promise<void>;
  handleWebhook(payload: any): Promise<WebhookProcessingResult>;
}
```

## 2. Ingestion & Deduplication Pipeline
```text
Provider Webhook / Sync Trigger
  ↓
Fetch Raw Transactions
  ↓
Normalize Schema
  ↓
Deduplicate Engine (Match External ID, Account, Date, Amount, Merchant Similarity)
  ↓
Automated Rule / AI Categorization
  ↓
Store in PostgreSQL Ledger
  ↓
Update Account Balance & Emit User Notification
```
