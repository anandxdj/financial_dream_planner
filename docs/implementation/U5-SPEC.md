# U5 Plans and Scenarios Specification

Date: 2026-08-30
Branch: `feat/financial-engine`
Status: accepted

## Scope

U5 persists immutable financial snapshots and plan versions, and adds household-scoped scenario draft, run, compare, and apply workflows. It reuses the U4 deterministic financial engine; persistence services must not duplicate financial formulas.

The unit delivers:

- immutable financial snapshots containing explicit inputs, resolved assumptions, completeness, engine/policy versions, and deterministic hashes;
- one household plan with immutable, monotonically increasing versions and an atomic current-version pointer;
- explicit plan recalculation from caller-supplied financial inputs;
- stored scenario drafts tied to the exact baseline plan version from which they were created;
- deterministic scenario runs and comparisons that do not mutate the baseline;
- explicit scenario apply that creates a new snapshot and plan version exactly once;
- authenticated, tenant-scoped REST APIs, OpenAPI/SDK contracts, migrations, and focused tests.

Normalized source domains remain future units where they do not already exist. U5 therefore accepts the U4 `ScenarioDomainInputs` shape as the complete, explicit planning input envelope and stores that envelope in immutable snapshots. No missing value is inferred as zero.

## Persistence model

### Financial snapshot

A snapshot is append-only and household scoped. It records:

- UUID, household ID, explicit `asOf` timestamp, and creation timestamp;
- household data revision supplied by the caller as a non-negative integer;
- engine version and immutable policy version;
- exact input envelope, resolved assumptions, and completeness result;
- canonical SHA-256 input and output hashes;
- deterministic calculated output.

Application code exposes no update or delete path for snapshots. Canonical hashing recursively sorts object keys and preserves array order; equivalent JSON object key order must produce the same hash.

### Plan and plan version

There is at most one plan per household. A plan stores status and the current version ID. Plan versions are append-only and use a unique `(plan_id, version_number)` sequence. Each version references one immutable snapshot and stores the scenario evaluation output plus its assumptions. Historical versions are never updated or overwritten.

Plan recalculation locks the household plan, creates a new snapshot and next version, and advances the current pointer in one transaction. A failed transaction leaves no partial snapshot or version.

### Scenario

A scenario is household scoped and references an immutable baseline plan version. It stores a name, optional description, strict partial scenario overlays, status (`draft` or `applied`), timestamps, and optional applied plan version. Scenario records may not be moved to a different baseline. Applying a scenario is idempotent: after success, repeated apply returns the same applied version without creating another version.

## Workflow contract

- `POST /api/v1/plans/recalculate` evaluates explicit baseline inputs with the U4 scenario evaluator, then atomically appends a snapshot and plan version.
- `GET /api/v1/plans/current` returns the current immutable version and snapshot; absence returns 404.
- `GET /api/v1/plans/history` returns the household's versions newest first with stable pagination.
- `POST /api/v1/scenarios` requires an existing current plan and captures its version ID as the baseline.
- `GET /api/v1/scenarios` lists only the authenticated household's scenarios.
- `POST /api/v1/scenarios/:id/run` evaluates the stored baseline inputs plus the stored overlay without persistence side effects.
- `POST /api/v1/scenarios/compare` accepts two to ten scenario IDs, rejects mixed baselines, and returns deterministic run results in caller order.
- `POST /api/v1/scenarios/:id/apply` is the only scenario operation that may change the current plan.

## Concurrency and apply semantics

Apply runs in a database transaction and locks both the scenario and household plan. It verifies that:

1. the scenario belongs to the authenticated household;
2. its baseline version is still the plan's current version;
3. it has not already been applied.

If the baseline is stale, return HTTP 409 with code `SCENARIO_BASELINE_STALE`; create no snapshot or plan version and do not change the plan pointer. Concurrent applications against the same baseline cannot both overwrite it: one may append and advance the plan, while every different scenario still targeting the old baseline conflicts. Concurrent retries of the same scenario return its one applied version.

## API and validation contract

All endpoints require the existing authentication middleware and derive household ID exclusively from `AuthContext`; request bodies never accept a household ID. UUID path parameters, pagination, names, descriptions, inputs, and overlays are strict Zod schemas. Unknown fields are rejected.

Responses serialize timestamps as ISO-8601 strings and preserve decimal strings from U4. Database JSON is parsed through response schemas before returning. Missing resources outside the household return 404 rather than revealing cross-tenant existence.

## Acceptance gates

- PostgreSQL migrations define foreign keys, append-only data shape, unique plan/version constraints, scenario baseline/applied references, and useful household indexes.
- Integration tests prove immutable history, canonical hashes, tenant isolation, run-without-mutation, compare ordering/baseline validation, idempotent retry, stale-baseline conflict, and concurrent apply behavior.
- API tests prove authentication and strict request/response contracts.
- Existing U1-U4 behavior remains green.
- Backend typecheck, lint, build, full tests, OpenAPI generation/check, SDK typecheck/build, and `git diff --check` pass.

## Out of scope

- AI-authored recommendations and research (U6);
- drift detection and acceptance (U7);
- document storage, export, and deletion (U8);
- implicit reads of the clock for calculation horizons or mutable policy defaults;
- editing or deleting historical snapshots and plan versions.

## Completion evidence

- Antigravity bulk implementation: Gemini `gemini-3.7-flash-high`, conversation `2a6506c8-fcd1-403c-a29e-da839cb9ae29`, explicitly authorized by the user for private-repository access and edits; no branch switch, commit, push, or lockfile edit.
- Conductor review corrected scenario-apply snapshot semantics so `asOf` and household data revision remain those of the baseline, added persisted status/application-state constraints, and made duplicate comparison validation preserve tenant non-disclosure.
- Final conductor-controlled backend result: typecheck, lint, and production build pass; 24 test files and 137 tests pass with no skips or failures while Docker-backed PostgreSQL API/integration tests run.
- Drizzle migrations and metadata were regenerated from schema. OpenAPI and SDK contracts were regenerated; SDK typecheck/build and `git diff --check` pass.
