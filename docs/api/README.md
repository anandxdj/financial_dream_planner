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

## Drift Endpoints (U7)

All drift endpoints are authenticated and household scoped under `/api/v1/drift`. Check creation requires an idempotency key in the strict JSON body and the exact current baseline version.

- `POST /checks` — Durably creates or deduplicates an asynchronous deterministic drift check; returns `202` while queued/running and `200` for an existing terminal check.
- `GET /checks/:id` — Returns the non-expired check and its completed event, if present.
- `GET /current` — Returns the newest pending event for the exact current plan version, or `null`.
- `GET /` — Lists non-expired events newest-first with cursor pagination and optional status filter.
- `POST /:id/accept` — With an empty body, atomically accepts a pending material event and creates one immutable snapshot/plan version. Stale baselines return `409 DRIFT_BASELINE_STALE`.
- `POST /:id/keep` — With an empty body, idempotently keeps the existing baseline and creates no plan state.

Only `accept` can advance the plan. Duplicate jobs, failures, no-change results, reads, and keep actions cannot mutate baseline history.

## Documents & Privacy Endpoints (U8)

All document and privacy endpoints are authenticated and household scoped under `/api/v1/documents` and `/api/v1/privacy`. Internal object keys, storage endpoints, credentials, and token hashes are never exposed across the service boundary.

- **Documents (`/api/v1/documents`)**:
  - `POST /` — Uploads a bounded private document (requires `document_storage` consent, validates base64 content and size <= 10MB); returns metadata without object key (`201`).
  - `GET /` — Lists non-expired available documents for the authenticated household with cursor pagination (`200`).
  - `GET /:id` — Returns tenant-scoped document metadata (`200`).
  - `POST /:id/download` — Returns a short-lived download grant and expiry (maximum 5 minutes) without disclosing internal object keys (`200`).
  - `DELETE /:id` — Deletes the physical object from storage and marks metadata deleted (`200`).

- **Privacy & Consents (`/api/v1/privacy`)**:
  - `POST /consents` — Records or withdraws versioned consent (`document_storage`, `privacy_export`, `household_deletion`) with idempotency key (`201` on create, `200` on identical replay).
  - `GET /consents` — Returns effective consent states and caller's append-only consent history (`200`).
  - `POST /exports` — Creates or deduplicates a durable export request (requires `privacy_export` consent); returns `202` while active and `200` when completed.
  - `GET /exports/:id` — Returns export status and artifact metadata while unexpired (`200`).
  - `POST /exports/:id/download` — Returns a short-lived download grant for the completed export artifact (`200`).
  - `POST /deletions` — Initiates two-step household deletion (requires owner role and `household_deletion` consent); returns a one-time random confirmation token (`201`).
  - `POST /deletions/:id/confirm` — Confirms deletion using the token; atomically consumes confirmation and queues the irreversible deletion worker job (`200`).
  - `GET /deletions/:id` — Returns deletion request status while the account exists (`200`).
## Operational Endpoints (U9)

- `GET /health` — Unauthenticated liveness probe. Fast event-loop responsiveness check. Returns `{ "status": "ok" }` (`200`). Never accesses database, cache, or external providers.
- `GET /ready` — Unauthenticated readiness probe. Bounded check against canonical PostgreSQL and Redis dependencies. Returns `200` only when all dependencies are ready: `{ "status": "ready", "checks": { "database": "ready", "redis": "ready" } }`, otherwise `503` with failed dependency indicators. Never leaks error details, endpoints, credentials, or internal latencies.
- `GET /metrics` — Protected Prometheus metrics endpoint. Disabled by default unless `METRICS_ENABLED=true`. Requires timing-safe bearer token matching `METRICS_BEARER_TOKEN`. Returns `404` when disabled or unauthorized to prevent reconnaissance. Emits `fdp_` prefixed metrics with bounded enum labels.
