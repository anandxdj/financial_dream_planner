# U8 Privacy and Storage Specification

Date: 2026-08-31
Branch: `main`
Status: accepted

## Scope

U8 adds private, household-scoped document storage and durable privacy operations. PostgreSQL remains authoritative for metadata and workflow state; object bytes live behind a vendor-neutral storage contract whose initial adapter is compatible with Cloudflare R2's S3 API.

The unit delivers:

- an `ObjectStorage` boundary and R2-compatible S3 adapter with injected transport for deterministic tests;
- tenant-scoped document metadata whose opaque object keys never cross the service boundary or appear in API responses, errors, audit payloads, or logs;
- explicit, versioned consent grants and withdrawals;
- durable, idempotent export requests and private, expiring export artifacts;
- durable, confirmed household-deletion requests with bounded retries, concurrency safety, partial-failure recovery, and object-first ordering;
- privacy-safe append-only audit records, retention cleanup, authenticated APIs, migrations, documentation, OpenAPI/SDK contracts, and focused tests.

U8 operates on the authenticated household. The V1 invariant of one active household membership per user makes a confirmed household deletion the account-deletion operation. No client-provided household or user identifier is an authorization input.

## Storage and private-key contract

Domain/application code depends on `ObjectStorage`, not an AWS or Cloudflare SDK. The contract supports byte upload/download, existence checks, deletion, and a bounded download grant. Provider failures normalize to stable unavailable/not-found/conflict errors and never expose endpoint, bucket, credentials, provider payloads, signed URLs, or object keys.

The R2 adapter uses a fixed configured HTTPS endpoint, region `auto`, bucket, access-key ID, and secret. The provider is private by default; public buckets and caller-selected endpoints/buckets are unsupported. Configuration is validated at startup when storage is enabled. Provider clients and clocks are injectable. Deterministic tests use a fake storage implementation and require no live R2 or network.

Object keys are generated only by the server from cryptographically random identifiers and fixed namespaces. They are never derived from filenames, email addresses, household IDs, user-controlled path fragments, or raw database IDs. Keys are stored only in private persistence rows and passed only to `ObjectStorage`. API document/artifact representations expose stable metadata IDs, sanitized display names, media type, byte size, checksum, status, and timestamps—not keys, bucket names, endpoints, or provider URLs.

Downloads use an authenticated API action that resolves tenant ownership and returns a short-lived provider grant (maximum five minutes). Grants are never persisted or logged. Expired, deleted, foreign, or unavailable objects return normalized errors without disclosing whether another tenant's object exists.

## Documents

`documents` is household scoped and records uploader, sanitized display name, media type, exact byte size, SHA-256 checksum, private object key, lifecycle status (`pending`, `available`, `delete_pending`, `deleted`, `failed`), retention deadline, and timestamps. A database uniqueness constraint protects object keys; household-qualified indexes and references support tenant-safe access.

Document creation first validates strict metadata and bounded content, creates a `pending` metadata row, uploads bytes under its server key, then marks it `available`. An upload failure leaves a recoverable failed/pending record but never claims availability. Retry reuses the same metadata ID/key and verifies checksum/size. A successful upload followed by database failure is recorded for orphan cleanup; cleanup checks database ownership before deleting any object.

Document deletion marks metadata `delete_pending`, deletes the exact stored object, then marks it `deleted`. Missing provider objects count as successfully deleted. Provider outage retains `delete_pending` for retry. Reads hide deleted/expired documents and never fall back to unscoped lookup.

## Consent contract

Consent purposes are a closed server enum (`document_storage`, `privacy_export`, `household_deletion`) with versioned policy text identifiers. `consent_records` is append-only and records household, user, purpose, policy version, action (`granted`, `withdrawn`), request/session metadata limited to privacy-safe identifiers, and timestamp. It never stores raw tokens, request bodies, IP addresses, user agents, document contents, or provider details.

The effective state is the newest record for the exact `(household, user, purpose)`. Grant and withdrawal requests require an idempotency key; same key/same canonical action returns the original record, while reuse with different content returns `409 CONSENT_IDEMPOTENCY_CONFLICT`. Storage upload, export creation, and deletion initiation require an effective current-version grant for their respective purpose. Withdrawal prevents new operations but does not erase already accepted durable work or override legal/audit retention.

## Durable export contract

`POST /api/v1/privacy/exports` accepts `{ idempotencyKey }`, requires current export consent, and creates a household-scoped request plus transactional outbox event in one transaction. `(household_id, idempotency_key)` is unique. Same key returns the original request; a different request under the same key conflicts. Concurrent duplicate requests produce one durable request and one logical artifact.

Export status is `queued`, `running`, `completed`, `failed`, or `expired`. The worker atomically claims retryable work. It builds a versioned JSON export from a repeatable database snapshot, excluding password/identity secrets, challenge/session/token hashes, raw provider traces, internal object keys, signed URLs, and deletion confirmation secrets. Document metadata is included; available document bytes are included as checksum-verified encoded entries within configured size limits. The artifact is uploaded to a private server-generated key and only then is the database row atomically marked completed with artifact metadata and an expiry 24 hours after completion.

Retries reuse the request/artifact identity. A completed unexpired request is a no-op on redelivery. If upload succeeds but final persistence fails, retry verifies/replaces that exact artifact and orphan cleanup removes superseded unreferenced keys. Failed attempts record only bounded stable codes, increment attempts, and remain recoverable within the queue policy. Reads hide expired artifacts immediately; cleanup deletes their objects first and then marks requests `expired`. Storage outage never fabricates a completed export.

## Durable deletion contract

Deletion is intentionally two-step:

1. `POST /api/v1/privacy/deletions` accepts `{ idempotencyKey }`, requires owner role, current deletion consent, and a recently authenticated session. It creates or returns a `pending_confirmation` request and a cryptographically random, single-use confirmation token. Only its hash is stored; the raw token is returned once and never logged.
2. `POST /api/v1/privacy/deletions/:id/confirm` accepts `{ confirmationToken }`. It verifies exact household ownership, token hash, 15-minute expiry, request state, and freshness of the initiating session before atomically consuming confirmation, moving to `queued`, and writing the outbox event. Wrong tokens do not consume confirmation. Reconfirmation of the already queued/running/completed request is idempotent without requiring the token again.

Deletion status is `pending_confirmation`, `queued`, `running`, `failed`, or `completed`. Only one non-completed deletion request may exist per household. A household advisory lock and row locking make concurrent initiation/confirmation/worker delivery converge on that request. A stale request whose consent was withdrawn, session revoked, membership changed, policy version changed, or confirmation expired cannot be queued and returns a stable conflict; it creates no deletion side effects.

The worker uses safe irreversible ordering:

1. lock and claim the exact household request;
2. enumerate only object-key rows selected by exact household-qualified predicates;
3. delete document and export objects, treating provider not-found as success and recording per-object progress;
4. retry until every selected object is confirmed absent; never delete database ownership rows while any household object deletion is unresolved;
5. in a database transaction, append the terminal privacy audit event, revoke sessions, delete household-owned domain/privacy rows in foreign-key-safe order, delete membership/household, and delete the user only if no other surviving membership/identity ownership requires it;
6. preserve the minimal deletion request tombstone and privacy-safe audit records without foreign keys to deleted tenant rows, then mark the tombstone completed.

The request captures its target household at creation and the worker never accepts keys, household IDs, table names, or predicates from a job payload. Every destructive query includes the captured household ID. Per-object progress prevents retry from touching unrelated keys. Partial object failure leaves canonical tenant data intact and retryable. Duplicate delivery after completion is a no-op. A failed database transaction rolls back all relational deletion and remains retryable; objects already deleted remain safely idempotent.

## Audit, logging, retention, and recovery

`audit_events` is append-only and privacy-safe. It stores action, actor type and optional non-secret actor reference, entity type/reference, request ID, stable outcome/policy metadata, and timestamp. Privacy audit rows intentionally avoid cascading foreign keys so consent, export, and deletion evidence can survive account deletion. They contain no before/after financial payloads, email, filename, object key, signed URL, token/hash, IP/user-agent, provider error, raw request body, or secret.

The shared logger applies structural redaction for secret/token/authorization/cookie/object-key/signed-URL fields in addition to call-site minimization. Storage and worker logs use public request/document IDs and stable error codes only. Raw bodies and export payloads are never logged.

Retention policy:

- unconfirmed deletion requests expire after 15 minutes and are cleaned after 24 hours;
- completed export artifacts expire after 24 hours and are hidden at the deadline;
- failed/expired export requests and deleted document tombstones are retained 30 days;
- superseded/unreferenced objects are cleaned in bounded, retry-safe batches only after proving they are not referenced by any live metadata row;
- consent records and privacy audit events are retained as append-only compliance evidence; deletion tombstones retain only random request IDs, policy/outcome metadata, and timestamps.

Cleanup takes an injected clock, uses bounded batches, marks progress durably, treats object-not-found as success, and never crosses household boundaries. Storage outage delays physical cleanup but does not make expired artifacts readable. Recovery reruns outbox dispatch and workers using stable request UUID job IDs.

## API contract

All endpoints require authentication, derive user/household/session from `AuthContext`, use strict Zod schemas, and return the standard error envelope. Invalid/foreign UUIDs return validation error/404 without tenant disclosure.

- `POST /api/v1/privacy/consents` records a grant or withdrawal for a closed purpose and policy version.
- `GET /api/v1/privacy/consents` returns effective consent states plus the caller's append-only consent history.
- `POST /api/v1/documents` uploads one bounded private document and returns metadata without an object key.
- `GET /api/v1/documents` lists non-expired available household documents with stable cursor pagination.
- `GET /api/v1/documents/:id` returns tenant-scoped metadata.
- `POST /api/v1/documents/:id/download` returns a short-lived download grant and expiry, never a key.
- `DELETE /api/v1/documents/:id` performs/retries private deletion and returns current metadata status.
- `POST /api/v1/privacy/exports` creates/deduplicates an export request (`202` active, `200` terminal).
- `GET /api/v1/privacy/exports/:id` returns status and artifact metadata when completed and unexpired.
- `POST /api/v1/privacy/exports/:id/download` returns a short-lived artifact grant when completed and unexpired.
- `POST /api/v1/privacy/deletions` initiates/deduplicates deletion and returns the one-time confirmation token only for a newly created request.
- `POST /api/v1/privacy/deletions/:id/confirm` queues confirmed deletion.
- `GET /api/v1/privacy/deletions/:id` returns the authenticated household's request while the account still exists.

Upload content type and size are enforced before storage; JSON bodies reject unknown keys; action routes reject unknown body fields. Timestamps are ISO-8601. No response contains storage credentials, internal keys, secret hashes, or another tenant's existence.

## Acceptance gates

- Unit tests cover object-key randomness/non-derivation/non-disclosure, R2 provider normalization, download-grant bounds, configuration validation, consent versions/effective state/idempotency, confirmation token hashing/expiry/single use, redaction, retention cutoffs, and cleanup selection.
- PostgreSQL-backed tests cover tenant-qualified document metadata, duplicate and concurrent consent/export/deletion requests, one outbox event, duplicate delivery, storage outage/retry, export partial failure/recovery, deletion object-first ordering, partial deletion recovery, relational rollback, expired artifact hiding, bounded retention cleanup, orphan cleanup, preserved audit/tombstones, and unrelated-tenant survival.
- API tests cover authentication, owner authorization, recent-auth enforcement, strict body/path/query validation, consent enforcement, private metadata/download behavior, idempotent status codes, stale confirmation/request rejection, and cross-tenant 404 non-disclosure.
- Tests use injected fake storage/provider clients and deterministic clocks. Deterministic gates require no live R2/network and contain no skips.
- Existing U1-U7 behavior remains green.
- Backend typecheck, lint, production build, all deterministic local and Docker-backed tests, migration generation/application, OpenAPI generation/check, SDK typecheck/build, and `git diff --check` pass.

## Out of scope and release gates

- public buckets, public object URLs, caller-selected keys, direct unauthenticated uploads, multipart/resumable uploads, OCR/document parsing, antivirus processing, and document sharing;
- restoring a completed deletion or silently cancelling a confirmed deletion;
- deleting append-only privacy-safe audit/consent evidence required for accountability;
- live R2 credentials/provider calls, legal-policy approval, backup erasure, and production deletion drills, which remain U9/release gates and must not be represented as completed by deterministic U8 tests.

## Completion evidence

- Antigravity bulk implementation used Gemini 3.7 Flash High in conversation `0d2c48e7-cc8c-42ca-974b-abe7ddcbb4a5` under the user's explicit private-repository and network authorization. It did not switch branches, commit, or push. Its output was treated as a claim; detached earlier attempts were terminated after they continued beyond their wrapper turns.
- Conductor review inspected the changed source, tests, migration, documentation, OpenAPI, and generated SDK. Corrections removed two competing generated implementations, restored dependency injection, made disabled storage fail closed, enforced canonical base64/current consent policy, added household advisory locking, same-session/owner stale-request checks, timing-safe token comparison and consumption, privacy-safe job payloads/audit metadata, retryable deletion failure state, and outage-safe retention cleanup.
- Final conductor-controlled result: 49 backend test files and 315 tests pass with zero skips or failures. Docker-backed PostgreSQL tests cover concurrent export/deletion deduplication, object-first partial deletion failure and recovery, cross-tenant survival, export outage retry, expired-artifact hiding/cleanup retry, and audit/consent preservation. Backend typecheck, lint, and production build pass.
- Drizzle migration `0010_u8_privacy_storage.sql` and snapshot generate with no pending schema changes and apply through fresh Docker-backed test databases. OpenAPI and SDK generation is byte-stable; SDK typecheck/build and `git diff --check` pass. The post-commit `openapi:check` is the final recorded gate.
