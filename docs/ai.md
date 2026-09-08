# Expense Tracker — AI & Voice Architecture Specification

## 1. Vision & Document OCR Pipeline
- User uploads receipt / statement image or PDF document.
- OCR vision model extracts structured JSON: Merchant, Date, Time, Line Items, Subtotal, Tax, Total, Payment Method.
- extracted fields are stored with an `aiConfidence` score (0–100%).
- User confirms or edits extracted fields before saving to financial ledger.

## 2. Voice Input Processing Pipeline
- Audio recorded on mobile client -> Speech-To-Text processing.
- Natural Language Understanding (NLU) extracts transaction intent: `Type`, `Amount`, `Category`, `Account`, `Date`.
- Interactive prompt asks user if mandatory fields are missing.

## 3. Natural Language Financial Assistant Tool-Calling Architecture
```text
User Query ("How much did I spend on food this month?")
   │
   v
NestJS AI Agent Engine
   │
   ├─► Evaluates intent & maps to tool calls:
   │   getCategorySpending(category: "Food", dateRange: "THIS_MONTH")
   │
   ├─► Executes database query securely against PostgreSQL
   │
   v
AI formats deterministic SQL query result into natural language response
```

## 4. Deterministic Financial Guardrail Rule
- AI services NEVER calculate or generate balances or totals independently.
- AI presents data fetched strictly from backend ledger calculations.
