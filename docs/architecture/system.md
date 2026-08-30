# System Architecture

## Module boundary

Backend capabilities live under `backend/src/modules/<capability>`. A module owns its routes, controllers, services, domain policies, schemas/types, persistence models, and focused tests. Composition roots (`app.ts`, `composition.ts`, and worker composition) only wire modules and infrastructure. `shared/` is reserved for genuinely cross-cutting protocol primitives such as error envelopes, request IDs, authentication transport middleware, exact decimals, and pagination; business rules do not accumulate there. New financial features follow this boundary before adding routes.

Clients call a versioned REST API and resumable SSE streams. Express controllers validate input and invoke application use cases. API and BullMQ workers share those use cases. PostgreSQL stores users, finance data, immutable plans, durable job runs/events, and a transactional outbox. Redis loss can delay work but cannot erase accepted work or completed results.

Modules own routes, services, schemas, and database models. Job queue and outbox ownership lives in `backend/src/modules/jobs`; reusable API primitives live in `shared`. Domain code does not import Express, BullMQ, LangGraph, or vendor SDK types. The API and worker composition roots inject database, queues, storage, providers, logger, and clock. Every financial mutation eventually writes its state, audit record, revision, and outbox event in one transaction.

Deployment uses the same built image with `dist/server.js` and `dist/worker.js` entrypoints. Migrations run separately before new processes receive traffic.
