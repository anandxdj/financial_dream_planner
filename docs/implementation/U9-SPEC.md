# U9 Closed-Beta Operations Specification

Date: 2026-08-31
Branch: `main`
Status: accepted
Depends on: accepted U1-U8 (`0be5992`)

## Ownership and scope

The conductor owns this specification and every deployment, security, privacy, backup/restore, observability, incident-response, release, and rollback decision. Antigravity may implement only bounded boilerplate, infrastructure configuration, migration/support scripts, dashboard/alert definitions, and tests against this contract. Its results are claims until the conductor inspects every changed file, audits its trajectory, and reruns every shipping gate.

U9 makes the modular monolith operable for an invite-only closed beta. It does not claim a staging deployment, live provider validation, legal approval, or production readiness. Nothing is pushed.

## Deployment contract

- One immutable backend image supplies the API, worker, and one-shot migration entrypoints. The runtime is non-root, has a production-only dependency tree, receives secrets only through environment/runtime secret injection, and has an image health check.
- Production-like Compose defines API, worker, Redis, a one-shot migration service, and Traefik-facing labels/network configuration. PostgreSQL connectivity is external by default through `DATABASE_URL`; a clearly named local operational-test profile may provide PostgreSQL for deterministic rehearsals.
- API and worker never race migrations. Migration success is a dependency of process startup. Migrations use the direct database URL and the existing advisory-lock discipline.
- Redis is private and is not published in the production-like topology. API ports bind locally for direct smoke testing; Traefik routing is opt-in and uses an externally managed proxy network. No TLS certificate or production credential is checked in.
- Restart policy is `unless-stopped`; health checks, stop grace periods, resource-safe defaults, and read-only/no-new-privileges/tmpfs settings are applied where compatible with the Node runtime.
- The existing root Compose remains the developer stack. U9 adds a separate, explicit production-like operations Compose file so local defaults cannot be mistaken for production configuration.

## Health, readiness, and safe failure

- `GET /health` is unauthenticated liveness only. It proves the API event loop can answer and returns a stable body without version, host, dependency, credential, or exception detail. It never calls PostgreSQL, Redis, storage, or third parties.
- `GET /ready` is unauthenticated readiness. It performs independently bounded PostgreSQL and Redis probes using injected health dependencies. It returns `200` only when both canonical database and queue coordination are ready, otherwise `503`. The response exposes only stable dependency names and `ready|not_ready`; raw errors, endpoints, latency internals, and credentials are forbidden.
- Readiness has a total bounded deadline, cannot hang the process, records readiness metrics, and fails closed on timeout/exception. Storage and optional AI/research providers are excluded because their outages must not prevent authentication and canonical-data reads.
- During shutdown readiness flips to `503` before HTTP admission stops. Liveness remains available while the server drains.

## Metrics contract

- `GET /metrics` exposes Prometheus text and is disabled unless explicitly enabled. When enabled it requires a configured bearer token using timing-safe comparison; missing/invalid credentials return `404` to avoid advertising the surface. The token is never logged.
- Metric names are stable and prefixed `fdp_`. Required signals are:
  - HTTP request count and duration by method, normalized route, and status class;
  - job/outbox dispatch and processing outcomes, retry/recovery count, queue depth, and oldest pending outbox age;
  - storage operation failures by bounded operation and stable code;
  - privacy export/deletion outcomes by bounded operation/outcome;
  - authentication failures by bounded stable reason;
  - PostgreSQL and Redis readiness state and probe failures.
- Labels are closed/bounded enums. Metrics and logs never contain user, household, session, request body, email, filename, object key, signed URL, token/hash, raw path parameter, job payload, financial value, prompt, provider trace, IP, or user-agent.
- In-process counters/histograms are acceptable for a single-instance closed beta; PostgreSQL remains authoritative for durable job/outbox lag. Process restart resets process metrics and documentation states that limitation.

## Logging and correlation

- Every request accepts a syntactically valid bounded `X-Request-ID` or generates a UUID. The response echoes it. Invalid/oversized values are replaced, not reflected.
- Structured JSON logs include timestamp, level, event, request ID, normalized route/method/status, duration, and stable outcome codes only. Existing structural redaction remains mandatory and is extended for authorization, cookie, tokens, storage keys/URLs, request bodies, and nested secret-like fields.
- Worker logs carry a generated correlation ID plus public run/request IDs only. Outbox payloads and privacy data are never logged. Unexpected errors are represented by a stable code; stack traces are development-only and redacted.

## Alerts and thresholds

Checked-in Prometheus rules must parse and cover:

- readiness unavailable for 2 minutes (critical);
- HTTP 5xx ratio above 5% with meaningful traffic for 5 minutes (warning), above 15% for 2 minutes (critical);
- oldest pending outbox age above 5 minutes (warning), 15 minutes (critical);
- job failure ratio above 10% for 10 minutes and recovery retries increasing without success;
- storage failures sustained for 5 minutes;
- export/deletion failures or stuck operations older than their worker retry window;
- authentication failure surge relative to a documented absolute closed-beta threshold;
- backup age over 26 hours or last restore rehearsal failure/age over 30 days;
- PostgreSQL or Redis readiness failure for 2 minutes.

Every alert has severity, summary, impact, first diagnostic step, and runbook reference. Tests validate required rules/expressions and reject privacy-unsafe labels.

## Backup and restore

- Scripts use `pg_dump` custom format with no passwords on command lines, fail fast, write owner-restricted files where supported, produce SHA-256 checksums and a privacy-safe manifest, and never upload anywhere automatically.
- Restore is destructive only to an explicitly supplied non-production target database. It refuses missing/ambiguous environment names, refuses source and target URL equality, requires an explicit rehearsal acknowledgement, verifies checksum before restore, restores into an empty rehearsal database, applies/checks migrations, and runs integrity probes.
- Rehearsal documentation covers schedule (daily backup, monthly restore), retention/encryption responsibilities, RPO <= 24h, beta RTO <= 4h, object-storage inventory limitations, evidence capture, cleanup, and failure escalation. Local Docker-backed acceptance creates representative tenant/job/privacy data, backs it up, restores it to a distinct database, and proves critical row counts and tenant relationships.
- U9 does not claim point-in-time recovery, offsite replication, R2 versioning, or production backup erasure until separately configured and rehearsed.

## Release, migration, and rollback

- A preflight script checks branch/dirty state (informational locally, enforced for release mode), required variables without printing values, image/build artifacts, migration presence, generated OpenAPI/SDK stability, Compose config validity, and database/Redis connectivity. It cannot mutate production.
- Release order: capture backup evidence; validate config; build immutable image; run migration job once; start worker; start API; require readiness; run closed-beta smoke; monitor alerts. Feature flags default closed.
- Migrations are additive/forward-compatible. Application rollback reverts API/worker image while retaining compatible schema. Destructive schema rollback is forbidden; an incompatible migration stops release and requires a forward repair. Privacy deletion already confirmed cannot be rolled back.
- Release evidence distinguishes deterministic local, Docker-backed, staging, and live-provider gates. Unrun gates are explicitly recorded as unrun.

## Graceful shutdown and recovery

- API handles SIGTERM/SIGINT once: mark not ready, stop accepting connections, drain keep-alive requests, close runtime dependencies, and exit zero. A configurable hard deadline destroys remaining sockets and exits non-zero. Signal handlers are testable without calling `process.exit` from domain code.
- Worker handles SIGTERM/SIGINT once: pause/close intake, allow the active BullMQ job to finish within the grace period, close dispatcher/queues/Redis/database, and exit. An interrupted job remains recoverable through BullMQ retry plus PostgreSQL idempotency/outbox state.
- Startup replays undispatched outbox records. Duplicate/recovered delivery uses stable IDs and cannot duplicate plan baselines, exports, or deletions. Docker-backed tests terminate/restart worker processes and prove accepted work reaches one terminal logical outcome.

## Closed-beta smoke flow

A deterministic Docker-backed smoke script/test uses only local PostgreSQL, Redis, fake storage, and stubbed providers. It proves:

1. invite/local authentication creates a session and owner household;
2. a second tenant cannot read or mutate the first tenant's resources;
3. account/category/ledger ingestion and cash-flow work;
4. plan recalculation, scenario execution/application, and drift check/explicit action work;
5. document consent/upload/list/download metadata isolation work with fake private storage;
6. export consent/request/worker completion/download metadata work;
7. deletion consent/two-step confirmation/worker completion removes the exact household while the unrelated tenant survives;
8. correlation IDs are returned and no smoke output contains secrets or internal object keys.

The flow must be deterministic, rerunnable with unique data, self-cleaning only inside its explicitly created Docker test resources, and contain no skips.

## Documentation and API contracts

- Update system architecture, data model only if persistence changes, authentication operational switches, operations runbook, API README, root/backend deployment documentation, `.env.example`, OpenAPI, and generated SDK where observable endpoints/configuration change.
- `/health`, `/ready`, and conditional `/metrics` are documented with security and failure semantics. Operational endpoints expose no tenant data.

## Acceptance contract

All gates are conductor-run and must pass with zero skips:

1. baseline remains `main`; no branch switch, push, lockfile/package-manifest/tooling/environment mutation by Antigravity;
2. backend full tests report zero failures and zero skipped/todo tests;
3. PostgreSQL and Redis Docker-backed suites pass, including readiness outage/recovery, outbox retry/recovery, graceful API/worker shutdown, and tenant survival;
4. backend `check-types`, `lint`, and production `build` pass;
5. `db:generate` produces no unexpected migration and fresh-database migrations apply completely;
6. OpenAPI generation is byte-stable and `openapi:check` passes;
7. SDK `check-types` and `build` pass;
8. Docker image builds; production-like Compose config renders; migration/API/worker/Redis/PostgreSQL operational-test stack becomes healthy; smoke flow passes;
9. readiness returns `200` healthy and bounded `503` for PostgreSQL/Redis loss; liveness stays dependency-independent;
10. graceful shutdown drains or reaches its explicit deadline; accepted interrupted work recovers exactly once logically;
11. backup/checksum/restore rehearsal succeeds against distinct Docker databases and integrity checks pass;
12. alert rules parse and their required thresholds/labels/runbook links pass tests;
13. privacy-safe logging, correlation ID, protected metrics, and bounded metric labels pass adversarial tests;
14. `git diff --check` passes;
15. conductor inspects every changed file and audits every Antigravity conversation trajectory/non-zero command result;
16. a dedicated `feat: add U9 closed-beta operations` commit is created on `main` only after all gates genuinely pass; post-commit tree is clean; nothing is pushed.

## Out of scope and remaining release gates

- Kubernetes, managed monitoring installation, automatic paging integration, production Traefik/TLS provisioning, production secret management, PITR, multi-region failover, and public launch;
- real Neon/R2/OIDC/SMTP/Tavily/LLM calls, staging deployment, production backup/deletion drills, penetration testing, legal/privacy-policy approval, and live alert delivery. These remain explicitly unrun release gates unless actually performed.

## Completion evidence

- Antigravity/Gemini 3.7 Flash High ran the bounded implementation attempt in conversation `a41d84f5-153f-4ecf-a0b4-3fae1ca7a94b`. The CLI exited `1` without a digest after 710 recorded steps. It stayed on `main`, made no commit/push, and changed no manifest, lockfile, frontend file, installed tooling, or external environment. Its incomplete output was treated only as a claim.
- Conductor trajectory audit found no recorded non-zero command step, but the overall run failed. Independent diff inspection identified and corrected fail-open readiness defaults, double-counted histogram buckets, unsafe/high-cardinality request routes, a restore path that swallowed `pg_restore` failure and fabricated integrity, optional checksum verification, incomplete smoke coverage, stale operational documentation, Node/pnpm image incompatibility, missing Docker context exclusions, worker healthcheck inheritance, and missing explicit Compose runtime configuration.
- Final conductor-run backend result: 60 test files and 357 tests pass with zero skipped/todo tests reported. The Docker-backed closed-beta smoke covers two authenticated tenants, isolation, ledger/cash flow, plan/scenario apply, drift processing/acceptance, private document flow, export worker completion/download, confirmed household deletion completion, and unrelated-tenant survival.
- Backend typecheck, lint, and production build pass. Drizzle reports 31 tables and no schema changes to generate; fresh Docker-backed test databases apply all checked-in migrations. OpenAPI and generated SDK are byte-stable across consecutive generation runs; SDK typecheck/build pass.
- Docker image build passes using Node 22 and a 1.7 MB excluded context. The isolated production-like Compose rehearsal applied migrations, started API/worker/PostgreSQL/Redis, observed readiness `200 -> 503 -> 200` across Redis loss/recovery while liveness stayed `200`, and observed clean SIGTERM exit `0` for API and worker.
- A real PostgreSQL custom-format dump produced SHA-256 `7547d17a7ed436220e6d5e626da6cdb5bb8e75b44628e310ff7c494825a5c840`, restored into a distinct rehearsal database, preserved the marker row, and exposed 32 public tables. Disposable Prometheus `promtool` parsed all 11 alert rules successfully. Isolated rehearsal containers, volumes, and network were removed afterward.
- Staging/live-provider, production backup/deletion, legal review, penetration test, live paging, and real Neon/R2/OIDC/SMTP/Tavily/LLM gates were not run and remain release gates.
