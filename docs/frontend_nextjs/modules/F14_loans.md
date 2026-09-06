# F14 — Loan analysis

## Release phase

Release 2 (Decision Tools).

## Dependencies

- **[F00 Foundation](F00_foundation.md)**: Design tokens, responsive grid system, accessible color contrasts, typography (`DM Serif Display` + `Manrope`), tabular numbers.
- **[F06 App shell](F06_app_shell.md)**: Sidebar layout (248px desktop / drawer below 1024px), header, breadcrumb navigation.
- **[F07 Overview](F07_overview.md)**: Debt obligations summary, monthly EMI burden, and liquidity buffer metrics.
- **[F08 Accounts](F08_accounts.md)**: Loan liability accounts, outstanding balances, and lender metadata.
- **[F11 Plan](F11_plan.md)**: Active plan baseline cash flow, EMI deductions, and emergency runway.
- **[F13 Saved scenarios](F13_scenarios.md)**: Loan prepayment and refinancing scenario modeling.

## Routes & Navigation Gating

- **Routes**:
  - `/dashboard/loans`: Portfolio overview of active loans, total outstanding debt, aggregate monthly EMI, debt-to-income (DTI) ratio, and entry to loan analysis tools.
  - `/dashboard/loans/[id]`: In-depth analysis for a specific loan or simulation: repayment breakdown, prepayment strategy modeler, refinancing comparator, and full amortization schedule.
- **Navigation Gating**:
  - The "Loans" navigation item in `DEFAULT_PLANNER_NAV` and overview quick links must remain hidden until real backend loan calculation endpoints are integrated and verified.
  - Unavailable routes must not be exposed as dead links or mock fixtures in production.

## Screens and Behavior

### 1. Prominent Analytical Disclaimer
- Every loan screen must display a permanent, visible disclaimer banner at the top of the content area:
  > **Analytical Planning Tool Only**
  > Calculations are produced using standard mathematical amortization algorithms for planning and decision-support purposes. They do not constitute a lender offer, credit assessment, loan approval, or commitment to lend. Actual terms, interest rates, and fees vary by financial institution.

### 2. Loan Portfolio Overview (`/dashboard/loans`)
- Aggregate metrics:
  - **Total Outstanding Principal**: Tabular currency formatted in Lakhs/Crores (e.g. `₹45,50,000.00`).
  - **Total Monthly EMI Outflow**: Monthly commitment deducted from take-home income.
  - **Debt-to-Income (DTI) Ratio**: Total EMIs divided by gross monthly income (with color-coded health indicator: `< 35%` Healthy Green, `35-50%` Moderate Amber, `> 50%` High Risk Red).
  - **Projected Debt Freedom Date**: Earliest date when all active loans reach zero balance under current repayment schedules.
- Active loans list:
  - Cards displaying loan name (e.g. "Home Loan — HDFC", "Auto Loan — SBI"), outstanding balance, interest rate (APR %), remaining tenure in months/years, and monthly EMI.
  - Primary CTA on each card: `Analyze Repayment & Prepayments`.
  - Header CTA: `+ Add / Simulate Loan`.

### 3. Prepayment Strategy Analyzer (`/dashboard/loans/[id]`)
- Allows users to model lump-sum prepayments (e.g. annual bonus allocation) or recurring monthly top-ups.
- Supported Prepayment Strategies (calculated directly by backend financial engine):
  1. **Reduce Tenure (`reduce_tenure`)**:
     - Keeps monthly EMI constant.
     - Shortens the total loan tenure and significantly reduces total interest paid.
     - Displays: Months Saved, Total Interest Saved, Revised Payoff Date.
  2. **Reduce EMI (`reduce_emi`)**:
     - Keeps loan tenure constant.
     - Lowers the required monthly EMI, freeing up monthly cash flow and increasing monthly surplus.
     - Displays: Revised Monthly EMI, Monthly Cash Flow Increase, Total Interest Saved.
- **Buffer & Goal Trade-Off Analysis**:
  - Automatically evaluates whether proposed lump-sum prepayments threaten the household emergency buffer.
  - If liquid reserves drop below 3 months of essential expenses, a warning callout appears: "This prepayment reduces your emergency buffer below the recommended 3 months."

### 4. Refinancing & Balance Transfer Comparator
- Evaluates the financial viability of transferring the loan balance to a lower interest rate:
  - Inputs: New Annual Interest Rate (APR %), Revised Tenure (optional), Processing Fee / Balance Transfer Cost.
  - Engine evaluation outputs:
    - Revised Monthly EMI
    - Revised Total Interest
    - Net Savings (`netSavings = interestSaved - processingFee`)
    - `isBeneficial` boolean flag: Clearly indicates whether the refinancing yields positive financial return after accounting for all fees.

### 5. Accessible Amortization Schedule
- Detailed breakdown of each payment period:
  - Month number
  - Total Monthly Payment (INR)
  - Principal component (INR)
  - Interest component (INR)
  - Remaining Loan Balance (INR)
- Controls:
  - Toggle between "Annual Summary View" (default on mobile and tablet) and "Complete Monthly Breakdown".
  - Search/Jump to specific year or month.

### 6. Baseline Preservation Rule
- Calculating loan amortizations, simulating prepayments, or testing refinancing options **MUST NEVER** alter the active plan baseline (`plans.currentVersionId`) or mutate `household_planning.inputs` automatically.
- Users can apply the resulting reduced EMI or payoff timeline into a new scenario via F13 with explicit confirmation.

## Screen States

- **Loading**:
  - Skeleton cards for EMI summary, DTI gauge, and amortization schedule table with animated shimmer.
- **Populated**:
  - Complete loan metrics, interactive prepayment controls, visual amortization breakdown chart, and accessible data table.
- **Empty with Next Action**:
  - Displayed when no loans are recorded in the plan:
    - Heading: "No loans in your plan."
    - Body: "Add an existing loan or simulate a prospective loan to analyze EMI commitments, test prepayment savings, and view your amortization schedule."
    - Action CTA: `+ Add loan details` (`/dashboard/loans/new` or input modal).
- **Partial Error with Retry**:
  - If calculation endpoint fails:
    - Inline alert banner: "Unable to calculate loan amortization. [Retry calculation]"
    - Entered loan inputs are preserved intact.
- **Stale / Refetching**:
  - Adjusting prepayment sliders updates output with a non-blocking background fetch (`aria-busy="true"`), retaining previously displayed schedule until the new calculation resolves.
- **Offline Read State**:
  - Cached loan schedules and summaries remain readable.
  - Sliders and simulation forms disabled with message: "Reconnect to recalculate loan schedules."
- **Form Validation**:
  - Principal: required, numeric decimal string > 0.
  - Interest rate: required, decimal string >= 0 and <= 100.
  - Tenure: required, integer >= 1 and <= 480 (40 years).
  - Prepayment amount: decimal string > 0 and <= principal.

## Exact API Mapping

### 1. Loan Calculation & Amortization
- **Endpoint**: `POST /api/v1/financial-engine/loan`
- **Request Schema**:
  ```json
  {
    "principal": "5000000.00",
    "annualRate": "8.50",
    "tenureMonths": 240,
    "prepayments": [
      {
        "month": 12,
        "amount": "200000.00"
      }
    ],
    "prepaymentStrategy": "reduce_tenure",
    "refinancing": {
      "newAnnualRate": "8.00",
      "newTenureMonths": 220,
      "processingFee": "10000.00"
    },
    "policyVersion": "v1.0"
  }
  ```
- **Response Schema (`200 OK`)**:
  ```json
  {
    "monthlyEmi": "43391.16",
    "totalPrincipal": "5000000.00",
    "totalInterest": "5413878.40",
    "totalPayment": "10413878.40",
    "tenureMonths": 240,
    "annualRate": "8.50",
    "monthlyRate": "0.7083",
    "schedule": [
      {
        "month": 1,
        "payment": "43391.16",
        "principal": "7974.49",
        "interest": "35416.67",
        "remainingBalance": "4992025.51"
      }
    ],
    "prepaymentComparison": {
      "originalTotalInterest": "5413878.40",
      "revisedTotalInterest": "4810230.12",
      "interestSaved": "603648.28",
      "originalTenureMonths": 240,
      "revisedTenureMonths": 218,
      "monthsSaved": 22,
      "revisedMonthlyEmi": "43391.16",
      "schedule": []
    },
    "refinancingComparison": {
      "currentRemainingInterest": "5413878.40",
      "newMonthlyEmi": "42150.00",
      "newTotalInterest": "4920000.00",
      "processingFee": "10000.00",
      "netSavings": "483878.40",
      "isBeneficial": true
    },
    "completeness": {
      "status": "complete",
      "missing": [],
      "warnings": []
    },
    "policyVersion": "v1.0",
    "resolvedAssumptions": {}
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `INVALID_LOAN_TERMS` (tenure <= 0, invalid rate, etc.)
  - `401 Unauthorized`

## Responsive & Accessibility Behavior

### Responsive Breakpoints (360px, 768px, 1024px, 1440px)
- **1440px (Wide Desktop)**:
  - 2-column layout: Left column (38%) loan parameters, prepayment strategy controls, and refinancing comparator; Right column (62%) amortization summary cards, principal vs interest visual chart, and complete data table.
- **1024px (Small Desktop)**:
  - Sidebar collapses to drawer.
  - Stacked layout with sticky tab bar: "Overview & Prepayments", "Refinancing", and "Amortization Table".
- **768px (Tablet Portrait)**:
  - Full-width card stack. Amortization schedule renders in Annual Summary Mode with expanders for individual monthly rows.
- **360px (Mobile Phone)**:
  - Single column view with 16px horizontal margins.
  - Zero horizontal page overflow (`overflow-x: hidden`).
  - Amortization table supports smooth horizontal scroll inside a dedicated container with sticky first column (Month), or collapses to a card-based yearly list.
  - Touch targets strictly >= 44x44px.

### Accessibility (WCAG 2.1 AA)
- Data table semantics:
  - `<table>` with `<caption>` describing the schedule.
  - Header row: `<th scope="col">` for Month, Payment, Principal, Interest, Balance.
  - First cell of each row: `<th scope="row">` for the month number.
- Textual chart alternatives:
  - Every visual chart is paired with a clear textual summary: "For a loan of ₹50 Lakh at 8.5% over 20 years, total interest is ₹54.14 Lakh (52% of total payments) and monthly EMI is ₹43,391."
- Slider controls:
  - Range sliders for prepayment amounts have accessible labels, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext`.
- Contrast & Colors: Text meets >= 4.5:1 contrast against `#FFF9F0` / `#FFFCF8`.
- Tabular numerals: All currency values use `tabular-nums` with Indian rupee symbols (`₹`) and Lakh/Crore grouping.

## Analytics & Privacy Rules

- **Zero Sensitive Financial Figures**:
  - Loan principal amounts, monthly EMI amounts, interest rates, outstanding balances, and lender account numbers MUST NEVER appear in analytics payloads or client logs.
- **Allowed Telemetry Events**:
  - `loan_overview_viewed`: `{ loan_count: number }`
  - `loan_detail_viewed`: `{ has_prepayment: boolean }`
  - `loan_prepayment_simulated`: `{ strategy: "reduce_tenure" | "reduce_emi" }`
  - `loan_refinancing_evaluated`: `{ is_beneficial: boolean }`
  - `amortization_schedule_viewed`: `{ view_mode: "annual" | "monthly" }`

## Measurable Acceptance Criteria

1. **Mandatory Disclaimer**: Prominent analytical disclaimer is visibly rendered at the top of every loan screen.
2. **Mathematical Accuracy**: EMI, principal/interest allocation, total interest, and remaining balance calculations match backend financial engine results exactly to 2 decimal places.
3. **Prepayment Logic**: Prepayment simulations correctly reflect both `reduce_tenure` (lower months, same EMI) and `reduce_emi` (same months, lower EMI) strategies.
4. **Refinancing Accuracy**: Net savings correctly subtracts processing fees from interest saved and sets `isBeneficial` accurately.
5. **Accessible Tables**: Amortization schedules pass WCAG table markup requirements (`scope="col"`, `scope="row"`, readable captions).
6. **No Overflow**: 0 horizontal page overflow at 360px, 768px, 1024px, and 1440px viewports.
7. **Strict Input Boundaries**: Forms prevent negative principal, zero tenure, and non-numeric characters with inline validation messages.
8. **Baseline Unchanged**: Simulating loans or prepayments never mutates active baseline plan versions or household inputs.
9. **Zero Privacy Leaks**: Automated test runs verify zero monetary figures in analytics calls or browser console output.
10. **Test Coverage**: Frontend Vitest tests cover loan overview, prepayment analyzer, refinancing calculator, and accessible amortization table with >90% code coverage.
