# ⚡ AI Expense Tracker Platform

> A production-grade, modern multi-platform AI-powered personal and business financial management platform built with NestJS, Prisma ORM, PostgreSQL, Redis, Flutter Material 3, and TypeScript Web Admin.

[![CI/CD Pipeline](https://github.com/Omatsulijoshua/AI-Expense-Tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Omatsulijoshua/AI-Expense-Tracker/actions)
[![NestJS](https://img.shields.io/badge/NestJS-v10.3-red.svg?logo=nestjs)](https://nestjs.com/)
[![Flutter](https://img.shields.io/badge/Flutter-v3.41-blue.svg?logo=flutter)](https://flutter.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-v5.9-2D3748.svg?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16-4169E1.svg?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-v7-DC382D.svg?logo=redis)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Executive Summary & Architecture Overview

The **AI Expense Tracker Platform** provides an end-to-end ecosystem for managing personal finances, track recurring subscriptions, analyze debt/liabilities, execute business workspace operations, scan physical receipts with Vision OCR, log expenses via speech-to-text natural language voice parsing, and consult a conversational AI financial advisor backed by deterministic database tool execution.

### Architectural Blueprint
```
                              ┌──────────────────────────────────┐
                              │  Flutter Multi-Platform App      │
                              │  (Android / iOS / Desktop / Web) │
                              └────────────────┬─────────────────┘
                                               │ HTTP / REST JWT
                                               ▼
┌──────────────────────┐      ┌──────────────────────────────────┐      ┌──────────────────────┐
│  Web Admin Console   ├─────►│  NestJS REST API Gateway         │◄─────┤  Banking Integrations│
│  (TypeScript / Vite) │      │  (RBAC, Throttling, PII Scrubber)│      │  (Mono & Plaid)      │
└──────────────────────┘      └────────────────┬─────────────────┘      └──────────────────────┘
                                               │
                                ┌──────────────┴──────────────┐
                                │                             │
                                ▼                             ▼
                     ┌────────────────────┐        ┌────────────────────┐
                     │ PostgreSQL (Prisma)│        │ Redis Queue/Cache  │
                     │  (30+ Entities)    │        │  (Offline Sync)    │
                     └────────────────────┘        └────────────────────┘
```

---

## ✨ Key Features & Capability Suite

### 1. 🏦 Financial Core & Multi-Account Ledger
- Support for 9+ account types (`BANK_ACCOUNT`, `CREDIT_CARD`, `CASH_WALLET`, `SAVINGS_ACCOUNT`, `INVESTMENT_ACCOUNT`, `MOBILE_WALLET`, `BUSINESS_ACCOUNT`).
- Transaction engine handling `INCOME`, `EXPENSE`, and `TRANSFER` between accounts linked via `transaction_transfers`.
- Automated real-time running balance calculation and transaction timeline filtering.

### 2. 📊 Analytics, Cash Flow & Reporting
- Interactive cash flow trend charts (`fl_chart`) visualizing income vs expense trajectories over daily, weekly, monthly, and annual intervals.
- Category spending breakdowns with percentage calculations and top merchant insights.
- Export financial reports to CSV and PDF formats.

### 3. 💡 Budgets, Bill Reminders & Savings Goals
- Budget threshold alerting engine (Warning at 80%, Exceeded at 100%).
- Interactive bill calendar tracking status (`UPCOMING`, `DUE_TODAY`, `OVERDUE`, `PAID`).
- Target-driven savings goals tracking target amount vs current saved balance with deadline progress indicators.

### 4. 📥 CSV Statement Import & Offline Sync Queue
- Statement CSV import engine with dynamic column mapper and 48-hour duplicate transaction detection.
- Offline-first Sync Queue (`SyncQueueService`) allowing users to log transactions offline and sync via `POST /api/v1/transactions/sync` upon network reconnection.

### 5. 🔌 Open Banking Connections (Mono & Plaid Adapters)
- Provider abstraction layer (`IFinancialProvider`) supporting high-fidelity sandbox banking adapters for Mono (African markets) and Plaid (Global markets).
- Webhook receiver (`/api/v1/integrations/webhooks/:provider`) for automated balance and transaction updates.

### 6. 🧾 Vision OCR Receipt AI & Document Vault
- Vision OCR extraction pipeline extracting merchant name, subtotal, VAT tax, transaction date, and category recommendations with 94%+ confidence.
- Document Vault repository storing digital receipts linked directly to ledger transaction entries.

### 7. 🎙️ Natural Language Voice Entry
- Natural language speech-to-text transaction parser extracting intent type, amount, merchant, fuzzy account name, and category.
- Interactive voice confirmation UI with animated waveform mic and prompt suggestions.

### 8. 💬 Conversational AI Financial Advisor
- Conversational chat assistant featuring backend tool calling (`query_net_worth`, `query_spending_by_category`, `query_upcoming_bills`, `query_budget_status`).
- Returns deterministic, audit-proven database evidence cards directly inside chat conversations.

### 9. 📈 Advanced AI Engine & Financial Health Score
- **Statistical Anomaly Detector**: Identifies transaction outliers (>2.8x standard deviation) and duplicate charges.
- **Subscription Manager**: Detects recurring monthly/weekly subscription payments.
- **30-Day Cash Flow Forecast**: Predictive balance algorithm forecasting 30-day liquidity.
- **Financial Health Score (0–100)**: Evaluates savings ratio, debt ratio, budget adherence, and emergency fund buffer.

### 10. 🏢 Debt Tracker, Net Worth & Business Workspaces
- Debt tracker for `I_OWE` (payables) and `OWED_TO_ME` (receivables) with repayment logging.
- Asset vs Liabilities Net Worth calculator.
- Multi-tenant workspace switcher for `PERSONAL`, `BUSINESS`, and `FAMILY` modes with RBAC team roles (`OWNER`, `ADMIN`, `ACCOUNTANT`, `MEMBER`, `VIEWER`).

### 11. ⚡ Web Admin Console (`apps/admin`)
- Administrative dashboard displaying real-time system status, open banking provider diagnostics, platform user management table with lock/unlock toggles, AI token/cost analytics ($0.002 / 1k tokens), and system audit logs.

### 12. 🛡️ Enterprise Security & Hardening
- Role-Based Access Control (`RolesGuard` & `@Roles()`) and sliding-window rate limiting (`RateLimiterGuard`).
- **AI PII Scrubber**: Automatically redacts emails, credit card numbers, phone numbers, and SSNs from text before calling AI models.
- **AES-256-CBC Encryption**: Encrypts banking OAuth tokens at rest.
- **Automated Database Backups**: Timestamped PostgreSQL backup scripts with 30-day retention cleanup.

---

## 📂 Repository Monorepo Structure

```
AI-Expense-Tracker/
├── .github/
│   └── workflows/ci.yml         # GitHub Actions CI/CD Pipeline
├── apps/
│   ├── admin/                   # Web Admin Console (HTML/CSS/TypeScript/Vite)
│   │   ├── Dockerfile
│   │   ├── index.html
│   │   ├── package.json
│   │   └── src/main.ts
│   └── mobile/                  # Flutter Multi-Platform App (Android, iOS, Web)
│       ├── lib/                 # Riverpod, Material 3, Clean Architecture
│       ├── pubspec.yaml
│       └── analysis_options.yaml
├── backend/
│   └── api/                     # NestJS REST API Gateway
│       ├── Dockerfile
│       ├── prisma/schema.prisma # Prisma Schema (30+ Models)
│       ├── src/
│       │   ├── accounts/        # Financial Accounts Module
│       │   ├── admin/           # Web Admin Dashboard Module
│       │   ├── ai-advanced/     # Anomaly, Forecast & Health Score
│       │   ├── ai-assistant/    # Conversational Advisor & Tool Calling
│       │   ├── auth/            # JWT Auth & Session Management
│       │   ├── bills/           # Bills Calendar & Reminders
│       │   ├── budgets/         # Budget Threshold Engine
│       │   ├── business-debt/   # Debts, Net Worth & Workspaces
│       │   ├── documents/       # Receipt Vision OCR Pipeline
│       │   ├── goals/           # Savings Goals Module
│       │   ├── imports/         # CSV Statement Import Parser
│       │   ├── integrations/    # Mono & Plaid Banking Adapters
│       │   ├── reports/         # Cash Flow & Category Reports
│       │   ├── security/        # RBAC, Rate Limiter, PII Scrubber
│       │   ├── transactions/   # Core Transaction Engine
│       │   ├── voice/           # Voice Entry Intent Engine
│       │   └── app.module.ts
│       └── package.json
├── docs/                        # Complete System Architecture Suite
│   ├── ai.md
│   ├── api.md
│   ├── architecture.md
│   ├── database.md
│   ├── integrations.md
│   ├── roadmap.md
│   └── security.md
└── infra/                       # Infrastructure & Deployment Scripts
    ├── docker-compose.yml       # PostgreSQL, Redis, API Gateway, Admin Web
    └── scripts/
        ├── backup-database.ps1  # Automated PowerShell DB Backup
        ├── backup-database.sh   # Automated Shell DB Backup
        ├── deploy.ps1           # Production Deployment PowerShell Script
        └── deploy.sh            # Production Deployment Shell Script
```

---

## 🛠️ Technology Stack Matrix

| Component | Technology | Version / Specification |
|---|---|---|
| **Backend Framework** | NestJS / Express | Node.js v20+, TypeScript 5.3+ |
| **Database ORM** | Prisma ORM | PostgreSQL 16 Alpine |
| **Cache & Queue** | Redis | Redis 7 Alpine |
| **Mobile App Shell** | Flutter | Dart 3.11 / Flutter 3.41 (Material 3) |
| **Web Admin Console** | Vite / TypeScript | Nginx Alpine Container |
| **Testing Suite** | Jest / Supertest | 14 Test Suites (56 Unit Tests) |
| **Containerization** | Docker / Docker Compose | Multi-container Stack |
| **CI/CD Automation** | GitHub Actions | Automated Test & Analysis Pipeline |

---

## 🚀 Quick Start & Installation Guide

### Prerequisites
- [Node.js (v20+)](https://nodejs.org/) & `npm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Flutter SDK (v3.41+)](https://docs.flutter.dev/get-started/install)

### 1. Clone Repository & Setup Environment Variables
```bash
git clone https://github.com/Omatsulijoshua/AI-Expense-Tracker.git
cd AI-Expense-Tracker
```

Create `.env` file inside `backend/api/.env`:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/expense_tracker_db?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_SECRET="super_secret_jwt_access_key_12345"
JWT_REFRESH_SECRET="super_secret_jwt_refresh_key_67890"
ENCRYPTION_KEY="default_expense_tracker_secret_key_32bytes!!"
```

### 2. Launch Infrastructure Services (PostgreSQL & Redis)
```bash
docker compose -f infra/docker-compose.yml up postgres redis -d
```

### 3. Run Backend API Gateway (NestJS)
```bash
cd backend/api
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```
Backend API will be accessible at: `http://localhost:3000/api/v1`

### 4. Run Web Admin Console
```bash
cd apps/admin
npm run dev
```
Web Admin Console accessible at: `http://localhost:5173`

### 5. Run Flutter Mobile App
```bash
cd apps/mobile
flutter pub get
flutter run
```

---

## 🧪 Verification & Testing Suite

Execute the automated test suites across the monorepo:

### Backend Unit Tests (Jest)
```bash
cd backend/api
npm test
```
*Output: 14 test suites passed, 56 unit tests passed.*

### NestJS Backend Compilation Check
```bash
cd backend/api
npm run build
```

### Flutter Static Code Analysis
```bash
cd apps/mobile
flutter analyze
```
*Output: No issues found!*

### Web Admin Production Build
```bash
cd apps/admin
npm run build
```

---

## 🚢 Production Deployment

Launch the complete multi-container production stack (PostgreSQL, Redis, NestJS API Gateway, Nginx Web Admin):

### Using Deployment Scripts
**Linux / macOS**:
```bash
chmod +x infra/scripts/deploy.sh
./infra/scripts/deploy.sh
```

**Windows PowerShell**:
```powershell
.\infra\scripts\deploy.ps1
```

---

## 🗺️ Master Development Roadmap Status (100% Complete)

| Phase | Phase Name | Status | Key Deliverable |
|---|---|---|---|
| **Phase 1** | Foundation | **PASSED** | Monorepo layout, Prisma schema, Redis setup, Flutter M3 app. |
| **Phase 2** | Authentication | **PASSED** | Auth API, JWT access/refresh tokens, session management. |
| **Phase 3** | Financial Core | **PASSED** | Accounts, Income/Expense/Transfer ledger engine, net balance. |
| **Phase 4** | Dashboard & Analytics | **PASSED** | Cash flow charts, category breakdown, search & reports. |
| **Phase 5** | Budgets / Bills / Goals | **PASSED** | Budget alerts, bill calendar, savings goals progress. |
| **Phase 6** | Import & Offline | **PASSED** | Statement CSV mapper, duplicate detector, offline sync queue. |
| **Phase 7** | Financial API Connections | **PASSED** | Provider abstraction, Mono & Plaid sandbox adapters, webhooks. |
| **Phase 8** | Receipt / Document AI | **PASSED** | Vision OCR extraction pipeline, document vault repository. |
| **Phase 9** | Voice Entry | **PASSED** | Speech-to-text, natural language transaction intent parser. |
| **Phase 10** | AI Financial Assistant | **PASSED** | Conversational chat advisor with backend tool execution. |
| **Phase 11** | Advanced AI | **PASSED** | Anomaly detector, subscription manager, 30-day forecast, Financial Health Score. |
| **Phase 12** | Debt + Net Worth + Business | **PASSED** | Debt tracker, Assets vs Liabilities net worth, business team roles. |
| **Phase 13** | Admin Dashboard | **PASSED** | Web Admin console UI, user lock management, AI cost metrics, audit logs. |
| **Phase 14** | Security + Hardening | **PASSED** | RBAC guards, rate limiter, PII scrubber, AES-256 encryption, DB backups. |
| **Phase 15** | Production QA & Deploy | **PASSED** | Production Docker stack, deployment scripts, multi-platform release QA. |

---

## 📄 Documentation Sitemap

- [Architecture & Monorepo Design](docs/architecture.md)
- [Database Schema Specification](docs/database.md)
- [REST API Endpoint Documentation](docs/api.md)
- [AI Engine & LLM Guardrails Specification](docs/ai.md)
- [Banking Provider Integration Design](docs/integrations.md)
- [Security, Privacy & RBAC Controls](docs/security.md)
- [Master Development Roadmap](docs/roadmap.md)

---

## 📄 License & Author

Developed by **Joshua Omatsuli**  
Repository: [https://github.com/Omatsulijoshua/AI-Expense-Tracker](https://github.com/Omatsulijoshua/AI-Expense-Tracker)  
Licensed under the [MIT License](LICENSE).
