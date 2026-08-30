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

## Financial Engine Endpoints (U4)

All financial-engine endpoints are authenticated, stateless `POST` calculations under `/api/v1/financial-engine`. Decimal money/rate inputs are strings. Outputs include policy version, resolved assumptions, and completeness metadata; missing inputs remain distinguishable from explicit zero.

- `POST /cash-flow` — Cash flow, savings rate, and investable capacity.
- `POST /emergency-fund` — Reserve target, runway, shortfall, and completion estimate.
- `POST /loan` — EMI, amortization, prepayment, and refinancing comparisons.
- `POST /investment-projection` — Lump-sum, SIP, step-up SIP, and policy return scenarios.
- `POST /goal-funding` — Inflated goal cost, funding gap, required contribution, and feasibility.
- `POST /net-worth` — Exact assets, liabilities, net worth, and allocation percentages.
- `POST /scenario` — Deterministic baseline evaluation with partial scenario changes overlaid by domain.

## Plans and Scenarios Endpoints (U5)

All plans and scenarios endpoints are authenticated and household scoped under `/api/v1/plans` and `/api/v1/scenarios`.

- **Plans (`/api/v1/plans`)**:
  - `POST /recalculate` — Evaluates explicit baseline inputs with U4 scenario evaluator, locks household plan, and atomically appends an immutable snapshot and new plan version.
  - `GET /current` — Returns current immutable plan version and snapshot; returns `404` if uninitialized.
  - `GET /history` — Returns household plan version history newest-first with stable cursor pagination.

- **Scenarios (`/api/v1/scenarios`)**:
  - `POST /` — Creates scenario draft referencing current plan version as baseline.
  - `GET /` — Lists authenticated household's scenario drafts and applied records.
  - `GET /:id` — Retrieves scenario details by ID.
  - `POST /compare` — Compares 2 to 10 scenarios in caller order; rejects mixed baselines (`400 SCENARIO_MIXED_BASELINES`).
  - `POST /:id/run` — Evaluates baseline inputs plus stored overlay without database side effects.
  - `POST /:id/apply` — Atomically applies scenario against current baseline: appends new snapshot and version, advances plan pointer, marks scenario applied. Rejects stale baseline with `409 SCENARIO_BASELINE_STALE`; retries of the same scenario return its applied version idempotently.
