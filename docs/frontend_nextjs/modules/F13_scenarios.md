# F13 — Saved scenarios

## Release phase

Release 2 (Decision Tools).

## Dependencies

- **[F00 Foundation](F00_foundation.md)**: Design tokens, responsive grid system, accessible color contrasts, typography (`DM Serif Display` + `Manrope`), tabular numbers.
- **[F06 App shell](F06_app_shell.md)**: Sidebar navigation (248px desktop / drawer below 1024px), header, breadcrumbs.
- **[F07 Overview](F07_overview.md)**: Primary recommendation cards, surplus indicators, scenario impact previews.
- **[F10 Goals](F10_goals.md)**: Target amounts, timelines, and feasibility constraints under scenario adjustments.
- **[F11 Plan](F11_plan.md)**: Active baseline version snapshot, assumptions, and version increments.
- **[F12 History and drift](F12_plan_history_drift.md)**: Plan version lineage, snapshot diffing, and baseline restoration rules.

## Routes & Navigation Gating

- **Routes**:
  - `/dashboard/scenarios`: List of saved scenarios for the household, status filters, and multi-scenario comparison entry.
  - `/dashboard/scenarios/new`: Interactive scenario builder to create and simulate a bounded "what-if" decision overlay.
  - `/dashboard/scenarios/[id]`: Detailed view of a specific scenario, simulation outputs, diff against baseline, and the explicit "Apply to Plan" workflow.
- **Navigation Gating**:
  - The "Scenarios" navigation item in `DEFAULT_PLANNER_NAV` and dashboard shortcut links must remain hidden until real backend scenario endpoints are integrated and verified.
  - No fixture or mock data may be surfaced in production navigation.

## Screens and Behavior

### 1. Scenario Catalog (`/dashboard/scenarios`)
- Grid or list of household scenarios showing:
  - Scenario Name and optional description (e.g. "Career switch to Tech", "Buy 3BHK Apartment in 2028").
  - Target Baseline Version badge (e.g. `Based on Plan v2`).
  - Status indicator: `Draft` (simulation only) or `Applied to Plan v3` (persisted into a past or current version).
  - Summary of input overlays: e.g. "Income +₹25,000/mo, New Car Loan EMI ₹18,000/mo".
  - Quick actions: `Simulate`, `Compare` (checkbox selector for 2 to 4 scenarios), `Edit`, and `Delete`.
- Header includes primary CTA: `+ Create Scenario`.

### 2. Scenario Builder (`/dashboard/scenarios/new`)
- Form allowing users to define a bounded decision overlay on top of the active baseline:
  - **Cash Flow Adjustments**: Simulated change in take-home income, essential expenses, or discretionary spend.
  - **Emergency Reserve Adjustments**: Changes in target runway months or liquid reserves.
  - **Debt / Loan Decisions**: Adding a prospective loan (principal, interest rate, tenure) or prepayment plan.
  - **Investment Step-Up**: Adjusting monthly SIP or testing alternative expected return rates.
  - **Goal Timelines**: Shifting goal target dates or contribution amounts.
- **Real-Time Simulation (`POST /api/v1/scenarios/{id}/run`)**:
  - Allows previewing projected monthly surplus, runway months, and goal feasibility before saving.
  - Backend recalculates outputs on the fly without database mutations.

### 3. Multi-Scenario Comparison Matrix (`/dashboard/scenarios/compare`)
- Compares 2 to 4 selected scenarios side-by-side against the common baseline version.
- Displays structured comparison metrics:
  - Monthly surplus delta (`+₹15,000` vs `-₹8,000`)
  - Emergency buffer runway (months)
  - Earliest goal completion date
  - Total debt obligation and debt-to-income ratio
  - Long-term projected net worth at 5, 10, and 20 years
- Visual delta callouts:
  - Green/Sage for favorable outcomes (increased surplus, earlier goal completion).
  - Amber/Gold for trade-offs (e.g. higher income but reduced liquidity).
  - Red for risk triggers (e.g. emergency runway dropping below 3 months).

### 4. Immutable-Baseline Rule
- Creating, editing, simulating, or comparing scenarios **MUST NEVER** modify `plans.currentVersionId` or alter `household_planning.inputs`.
- Scenarios exist as isolated overlay records referencing a specific `baselineVersionId`.
- The user can explore arbitrary high-risk or aggressive scenarios with zero danger to their active financial plan.

### 5. Explicit Confirmation Rule for Application
- Applying a scenario overlay to the actual plan is an irreversible versioned mutation.
- Clicking `Apply to Plan` on `/dashboard/scenarios/[id]` triggers an explicit two-step confirmation modal:
  1. **Delta Summary**: Itemized diff comparing Current Baseline vs New Plan (inputs changed, surplus impact, goal status changes).
  2. **Audit Warning**: "Applying this scenario will create a new saved plan version (Version X+1) and update your active baseline. Your current plan version (Version X) will remain preserved in plan history."
  3. **Action Buttons**: `Cancel` (secondary, safe) and `Confirm & Apply to Plan` (primary action).
- Executing application calls `POST /api/v1/scenarios/{id}/apply` with an `Idempotency-Key` header:
  - The backend creates a new snapshot in `financial_snapshots`.
  - Creates a new `plan_versions` record with incremented `versionNumber` and `triggerReason: "scenario_applied"`.
  - Updates `plans.currentVersionId`.
  - Updates the scenario record to `status: "applied"` with `appliedVersionId`.
  - Toast confirmation appears: "Plan Version X+1 created from scenario [Name]."
  - User is navigated to `/dashboard/plan?welcome=1` or the new version review.

### 6. Conflict Recovery (409 Conflict)
- If the baseline plan was updated (e.g. from onboarding edit, drift acceptance, or another scenario) after the scenario was created, the scenario's `baselineVersionId` is stale.
- Calling `/api/v1/scenarios/{id}/apply` returns HTTP 409 `SCENARIO_BASELINE_STALE`.
- The UI handles this gracefully with a clear dialog:
  - "The baseline plan has changed since this scenario was created."
  - Options:
    1. `Rebase Scenario`: Updates the scenario's baseline to the current active plan version, recalculates simulation, and allows the user to review before applying.
    2. `Cancel`: Keeps scenario in draft status.

## Screen States

- **Loading**:
  - Skeleton cards for scenario list and comparison columns with subtle shimmer.
  - Simulation buttons display inline spinner with accessible text: "Calculating projection…".
- **Populated**:
  - Scenario list cards with status chips, metric summaries, and action menus.
  - Side-by-side comparison cards with aligned tabular figures and delta badges.
- **Empty with Next Action**:
  - Displayed when no scenarios exist:
    - Heading: "Test decisions before making them."
    - Body: "Model 'what-if' situations like a job change, home purchase, or higher loan prepayment to see how they impact your goals and monthly buffer before changing your active plan."
    - Action CTA: `+ Create your first scenario` (`/dashboard/scenarios/new`).
- **Partial Error with Retry**:
  - If a scenario simulation fails:
    - Error notice within the scenario card: "Could not evaluate simulation. [Retry]"
    - Does not break the rest of the dashboard or list.
- **Stale / Refetching**:
  - Background updates retain rendered cards with `aria-busy="true"` and a subtle progress bar.
- **Offline Read State**:
  - Previously loaded scenarios and comparisons are viewable in read-only mode.
  - "Simulate" and "Apply to Plan" buttons disabled with tooltip: "Re-connect to run simulations or update your plan."
- **Form States**:
  - Inline validation: Requires non-empty name (max 100 chars); decimal inputs must be non-negative numeric strings.
  - Saving state: "Saving scenario…".
  - Failed save retains user edits in the form with a clear error explanation.

## Exact API Mapping

### 1. Create Scenario
- **Endpoint**: `POST /api/v1/scenarios`
- **Request Schema**:
  ```json
  {
    "name": "Purchase Electric Vehicle",
    "description": "Down payment of 3L and 5-year auto loan",
    "overlay": {
      "cashFlow": {
        "emis": "18500.00"
      },
      "loan": {
        "principal": "900000.00",
        "annualRate": "9.25",
        "tenureMonths": 60
      },
      "emergencyFund": {
        "currentReserves": "250000.00"
      }
    }
  }
  ```
- **Response Schema (`201 Created`)**:
  ```json
  {
    "data": {
      "id": "uuid",
      "householdId": "uuid",
      "baselineVersionId": "uuid",
      "name": "Purchase Electric Vehicle",
      "description": "Down payment of 3L and 5-year auto loan",
      "overlay": {},
      "status": "draft",
      "appliedVersionId": null,
      "appliedAt": null,
      "createdAt": "2026-09-06T05:00:00.000Z",
      "updatedAt": "2026-09-06T05:00:00.000Z"
    }
  }
  ```
- **Error Responses**: `400 Bad Request` (validation), `401 Unauthorized`, `404 Not Found` (no active plan).

### 2. List Scenarios
- **Endpoint**: `GET /api/v1/scenarios`
- **Response Schema (`200 OK`)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "householdId": "uuid",
        "baselineVersionId": "uuid",
        "name": "Purchase Electric Vehicle",
        "description": "...",
        "overlay": {},
        "status": "draft",
        "appliedVersionId": null,
        "appliedAt": null,
        "createdAt": "2026-09-06T05:00:00.000Z",
        "updatedAt": "2026-09-06T05:00:00.000Z"
      }
    ]
  }
  ```

### 3. Run / Simulate Scenario
- **Endpoint**: `POST /api/v1/scenarios/{id}/run`
- **Response Schema (`200 OK`)**:
  ```json
  {
    "data": {
      "name": "Purchase Electric Vehicle",
      "baseline": { "cashFlow": {}, "emergencyFund": {}, "loan": {} },
      "scenario": { "cashFlow": {}, "emergencyFund": {}, "loan": {} },
      "deltas": {
        "cashFlow": { "monthlySurplusDelta": "-18500.00" },
        "emergencyFund": { "runwayMonthsDelta": "-0.8" }
      },
      "completeness": { "status": "complete", "missing": [], "warnings": [] },
      "policyVersion": "v1.0"
    }
  }
  ```

### 4. Compare Scenarios
- **Endpoint**: `POST /api/v1/scenarios/compare`
- **Request Schema**:
  ```json
  {
    "scenarioIds": ["uuid-1", "uuid-2"]
  }
  ```
- **Response Schema (`200 OK`)**:
  ```json
  {
    "data": {
      "baselineVersionId": "uuid",
      "scenarios": [
        {
          "name": "Scenario A",
          "baseline": {},
          "scenario": {},
          "deltas": {}
        },
        {
          "name": "Scenario B",
          "baseline": {},
          "scenario": {},
          "deltas": {}
        }
      ]
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `INVALID_SCENARIO_COUNT` (must be 2-4) or `MIXED_BASELINES` (scenarios must share the same baseline version).

### 5. Apply Scenario to Plan
- **Endpoint**: `POST /api/v1/scenarios/{id}/apply`
- **Headers**: `Idempotency-Key: <uuid>`
- **Response Schema (`200 OK`)**:
  ```json
  {
    "data": {
      "plan": { "id": "uuid", "currentVersionId": "uuid-new" },
      "version": { "id": "uuid-new", "versionNumber": 3, "triggerReason": "scenario_applied" },
      "snapshot": { "id": "uuid", "engineOutputs": {} }
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `SCENARIO_NOT_FOUND`
  - `409 Conflict`: `SCENARIO_BASELINE_STALE` (baseline plan moved forward since scenario creation).

## Responsive & Accessibility Behavior

### Responsive Breakpoints (360px, 768px, 1024px, 1440px)
- **1440px (Wide Desktop)**:
  - Multi-column comparison grid: Fixed Baseline column (left) + up to 3 scrollable scenario columns (right).
  - All financial metric diffs aligned horizontally for instant side-by-side scanning.
- **1024px (Small Desktop)**:
  - Comparison collapses to 2 cards side-by-side with sticky metric row headers.
- **768px (Tablet Portrait)**:
  - Stacked cards. A segmented button or dropdown allows switching between scenarios to compare against the fixed baseline.
- **360px (Mobile Phone)**:
  - Single column cards.
  - Zero horizontal page overflow (`overflow-x: hidden`).
  - Swipable or tabbed comparison view: Tab 1 "Baseline", Tab 2 "Scenario 1", Tab 3 "Scenario 2".
  - Delta callouts displayed as compact pills (`-₹18,500/mo`).
  - Touch targets strictly >= 44x44px.

### Accessibility (WCAG 2.1 AA)
- Semantic data markup: Comparison grid uses proper `role="table"` or standard `<table>` with `<th scope="col">` and `<th scope="row">`.
- Modals: Full focus trap on the "Apply to Plan" confirmation modal, returning focus to the triggering element upon close. `aria-modal="true"`, `role="dialog"`, and `aria-labelledby` pointing to modal title.
- Live announcements: `aria-live="polite"` region notifies screen readers when simulation results finish calculating.
- High Contrast: Text and badge tokens meet >= 4.5:1 contrast against `#FFF9F0` and `#FFFCF8`.
- Tabular figures: All financial amounts formatted with `tabular-nums` and Indian comma notation (`₹15,00,000`).

## Analytics & Privacy Rules

- **Zero Sensitive Data in Telemetry**:
  - Salary, income, net worth, proposed loan amounts, and exact monetary delta figures MUST NOT be passed in analytics events, URL params, or client logs.
- **Allowed Telemetry Events**:
  - `scenario_list_viewed`: `{ count: number }`
  - `scenario_created`: `{ has_loan: boolean, has_cashflow: boolean, has_investment: boolean }`
  - `scenario_simulated`: `{ scenario_id: string }`
  - `scenario_compared`: `{ scenario_count: number }`
  - `scenario_apply_attempted`: `{ scenario_id: string }`
  - `scenario_applied`: `{ scenario_id: string, new_version_number: number }`
  - `scenario_conflict_encountered`: `{ code: "SCENARIO_BASELINE_STALE" }`

## Measurable Acceptance Criteria

1. **Baseline Immutability**: Creating, running, or comparing scenarios never alters `plans.currentVersionId` or `household_planning.inputs`.
2. **Deterministic Simulation**: `POST /api/v1/scenarios/{id}/run` returns calculation deltas consistent with the backend financial engine without database side-effects.
3. **Multi-Scenario Comparison**: Comparing 2 to 4 scenarios produces an aligned comparison matrix referencing the shared baseline.
4. **Explicit Confirmation**: Applying a scenario requires explicit confirmation in a modal showing an itemized delta preview before executing.
5. **Traceable Version Creation**: Successful application creates a new plan version with `versionNumber = max + 1` and `triggerReason: "scenario_applied"`, and marks the scenario as `applied`.
6. **Conflict Handling**: Stale baseline triggers HTTP 409 `SCENARIO_BASELINE_STALE` and presents a recoverable rebase/cancel UI.
7. **Responsive Compliance**: Zero horizontal scrolling across 360px, 768px, 1024px, and 1440px viewports.
8. **Decimal Precision**: All monetary values preserved as string decimals without floating point drift.
9. **Zero Privacy Leaks**: Automated test verification confirms that no financial amounts leak into analytics or client console logs.
10. **Test Coverage**: Frontend Vitest tests cover scenario creation, simulation, comparison, explicit apply confirmation, and 409 stale-baseline handling with >90% code coverage.
