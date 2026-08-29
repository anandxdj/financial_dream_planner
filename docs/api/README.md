# API Contract

All public endpoints use `/api/v1`. UUIDs identify resources; timestamps are RFC 3339 UTC. Money and rates are decimal strings. Errors use `{ "error": { "code", "message", "details?", "requestId" } }`. Collections use opaque cursors and a maximum page size of 100. Mutable resources use `revision`/`ETag` with `If-Match`; side-effectful POSTs accept `Idempotency-Key`.

Run endpoints expose status, idempotent cancellation, and `text/event-stream` events. Reconnect with `Last-Event-ID`; PostgreSQL event order is authoritative.

Run `pnpm openapi:generate` in `backend/` to generate [openapi.json](openapi.json) and `sdk/src/generated/schema.d.ts`. The independent SDK wraps `openapi-fetch` and supplies `subscribeRun()`.
