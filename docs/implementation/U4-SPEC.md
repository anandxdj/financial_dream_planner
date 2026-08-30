# U4 Financial Engine Specification

Date: 2026-08-30
Branch: `feat/financial-engine`
Status: accepted

## Scope

U4 delivers a pure TypeScript calculation library and authenticated stateless calculation endpoints. It does not read the database, clock, environment, provider, or logger. Persistence of goals, snapshots, plans, and scenarios belongs to U5.

The implementation must cover:

- versioned immutable calculation policy;
- cash-flow and savings-rate calculations;
- emergency-fund target, runway, shortfall, and completion estimate;
- EMI, amortization, remaining balance, and prepayment comparison;
- lump-sum, SIP, and step-up SIP projections;
- future goal cost, funding ratio, required lump sum, required SIP, shortfall, and feasibility;
- net worth and allocation percentages;
- deterministic composition of input changes into scenario outputs;
- completeness warnings instead of silently substituting zero for missing required inputs.

## Determinism and numeric contract

- Accept decimal values as base-10 strings. Reject JavaScript `number` money/rate inputs.
- Use `decimal.js` with precision 40 and `ROUND_HALF_UP`.
- Money outputs are strings rounded to two decimals only at public output boundaries.
- Rates and ratios are strings rounded to four decimal places at public output boundaries.
- Intermediate calculations retain full Decimal precision. Never round each schedule row before deriving the next row.
- Month counts are non-negative integers. Annual rates are percentages (for example `9` means 9%).
- A zero annual rate uses the mathematically exact zero-rate branch; formulas must not divide by zero.
- Results depend only on explicit input and the selected policy version. No implicit current date or mutable defaults.

## Published policy

`IN-2026.1` is immutable and contains:

- general inflation: 6%;
- education and medical inflation: 8%;
- conservative/expected/optimistic annual returns: 6%/9%/12%;
- default annual contribution step-up: 0%;
- emergency reserve months for stable/variable/irregular income: 6/9/12.

Unknown policy versions are rejected. Callers may override assumptions explicitly; outputs must return the resolved assumptions and policy version.

## Completeness contract

Every calculator returns `completeness: { status, missing, warnings }` where status is `complete` or `incomplete`. Missing required fields produce `incomplete` and nullable derived values. A missing value is never interpreted as zero. Explicit `"0"` remains valid where the domain allows zero.

Warnings are stable machine-readable codes. At minimum support negative cash flow, zero income, target already funded, insufficient monthly capacity, and non-amortizing/invalid loan terms where applicable.

## Formula contract

- Cash flow: `income - essential expenses - discretionary expenses - EMIs - mandatory obligations`. Savings rate is `surplus / income * 100`; it is null with a zero-income warning when income is zero. Investable capacity is `max(surplus, 0)`.
- Emergency fund: monthly need is `essential expenses + EMIs + mandatory obligations`; target is monthly need times policy reserve months, with an explicit dependents uplift of 0 months for 0 dependents, 1 month for 1–2, and 2 months for 3+. Runway is reserves divided by monthly need. Completion months is `ceil(shortfall / monthly contribution)` and null when contribution is absent or non-positive.
- EMI: monthly rate is annual percentage divided by 1200. Payment is `P*r*(1+r)^n / ((1+r)^n-1)`; at zero rate it is `P/n`. The final amortization row is adjusted to clear the remaining unrounded principal exactly.
- Investment projection: lump sum compounds monthly. SIP contributions occur at the end of each month. Step-up applies once after each completed 12-month block. Return scenarios resolve from policy unless explicitly supplied.
- Goal funding: future cost compounds the present target by annual inflation over the explicit month horizon. Current funding grows over the same horizon. Required SIP uses the ordinary-annuity future-value formula and is zero when already funded. Feasibility compares required monthly contribution with explicit available monthly capacity.
- Net worth: total assets minus total liabilities. Allocation percentages use positive asset totals and return stable keys in caller order.

## API boundary

Expose authenticated `POST /api/v1/financial-engine/*` endpoints for cash-flow, emergency-fund, loan, investment projection, goal funding, net worth, and scenario evaluation. Request schemas are strict. Responses use the same pure library functions and include policy/completeness/assumptions. Update OpenAPI and the generated SDK in the same change.

## Acceptance gates

- Golden examples cover zero-rate loans, standard EMI/amortization, SIP/lump-sum projections, goal funding, and all published policy defaults.
- Property tests cover exact cash-flow identities, amortization principal conservation, monotonic projection growth for non-negative returns/contributions, and deterministic repeatability.
- Missing inputs are distinguishable from explicit zero.
- Invalid decimals, negative terms where forbidden, unknown policy versions, and non-finite results are rejected.
- Backend typecheck, lint, build, full tests, OpenAPI generation/check, SDK typecheck/build, and `git diff --check` pass.

## Completion evidence

- Antigravity bulk implementation: Gemini `gemini-3.7-flash-high`, conversation `170258d7-cf4a-4f6b-8ee4-edab0f0f2942`, explicitly authorized with `--yolo`; no branch switch, commit, push, or lockfile edit.
- Conductor review corrected partial scenario composition, zero-need runway semantics, policy-registry immutability, misleading projection warnings, and resolved-assumption metadata for explicit overrides.
- Final conductor-controlled backend result: build and lint pass; 20 test files and 111 tests pass with no skips or failures while Docker-backed API tests run.
- OpenAPI and generated SDK were regenerated; SDK typecheck/build and `git diff --check` pass.
- U4 persists no financial state. Immutable snapshots, stored goals/plans, and scenario apply semantics remain U5 work.
