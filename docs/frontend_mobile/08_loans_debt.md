# 07 - Loans and Debt

## Feature objective

Model debt as a first-class planning constraint without turning the app into a lending marketplace. Users should understand outstanding debt, EMI burden, payoff timeline, and the impact of prepayment on cash safety and goals.

## Dependencies

- Accounts/Financial State
- Plan engine
- Goals
- Scenarios

## In scope

- loan list
- add/edit loan
- loan detail
- EMI and remaining tenure
- principal/interest summary
- due date
- repayment timeline
- prepayment simulation
- impact on monthly surplus and goals
- link from Home/Plan when important

## Out of scope

- loan applications
- lender marketplace
- refinancing execution
- automatic payment

## Routes

```text
loans/index.tsx
loans/new.tsx
loans/[id].tsx
loans/[id]/edit.tsx
loans/[id]/prepayment.tsx
```

Loans are not a bottom tab.

## Feature folder

```text
features/loans/
|-- screens/
|-- components/
|   |-- LoanCard/
|   |-- LoanSummary/
|   |-- RepaymentTimeline/
|   `-- PrepaymentResult/
|-- forms/
|-- hooks/
|-- services/
|-- schemas/
`-- types.ts
```

## Loan data

MVP fields:

- type/name
- original principal optional if unknown
- outstanding principal
- EMI
- interest rate if known
- remaining tenure if known
- next due date
- lender/account reference optional

Do not block user if one optional field is unknown. Backend should indicate which simulations are approximate.

## Loans list

Each card:

- name/type
- outstanding amount
- EMI
- months remaining
- next due date
- risk/overdue status if applicable

Summary header can show:

- total outstanding debt
- total monthly EMI

## Loan detail

Sections:

1. outstanding amount
2. EMI / interest / remaining tenure
3. next due date
4. principal vs interest visualization if backend supports it
5. repayment timeline
6. effect on monthly plan
7. linked goal or account where relevant

Primary action:

- Try prepayment

## Prepayment simulation

User enters a prepayment amount.

Backend returns:

- new payoff date/remaining tenure
- interest saved
- impact on monthly surplus/cash buffer
- effect on active goals
- feasibility warning if emergency fund becomes weak

Do not directly alter loan state.

Actions:

- Create/Save scenario
- Cancel

Applying scenario later follows normal scenario confirmation/baseline rules.

## EMI treatment

EMI is a real cash obligation and must affect monthly plan.

If a loan finishes, roadmap/plan may surface newly available monthly capacity.

Example:

> Bike EMI ends in 3 months and frees INR 4,200/month.

## API requirements

Conceptual:

```text
GET    /loans
POST   /loans
GET    /loans/:id
PATCH  /loans/:id
POST   /loans/:id/prepayment-simulation
```

## Query hooks

```text
useLoans
useLoan
useCreateLoan
useUpdateLoan
usePrepaymentSimulation
```

## Step-by-step implementation

1. Build loan list + summary.
2. Build add/edit loan form.
3. Build detail screen.
4. Add repayment timeline visualization.
5. Build prepayment input.
6. Integrate deterministic simulation result.
7. Link result to Scenario feature.
8. Add Home/Plan contextual loan cards.

## Acceptance criteria

- user can create/edit a loan without knowing every optional field
- loan calculations are never performed by AI/mobile UI
- prepayment simulation shows consequences beyond interest saved
- simulation does not mutate the real loan
- loan completion can influence plan/roadmap through backend state

## Tests

- loan form validation
- unknown optional field behavior
- prepayment mutation/query handling
- scenario handoff
- due-date/status rendering
