# Release 2 Progress — Orca run `run_07aa2b9572d8`

## Executive status

This document records the state visible in the worktree at the time of this run. It is a progress record, not a release sign-off: the Release 2 implementation is present for F12–F15, frontend checks and SDK checks pass, and backend static checks pass, but backend integration coverage and browser/release verification are not complete.

Release 2 is the Decision Tools release:

- **F12 — Plan history and meaningful drift:** version history, historical snapshot review, material drift findings, explicit keep/accept behavior, and restore-as-a-new-version behavior.
- **F13 — Saved scenarios:** bounded what-if overlays, scenario evaluation and 2–4 scenario comparison, and explicit application to a traceable new plan version.
- **F14 — Loan analysis:** repayment/amortization, EMI, prepayment (`reduce_tenure` and `reduce_emi`), refinancing comparison, liquidity impact, and non-lender disclosure.
- **F15 — Investments:** conservative/expected/optimistic compounding projections, contribution step-up simulation, milestones, missing-input handling, and no trading/brokerage execution.

The binding acceptance checklist is [docs/frontend_nextjs/RELEASE2_ACCEPTANCE.md](docs/frontend_nextjs/RELEASE2_ACCEPTANCE.md). Its checkboxes remain the authority for acceptance; this file does not mark unchecked items complete.

## Architecture and contracts implemented

The current changes extend the existing Express + PostgreSQL/Drizzle backend, generated OpenAPI/SDK contract, and Next.js planner UI.

- F12 adds plan-history drift summary/detail schemas, version detail and restore request/response contracts, history/version/restore routes, and service/controller behavior for comparing and restoring versions.
- F13 extends scenario models/services/controllers/routes with revision-aware update/delete behavior and run/compare/apply flows.
- F14 adds authenticated loan CRUD and analysis/prepayment/scenario routes under `/api/v1/loans`; loan calculations delegate to the existing financial engine.
- F15 adds authenticated investment summary/input/projection routes under `/api/v1/investments`; projections delegate to the existing investment financial-engine calculation.
- `backend/src/openapi.ts`, `docs/api/openapi.json`, and `sdk/src/generated/schema.d.ts` carry the expanded API contract. Frontend decision queries use generated `paths` types and decimal-string request/response boundaries.
- The database migration adds the `loans` table and a revision column/check to `scenarios`; Drizzle journal/snapshot metadata is updated.
- Next.js routes and feature views are present for history/review, scenarios/new/detail, loans/detail, and investments. The views include loading/empty/error or disclosure-oriented states covered by the new feature tests; browser behavior is still unverified below.

## Change inventory

### Backend

Modified:

- `backend/src/app.ts` — mounts loan and investment routers.
- `backend/src/database/schema.ts` — exports loan schema.
- `backend/src/database/drizzle/meta/_journal.json` — migration journal update.
- `backend/src/modules/plans/model.ts`, `plans.controller.ts`, `plans.route.ts`, `plans.service.ts` — history drift details, version lookup, restore, and associated contracts/logic.
- `backend/src/modules/scenarios/model.ts`, `scenarios.controller.ts`, `scenarios.route.ts`, `scenarios.service.ts` — scenario revision/update/delete and decision flows.
- `backend/src/openapi.ts` — API descriptions for the expanded contracts.
- `backend/tests/helpers/db.ts` — test database helper update.

Added:

- `backend/src/modules/loans/index.ts`, `model.ts`, `loans.controller.ts`, `loans.route.ts`, `loans.service.ts`.
- `backend/src/modules/investments/index.ts`, `model.ts`, `investments.controller.ts`, `investments.route.ts`, `investments.service.ts`.
- `backend/src/database/drizzle/0012_volatile_nightmare.sql` and `backend/src/database/drizzle/meta/0012_snapshot.json`.

### Frontend

Modified:

- `frontend/src/components/planner/app-shell.tsx` — planner shell/navigation integration.
- `frontend/src/features/planner/plan.tsx` and `queries.ts` — plan integration and query support.

Added:

- Routes: `frontend/src/app/dashboard/plan/history/page.tsx`, `plan/review/[id]/page.tsx`, `scenarios/page.tsx`, `scenarios/new/page.tsx`, `scenarios/[id]/page.tsx`, `loans/page.tsx`, `loans/[id]/page.tsx`, and `investments/page.tsx`.
- Feature/query code: `frontend/src/features/planner/decision-queries.ts`, `history-drift.tsx`, `scenarios.tsx`, `loans.tsx`, and `investments.tsx`.
- Feature tests: `history-drift.test.tsx`, `scenarios.test.tsx`, `loans.test.tsx`, and `investments.test.tsx`.

### SDK and API artifacts

- `sdk/src/generated/schema.d.ts` was regenerated from the OpenAPI document.
- `docs/api/openapi.json` was updated with the current route/schema contract.

### Documentation

- `docs/frontend_nextjs/RELEASE2_ACCEPTANCE.md` was added as the Release 2 acceptance matrix.
- F12/F13/F14/F15 module specifications and `docs/frontend_nextjs/modules/README.md` are updated in the worktree.
- No existing documentation was changed for this progress report; this root-level file is the only file created by this task.

### Database

- Migration `0012_volatile_nightmare.sql` creates `loans` with household/account foreign keys, status/type checks, monetary numeric columns, revision, and indexes.
- The migration adds `scenarios.revision` and its non-negative check.
- Applying the migration to a real database and exercising rollback/recovery remain release work, not claims made here.

## Verification performed and observed results

Commands were run from the indicated package directories in the current worktree.

| Area | Command | Observed result |
|---|---|---|
| Frontend typecheck | `cd frontend && pnpm exec tsc --noEmit` | **PASS**, exit 0 |
| Frontend lint | `cd frontend && pnpm lint` | **PASS**, exit 0 |
| Frontend tests | `cd frontend && pnpm test -- --run` | **PASS** — 13 files, 39 tests passed |
| Frontend production build | `cd frontend && pnpm build` | **PASS** — Next build compiled and generated all listed Release 2 routes |
| SDK typecheck | `cd sdk && pnpm check-types` | **PASS**, exit 0 |
| SDK build | `cd sdk && pnpm build` | **PASS**, exit 0 |
| Backend typecheck | `cd backend && pnpm check-types` | **PASS**, exit 0 |
| Backend lint | `cd backend && pnpm lint` | **PASS**, exit 0 |
| Backend full tests | `cd backend && pnpm test -- --run` | **PARTIAL / BLOCKED** — 42 test files passed, 283 tests passed; 17 test files skipped (91 tests skipped); 3 integration suites failed before execution because Testcontainers could not find a working container runtime (`backup-restore-rehearsal`, `operations-recovery`, `smoke-flow`) |

Therefore backend is **not fully green**: static checks pass, but the full suite is not a pass until a supported PostgreSQL/container runtime is available and the three blocked suites are rerun. No claim is made here that backend integration, migration, OpenAPI drift, or browser checks have passed.

## Orca orchestration chronology

The following chronology preserves the run facts supplied by the coordinator and does not infer timestamps or hidden task completion:

1. Orca run `run_07aa2b9572d8` dispatched Release 2 work covering F12–F15.
2. Orchestration encountered quota/account/model retry activity during dispatch. The exact retry count and timing are not represented in the repository, so they are intentionally not reconstructed here.
3. Frontend completion was coordinator-recovered after a revoked capability; the recovered frontend result is the implementation currently visible in this worktree and is supported by the passing frontend checks above.
4. Backend work remains active under dispatch context `ctx_736b4177a684`, using **Gemini 3.8 Flash Medium**. Active backend status must not be treated as backend release completion.
5. This worker inspected the resulting git status/diff, relevant specifications and code, and ran the verification commands listed above. No stage, commit, push, or unrelated code change was performed.

## Known gaps, risks, and blockers

- Backend integration tests need a working Docker/Podman-compatible Testcontainers runtime; three suites currently fail at container startup, so tenant/migration/end-to-end behavior is not proven by this run.
- `docs/frontend_nextjs/RELEASE2_ACCEPTANCE.md` still contains unchecked backend, SDK contract, UI-state, conflict, and browser acceptance items. Passing frontend tests/build does not satisfy those manual or integration gates.
- Browser verification at 360–1440 px, keyboard/focus behavior, WCAG table review, real authenticated API wiring, stale/offline/refetch states, and explicit confirmation/conflict flows remain unverified.
- Database migration application and a real PostgreSQL rehearsal remain unverified.
- OpenAPI generation/drift verification (`backend pnpm openapi:check`) was not run in this pass; generated artifacts are present but contract parity still needs its command-level check.
- The worktree contains many pre-existing uncommitted Release 2 changes. Avoid broad formatting, regeneration, cleanup, or reset operations that could overwrite them.

## Browser and release verification still required

Before release sign-off, run the acceptance matrix against a real backend/database and authenticated household data:

1. Apply migration `0012`, start backend/frontend, and verify all F12–F15 endpoints through the actual app.
2. Run backend unit/integration suites with a working container runtime, then run `pnpm openapi:check` and inspect the generated diff.
3. Exercise every Release 2 route at 360, 768, 1024, and 1440 px: loading, populated, empty/next-action, partial error/retry, stale/refetch, and offline read states.
4. Verify F12 side-by-side history/drift review, keep/accept/restore confirmation, baseline immutability, revision conflicts, and new-version provenance.
5. Verify F13 bounded 2–4 scenario comparison, mixed-baseline rejection, explicit apply confirmation, idempotency, and stale-baseline 409 recovery.
6. Verify F14 amortization/EMI, both prepayment strategies, refinancing net savings, buffer warning, decimal validation, and non-lender disclaimer.
7. Verify F15 three projections, step-up milestones, missing-input behavior, decimal formatting, disclosure, and absence of trading/broker execution language.
8. Check browser console/network/telemetry redaction, keyboard/focus semantics, table accessibility, and responsive overflow.

## Safe continuation checklist

Use this order for the next worker/coordinator:

- [ ] Preserve all current uncommitted changes; do not reset, clean, or regenerate unrelated files.
- [ ] Confirm the backend active dispatch and obtain its completion/result before declaring backend work done.
- [ ] Start a supported container runtime and rerun `cd backend && pnpm test -- --run`; record exact totals and any remaining failures.
- [ ] Run `cd backend && pnpm openapi:check`; if it changes generated artifacts, review the diff rather than discarding it.
- [ ] Apply the Drizzle migration to an isolated test database and run authenticated API smoke checks for F12–F15.
- [ ] Run the browser/release checklist above at all required viewport sizes.
- [ ] Update `docs/frontend_nextjs/RELEASE2_ACCEPTANCE.md` only with evidence-backed checkbox changes, if explicitly requested by the coordinator.
- [ ] Re-run frontend typecheck/lint/tests/build and SDK check-types/build after any approved fix.
- [ ] Review `git diff` and `git status --short`; ensure this progress file is the only new documentation artifact from this task.
- [ ] Do not stage or commit: hand off the working tree for coordinator review and release decision.

## No-stage / no-commit note

This task intentionally created only `RELEASE2_PROGRESS_README.md`. No files were staged, no commit was created, no code was modified by this worker, and no existing documentation was overwritten.
