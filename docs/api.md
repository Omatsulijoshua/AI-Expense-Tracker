# Expense Tracker — API Design Specification

## 1. REST Conventions
- Base URL path: `/api/v1`
- Content Type: `application/json`
- Standard Authentication Header: `Authorization: Bearer <jwt_access_token>`

## 2. API Response Standard Format
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  },
  "error": null
}
```

## 3. Endpoints Summary
- `/api/v1/auth/*`: Registration, login, refresh, logout, password reset.
- `/api/v1/users/*`: Profile management, security settings.
- `/api/v1/workspaces/*`: Multi-tenant workspace management and team invitations.
- `/api/v1/accounts/*`: CRUD operations for financial accounts and balance tracking.
- `/api/v1/transactions/*`: Financial ledger API (filters, cursor pagination, batch creation).
- `/api/v1/categories/*`: Category & subcategory taxonomy tree.
- `/api/v1/budgets/*`: Budget creation, tracking, status checks.
- `/api/v1/goals/*`: Savings goals targets and milestone logging.
- `/api/v1/bills/*`: Bill management and calendar feeds.
- `/api/v1/debts/*`: Money owed and debt payment recording.
- `/api/v1/reports/*`: Cash flow, net worth, and category spending reports.
- `/api/v1/documents/*`: Document upload, OCR extractions, private link signatures.
- `/api/v1/ai/*`: Voice transaction parsing, natural language assistant, anomaly detection.
- `/api/v1/integrations/*`: Bank provider connections, webhooks, sync triggers.
- `/api/v1/health`: System status and dependency healthcheck endpoint.
