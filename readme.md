<p align="center">
  <img src="docs/readme/story/01-hero.svg" alt="Financial Dream Planner — see your financial life before you live it" width="100%" />
</p>

<h1 align="center">Financial Dream Planner</h1>

<p align="center">
  <strong>An India-first living financial plan: canonical money data, deterministic financial mathematics, what-if scenarios, plan drift, cited research, and guarded AI — working as one system.</strong>
</p>

<p align="center">
  <code>Express 5</code> · <code>TypeScript</code> · <code>PostgreSQL + Drizzle</code> · <code>Redis + BullMQ</code> · <code>LangGraph</code> · <code>OpenAPI SDK</code> · <code>Next.js</code> · <code>Expo/RN planned</code>
</p>

> [!IMPORTANT]
> **What is real today vs. what the storyboard shows:** backend delivery units **U1–U8 are accepted** in the repository (foundation, auth/tenancy, ledger, financial engine, plans/scenarios, AI/research, drift, privacy/storage). The current Next.js app is still a web/auth starter, and the Android-first Expo client is specified in detail under `docs/frontend_mobile/` but has not been added as source yet. The visual tour below is the intended product experience built on top of the implemented backend capabilities.

## Why this exists

Most finance apps answer **“what happened?”**. Financial Dream Planner is designed to keep answering three harder questions:

1. **Where do I stand now?** — canonical accounts/transactions, cash flow, debt, emergency runway, goals, and net worth.
2. **What happens if I change something?** — deterministic scenarios for EMIs, SIPs, goal dates, loans, and long-term wealth.
3. **What should I do next?** — one explainable next action, backed by deterministic calculations, bounded AI reasoning, current research when needed, and explicit user control over plan changes.

The backend owns financial truth. Clients collect and present information. The deterministic engine performs calculations. AI orchestrates and explains; it does **not** become the authoritative calculator.

---

# The product story

## 01 — Start with context, not spreadsheets

The product direction is deliberately conversational: start with goals and the minimum useful financial state, then progressively enrich the plan from accounts, observed transactions, documents, and targeted follow-up questions.

<p align="center">
  <img src="docs/readme/story/02-conversation.svg" alt="Conversational onboarding for Financial Dream Planner" width="100%" />
</p>

The planned mobile onboarding mirrors the backend's progressive model: create an account → choose goals → enter minimum financial information → generate the first snapshot → enrich it with observed data.

## 02 — Turn scattered money into canonical financial state

A financial plan is only useful if the underlying data is coherent. The repository models household-scoped accounts, canonical transactions, source provenance, categories, immutable snapshots, plans, and version history instead of stuffing the user's entire financial life into one AI prompt or a single JSON blob.

<p align="center">
  <img src="docs/readme/story/03-structured-state.svg" alt="Scattered financial data becoming a connected financial state" width="100%" />
</p>

### A distinctive India-first ingestion path: private SMS → canonical ledger

The Android product plan treats SMS ingestion as a first-class privacy boundary: scan and classify on-device, upload normalized financial observations rather than the raw personal inbox, then let the backend deduplicate and reconcile them into one canonical ledger.

<p align="center">
  <img src="docs/readme/story/11-sms-ledger.svg" alt="Private Android SMS ingestion into a canonical financial ledger" width="100%" />
</p>

Strong identifiers such as UTR/RRN/reference IDs win first; conservative fingerprint matching handles the fallback case. One transaction may later have multiple provenance sources, but the user should still see one real transaction.

## 03 — See today clearly

The planned Home experience is a **daily financial pulse**, not a giant analytics report: financial health, one next-best action, income/spend/surplus, meaningful drift, upcoming obligations, goal previews, and recent transactions.

<p align="center">
  <img src="docs/readme/story/04-daily-pulse.svg" alt="Financial Dream Planner daily financial pulse dashboard" width="100%" />
</p>

The financial health and core financial metrics are intended to be backend-calculated and deterministic. The client renders them; it does not independently reinvent financial math.

## 04 — Plan every goal against real constraints

Goals are not isolated progress bars. The planning model is meant to reason about target cost, inflation, existing funding, required contribution, flexibility, liabilities, and competing goals together.

<p align="center">
  <img src="docs/readme/story/05-goals.svg" alt="Financial goals planning across home, emergency fund, travel and retirement" width="100%" />
</p>

The deterministic engine already supports goal future cost/funding, required contribution and feasibility calculations alongside cash flow, emergency funds, loans and investment projections.

## 05 — Project the future with explicit assumptions

Long-term projections should be explainable and reproducible. Financial calculations use base-10 decimal inputs, typed output rounding, immutable published policy versions, and explicit completeness metadata when required inputs are missing.

<p align="center">
  <img src="docs/readme/story/06-projection.svg" alt="Projected net worth and financial milestone timeline" width="100%" />
</p>

The first published financial policy is `IN-2026.1`; projection assumptions are versioned so a historical plan never silently inherits a later policy.

## 06 — Ask “what if?” without touching the baseline

A scenario is an overlay on an immutable baseline. Running a scenario has no side effect; applying one is an explicit operation with stale-baseline protection and idempotent/concurrency-safe semantics.

<p align="center">
  <img src="docs/readme/story/07-scenarios.svg" alt="What-if financial scenario simulator" width="100%" />
</p>

The API supports creating scenario drafts, running them, comparing multiple scenarios, and explicitly applying one to create a new snapshot and plan version.

## 07 — Let the plan notice when real life drifts

This is one of the project's defining ideas. The backend compares **accepted planned state** with **observed financial state**, computes material impact, and surfaces a drift event — but detection alone can never rewrite the plan.

<p align="center">
  <img src="docs/readme/story/12-living-plan-drift.svg" alt="Living plan drift detection and explicit baseline acceptance" width="100%" />
</p>

Only an explicit **Accept** action can advance the baseline. **Keep** preserves the existing plan, and competing stale events cannot overwrite newer plan history.

## 08 — Understand the trade-offs, not just the answer

A useful planner should expose the consequence chain: monthly flexibility, emergency runway, debt burden, goal timing, long-term corpus, and the assumptions behind those changes.

<p align="center">
  <img src="docs/readme/story/08-tradeoffs.svg" alt="Financial scenario trade-off analysis and recommendation" width="100%" />
</p>

## 09 — Compare futures side by side

The scenario API can compare multiple scenarios against the same baseline, preserving caller order and rejecting mixed baselines. That supports a UI where the decision is not “AI says yes/no,” but **Current vs. Option A vs. Option B vs. a better-balanced path**.

<p align="center">
  <img src="docs/readme/story/09-compare-futures.svg" alt="Side-by-side comparison of financial futures" width="100%" />
</p>

## 10 — Use AI as a guarded copilot

The AI layer is intentionally bounded. The planner uses a LangGraph workflow, a closed typed tool registry, deterministic finance tools, cited research, a deterministic risk validator, and a critic that validates citations/freshness before a guarded answer is returned.

<p align="center">
  <img src="docs/readme/story/13-ai-guardrails.svg" alt="Guarded AI planner using deterministic finance tools and cited research" width="100%" />
</p>

The primary OpenAI-compatible provider can fall back to Gemini only for bounded transient/structured-output failures and only before user-visible output has begun. Prompt injection or policy failures fail closed rather than triggering provider switching.

## 11 — One system, not an AI wrapper

<p align="center">
  <img src="docs/readme/story/10-architecture.svg" alt="Financial Dream Planner product architecture" width="100%" />
</p>

The production architecture is a **standalone modular monolith**: versioned REST + resumable SSE, PostgreSQL as the durable source of truth, deterministic domain logic, BullMQ workers for asynchronous work, vendor-neutral storage, and separate client applications.

---

# What is implemented today?

| Area | Status | What exists in the repository |
| --- | :---: | --- |
| Foundation | ✅ Accepted | Build/runtime primitives, durable jobs + resumable SSE, OpenAPI contract, generated TypeScript SDK, local services |
| Auth & tenancy | ✅ Accepted | Email/password flows, Google/OIDC broker path, device/browser session model, household provisioning, security gates |
| Canonical ledger | ✅ Accepted | Accounts, categories, manual transactions, normalized SMS batch sync, exact/fallback dedupe, provenance, cash-flow snapshot |
| Deterministic financial engine | ✅ Accepted | Cash flow, emergency fund, loan/amortization/prepayment/refinancing, SIP/lump-sum projection, goal funding, net worth, scenarios |
| Plans & scenarios | ✅ Accepted | Immutable snapshots/version history, recalculate/current/history, draft/run/compare/apply with concurrency protection |
| AI & research | ✅ Accepted | LangGraph planner, OpenAI-compatible primary + Gemini fallback, closed tools, cited research, SSRF defenses, risk + critic validators |
| Living-plan drift | ✅ Accepted | Durable material-change checks, immutable findings, impact evaluation, explicit keep/accept flow, stale-baseline protection |
| Privacy & storage | ✅ Accepted | R2-compatible object storage, documents, consent lifecycle, durable export, two-step household deletion, retention cleanup |
| Closed-beta operations | 🗓 Planned | Deployment/release gates, health/metrics/alerts, backup/restore rehearsal, beta E2E hardening |
| Next.js product UI | 🚧 Starter | Auth/web starter exists; the full storyboard UI above is the product direction, not yet the current web implementation |
| Android app | 📐 Specified | Android-first Expo/React Native feature pack exists under `docs/frontend_mobile/`; `mobile/` source has not been added yet |

> A development unit marked **Accepted** means its deterministic local and Docker-backed acceptance gates passed. Environment-specific staging/CI checks remain release gates and should not be confused with a production launch.

---

# Core backend capabilities

### Canonical money model

- Household-scoped financial state
- Accounts and categories
- Canonical transaction ledger with source provenance
- Manual transaction creation + normalized SMS ingestion
- Exact-reference deduplication plus conservative fallback fingerprinting
- Cash-flow snapshot with explicit no-data vs. net-zero semantics
- Revision/ETag concurrency and idempotency on side-effectful APIs

### Deterministic financial engine

- Cash flow, savings rate and investable capacity
- Emergency reserve target, runway, shortfall and completion estimate
- EMI, amortization, total interest, prepayment and refinancing comparisons
- SIP, step-up SIP, lump-sum and return-scenario projections
- Goal inflation, future cost, funding gap, required contribution and feasibility
- Exact assets/liabilities/net worth and allocation
- Scenario overlays and drift-impact calculation
- Immutable policy/assumption versioning

### Living plans

- Immutable financial snapshots
- Versioned baseline plans — history is appended, not overwritten
- Side-effect-free scenario runs
- Multi-scenario comparison
- Explicit scenario application
- Deterministic plan-drift checks
- User-controlled baseline acceptance

### AI + current research

- LangGraph orchestration with explicit state boundaries
- OpenAI-compatible primary adapter + Gemini fallback router
- Closed Zod-validated finance/research tool registry
- Research source ranking: regulators → official filings/providers → structured APIs → reputable publications → community
- SSRF-defended research fetcher
- Risk validator that blocks individual-security buy/sell advice, guaranteed-return language and autonomous trading promises
- Critic layer validating evidence ownership, citation identity and freshness
- 90-day conversation/research retention and 30-day evidence freshness boundaries

### Privacy and reliability

- Browser cookie + CSRF model and native bearer-token model
- Rotating session/refresh-token families and revocation
- Tenant-scoped documents and short-lived download grants
- Versioned consent history
- Durable privacy exports
- Two-step household deletion
- Transactional outbox + BullMQ job model
- PostgreSQL remains authoritative even when Redis is unavailable
- Hidden chain-of-thought, raw provider traces and system prompts are not persisted

---

# Repository map

```text
financial_dream_planner/
├── backend/                  # Express 5 + TypeScript backend and BullMQ worker
│   ├── src/modules/
│   │   ├── auth/
│   │   ├── accounts/
│   │   ├── categories/
│   │   ├── transactions/
│   │   ├── financial-engine/
│   │   ├── plans/
│   │   ├── scenarios/
│   │   ├── planner/
│   │   ├── research/
│   │   ├── drift/
│   │   ├── privacy/
│   │   ├── documents/
│   │   ├── storage/
│   │   └── jobs/
│   └── tests/                # unit + integration + API tests
├── frontend/                 # Next.js 16 / React 19 web starter + auth UI
├── sdk/                      # generated TypeScript client/types from OpenAPI
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── product/
│   ├── implementation/
│   ├── operations/
│   ├── frontend_mobile/      # Android-first Expo feature specifications
│   └── readme/story/         # this README's visual storyboard assets
├── postman/                  # starter API collection/environment
└── docker-compose.yml        # PostgreSQL + Redis + app/worker local topology
```

---

# Technology

| Layer | Current / planned technology |
| --- | --- |
| Backend | Node.js 20+, TypeScript, Express 5, Zod |
| Financial math | Pure TypeScript + `decimal.js`, immutable policy versions |
| Database | PostgreSQL + Drizzle |
| Async | Redis + BullMQ + transactional outbox |
| AI orchestration | LangGraph JS |
| LLM routing | OpenAI-compatible primary adapter + Gemini fallback |
| Research | Tavily provider abstraction + SSRF-safe fetch + source ranking |
| Files | Vendor-neutral object storage + R2-compatible S3 adapter |
| API contract | REST `/api/v1`, OpenAPI, generated TypeScript SDK, resumable SSE |
| Current web | Next.js 16, React 19, TanStack Query, React Hook Form, Zod, Tailwind 4, shadcn/Base UI |
| Planned mobile | Expo, React Native, Expo Router, TanStack Query, SQLite, SecureStore, Reanimated, FlashList, Victory Native, selective Skia |
| Testing | Vitest, Supertest, Testcontainers/PostgreSQL, golden/property/integration/API tests |
| Local deployment | Docker Compose; API + worker share the same built image |

---

# API surface

Public endpoints live under `/api/v1`. Money/rates are decimal strings, resource IDs are UUIDs, mutable resources use revision/ETag semantics, and long-running work exposes resumable SSE events.

Implemented API groups include:

```text
/auth
/accounts
/categories
/transactions
/financial-engine
/plans
/scenarios
/drift
/planner
/research
/documents
/privacy
/runs
```

Useful references:

- [`docs/api/README.md`](docs/api/README.md) — readable API contract and conventions
- [`docs/api/openapi.json`](docs/api/openapi.json) — checked-in generated OpenAPI contract
- [`sdk/src/generated/schema.d.ts`](sdk/src/generated/schema.d.ts) — generated TypeScript API types

Regenerate the contract and SDK types after API schema changes:

```bash
cd backend
pnpm openapi:generate
```

Verify they are checked in and current:

```bash
pnpm openapi:check
```

---

# Run locally

## Prerequisites

- Node.js 20+
- pnpm 11
- Docker Desktop / Docker Engine

Each application is independently packaged. Run commands from that package's directory.

### 1. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

### 2. Start the API

```bash
cd backend
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

API: `http://localhost:4000`  
Health: `GET http://localhost:4000/health`

### 3. Start the worker

```bash
cd backend
pnpm tsx src/worker.ts
```

### 4. Start the current Next.js web client

```bash
cd frontend
cp .env.example .env.local
pnpm install
pnpm dev
```

Web: `http://localhost:3000`

The frontend defaults to `http://localhost:4000/api/v1` through `NEXT_PUBLIC_API_URL`.

---

# Verify the repository

Backend:

```bash
cd backend
pnpm check-types
pnpm lint
pnpm test
pnpm build
pnpm openapi:check
```

Frontend:

```bash
cd frontend
pnpm lint
pnpm build
```

SDK:

```bash
cd sdk
pnpm install
pnpm check-types
pnpm build
```

The backend suite includes focused unit, API and Docker-backed integration coverage for financial calculations, auth/session security, ledger replay/deduplication, plan/scenario concurrency, AI tool boundaries, prompt injection, cited research, drift, retention, storage and privacy workflows.

---

# Documentation map

Start at [`docs/README.md`](docs/README.md), then go deeper depending on the question:

- **System boundaries:** [`docs/architecture/system.md`](docs/architecture/system.md)
- **Financial mathematics:** [`docs/architecture/financial-engine.md`](docs/architecture/financial-engine.md)
- **AI + cited research:** [`docs/architecture/ai-research.md`](docs/architecture/ai-research.md)
- **Living-plan drift:** [`docs/architecture/drift.md`](docs/architecture/drift.md)
- **Authentication:** [`docs/architecture/authentication.md`](docs/architecture/authentication.md)
- **Data model:** [`docs/architecture/data-model.md`](docs/architecture/data-model.md)
- **API contract:** [`docs/api/README.md`](docs/api/README.md)
- **Backend PRD:** [`docs/product/backend-prd.md`](docs/product/backend-prd.md)
- **Implementation status:** [`docs/implementation/roadmap.md`](docs/implementation/roadmap.md)
- **Android-first mobile design:** [`docs/frontend_mobile/README.md`](docs/frontend_mobile/README.md)
- **Operations:** [`docs/operations/runbook.md`](docs/operations/runbook.md)

> Some older backend planning documents still use the working title **Living Financial Plan**. The product/repository brand used by this README is **Financial Dream Planner**.

---

## Product principle

> **Financial truth is deterministic and versioned. AI helps the user understand and navigate that truth; it does not silently replace it.**

Financial Dream Planner is planning software under active development. Visual examples contain illustrative financial values, and real projections depend on user inputs and explicit assumptions.
