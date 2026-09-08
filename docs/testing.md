# Expense Tracker — Testing & Verification Strategy

## 1. Automated Test Suites
- **Backend Unit Tests**: Jest test runner for services, DTO validation, calculation logic.
- **Backend E2E Tests**: Supertest HTTP endpoint testing against NestJS application controllers.
- **Prisma Schema Verification**: Automated `prisma validate` check.
- **Flutter Code Analysis**: `flutter analyze` ensuring zero errors and clean Material 3 design compliance.
- **Flutter Unit & Widget Tests**: `flutter test` testing providers, routing, and UI component rendering.

## 2. Financial Ledger Correctness Tests
- Multi-account transfer net-worth invariance tests (Transfers MUST NOT alter aggregate net worth).
- Precision decimal arithmetic tests (`0.1 + 0.2` rounding safety).
- Duplicate transaction detection algorithm validation.
