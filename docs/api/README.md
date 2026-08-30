# API Contract

All public endpoints use `/api/v1`. UUIDs identify resources; timestamps are RFC 3339 UTC. Money and rates are decimal strings. Errors use `{ "error": { "code", "message", "details?", "requestId" } }`. Collections use opaque cursors and a maximum page size of 100. Mutable resources use `revision`/`ETag` with `If-Match`; side-effectful POSTs accept `Idempotency-Key`.

Run endpoints expose status, idempotent cancellation, and `text/event-stream` events. Reconnect with `Last-Event-ID`; PostgreSQL event order is authoritative.

Run `pnpm openapi:generate` in `backend/` to generate [openapi.json](openapi.json) and `sdk/src/generated/schema.d.ts`. The independent SDK wraps `openapi-fetch` and supplies `subscribeRun()`.

Authentication endpoints cover local register/login/refresh plus central OIDC start, callback, and mobile bridge exchange. Browser clients send credentials as cookies and must echo the readable CSRF cookie in `X-CSRF-Token` on unsafe requests with `Origin` set to the configured web origin. Native/API clients use bearer tokens and do not mix them with browser cookies. Household scope is never accepted from authentication request bodies.
