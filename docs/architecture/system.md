# System Architecture

## Module boundary

Backend capabilities live under `backend/src/modules/<capability>`:
- `auth`: Authentication, session families, invitations, OIDC.
- `households`: Household tenant context, membership, RBAC.
- `ledger`: Accounts, transactions, categorization, audit trails.
- `financial-engine`: Pure deterministic financial calculation models.
- `plans`: Baseline plans, immutable financial snapshots, scenarios, version trees.
- `planner`: Bounded LangGraph planning orchestration, LLM provider routing, closed tool registry, risk/critic safety filters.
- `research`: Cited financial research runner, SSRF-safe document fetcher, Tavily search provider, source rank classification.
- `drift`: Deterministic material-change policy, durable deduplicated checks, explicit baseline acceptance, and drift retention.
- `privacy`: Consent lifecycle, durable export generation, two-step confirmation household deletions, append-only compliance audit events, and retention cleanup.
- `documents`: Tenant-scoped document metadata, upload validation, short-lived download grants, and delete lifecycle.
- `storage`: Vendor-neutral `ObjectStorage` contract, R2-compatible S3 adapter, opaque key generator, and deterministic in-memory `FakeStorage`.
- `jobs`: BullMQ queues, job runs, and transactional outbox.

Composition roots (`app.ts`, `composition.ts`, and worker composition) only wire modules and infrastructure. `shared/` is reserved for genuinely cross-cutting protocol primitives such as error envelopes, request IDs, authentication transport middleware, exact decimals, and pagination; business rules do not accumulate there.

Clients call a versioned REST API and resumable SSE streams. Express controllers validate input and invoke application use cases. API and BullMQ workers share those use cases. PostgreSQL stores users, finance data, immutable plans, durable job runs/events, planner conversations/messages, research evidence, and a transactional outbox. Redis loss can delay work but cannot erase accepted work or completed results.

Financial domain code does not import Express, BullMQ, LangGraph, or vendor SDK types. The planner orchestration module owns its LangGraph dependency while remaining independent of vendor SDK types. Composition roots inject infrastructure where required. Every financial mutation eventually writes its state, audit record, revision, and outbox event in one transaction.

Deployment uses the same built image with `dist/server.js` and `dist/worker.js` entrypoints. Migrations run separately before new processes receive traffic.
