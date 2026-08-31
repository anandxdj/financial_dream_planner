# Backend

Express 5 API & BullMQ Worker with PostgreSQL + Drizzle. See the [root README](../readme.md) for full project setup. Use **pnpm** only.

## Development & Operations Scripts

```bash
# Type check and lint
pnpm check-types
pnpm lint

# Build server, worker, and migrate bundles
pnpm build

# Run unit, API, and integration tests
pnpm test

# Generate and check OpenAPI specification & SDK bindings
pnpm openapi:generate
pnpm openapi:check

# Generate and run database migrations
pnpm db:generate
pnpm db:migrate

# Operational scripts
pnpm tsx ../scripts/preflight.ts
pnpm tsx ../scripts/backup.ts
pnpm tsx ../scripts/restore.ts
```
