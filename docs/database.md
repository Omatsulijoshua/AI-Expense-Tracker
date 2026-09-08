# Expense Tracker — Database Schema & Ledger Architecture

## 1. Overview
The database layer uses PostgreSQL managed via Prisma ORM. Financial data integrity is guaranteed by relational strictness, numeric precision, foreign keys, and transaction boundary controls.

## 2. Currency & Financial Precision Standard
- All monetary fields use `NUMERIC(20, 4)` in PostgreSQL (`Decimal` in Prisma).
- Floating-point representations (`FLOAT`, `DOUBLE`) are strictly forbidden for currency values to prevent rounding errors.
- Multi-currency transactions retain original amount and original currency code, alongside computed base currency equivalent.

## 3. Core Relational Entities
- `users`: User identity credentials, locale, default currency.
- `sessions`: Refresh tokens, device information, session state.
- `workspaces`: Multi-tenant containers (Personal, Business, Shared).
- `workspace_members`: User permissions per workspace (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`).
- `accounts`: Bank accounts, Cash wallets, Credit cards, Investments.
- `transactions`: Ledger entries (`INCOME`, `EXPENSE`, `TRANSFER`).
- `transaction_transfers`: Link table between source outflow transaction and destination inflow transaction.
- `categories` & `subcategories`: Categorization hierarchy.
- `budgets` & `budget_categories`: Spending limits and category allocations.
- `bills`: Recurring bill obligations and due dates.
- `recurring_transactions`: Automated scheduled transaction triggers.
- `savings_goals`: Target savings goals, progress tracking.
- `debts` & `debt_payments`: Money owed / money owing ledger.
- `documents` & `document_extractions`: Uploaded receipts, invoices, statements & OCR AI extraction results.
- `audit_logs`: Immutable audit trails for key operations.
- `sync_jobs`: Background financial synchronization and API import tracking.

## 4. Key Performance Indexes
- `idx_transactions_user_workspace`: `(user_id, workspace_id, transaction_date DESC)`
- `idx_transactions_account`: `(account_id, transaction_date DESC)`
- `idx_transactions_category`: `(category_id, transaction_date DESC)`
- `idx_transactions_external_id`: `(external_transaction_id)`
- `idx_audit_actor`: `(actor_id, created_at DESC)`
