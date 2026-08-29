# Product and Engineering Decisions

- Backend-only delivery; the existing Next frontend remains untouched.
- One standalone Express 5/TypeScript modular monolith, PostgreSQL canonical storage, and Redis/BullMQ only for coordination.
- Primary market India; household defaults are INR and Asia/Kolkata. API money values are fixed-scale decimal strings.
- Central OIDC is authoritative. Closed beta runs hybrid local email/password plus brokered OIDC; Google is reached through OIDC. Expo receives only application tokens through a one-time bridge-code exchange.
- Planning education only: cash-flow, debt, goal, risk, and asset-class guidance; no individual-security calls, autonomous trading, payments, or silent baseline changes.
- Deterministic calculations precede AI. Versioned visible defaults and user overrides are copied into immutable snapshots and plans.
- AI history is user-controlled: user messages and final answers are retained for 90 days by default; hidden reasoning and raw provider traces are never stored.
- Closed beta is invite-only and requires privacy, security, backup/restore, observability, and legal review gates before public launch.
