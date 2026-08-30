# U3 Ledger Vertical — Session Handoff

> Fresh-session entry point: [NEXT-SESSION.md](NEXT-SESSION.md). Read that plan first, then use this document for detailed evidence and logs.

Date: 2026-08-30 (Asia/Calcutta)  
Branch: `feat/ledger-vertical`  
Base/U2 checkpoint: `66b2717 feat(auth): harden tenancy and OIDC sessions`  
U3 status: implementation complete, locally verified, and committed as five focused commits through `0c1edb6`.

## Completion record

1. The committed U3 diff was reviewed in a fresh session.
2. Backend build, lint, the full PostgreSQL-backed suite, SDK checks, and `openapi:check` passed after the final serializer change.
3. U2 and U3 were marked accepted under the roadmap's documented local-acceptance policy; real-provider staging remains a release gate.
4. U3 is represented by commits `ccd43ab`, `9756b51`, `e1a899b`, `58f6c63`, and `0c1edb6`.

U4 may now start from a dedicated branch based on `0c1edb6` plus this documentation checkpoint.

## Orchestration record

The conductor defined the U3 architecture and acceptance contract. Antigravity acted as the bulk implementation worker with explicit repository authorization:

- Model: `gemini-3.7-flash-high` (Gemini 3.7 Flash High)
- Flags: `--yolo --mode accept-edits --dir <repo>`
- Conversation ID: `b913ecdb-74c3-4bf0-957d-33cdaf43edfd`
- Local trajectory: `C:\Users\Dell\.gemini\antigravity-cli\brain\b913ecdb-74c3-4bf0-957d-33cdaf43edfd\.system_generated\logs\transcript.jsonl`
- Antigravity did not commit or switch branches.
- The bundled `agy-trace --audit` could not run because Windows `python3` is a broken Store shim. The conductor parsed the JSONL directly: 274 steps; nonzero commands were Docker unavailable, an initial missing `DATABASE_URL`, intermediate TypeScript errors, generated-file diff detection, and intermediate lint errors. Antigravity corrected the code errors before returning; Docker was later started by the conductor.

## Completed U3 implementation

- Household-scoped account CRUD.
- Household/system category CRUD with system-category mutation protection.
- Canonical transactions and multi-source provenance.
- Checked-in Drizzle migrations `0003` and corrective `0004`, with snapshots and journal entries.
- Normalized SMS batch endpoint at `POST /api/v1/transactions/sync`.
- Exact-reference deduplication and multi-source provenance attachment.
- Reference-free conservative fingerprinting with ambiguous twins preserved as separate `needs_review` transactions.
- Source/client idempotency, including concurrent reference-free replay.
- Transaction list/detail/create/update/delete endpoints.
- Single-currency exact-decimal cash-flow snapshot with explicit no-data `null` versus observed `"0.00"`.
- Strict sync schemas reject raw SMS/unknown fields.
- OpenAPI document and generated TypeScript SDK updated.
- Architecture and API documentation updated.
- Unit, integration, concurrency, tenant-isolation, CSRF-aware API, migration, and cash-flow tests added/updated.

## Conductor corrections after worker review

Antigravity's initial implementation was not accepted as-is. The conductor found and fixed:

1. Cross-household account/category references: service ownership checks plus composite household/account and household/transaction foreign keys.
2. Provenance uniqueness: exact-reference uniqueness moved to canonical transactions; provenance uses `(household, sourceType, clientId)` idempotency so multiple sources can attach to one transaction.
3. Concurrent reference-free replay: fingerprint advisory locking now rechecks client identity inside the transaction, preventing an orphan/extra canonical row.
4. Fallback twin concurrency: serialized by household/fingerprint advisory lock; genuine collisions remain durable and reviewable.
5. Mixed-currency aggregation: cash flow filters one requested currency, defaulting to INR.
6. Account deletion: accounts with ledger history return `409 ACCOUNT_IN_USE` rather than hitting an invalid composite `SET NULL` path.
7. Database checks: positive transaction amount and confidence range constraints.
8. Raw SMS handling: strict Zod sync objects reject unknown/raw fields.
9. Migration ordering: composite unique indexes are created before dependent composite foreign keys in `0004`.
10. Cookie-auth API tests: unsafe requests now send the established Origin and CSRF header instead of weakening middleware.
11. API money serialization: PostgreSQL retains `numeric(19,4)` while API money values return stable two-decimal strings.
12. Currency/date validation and OpenAPI descriptions were aligned with runtime behavior.

## Verification log

Final conductor-controlled results:

```text
backend: pnpm check-types
PASS — tsc --noEmit

backend: pnpm lint
PASS — eslint src tests scripts

backend: pnpm test
PASS — 9 test files, 55 tests; 0 skipped, 0 failed
Docker/Testcontainers PostgreSQL was running for this result.

backend: pnpm build
PASS — typecheck + esbuild (run before final test pass; rerun if desired before commit)

backend: pnpm db:generate
PASS — "No schema changes, nothing to migrate" after 0004 model/snapshot alignment

backend: pnpm openapi:generate
PASS — regenerated docs/api/openapi.json and sdk/src/generated/schema.d.ts

sdk: pnpm check-types && pnpm build
PASS

targeted ledger API after final serialization fix
PASS — 1 file, 4 tests
```

Important earlier failures that were fixed:

- PostgreSQL rejected `0004` because generated composite FKs preceded required unique indexes.
- Ledger API mutations returned 403 because worker tests omitted CSRF headers.
- Account API returned `25000.0000` instead of the two-decimal API contract.

## Remaining release work

- CI/provider staging remains advisable for central OIDC against a real provider even though local Docker auth gates are green.

## Operational notes

- Docker Desktop was started in the background and reported server version `29.7.2`.
- `node_modules` for backend and SDK were restored with `pnpm install --frozen-lockfile`; lockfiles were not changed.
- The working tree intentionally contains all U3 changes. Do not reset or clean it.
