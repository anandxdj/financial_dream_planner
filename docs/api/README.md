# API Contract

All public endpoints use `/api/v1`. UUIDs identify resources; timestamps are RFC 3339 UTC. Money and rates are decimal strings. Errors use `{ "error": { "code", "message", "details?", "requestId" } }`. Collections use opaque cursors and a maximum page size of 100. Mutable resources use `revision`/`ETag` with `If-Match`; side-effectful POSTs accept `Idempotency-Key`.

Run endpoints expose status, idempotent cancellation, and `text/event-stream` events. Reconnect with `Last-Event-ID`; PostgreSQL event order is authoritative.

Run `pnpm openapi:generate` in `backend/` to generate [openapi.json](openapi.json) and `sdk/src/generated/schema.d.ts`. The independent SDK wraps `openapi-fetch` and supplies `subscribeRun()`.

Authentication endpoints cover local register/login/refresh plus central OIDC start, callback, and mobile bridge exchange. Browser clients send credentials as cookies and must echo the readable CSRF cookie in `X-CSRF-Token` on unsafe requests with `Origin` set to the configured web origin. Native/API clients use bearer tokens and do not mix them with browser cookies. Household scope is never accepted from authentication request bodies.

## Ledger Endpoints (U3)

- **Accounts (`/api/v1/accounts`)**:
  - `GET /api/v1/accounts` — List accounts for the authenticated household.
  - `POST /api/v1/accounts` — Create an account.
  - `GET /api/v1/accounts/:id` — Get account details.
  - `PATCH /api/v1/accounts/:id` — Update account details/balance.
  - `DELETE /api/v1/accounts/:id` — Delete an unused account; accounts with ledger history return `409`.

- **Categories (`/api/v1/categories`)**:
  - `GET /api/v1/categories` — List system and household categories.
  - `POST /api/v1/categories` — Create custom household category.
  - `GET /api/v1/categories/:id` — Get category details.
  - `PATCH /api/v1/categories/:id` — Update custom category (system categories rejected).
  - `DELETE /api/v1/categories/:id` — Delete custom category.

- **Transactions (`/api/v1/transactions`)**:
  - `POST /api/v1/transactions/sync` — Ingest normalized SMS observation batches with `syncId` and `clientId`. Deduplicates exact references and flags fallback collisions as `needs_review`.
  - `GET /api/v1/transactions` — List canonical transactions with cursor pagination and filters (`accountId`, `categoryId`, `direction`, `status`, `startDate`, `endDate`).
  - `POST /api/v1/transactions` — Create manual transaction.
  - `GET /api/v1/transactions/:id` — Get transaction details with attached provenance.
  - `PATCH /api/v1/transactions/:id` — Update category, merchant, description, or verification status.
  - `DELETE /api/v1/transactions/:id` — Delete transaction and cascaded provenance.
  - `GET /api/v1/transactions/cash-flow` — Compute an exact single-currency snapshot (defaults to INR) with explicit `null` for no-data vs `"0.00"` for net-zero.
