# Release 2 Acceptance Checklist & Verification Matrix

**Release Phase**: Release 2 — Decision Tools (Modules F12, F13, F14, F15)
**Document Status**: Active Implementation & Acceptance Gate
**Associated Specifications**:
- [Master PRD](NEXTJS_PRODUCT_UI_PRD.md) (§4.2, §9, §16.3, §16.4)
- [F12 — History and drift](modules/F12_plan_history_drift.md)
- [F13 — Saved scenarios](modules/F13_scenarios.md)
- [F14 — Loan analysis](modules/F14_loans.md)
- [F15 — Investments](modules/F15_investments.md)
- [Modules Index](modules/README.md)

---

## 1. Executive Summary & Release Scope

Release 2 transitions the Financial Dream Planner from core planning and manual tracking (Release 1) into sophisticated, deterministic household decision-making tools. Release 2 introduces four interconnected modules:
1. **F12: Plan History & Meaningful Drift Review**: Historical version inspection, material input drift detection, side-by-side snapshot review, and explicit version restoration / drift acceptance.
2. **F13: Saved Scenarios**: Bounded "what-if" decision simulation, multi-scenario trade-off comparison matrix (2–4 scenarios), and explicit, traceable application to new plan versions.
3. **F14: Loan Analysis**: Repayment timeline modeling, mathematical amortization schedules, prepayment strategy evaluation (`reduce_tenure` vs `reduce_emi`), refinancing net-savings calculator, and liquidity buffer impact warnings under a prominent non-lender analytical disclaimer.
4. **F15: Investment Projections**: Long-term compounding forecasts across conservative, expected, and optimistic scenarios, annual contribution step-up simulation, and milestone tables with explicit labeling of missing/estimated inputs and strictly **no** trading or brokerage execution.

This document establishes the binding acceptance criteria, verification commands, and multi-viewport browser testing checklists required for Release 2 sign-off.

---

## 2. Core Architectural Invariants

Every worker contributing to Release 2 must enforce the following non-negotiable architectural rules:

1. **Immutable Baseline Preservation**:
   - Exploring historical plan versions, reviewing drift, simulating "what-if" scenarios, running loan prepayments, or viewing investment compounding curves **MUST NEVER** alter the active plan baseline (`plans.currentVersionId`) or modify saved planning inputs (`household_planning.inputs`).
   - Read and simulation endpoints are strictly idempotent and side-effect free.
2. **Explicit Confirmation for Financial Mutations**:
   - Applying a scenario overlay (`POST /api/v1/scenarios/{id}/apply`), accepting drift findings (`POST /api/v1/drift/{id}/accept`), or restoring an earlier plan version **MUST** require an explicit confirmation modal displaying side-by-side delta summaries.
   - Confirmation creates a **new** plan version with incremented `versionNumber` and traceable provenance (`triggerReason`), preserving historical versions intact.
3. **Backend Calculation Authority**:
   - All financial algorithms (amortization schedules, EMI calculations, compound interest projections, scenario evaluations, drift comparator deltas) belong strictly in the backend financial engine (`backend/src/modules/financial-engine`).
   - The frontend, SDK, and Next.js proxy must perform zero financial math.
4. **Strict Decimal-String Boundaries**:
   - All monetary amounts, interest rates, and percentages are transferred and validated as decimal strings (e.g. `"5000000.00"`, `"8.50"`).
   - The frontend must never parse currency values into floating-point numbers for mathematical operations. Formatting uses tabular numerals (`tabular-nums`) with Indian numbering conventions (`en-IN`: Lakhs and Crores).
5. **Navigation Release Gating**:
   - In `DEFAULT_PLANNER_NAV` and dashboard shortcut cards, links to Release 2 routes (`/dashboard/plan/history`, `/dashboard/scenarios`, `/dashboard/loans`, `/dashboard/investments`) must remain hidden until real backend endpoints are integrated and verified.
   - Under no circumstances may mock or fixture-only screens be exposed in production navigation.
6. **Telemetry & Privacy Redaction**:
   - Sensitive financial figures (salaries, incomes, expenses, account balances, loan principals, EMIs, investment portfolios, exact net worth) **MUST NEVER** be emitted in client analytics payloads, URL search parameters, or browser console logs.
   - Only structural metadata (event names, counts, scenario types, status strings) may be recorded.

---

## 3. End-to-End Traceability Matrix

| Module | PRD Section | Route(s) | Primary API Contracts | Core Verification Suite |
| :--- | :--- | :--- | :--- | :--- |
| **F12 History & Drift** | §4.2, §9, §16.3 | `/dashboard/plan/history`<br>`/dashboard/plan/review/[id]` | `GET /api/v1/plans/history`<br>`GET /api/v1/plans/versions/{id}`<br>`POST /api/v1/plans/restore`<br>`GET /api/v1/drift/current`<br>`POST /api/v1/drift/checks`<br>`POST /api/v1/drift/{id}/accept`<br>`POST /api/v1/drift/{id}/keep` | Backend unit & integration tests<br>Frontend Vitest `history.test.tsx`<br>OpenAPI check<br>Browser 360–1440px audit |
| **F13 Scenarios** | §4.2, §9, §16.3 | `/dashboard/scenarios`<br>`/dashboard/scenarios/new`<br>`/dashboard/scenarios/[id]` | `POST /api/v1/scenarios`<br>`GET /api/v1/scenarios`<br>`GET /api/v1/scenarios/{id}`<br>`POST /api/v1/scenarios/{id}/run`<br>`POST /api/v1/scenarios/compare`<br>`POST /api/v1/scenarios/{id}/apply` | Backend scenarios integration tests<br>Frontend Vitest `scenarios.test.tsx`<br>409 Conflict recovery test<br>Browser 360–1440px audit |
| **F14 Loans** | §4.2, §9 | `/dashboard/loans`<br>`/dashboard/loans/[id]` | `POST /api/v1/financial-engine/loan`<br>`GET /api/v1/households/planning` | Financial engine unit tests<br>Frontend Vitest `loans.test.tsx`<br>WCAG Table audit<br>Browser 360–1440px audit |
| **F15 Investments** | §4.2, §9 | `/dashboard/investments` | `POST /api/v1/financial-engine/investment-projection`<br>`GET /api/v1/households/planning` | Investment engine unit tests<br>Frontend Vitest `investments.test.tsx`<br>Missing-input state test<br>Browser 360–1440px audit |

---

## 4. Backend Acceptance Checklist & Verification Commands

### 4.1 Functional Acceptance Checklist
- [ ] **F12 Plan History & Drift**:
  - `GET /api/v1/plans/history` returns paginated version records joined with financial snapshots, ordered by `createdAt` descending, with opaque cursor support and drift summaries against current baseline.
  - `GET /api/v1/plans/versions/{id}` returns version detail, snapshot, `isCurrent` boolean, and deep drift comparison.
  - `POST /api/v1/plans/restore` restores target version snapshot inputs with revision checking, creating a new plan version.
  - `GET /api/v1/drift/current` returns active material drift event or null.
  - `POST /api/v1/drift/checks` executes deterministic drift evaluation against specified baseline.
  - `POST /api/v1/drift/{id}/accept` creates a new plan version (`versionNumber = max + 1`), sets `triggerReason: "drift_accepted"`, and updates `plans.currentVersionId`.
  - `POST /api/v1/drift/{id}/keep` marks drift event as `kept` without mutating plan versions or baseline.
  - Stale baseline during accept/keep returns HTTP 409 `STALE_BASELINE`.
- [ ] **F13 Scenarios Engine**:
  - `POST /api/v1/scenarios` creates draft scenario with validated domain overlay.
  - `GET /api/v1/scenarios` lists household scenarios.
  - `POST /api/v1/scenarios/{id}/run` returns calculation deltas without persisting plan mutations.
  - `POST /api/v1/scenarios/compare` accepts 2–4 scenario IDs and outputs comparative matrix against shared baseline. Rejects mixed baselines with HTTP 400.
  - `POST /api/v1/scenarios/{id}/apply` creates a new plan version (`triggerReason: "scenario_applied"`), updates scenario status to `applied`, and returns HTTP 409 `SCENARIO_BASELINE_STALE` if baseline is not current.
  - Idempotency enforced via `Idempotency-Key` header.
- [ ] **F14 Loan Engine**:
  - `POST /api/v1/financial-engine/loan` calculates mathematical amortization schedule, monthly EMI, total interest, and remaining balances.
  - Prepayment modeling computes `reduce_tenure` (reduced months, constant EMI) and `reduce_emi` (reduced EMI, constant months).
  - Refinancing comparison factors processing fees into net savings and sets `isBeneficial` flag.
  - Validation rejects tenure <= 0, annual rate < 0, and non-numeric inputs with HTTP 400 `INVALID_LOAN_TERMS`.
- [ ] **F15 Investment Projection Engine**:
  - `POST /api/v1/financial-engine/investment-projection` outputs deterministic milestone compound projections across `conservative`, `expected`, `optimistic`, and optional `custom` rates.
  - Annual step-up compounding compounds after each 12-month interval.
  - Rejects negative horizon, rates < 0, or step-up > 100% with HTTP 400.
- [ ] **Tenant Isolation & Auth**:
  - All endpoints enforce household-level authorization via session cookies.
  - Cross-household access returns HTTP 404 or 403.
- [ ] **Logging Hygiene**:
  - Zero financial values, account numbers, or user inputs recorded in backend application logs.

### 4.2 Backend Verification Commands
Execute these commands from `backend/`:

```bash
# 1. Typecheck
pnpm check-types

# 2. Linting
pnpm lint

# 3. Unit Tests (All engine and service tests)
pnpm test:unit

# 4. PostgreSQL Integration Tests
pnpm test:integration

# 5. OpenAPI Schema Drift Verification
pnpm openapi:check
```

**Passing Criteria**: All commands exit with code 0. Zero test failures.

---

## 5. SDK Contract Verification Checklist

### 5.1 Contract Acceptance Checklist
- [ ] **Schema Parity**: `docs/api/openapi.json` exactly matches route registrations in `backend/src/openapi.ts`.
- [ ] **Generated Types**: `sdk/src/generated/schema.d.ts` is regenerated directly from `docs/api/openapi.json` without hand-edits.
- [ ] **Type Precision**:
  - All financial amounts typed as `string`.
  - All error schemas typed with `code` and `message`.
  - Scenarios and drift operations include complete request/response contracts.
- [ ] **Zero Hand-Edits**:
  - Automated check confirms `git diff` on `sdk/src/generated/schema.d.ts` only contains generator changes.

### 5.2 SDK Verification Commands
Execute these commands from `sdk/`:

```bash
# 1. SDK Typecheck
pnpm check-types

# 2. SDK Build
pnpm build
```

**Passing Criteria**: `tsc --noEmit` and `tsc -p tsconfig.json` exit with code 0.

---

## 6. Frontend Acceptance Checklist & Verification Commands

### 6.1 Route & Feature Acceptance Checklist
- [ ] **App Router Routes**:
  - `/dashboard/plan/history`: Renders paginated version history.
  - `/dashboard/plan/review/[id]`: Renders side-by-side baseline vs historical/drift snapshot.
  - `/dashboard/scenarios`: Renders scenario list and comparison trigger.
  - `/dashboard/scenarios/new`: Renders scenario builder and real-time simulator.
  - `/dashboard/scenarios/[id]`: Renders scenario detail, deltas, and "Apply to Plan" confirmation modal.
  - `/dashboard/loans`: Renders active loans summary, total debt, and DTI metric.
  - `/dashboard/loans/[id]`: Renders repayment schedule, prepayment analyzer, refinancing comparator, and amortization schedule.
  - `/dashboard/investments`: Renders wealth growth curves, scenario toggles, step-up simulator, and milestone table.
- [ ] **Navigation Gating**:
  - Navigation links in `app-shell.tsx` remain hidden or disabled until routes are confirmed functional.
- [ ] **Screen States Implemented on Every Route**:
  1. `Loading`: Accessible skeleton card shimmers.
  2. `Populated`: Real backend data rendered with Indian currency formatting (`₹`) and tabular figures.
  3. `Empty with next action`: Contextual copy and clear CTA link when no records exist.
  4. `Partial error with retry`: Inline error banner with retry trigger without screen blanking.
  5. `Stale / refetch`: Soft background refresh indicator (`aria-busy="true"`) retaining rendered data.
  6. `Offline read state`: Cached data visible with offline badge; mutation buttons disabled.
  7. `Form states`: Real-time decimal validation, saving indicator, failed save preserving user edits, and 409 conflict recovery.
- [ ] **Explicit Confirmation Modals**:
  - "Apply Scenario to Plan": Displays complete diff preview, requires explicit confirm click, passes `Idempotency-Key`.
  - "Accept Drift & Update Plan": Displays itemized findings, requires explicit confirm click.
  - "Keep Baseline": Dismisses drift without baseline modification.
- [ ] **Conflict Recovery UI**:
  - HTTP 409 `SCENARIO_BASELINE_STALE` renders an actionable dialog allowing user to rebase scenario or cancel.
- [ ] **Analytical Disclaimers**:
  - Loans: Mandatory non-lender disclaimer visibly displayed at top of screen.
  - Investments: Explicit notice that return rates are projections, not guarantees.
  - No trading language, stock tickers, or broker buttons anywhere in investment views.

### 6.2 Frontend Verification Commands
Execute these commands from `frontend/`:

```bash
# 1. Frontend Typecheck
pnpm exec tsc --noEmit

# 2. Frontend Linting
pnpm lint

# 3. Frontend Unit and Component Tests
pnpm test

# 4. Production Standalone Build
pnpm build
```

**Passing Criteria**: All commands exit with code 0. Zero TypeScript errors. Build generates static and dynamic pages with Next.js Proxy middleware registered.

---

## 7. Browser Acceptance Checklist (Empirical Multi-Viewport Verification)

Release 2 requires empirical verification across four standard device viewport widths:
1. **360px** (Mobile phone: compact portrait)
2. **768px** (Tablet: iPad Mini portrait)
3. **1024px** (Small desktop / Tablet landscape)
4. **1440px** (Full planning workspace desktop)

### 7.1 Viewport Responsiveness Matrix

| Route | 360px (Mobile) | 768px (Tablet) | 1024px (Small Desktop) | 1440px (Wide Desktop) |
| :--- | :--- | :--- | :--- | :--- |
| `/dashboard/plan/history` | Stacked version cards; delta badges; zero horizontal scroll | Stacked cards with key metrics | 2-column drawer layout | 2-column: Left 35% timeline, right 65% preview |
| `/dashboard/plan/review/[id]` | Tabbed toggle ("Baseline" vs "Compare"); stacked definition list | Stacked cards; delta pills | Side-by-side comparison table | Side-by-side diff table with sticky row headers |
| `/dashboard/scenarios` | Single-column scenario cards; swipeable comparison | 2-column scenario cards | 2-column grid; drawer nav | 3-column scenario catalog with comparison bar |
| `/dashboard/scenarios/compare` | Swipable tabs (Baseline / Scen 1 / Scen 2); compact diff pills | 2-column comparison cards with segmented control | Multi-column grid | Full multi-column matrix (Baseline + up to 3 scenarios) |
| `/dashboard/loans` | Single-column loan cards; summary metrics stacked | 2-column loan cards; DTI gauge | 2-column overview with drawer | Multi-column loan cards with DTI health indicator |
| `/dashboard/loans/[id]` | Sliders full width; amortization table in horizontal container or yearly cards | Annual amortization summary with row expanders | Side-by-side controls and amortization preview | 2-column: 38% controls, 62% charts and data table |
| `/dashboard/investments` | Interactive chart with text summary; card-based milestones | Full-width chart; 5-year milestone increments | Full-width chart; slider sidebar | 2-column: 35% inputs/step-up, 65% chart and table |

### 7.2 Accessibility & Usability Criteria (WCAG 2.1 AA)
- [ ] **Zero Page Overflow**: `document.documentElement.scrollWidth <= window.innerWidth` across all routes at 360px, 768px, 1024px, and 1440px.
- [ ] **Touch Target Sizing**: All buttons, links, toggles, and form controls have a minimum touch target bounding box of **44x44px**.
- [ ] **Keyboard Navigation**:
  - Logical tab order across all interactive elements.
  - Visible focus rings using primary purple (`#6C63D6`) outline with offset.
  - Modals trap focus; pressing `Escape` closes the modal and restores focus to the triggering element.
- [ ] **Screen Reader Semantics**:
  - Amortization and milestone tables use semantic markup (`<table>`, `<caption>`, `<th scope="col">`, `<th scope="row">`).
  - Projection and amortization charts are paired with accessible textual summaries (`aria-label` or accompanying text block).
  - Status changes and calculation updates use `aria-live="polite"`.
- [ ] **Color Independence**:
  - Positive (Sage) and negative/caution (Gold/Red) deltas are paired with explicit textual signs (`+` / `-`) or textual labels.
  - Investment curves use distinct dash patterns (solid, dashed, dotted) in addition to color.

---

## 8. Telemetry & Privacy Verification Checklist

- [ ] **Network Payload Inspection**:
  - Inspected outgoing analytics/telemetry requests during:
    - History viewing and drift review.
    - Scenario creation, simulation, comparison, and application.
    - Loan calculation and amortization schedule generation.
    - Investment compounding projection.
  - Verified: **ZERO** financial amounts, incomes, EMIs, balances, or net worth values are transmitted.
- [ ] **URL Inspection**:
  - Verified that financial values are never stored in query parameters (only non-sensitive filter keys like `cursor`, `limit`, `status`, `view`).
- [ ] **Console Hygiene**:
  - Browser developer tools console contains zero financial payloads or uncaught error traces during normal operations.

---

## 9. Release 2 Gatekeeper Sign-off Protocol

Before merging Release 2 into `main-2` or tagging Release 2 for deployment, all verification checks must be completed with empirical evidence:

```text
[ ] 1. Backend test suites pass (unit: 0 failures, integration: 0 failures).
[ ] 2. Backend OpenAPI schema drift check exits 0.
[ ] 3. SDK typecheck and build exit 0 with zero uncommitted hand-edits.
[ ] 4. Frontend typecheck, lint, and Vitest test suites pass (0 failures).
[ ] 5. Frontend Next.js standalone production build succeeds.
[ ] 6. Empirical browser test verified across 360px, 768px, 1024px, 1440px (zero horizontal overflow, touch targets >= 44px).
[ ] 7. Immutable baseline verified (zero unintended mutations during read/simulate).
[ ] 8. Explicit confirmation dialogs verified for drift acceptance and scenario application.
[ ] 9. Telemetry privacy verified (zero financial amounts leaked).
[ ] 10. Navigation gating verified (only fully functional routes exposed in nav).
```

Upon unanimous satisfaction of the above protocol, the Coordinator issues the Release 2 Sign-off.
