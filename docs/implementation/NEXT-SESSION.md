# Next Session Execution Plan

Last updated: 2026-08-30  
Completed branch: `feat/ledger-vertical`  
Detailed evidence and logs: [U3-HANDOFF.md](U3-HANDOFF.md)

## Session outcome

The fresh-session review is complete. U3 is committed in five focused commits through `0c1edb6`, all final gates pass, and U2/U3 are accepted under the roadmap's local-acceptance policy. This file now serves as the U3-to-U4 execution record.

## Already completed

- U2 auth/tenancy checkpoint committed as `66b2717`.
- Dedicated U3 branch created: `feat/ledger-vertical`.
- U3 account, category, canonical transaction, provenance, normalized SMS sync, deduplication, review-state, and cash-flow implementation completed.
- Drizzle migrations and snapshots generated and corrected.
- OpenAPI and generated SDK updated.
- Architecture, API documentation, unit tests, integration tests, concurrency tests, and authenticated API tests added.
- Antigravity performed the bulk implementation using Gemini 3.7 Flash High; the conductor reviewed and corrected its output.
- Docker Desktop was started and the full PostgreSQL-backed suite passed.

Latest verified result:

```text
backend typecheck: PASS
backend lint: PASS
backend tests: PASS — 9 files, 55 tests, 0 skipped, 0 failed
backend build: PASS (run before the final controller serialization change)
Drizzle schema generation: PASS — no pending schema changes
OpenAPI + SDK generation: PASS
SDK typecheck/build: PASS
git diff --check: PASS
```

## Completed fresh-session actions

Completed in order:

1. Read [U3-HANDOFF.md](U3-HANDOFF.md).
2. Confirm branch and preserve the tree:

   ```powershell
   git branch --show-current
   git status --short
   git diff --check
   ```

3. Review the final U3 diff. Give special attention to:

   - `backend/src/modules/transactions/transactions.service.ts`
   - `backend/src/modules/transactions/model.ts`
   - `backend/src/database/drizzle/0003_canonical_ledger.sql`
   - `backend/src/database/drizzle/0004_cultured_maria_hill.sql`
   - tenant-boundary and concurrency tests
   - generated OpenAPI and SDK changes

4. Reran the final backend build after the API money serializer change:

   ```powershell
   cd backend
   $env:CI='true'
   pnpm build
   pnpm test
   ```

   Expected test result: 9 files and 55 tests passing with no skips while Docker is running.

5. Rerun SDK verification if generated files changed:

   ```powershell
   cd ../sdk
   $env:CI='true'
   pnpm check-types
   pnpm build
   ```

6. Recorded the roadmap decision:

   - U2 and U3 are accepted after deterministic local and Docker-backed gates passed.
   - Real OIDC provider staging and CI remain release gates.
   - The policy is explicit in `docs/implementation/roadmap.md`.

7. U3 was committed as five focused commits and the documentation checkpoint follows separately.

   ```powershell
   git add --all
   git diff --cached --check
   git diff --cached --stat
   ```

8. Ran `pnpm openapi:check` after the commits; it passed.

10. Do not push unless explicitly requested.

## U3 acceptance checklist

- [x] Household scope derives from authenticated server state.
- [x] Cross-household account/category injection is rejected.
- [x] Exact external-reference replay cannot create duplicate canonical rows.
- [x] Multiple provenance sources can attach to one canonical transaction.
- [x] Source/client replay is idempotent.
- [x] Reference-free concurrent replay is idempotent.
- [x] Genuine fallback collisions remain separate and `needs_review`.
- [x] Raw SMS/unknown sync fields are rejected.
- [x] Money uses exact decimal storage/calculation and stable API strings.
- [x] Cash flow does not mix currencies.
- [x] Empty cash flow differs from observed net zero.
- [x] Migrations apply to fresh PostgreSQL.
- [x] OpenAPI and generated SDK are synchronized.
- [x] Full local Docker suite passes without skips.
- [x] Final diff review in the fresh session.
- [x] Final post-serializer backend build.
- [x] Roadmap acceptance decision recorded.
- [x] U3 commits created.
- [x] Post-commit `openapi:check` passes.

## After U3 is committed

Create a clean planning checkpoint and dedicated branch for U4 Financial Engine before implementation.

U4 planning scope:

- financial domain inputs and completeness semantics
- versioned calculation policy
- exact deterministic cash-flow, savings-rate, emergency-runway, debt, goal, and projection primitives
- golden examples with explicit rounding rules
- property tests and reproducibility guarantees
- API/OpenAPI/SDK boundaries

Recommended U4 workflow:

1. Conductor extracts requirements and defines calculation contracts/tests.
2. Antigravity, pinned explicitly to `gemini-3.7-flash-high`, handles bulk golden-test tables, repetitive calculator scaffolding, and first-pass review.
3. Conductor owns formulas, rounding, missing-data behavior, edge cases, and final verification.
4. Use a new dedicated branch after U3 is committed.

## Known operational context

- Docker Desktop server version observed: `29.7.2`.
- Backend and SDK dependencies were restored with frozen lockfiles; lockfiles were unchanged.
- Antigravity trajectory auditing via the bundled script is unavailable until a real `python3` executable replaces the Windows Store shim. Direct JSONL parsing remains available.
- Antigravity repository access was explicitly authorized with `--yolo` for U4 in the continuation request dated 2026-08-30.

## Completion statement for this session

U3 is implemented, committed, and fully exercised locally. The next work is a dedicated U4 planning and implementation branch; nothing has been pushed.
