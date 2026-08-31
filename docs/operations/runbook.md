# Operations Runbook

## Local and Production-like Services

For local development:
Copy `backend/.env.example` to `backend/.env`, then run `docker compose up --build`. PostgreSQL is canonical; Redis is disposable coordination state. Run migrations with `pnpm db:migrate` before API/worker startup.

For production-like operations:
Export the required `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `WEB_ORIGIN`, and `API_ORIGIN`, ensure the configured external Traefik network exists, then run `docker compose -f docker-compose.prod.yml up -d`. The `migrate` service applies additive Drizzle migrations before `api` and `worker` services accept connections. Redis is private and isolated.

## Health and Recovery

- `GET /health`: Liveness probe. Proves the API event loop is responsive. Never calls PostgreSQL, Redis, storage, or third-party APIs. Returns `200 { "status": "ok" }`.
- `GET /ready`: Readiness probe. Proves PostgreSQL (`SELECT 1`) and Redis (`PING`) connectivity with bounded 1500ms timeout. Returns `200 { "status": "ready", "checks": { "database": "ready", "redis": "ready" } }` when healthy, or `503` when degraded/shutting down.
- `GET /metrics`: Prometheus text exposition. Disabled by default unless `METRICS_ENABLED=true`. Requires timing-safe `Authorization: Bearer <token>` matching `METRICS_BEARER_TOKEN`. Missing or invalid tokens return `404` to prevent surface discovery.

If Redis is temporarily unavailable, accepted transactions and outbox events remain pending in PostgreSQL; the worker dispatcher will replay pending records automatically upon reconnection. Failed BullMQ deliveries use stable outbox IDs for idempotent processing.

If Cloudflare R2 or object storage is temporarily unavailable, document uploads fail safely with `503 STORAGE_UNAVAILABLE` leaving pending records for retry or cleanup. Document and household deletion requests hold `delete_pending` or failed state and remain retryable without database data loss. Deletion worker execution ensures object-first deletion: physical objects are confirmed absent before relational database rows are erased in foreign-key-safe order. Retention cleanup runs periodically to expire 24h export artifacts and clean 30-day tombstones.

Graceful shutdown: Send SIGTERM to API and worker. API marks readiness `not_ready` (503), stops accepting new requests, drains existing connections within `SHUTDOWN_TIMEOUT_MS` (default 15s), closes DB/Redis pools, and exits zero. Workers pause job intake and allow active BullMQ jobs to finish before closing queues.

## Backup and Restore

### Schedule and Service Objectives
- **Backup Frequency**: Daily automated backup using `scripts/backup.ts`.
- **Restore Rehearsal**: Monthly restore rehearsal into an isolated rehearsal database using `scripts/restore.ts`.
- **Recovery Point Objective (RPO)**: <= 24 hours.
- **Recovery Time Objective (RTO)**: <= 4 hours for closed-beta restoration.

### Executing Backup
```bash
DATABASE_URL="postgres://user:pass@host:5432/dbname" pnpm --dir backend exec tsx ../scripts/backup.ts
```
Outputs:
- `backups/fdp_backup_<timestamp>.dump` (pg_dump custom format `-Fc`, owner-restricted `0600`)
- `backups/fdp_backup_<timestamp>.dump.sha256` (SHA-256 checksum)
- `backups/fdp_backup_<timestamp>.manifest.json` (Privacy-safe manifest)

### Executing Restore Rehearsal
```bash
TARGET_DATABASE_URL="postgres://user:pass@host:5432/rehearsal_db" \
DUMP_FILE="backups/fdp_backup_<timestamp>.dump" \
ENVIRONMENT_NAME="rehearsal" \
CONFIRM_REHEARSAL="true" \
CHECKSUM_FILE="backups/fdp_backup_<timestamp>.dump.sha256" \
pnpm --dir backend exec tsx ../scripts/restore.ts
```
Safety rules:
1. Target environment MUST be explicitly non-production (`rehearsal`, `test`, `dev`). Production targets (`production`, `prod`, `live`) are strictly refused.
2. Source and target database URLs cannot be identical.
3. Checksum verification is mandatory prior to restoration.
4. Integrity probes fail closed and verify users, households, accounts, transactions, documents, exports, and deletion records.

## Alert Diagnostics and First Steps

Prometheus alert definitions reside in `monitoring/alerts.yml`:

The deployment monitoring system must publish `fdp_last_backup_timestamp_seconds` and `fdp_last_restore_rehearsal_timestamp_seconds` from successful external backup/rehearsal evidence; the in-process API does not fabricate these durable timestamps.

1. **FDPReadinessUnavailable** (`critical`):
   - *Impact*: API not serving traffic; pulled from Traefik rotation.
   - *First Diagnostic*: Check PostgreSQL and Redis container health (`docker compose ps`) and verify network reachability.
2. **FDPHttp5xxRateWarning / FDPHttp5xxRateCritical** (`warning` / `critical`):
   - *Impact*: User-facing error rate exceeds 5% (warning) or 15% (critical).
   - *First Diagnostic*: Inspect structured JSON logs filtered by `level=error` and inspect `fdp_http_requests_total{status_class="5xx"}`.
3. **FDPOldestPendingOutboxAgeWarning / FDPOldestPendingOutboxAgeCritical** (`warning` / `critical`):
   - *Impact*: Asynchronous jobs and outbox events lagging > 5m / 15m.
   - *First Diagnostic*: Check worker process status, Redis queue depth, and `outbox_events` table for un-dispatched records.
4. **FDPJobFailureRateHigh** (`critical`):
   - *Impact*: Over 10% of background jobs failing repeatedly.
   - *First Diagnostic*: Inspect worker logs for `job_execution_failed` events and check `job_runs` error details.
5. **FDPStorageFailuresSustained** (`warning`):
   - *Impact*: Document uploads/downloads and privacy export artifacts failing.
   - *First Diagnostic*: Verify S3/R2 storage endpoint availability and credential validity.
6. **FDPPrivacyOperationFailedOrStuck** (`warning`):
   - *Impact*: Compliance export or deletion failed.
   - *First Diagnostic*: Inspect `privacy_exports` and `household_deletions` tables for failed IDs and initiate safe retry.
7. **FDPAuthFailureSurge** (`warning`):
   - *Impact*: > 10 auth failures/min indicating potential brute force or client error.
   - *First Diagnostic*: Inspect `fdp_auth_failures_total` by reason and check IP rate limiters.
8. **FDPBackupStaleOrRestoreRehearsalMissing** (`critical`):
   - *Impact*: Backup age > 26h or restore rehearsal > 30 days.
   - *First Diagnostic*: Run `scripts/backup.ts` immediately and schedule restore drill.
9. **FDPDependencyReadinessFailed** (`critical`):
   - *Impact*: Database or Redis probe failure for > 2m.
   - *First Diagnostic*: Check database/Redis connectivity and inspect connection pool metrics.

## Release and Rollback Rules

1. **Preflight**: Run `pnpm --dir backend exec tsx ../scripts/preflight.ts --release` before starting deployment.
2. **Release Order**:
   - Capture fresh backup evidence with `scripts/backup.ts`.
   - Build immutable Docker image.
   - Run migration container once (`migrate` service).
   - Start worker service.
   - Start API service.
   - Validate `/ready` probe returns 200.
   - Run the Docker-backed closed-beta smoke flow (`pnpm vitest run tests/integration/smoke-flow.integration.test.ts` from `backend/`).
3. **Rollback**: Revert API and worker container images to previous release tag. Schema migrations are additive and forward-compatible; never run destructive schema rollbacks.
