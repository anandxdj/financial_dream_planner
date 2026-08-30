# U7 Drift Specification

Date: 2026-08-30
Branch: `main`
Status: accepted

## Scope

U7 adds deterministic, household-scoped material-change detection against the exact immutable plan version accepted as the check baseline. Drift is advisory until the user explicitly accepts it. Detection, dismissal, retries, and failures never mutate a plan.

The unit delivers:

- deterministic comparison of an observed financial-state envelope with an accepted immutable plan baseline;
- durable, deduplicated asynchronous drift checks dispatched through the transactional outbox and BullMQ;
- immutable drift findings that explain what changed, the threshold crossed, and affected deterministic outputs;
- explicit accept and keep actions with idempotency, stale-baseline protection, and concurrency safety;
- accepted drift as a new immutable financial snapshot and monotonically increasing plan version, preserving all prior history;
- authenticated tenant-scoped REST APIs, migrations, architecture/API documentation, OpenAPI/SDK contracts, retention, and tests.

Research and LLM output are not inputs to materiality or acceptance. U7 reuses the U4 deterministic evaluator and U5 persistence invariants; it does not duplicate financial formulas.

## Terminology and state machines

A **drift check** is a durable job. Its status is `queued`, `running`, `completed`, or `failed`. A check records the authenticated household, exact baseline version, mode (`lightweight` or `deep`), observed `asOf`, revision, canonical observed-input hash, bounded attempt/failure metadata, timestamps, and a 90-day retention deadline.

A **drift event** is the immutable completed comparison result. Its resolution status is:

- `pending`: material findings await a user decision;
- `kept`: the user explicitly retained the existing plan;
- `accepted`: the user explicitly created a replacement baseline version;
- `no_change`: no configured materiality threshold was crossed.

Failed checks create no event. Events are append-only except for the one-way resolution transition from `pending` to `kept` or `accepted` and the associated resolution metadata. An accepted event records its one created plan version. No endpoint reopens or deletes an event.

## Deterministic materiality policy

Policy ID `DRIFT-IN-2026.1` uses exact decimal arithmetic. A relative threshold is inclusive and is evaluated only when its absolute floor is also met. When the baseline is zero, a non-zero observed value is material once the absolute floor is met. Removal of a non-zero baseline uses the same rule. Exact boundary values are material.

Lightweight and deep checks use the same materiality thresholds; deep checks additionally return the complete deterministic output impact. Material findings are emitted in stable code order:

| Code | Comparison | Material threshold |
|---|---|---|
| `income_changed` | cash-flow monthly income | at least 5% and INR 1,000 |
| `spending_changed` | essential + discretionary expenses | at least 10% and INR 2,000 |
| `obligations_changed` | EMIs + mandatory obligations | at least 5% and INR 1,000 |
| `surplus_changed` | calculated monthly surplus | sign change, or at least 10% and INR 1,000 |
| `reserve_runway_changed` | calculated emergency-fund runway | at least 1.00 month |
| `investment_contribution_changed` | monthly SIP | at least 10% and INR 1,000 |
| `debt_terms_changed` | loan principal, annual rate, tenure, or prepayments | principal at least 5% and INR 5,000; rate at least 0.50 percentage point; tenure at least 3 months; or any prepayment added/removed/changed |
| `goal_changed` | target amount, horizon, savings, capacity, or calculated feasibility | target at least 5% and INR 5,000; horizon at least 3 months; savings/capacity at least 10% and INR 1,000; or feasibility changes |
| `net_worth_changed` | calculated net worth | sign change, or at least 10% and INR 10,000 |

Missing values are not coerced to zero. A field becoming present or absent is material when the present value crosses that finding's absolute floor; enum/status presence changes are material. Canonically equal inputs produce `no_change` without evaluation side effects. Findings include decimal-string baseline/observed values where applicable, absolute and relative deltas when defined, severity (`notice`, `warning`, `critical`), and affected output paths. Severity is deterministic: sign/feasibility regression is `critical`, an adverse delta at least twice its threshold is `warning`, otherwise `notice`.

## Durable job and deduplication contract

`POST /api/v1/drift/checks` requires `{ baselineVersionId, mode, asOf, revision, inputs, idempotencyKey }`. Household identity is never accepted from the client.

The server validates that `baselineVersionId` is the household's current plan version before enqueueing. In one database transaction it inserts the durable check and transactional outbox row. Queue publication is recoverable and uses the check UUID as the BullMQ job ID.

The canonical deduplication identity is `(household_id, baseline_version_id, mode, observed_input_hash, revision)`. The client idempotency identity is `(household_id, idempotency_key)`:

- the same key and same canonical request returns the original check;
- the same key with different request data returns `409 DRIFT_IDEMPOTENCY_CONFLICT`;
- a different key for the canonical duplicate returns the original check;
- duplicate queue delivery or worker retry converges on the same check and at most one event.

The worker atomically claims queued or retryable work. A completed check is a no-op on redelivery. A failure records only a stable sanitized code/message, increments attempts, and remains retryable within BullMQ's bounded retry policy. The existing plan is unchanged on every failure path.

## Acceptance and concurrency contract

`POST /api/v1/drift/:id/accept` is the only U7 operation that may advance a plan. In one transaction it takes the household advisory lock, locks the drift event and plan, and verifies:

1. the event belongs to the authenticated household and is `pending` (or is the same already accepted event);
2. the event's baseline version is still the plan's current version;
3. the completed check's observed state and deterministic output hashes still match the event;
4. the event contains at least one material finding.

Acceptance appends a new immutable snapshot from the observed inputs, appends the next plan version, advances the plan pointer, and marks the event accepted with that version ID. A retry of the same accepted event returns the same version. Concurrent accepts against one baseline permit one winner; a different event loses with `409 DRIFT_BASELINE_STALE`. Stale acceptance creates no snapshot/version and changes no resolution status.

`POST /api/v1/drift/:id/keep` locks the event and transitions only `pending` to `kept`. It is idempotent for the same kept event and never changes the plan. Accepted events cannot be kept, kept events cannot be accepted, and `no_change` cannot be resolved; these return `409 DRIFT_ALREADY_RESOLVED`.

All cross-household identifiers return 404. Unknown request fields and invalid UUIDs are rejected. Acceptance has no body and therefore cannot substitute client-provided financial state.

## Read/API contract

- `POST /api/v1/drift/checks` creates or deduplicates a durable check and returns `202` for queued/running or `200` for an existing terminal check.
- `GET /api/v1/drift/checks/:id` returns the authenticated household's check and completed event when present.
- `GET /api/v1/drift/current` returns the newest non-expired `pending` event for the exact current plan version, or `{ data: null }`.
- `GET /api/v1/drift` lists non-expired household events newest first with stable cursor pagination and optional strict status filtering.
- `POST /api/v1/drift/:id/accept` returns the accepted event, plan, new version, and snapshot.
- `POST /api/v1/drift/:id/keep` returns the kept event.

The API never exposes raw database errors, queue errors, stack traces, or another tenant's existence. Timestamps are ISO-8601 and money remains decimal strings.

## Retention and privacy

Checks and non-accepted events receive a 90-day retention deadline. Reads hide expired records before physical cleanup. Cleanup deletes only expired failed/no-change/kept checks and their dependent events in bounded batches; it never deletes a pending or accepted event, accepted snapshot, plan version, or plan history. Accepted events are retained as plan provenance. Cleanup is household-safe, retry-safe, clock-injected, and leaves unrelated records untouched.

Raw observed financial inputs are never logged. Failure fields are sanitized and bounded. Audit/outbox payloads contain identifiers and policy metadata, not the full financial envelope.

## Acceptance gates

- Unit tests cover every threshold immediately below, exactly at, and immediately above its boundary; zero/missing values; stable finding order/severity; canonical no-op; and deterministic hashes.
- PostgreSQL-backed tests cover durable outbox enqueue, canonical and idempotency-key deduplication, duplicate delivery, retry/failure recovery, at-most-one event, tenant non-disclosure, expired-read filtering, bounded cleanup, and preservation of pending/accepted/history rows.
- Concurrency tests cover same-event idempotent acceptance, competing-event acceptance, keep/accept races, stale baselines caused by scenario apply or recalculation, and no partial snapshot/version/event mutation.
- API tests cover authentication, strict input/path/query validation, status codes, no-op drift, current/list reads, accept/keep behavior, and immutable history.
- Existing U1-U6 behavior remains green with no skipped tests.
- Backend typecheck, lint, production build, all deterministic local and Docker-backed tests, migration generation/application, OpenAPI generation/check, SDK typecheck/build, and `git diff --check` pass.

## Out of scope

- scheduled calendar cadence and user notifications (future operations/client work);
- automatic acceptance or silent baseline mutation;
- LLM-authored thresholds, findings, calculations, or plan versions;
- live research during a drift job;
- editing/deleting historical snapshots and plan versions;
- document storage, export, account deletion, and broad privacy workflows (U8).

## Completion evidence

- Antigravity bulk implementation used Gemini 3.7 Flash High in conversation `86795453-7cb1-4a54-82d0-df65afa0a22e`, under the user's explicit private-repository and network authorization. It did not switch branches, commit, push, or change manifests/lockfiles. Its reported results were treated only as claims; the readable 406-step trace was audited and contained no non-zero command exits.
- Conductor review inspected every changed source, test, migration, document, and generated contract. Corrections added database-enforced canonical deduplication, transactional freshness checks, durable check UUID queue IDs, retry-propagating sanitized failures, separate drift/financial policy identities, observed-output and finding integrity verification, strict empty action bodies, real concurrency tests, complete numeric boundary coverage, and mutation-time retention race guards.
- Final conductor-controlled backend result: 40 test files and 264 tests pass with no skips or failures, including Docker-backed PostgreSQL API, integration, deduplication, retry, stale-baseline, tenant-isolation, retention, and concurrency tests. Backend typecheck, lint, and production build pass.
- Drizzle migration `0009_dapper_microchip.sql` and metadata were regenerated from the corrected schema and applied by the Docker-backed suite. OpenAPI and SDK types regenerate byte-stably; SDK typecheck/build and `git diff --check` pass. A post-commit `openapi:check` remains the final recorded gate.
