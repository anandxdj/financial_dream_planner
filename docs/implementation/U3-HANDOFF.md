# U3 Ledger Vertical — Session Handoff

Date: 2026-08-30 (Asia/Calcutta)  
Branch: `feat/ledger-vertical`  
Base/U2 checkpoint: `66b2717 feat(auth): harden tenancy and OIDC sessions`  
U3 status: implementation complete and locally verified; changes are **not committed**.

## First priority on resume

1. Review `git diff` and `git status`; preserve every current U3 file.
2. Run the final generation/build checks listed below once more if the workspace or dependencies changed.
3. Update roadmap acceptance statuses only if the intended policy is to accept U2 and U3 from the now-green Docker gates.
4. Commit the U3 slice with a focused message such as `feat(ledger): add tenant-scoped canonical transaction vertical`.

Do not start U4 before reviewing and committing this branch.

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

## Remaining work

- Review the final uncommitted diff, especially generated OpenAPI/SDK files and both U3 migrations.
- Optionally rerun `pnpm build` after the last controller-only serialization edit.
- Run `pnpm openapi:check` only after staging/committing generated artifacts; before commit it intentionally reports their diff from `HEAD`.
- Decide whether the now-green Docker gates are sufficient to mark U2 `accepted`. U2 currently remains `in progress` in the roadmap.
- Decide whether U3 should be marked `accepted` now or only after CI/staging validation. It currently remains `in progress`.
- Commit U3. Nothing has been pushed.
- CI/provider staging remains advisable for central OIDC against a real provider even though local Docker auth gates are green.

## Operational notes

- Docker Desktop was started in the background and reported server version `29.7.2`.
- `node_modules` for backend and SDK were restored with `pnpm install --frozen-lockfile`; lockfiles were not changed.
- The working tree intentionally contains all U3 changes. Do not reset or clean it.
