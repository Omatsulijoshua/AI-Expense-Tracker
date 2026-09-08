# Expense Tracker — Security & Privacy Specification

## 1. Authentication & Token Standards
- **Access Tokens**: Short-lived JWTs (15 minutes expiry) signed with RS256 / HS256 secret.
- **Refresh Tokens**: Long-lived secure tokens (7 days) stored as HttpOnly secure cookies or encrypted device storage (`FlutterSecureStorage`).
- **Password Hashing**: Bcrypt (cost factor 10-12).

## 2. Authorization & Role-Based Access Control (RBAC)
- Custom `@Roles(...roles: Role[])` decorator combined with NestJS `RolesGuard`.
- Role hierarchy: `OWNER` > `ADMIN` > `ACCOUNTANT` > `MEMBER` > `VIEWER`.
- `OWNER` role maintains absolute workspace permissions over all actions.
- Workspace boundary guards ensure zero cross-tenant data leakage.

## 3. API Rate Limiting & Protection
- Sliding-window rate limiter guard (`RateLimiterGuard`) configured via `@RateLimit({ ttlSeconds, limit })`.
- Prevents brute-force credential stuffing and DDoS attacks across high-volume endpoints (Auth, Document Upload, Voice Parsing, AI Assistant Chat).
- Exceeding threshold triggers `HTTP 429 Too Many Requests`.

## 4. Financial Data Privacy & PII Scrubbing
- **AI Prompt PII Scrubber**: `SecurityService.sanitizeForAi` automatically redacts emails, credit card numbers, phone numbers, and SSNs before payload dispatch to external LLMs.
- **AES-256-CBC Encryption at Rest**: OAuth tokens and bank credentials encrypted using `SecurityService.encryptData` / `decryptData`.
- **Flutter UI Data Masking**: `DataMasker` masks card numbers (`**** **** **** 1234`), bank account numbers (`****5678`), and email addresses across screen displays.

## 5. Automated Database Backup & Disaster Recovery
- Automated timestamped PostgreSQL dump scripts (`infra/scripts/backup-database.ps1` and `backup-database.sh`).
- 30-day backup retention policy with automated cleanup of outdated dump archives.
