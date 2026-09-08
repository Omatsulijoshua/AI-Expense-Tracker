# Expense Tracker — Security & Privacy Specification

## 1. Authentication & Token Standards
- **Access Tokens**: Short-lived JWTs (15 minutes expiry) signed with RS256 / HS256 secret.
- **Refresh Tokens**: Long-lived secure tokens (7 days) stored as HttpOnly secure cookies or encrypted device storage.
- **Password Hashing**: Argon2id or bcrypt (cost factor 12).

## 2. Authorization & Data Isolation
- Role-Based Access Control (RBAC) combined with Attribute-Based Access Control (ABAC).
- Workspace boundary guards ensure zero cross-tenant data leakages.

## 3. Financial Data Privacy Rules
- Financial credentials (Bank PINs, OTPs, Online banking passwords) are NEVER requested or stored.
- Bank API OAuth tokens are stored AES-256 encrypted at rest.
- Private document URLs are served via short-lived signed URLs.
- Sensitive financial metrics sent to AI LLM services are sanitized of personal identifiable information (PII).
