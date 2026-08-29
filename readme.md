# Living Financial Plan

Backend-first financial planning platform for India. The repository contains an Express/TypeScript modular monolith, an independent generated TypeScript SDK, a legacy Next.js starter client, and local infrastructure.

## Start locally

```bash
docker compose up -d postgres redis
cd backend
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

Run the worker separately with `pnpm tsx src/worker.ts`. API health is available at `http://localhost:4000/health`.

## Documentation

Start at [docs/README.md](docs/README.md). It links the normalized [backend PRD](docs/product/backend-prd.md), architecture decisions, implementation roadmap, API contract, and operations runbook.

The backend, frontend, and SDK are independent packages. Use pnpm only. The backend is the active implementation target; the existing frontend is not the product contract.
