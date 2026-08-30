# Feature Delivery Roadmap

Status values: `in progress`, `planned`, `accepted`. A unit begins only after its dependencies are accepted.

| Unit | Status | Depends on | Deliverable | Acceptance gate |
|---|---|---|---|---|
| U1 Foundation | accepted | — | Docs, contracts, exact primitives, builds, durable jobs/SSE, OpenAPI/SDK, local services | API/worker build; focused tests pass; event resume and outbox replay are durable |
| U2 Auth and tenancy | in progress | U1 | Hardened starter, OIDC broker, device sessions, household provisioning | Local security/unit gates pass; Docker-backed migration/race/provider staging checks remain |
| U3 Ledger vertical | planned | U2 | Accounts, categories, SMS sync, dedupe, provenance, cash-flow snapshot | Concurrent replay creates no duplicates; ambiguous matches survive review |
| U4 Financial engine | planned | U3 | Financial domains, versioned policy, deterministic calculators | Golden/property tests are exact and reproducible |
| U5 Plans/scenarios | planned | U4 | Immutable snapshots/plans, scenario compare/apply | Concurrent apply cannot overwrite a baseline |
| U6 AI/research | planned | U5 | Provider abstraction, agents, citations, history | Tool/prompt/SSRF/fallback/retention tests pass |
| U7 Drift | planned | U5, U6 | Material-change detection and explicit actions | Jobs dedupe; only accepted drift can create a baseline |
| U8 Privacy/storage | planned | U2, U3 | R2 documents, consent, export, deletion | Tenant isolation and outage/retry/deletion tests pass |
| U9 Closed-beta ops | planned | U1–U8 | Deploy, health, metrics, alerts, backup/restore, release gates | E2E beta flow and restore rehearsal pass |

Each unit updates its architecture/API documentation, checked-in migrations, OpenAPI, SDK, and focused tests in the same change. Enable beta features only after their acceptance gate passes.
