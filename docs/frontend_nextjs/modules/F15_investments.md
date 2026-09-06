# F15 — Investments

## Release phase

Release 2 (Decision Tools).

## Dependencies

- **[F00 Foundation](F00_foundation.md)**: Design tokens, responsive layout grid, color tokens, typography (`DM Serif Display` + `Manrope`), tabular numerals.
- **[F06 App shell](F06_app_shell.md)**: Sidebar layout (248px desktop / drawer below 1024px), header, active route indicators.
- **[F07 Overview](F07_overview.md)**: Investable capacity, planned monthly surplus, and overall net worth context.
- **[F10 Goals](F10_goals.md)**: Goal funding targets, target dates, and monthly contribution feasibility.
- **[F11 Plan](F11_plan.md)**: Baseline saved investment parameters, inflation rate policy, and return assumptions.
- **[F13 Saved scenarios](F13_scenarios.md)**: Investment step-up and return variance scenario simulation.

## Routes & Navigation Gating

- **Routes**:
  - `/dashboard/investments`: Investment planning dashboard, multi-scenario compound growth projections, contribution step-up modeler, and milestone allocation table.
- **Navigation Gating**:
  - The "Investments" navigation link in `DEFAULT_PLANNER_NAV` and dashboard shortcut cards must remain hidden until real backend investment calculation endpoints are integrated and verified.
  - No fixture-only or mock-only screens may be exposed in production navigation.

## Screens and Behavior

### 1. Strict Product Boundary: Planning Only, No Execution
- **Strict Prohibition**: The investment feature is exclusively an analytical planning and wealth-projection workspace.
- **Forbidden Capabilities**:
  - NO stock or fund trading, buy/sell orders, order books, or broker integration.
  - NO live ticker feeds, real-time market quotes, or intraday price charts.
  - NO invented individual stock holdings or simulated broker accounts.
  - NO language implying financial execution (e.g. "Execute trade", "Buy portfolio", "Invest now via broker").
- All screens emphasize strategic asset allocation, monthly discipline, and long-term compounding assumptions.

### 2. Investment Portfolio & Growth Overview (`/dashboard/investments`)
- Key Metric Cards:
  - **Current Liquid / Invested Assets**: Initial lump-sum capital from saved planning inputs.
  - **Current Monthly SIP**: Planned monthly investment contribution.
  - **Annual Step-Up Rate**: Configured annual percentage increase in SIP (e.g. `10.0%`).
  - **Projected Corpus at Horizon**: Future portfolio value under the baseline expected return scenario.
- Prominent Assumption Notice:
  - Shows underlying policy version (e.g. `Policy v1.0`), assumed general inflation rate (`6.0%`), and expected equity/debt blended returns (`12.0% p.a.`).

### 3. Multi-Scenario Compound Growth Projections
- The backend financial engine calculates deterministic projections across standard market return scenarios:
  1. **Conservative Scenario**: Assumes lower return rate (e.g. `8.0% p.a.`, typical of conservative debt/hybrid allocation).
  2. **Expected Scenario**: Baseline historical market return rate (e.g. `12.0% p.a.`, blended index/equity return).
  3. **Optimistic Scenario**: Favorable compounding return rate (e.g. `15.0% p.a.`).
  4. **Custom Scenario**: User-defined annual return rate for personal stress-testing.
- **Projection Visualizer**:
  - Multi-line area chart showing total invested capital versus total future value over the planning horizon.
  - Interactive scrubber allows inspecting projected corpus, total contributions, and compounding gains at any month or year.
  - Paired with an accessible textual summary for screen-reader users.

### 4. Explicit Handling of Unavailable & Estimated Values
- If investment inputs are missing from the household plan:
  - The UI **MUST NOT** invent synthetic holdings or silently substitute zero values without explanation.
  - Fields are explicitly labeled: `Not provided` or `Estimated`.
  - An informational callout is displayed:
    > "Some investment inputs have not been provided. Projections are calculated using baseline policy assumptions or available partial inputs. You can add your current balances in your financial inputs."
    > Action: `Update Investment Inputs` (`/onboarding?step=2`).

### 5. Annual Step-Up Modeler
- Interactive slider or stepper allowing the user to test the compounding impact of stepping up their monthly SIP annually (e.g. 0%, 5%, 10%, 15%):
  - Calculates the exponential difference in terminal wealth created by increasing monthly investments as income grows.
  - Displays: Total Additional Invested, Total Additional Wealth Created, Time-to-Goal Acceleration.

### 6. Compounding Milestone Table
- Structured data table displaying wealth accumulation at key milestones:
  - Columns: Horizon / Milestone, Total Invested (INR), Future Value (INR), Wealth Gain (INR), Inflation-Adjusted Purchasing Power (INR).
  - Milestones: Year 1, Year 3, Year 5, Year 10, Year 15, Year 20, and Target Horizon.

### 7. Goal Linkage & Allocation Context
- Cross-references projected future value against active goals from F10 (e.g. "Child Higher Education in 12 years: ₹40,00,000", "Retirement in 25 years: ₹5,00,00,000"):
  - Highlights whether projected investments are on track to meet combined goal funding targets.
  - Visual status chips: `Fully Covered`, `Partially Funded (75%)`, or `Shortfall Projected`.

### 8. Baseline Preservation Rule
- Simulating different return rates, step-up percentages, or time horizons **MUST NEVER** alter the active plan baseline (`plans.currentVersionId`) or mutate `household_planning.inputs` automatically.
- Any decision to adopt an increased SIP or new savings target must be saved as a scenario (F13) or explicitly updated via the plan generation flow (F11).

## Screen States

- **Loading**:
  - Skeleton cards for investment summary metrics, chart canvas skeleton, and milestone table shimmer.
- **Populated**:
  - Complete multi-scenario growth curves, interactive milestone table, step-up controls, and goal coverage indicators.
- **Empty with Next Action**:
  - Displayed when no investment balance or SIP has been entered:
    - Heading: "Start projecting your wealth."
    - Body: "Add your current investment balance and planned monthly SIP to model long-term compounding, evaluate return scenarios, and check goal coverage."
    - Action CTA: `+ Add investment details` (`/onboarding?step=2` or planning modal).
- **Partial Error with Retry**:
  - If projection API calculation fails:
    - Alert banner: "Unable to calculate investment projection. [Retry]"
    - Preserves entered simulation settings without resetting inputs.
- **Stale / Refetching**:
  - When adjusting step-up sliders or horizons, background recalculation updates with `aria-busy="true"` while keeping previous curves visible.
- **Offline Read State**:
  - Previously calculated projections and milestone tables remain available in read-only mode.
  - Sliders disabled with notice: "Reconnect to recalculate investment growth."
- **Form Validation**:
  - Initial lump sum: numeric decimal string >= 0.
  - Monthly SIP: numeric decimal string >= 0.
  - Annual step-up: decimal string between 0.00% and 100.00%.
  - Horizon: integer between 1 and 600 months (up to 50 years).

## Exact API Mapping

### 1. Investment Projection Calculation
- **Endpoint**: `POST /api/v1/financial-engine/investment-projection`
- **Request Schema**:
  ```json
  {
    "initialLumpSum": "1000000.00",
    "monthlySip": "25000.00",
    "annualStepUp": "10.00",
    "horizonMonths": 180,
    "customAnnualRate": "11.50",
    "policyVersion": "v1.0"
  }
  ```
- **Response Schema (`200 OK`)**:
  ```json
  {
    "initialLumpSum": "1000000.00",
    "monthlySip": "25000.00",
    "annualStepUp": "10.00",
    "horizonMonths": 180,
    "scenarios": {
      "conservative": {
        "scenarioName": "conservative",
        "annualRate": "8.00",
        "totalInvested": "9000000.00",
        "futureValue": "16500000.00",
        "totalGains": "7500000.00",
        "milestones": [
          {
            "month": 12,
            "year": 1,
            "totalInvested": "1300000.00",
            "futureValue": "1380000.00",
            "totalGains": "80000.00"
          },
          {
            "month": 60,
            "year": 5,
            "totalInvested": "2850000.00",
            "futureValue": "3750000.00",
            "totalGains": "900000.00"
          },
          {
            "month": 180,
            "year": 15,
            "totalInvested": "9000000.00",
            "futureValue": "16500000.00",
            "totalGains": "7500000.00"
          }
        ]
      },
      "expected": {
        "scenarioName": "expected",
        "annualRate": "12.00",
        "totalInvested": "9000000.00",
        "futureValue": "24500000.00",
        "totalGains": "15500000.00",
        "milestones": []
      },
      "optimistic": {
        "scenarioName": "optimistic",
        "annualRate": "15.00",
        "totalInvested": "9000000.00",
        "futureValue": "33800000.00",
        "totalGains": "24800000.00",
        "milestones": []
      }
    },
    "completeness": {
      "status": "complete",
      "missing": [],
      "warnings": []
    },
    "policyVersion": "v1.0",
    "resolvedAssumptions": {
      "policyVersion": "v1.0",
      "generalInflation": "6.0",
      "returns": {
        "conservative": "8.0",
        "expected": "12.0",
        "optimistic": "15.0"
      },
      "annualStepUp": "10.0"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation error (invalid rate, negative horizon, etc.)
  - `401 Unauthorized`

## Responsive & Accessibility Behavior

### Responsive Breakpoints (360px, 768px, 1024px, 1440px)
- **1440px (Wide Desktop)**:
  - 2-column layout: Left column (35%) contribution inputs, step-up controls, and return scenario toggles; Right column (65%) interactive compounding projection chart and detailed milestone table.
- **1024px (Small Desktop)**:
  - Sidebar collapses to drawer.
  - Stacked view: Full-width interactive chart at top; milestone cards and simulation controls below.
- **768px (Tablet Portrait)**:
  - Single column card stack. Milestone table defaults to 5-year increments with expanders for intermediate years.
- **360px (Mobile Phone)**:
  - Single column cards with 16px margins.
  - Zero horizontal page overflow (`overflow-x: hidden`).
  - Interactive chart is accompanied by a concise summary text box.
  - Milestone table renders as card-based milestone snapshots (e.g. "Year 5: Invested ₹28.5L → Value ₹37.5L").
  - Touch targets strictly >= 44x44px.

### Accessibility (WCAG 2.1 AA)
- Data table markup:
  - `<table>` element with `<caption>` explaining the investment projection milestones.
  - `<th scope="col">` on all column headers.
  - `<th scope="row">` on milestone year labels.
- Textual chart alternative:
  - Every projection curve is accompanied by screen-reader accessible text: "Expected compounding projection: Starting with ₹10 Lakh and investing ₹25,000 monthly with a 10% annual step-up yields ₹2.45 Crore over 15 years at an assumed 12% annual return."
- Color differentiation:
  - Conservative (Blue `#2B6CB0`), Expected (Purple `#6C63D6`), and Optimistic (Sage `#2E7D32`) curves use distinct stroke dash styles (solid, dashed, dotted) in addition to color to ensure readability for colorblind users.
- Tabular figures: All financial amounts formatted with `tabular-nums` in Indian notation (Lakhs and Crores).

## Analytics & Privacy Rules

- **Zero Sensitive Investment Figures**:
  - Portfolio balances, monthly SIP amounts, lump sums, and wealth targets MUST NEVER be sent in analytics payloads, query parameters, or client console logs.
- **Allowed Telemetry Events**:
  - `investment_projection_viewed`: `{ has_inputs: boolean }`
  - `investment_scenario_selected`: `{ scenario_name: "conservative" | "expected" | "optimistic" | "custom" }`
  - `investment_step_up_tested`: `{ has_step_up: boolean }`
  - `investment_horizon_changed`: `{ horizon_years: number }`
  - `investment_milestone_expanded`: `{ milestone_year: number }`

## Measurable Acceptance Criteria

1. **No Trading Execution**: No broker integrations, stock orders, or individual holding tickers exist in the UI or code.
2. **Mathematical Parity**: Future values and compounding milestones match the backend financial engine output to the rupee.
3. **Explicit Labeling of Uncertainty**: Conservative (8%), Expected (12%), and Optimistic (15%) return assumptions are explicitly labeled as projections, not guaranteed outcomes.
4. **Missing Values Explicit**: Missing investment inputs are displayed as "Not provided" or "Estimated" rather than synthetic default holdings.
5. **Accessible Tables & Charts**: Milestone tables use proper semantic tags, and charts have accessible text alternatives and non-color-reliant visual cues.
6. **No Overflow**: 0 horizontal page overflow at 360px, 768px, 1024px, and 1440px viewports.
7. **Input Validation**: Forms enforce non-negative numbers, max 100% step-up, and 1-600 month horizons.
8. **Baseline Preservation**: Exploring investment projections never modifies active baseline plan versions or household inputs.
9. **Zero Privacy Leaks**: Automated test runs verify zero monetary figures in analytics calls or browser console output.
10. **Test Coverage**: Frontend Vitest tests cover investment projections, step-up simulations, milestone table rendering, and missing-input states with >90% code coverage.
