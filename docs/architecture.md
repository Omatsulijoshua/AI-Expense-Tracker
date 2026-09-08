# Expense Tracker — System Architecture Document

## 1. Executive Summary
Expense Tracker is an AI-powered personal and small-business financial management platform built using a modular micro-architectural design pattern. The platform consists of a Flutter multi-platform client (Mobile & Web), a NestJS REST API and WebSockets server, PostgreSQL relational ledger database with Prisma ORM, Redis caching and queue processing engine, and AI integration services.

## 2. System Topology
```text
┌─────────────────────────────────────────────────────────┐
│                    Flutter Client                       │
│             (Android / iOS / Web / Desktop)             │
└────────────────────────────┬────────────────────────────┘
                             │ HTTPS / REST / WSS
                             v
┌─────────────────────────────────────────────────────────┐
│                      API Gateway                        │
│                   (NestJS / v1 Prefix)                  │
└────────────────────────────?────────────────────────────┘
                             │
     ┌───────────────────────┼──────────────────────┐
     │                       │                      │
     v                       v                      v
┌─────────┐             ┌─────────┐            ┌─────────┐
│ PostgreSQL│           │  Redis  │            │ AI Engine│
│ Database  │           │ Queue & │            │ Vision/ │
│ Ledger    │           │ Cache   │            │ Voice   │
└─────────┘             └─────────┘            └─────────┘
```

## 3. High-Level Modular Component Architecture
- **Auth & Session Module**: Handles authentication, JWT access/refresh token rotation, 2FA, session invalidation.
- **User & Workspace (Multi-tenant) Module**: Enforces multi-tenancy. Every financial record is bound to a `Workspace` and `UserId`. Strict workspace isolation guarantees non-leakage across personal and business spaces.
- **Financial Core Engine**: Manages Accounts, Income, Expense, Transfer ledger. Deterministic arithmetic engine ensures balances are strictly calculated by backend SQL triggers / transactions, never guessed by AI.
- **Category & Rule Engine**: Default and custom user categories, subcategories, automated merchant-matching rules.
- **Budgeting & Goals Engine**: Monthly/Weekly category budgets with configurable alert thresholds (50%, 75%, 90%, 100%), savings goals projection.
- **Bills & Recurring Engine**: Bill calendars, recurring transaction automated generation queues.
- **Financial API Integration Layer**: Provider abstraction interface (`FinancialProvider`) supporting bank connections, balance sync, transaction normalization, and deduplication.
- **AI & Vision / Voice Services Layer**: OCR receipt parsing, voice intent extraction, automated category suggestion with confidence scores, natural language financial assistant with structured tool-calling capabilities (`getTransactions`, `getCategorySpending`, etc.).
- **Admin Engine**: Platform monitoring, user status management, AI usage metrics, audit logs.

## 4. Multi-Tenant Workspace Model
- **Workspaces**: Personal, Family, Business environments.
- **Roles**: Owner, Admin, Accountant, Member, Viewer.
- **Security Scoping**: Service layer policies inject `workspaceId` into all database queries. Direct object reference vulnerabilities are guarded at the NestJS Guard level (`WorkspaceAuthGuard`).

## 5. Offline Synchronization Architecture
- **Flutter Local DB**: SQLite via Drift / Local Cache.
- **Sync Engine Strategy**: Queue of dirty local client operations processed chronologically. Server-side conflict resolution uses `updatedAt` timestamps and version vectors.
