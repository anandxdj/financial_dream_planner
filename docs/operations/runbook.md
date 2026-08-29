# Operations Runbook

## Local services

Copy `backend/.env.example` to `backend/.env`, then run `docker compose up --build`. PostgreSQL is canonical; Redis is disposable coordination state. Run migrations with `pnpm db:migrate` before API/worker startup.

## Health and recovery

`/health` proves the API process responds. U9 adds dependency readiness and metrics. If Redis is unavailable, keep accepted outbox rows pending and restart the dispatcher after recovery. Failed BullMQ deliveries use stable outbox IDs, so replay is idempotent. Run status and events are recovered from PostgreSQL.

Terminate API/worker with SIGTERM and allow graceful connection closure. Do not run multiple migration processes; production migrations use a direct database URL and advisory lock.

## Release and incident rules

Apply additive migrations, start workers, start API, and smoke-test health/run streaming. Roll back application processes without reversing a compatible migration. Never log passwords, access/refresh/OIDC tokens, signed URLs, raw SMS, document bodies, prompts, or hidden reasoning. Rotate exposed secrets, revoke affected sessions, disable the provider feature flag, preserve privacy-safe evidence, and follow the breach process. Closed beta cannot advance without backup/restore and deletion drills.
