# Living Financial Plan

Living Financial Plan is an India-focused personal-finance planning platform. The backend is the authoritative source of financial truth: it stores canonical financial state, runs deterministic calculations, and orchestrates bounded AI and research workflows for continuously updated plans.

## Repository layout

- `backend/` — Express 5 + TypeScript modular monolith with PostgreSQL/Drizzle, Redis/BullMQ, authentication, ledger, financial-engine, plans, scenarios, planner, research, and SSE run endpoints.
- `frontend/` — Next.js App Router web client and authentication UI.
- `sdk/` — Independent TypeScript SDK built from the generated OpenAPI contract.
- `docs/` — Product requirements, architecture decisions, API contract, implementation roadmap, and operations runbook.
- `postman/` — Starter collection and local environment for API requests.
- `docs/frontend_mobile/` — Dependency-aware Expo/React Native feature specifications and delivery roadmap. This is the mobile implementation plan, not the mobile app source.
- `docker-compose.yml` — Local PostgreSQL and Redis infrastructure, plus container definitions for the API and worker.

## Prerequisites

- Node.js 20 or newer
- pnpm 11
- Docker Desktop (for PostgreSQL and Redis)

Each package is independent and has its own `package.json`; run pnpm commands from that package directory.

## Run the backend locally

Start the local infrastructure:

```bash
docker compose up -d postgres redis
```

In a new terminal, configure and start the API:

```bash
cd backend
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

The API listens on `http://localhost:4000`. Check it with:

```text
GET http://localhost:4000/health
GET http://localhost:4000/ready
```

Start the BullMQ worker in a second terminal when exercising background jobs:

```bash
cd backend
pnpm tsx src/worker.ts
```

For production-like operations, see `docker-compose.prod.yml`, `monitoring/alerts.yml`, `scripts/backup.ts`, `scripts/restore.ts`, and `scripts/preflight.ts`.

## Run the web client

With the backend running, start the Next.js client in a separate terminal:

```bash
cd frontend
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The client uses `NEXT_PUBLIC_API_URL`, which defaults to `http://localhost:4000/api/v1`.

## Build and verify

Backend checks:

```bash
cd backend
pnpm check-types
pnpm lint
pnpm test
pnpm build
```

Frontend checks:

```bash
cd frontend
pnpm lint
pnpm build
```

SDK checks:

```bash
cd sdk
pnpm install
pnpm check-types
pnpm build
```

## API and generated SDK

All public endpoints are versioned under `/api/v1`. The checked-in contract is [`docs/api/openapi.json`](docs/api/openapi.json), and the generated TypeScript types are in `sdk/src/generated/schema.d.ts`.

Regenerate both from the backend package after changing an API schema:

```bash
cd backend
pnpm openapi:generate
```

Use `pnpm openapi:check` to verify that the checked-in OpenAPI document and SDK types are up to date.

## Documentation

Start with [`docs/README.md`](docs/README.md). It links to:

- the backend product requirements and product decisions;
- system, data-model, authentication, financial-engine, and AI/research architecture;
- API conventions and the generated contract;
- the implementation roadmap and operations runbook.

For the mobile direction, follow the recommended reading order in [`docs/frontend_mobile/README.md`](docs/frontend_mobile/README.md).

## Project status

The backend is the active implementation target and the API contract is the integration boundary for clients. The Next.js application is currently a web/auth starter, while the mobile feature pack defines the planned Android-first Expo client.
