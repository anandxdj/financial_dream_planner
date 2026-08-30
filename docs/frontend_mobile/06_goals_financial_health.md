# 05 - Goals and Financial Health

## Feature objective

Give users a small, meaningful set of goals and an explainable deterministic Financial Health Score that summarizes the state without becoming a mysterious AI-generated number.

## Dependencies

- Auth/Onboarding
- Accounts/Financial State
- Transactions
- backend deterministic finance engine

## In scope

Goals:

- maximum 3 active goals
- preset goal types + custom
- create/edit/archive
- target amount/date
- current saved amount
- priority
- progress
- required monthly contribution
- projected completion
- feasibility
- plan impact
- optional AI clarification when requested/needed

Financial Health:

- score
- status label
- deterministic factors
- score explanation
- score change over time when backend provides it

## Out of scope

- unlimited goal portfolio
- social/shared goals
- automatic investment execution
- AI-invented score

## Routes

```text
(tabs)/goals.tsx
goal/new.tsx
goal/[id].tsx
goal/[id]/edit.tsx
goal/[id]/scenario.tsx
```

Financial Health detail can be a bottom sheet or secondary screen from Home depending on content density.

## Feature folders

```text
features/goals/
|-- screens/
|-- components/
|-- forms/
|-- hooks/
|-- services/
|-- schemas/
|-- utils/
`-- types.ts

features/financial-health/
|-- components/
|-- hooks/
|-- services/
`-- types.ts
```

## Goal limit

MVP rule:

- up to 3 active goals
- completed/archived goals do not need to consume active slots

If all three slots are used, explain clearly rather than showing a broken Create button.

## Goal types

Preset choices:

- Emergency Fund
- Home
- Vehicle
- Travel
- Education
- Marriage
- Clear Debt
- Retirement
- Build Wealth
- Custom

Goal type influences defaults and follow-up questions but not calculation ownership.

## Goal creation flow

### Step 1 - Select type

### Step 2 - Structured fields

Required when meaningful:

- target amount
- target date
- current amount saved
- priority

### Step 3 - Targeted AI clarification only when required

Example:

> You are planning a vehicle purchase. Do you expect to pay fully in cash or finance part of it?

Avoid open-ended AI interrogation.

### Step 4 - Draft result

Show deterministic output:

- needed per month
- projected completion
- feasibility
- major conflict with existing goals

User confirms Create Goal.

## Relative goal difficulty

Do not classify difficulty by income alone.

Backend may derive internal difficulty from:

```text
target amount
existing saved amount
monthly surplus
timeline
competing goals
obligations
priority/risk
```

Possible internal labels can include micro/short-term/major/long-term/critical, but UI does not need to expose jargon unless useful.

## Goals root screen

Show:

- active count, e.g. 2 of 3
- one card per active goal
- progress
- target date
- on-track/at-risk status
- projected completion
- Add Goal if slot available

Avoid overloading cards with full scenario analysis.

## Goal detail

Sections:

1. amount/progress
2. required monthly contribution
3. projected completion
4. contribution/progress history
5. effect on overall plan
6. risks
7. linked accounts/investments where available

Actions:

- Ask AI about this goal
- Try a scenario
- Edit goal
- Archive goal

## Goal intelligence rule

Normal progress and feasibility are deterministic.

AI is used when:

- user asks for explanation
- goal details are ambiguous
- plan materially changes
- external research is required

Do not call AI on every goal screen render.

## Financial Health Score

The score must come from deterministic backend logic.

Suggested factor families:

- emergency fund coverage
- savings rate
- monthly surplus/cash-flow health
- debt/EMI burden
- goal readiness
- insurance/protection coverage
- income stability
- plan consistency

The exact weighting is a backend product decision and should be versioned.

## Health score UI

Example:

```text
78 / 100 - Good
+3 since last month
```

Tap to explain:

```text
Emergency fund     13/20
Savings rate       17/20
Debt burden        18/20
Goal readiness     12/15
Cash-flow health   14/15
Protection          4/10
```

Each factor needs one plain-language explanation and, when appropriate, a direct action.

## Versioning

Score response should include a calculation version so future weighting changes do not silently rewrite historical meaning.

Example:

```text
scoreVersion: "health-v1"
```

## API requirements

Conceptual:

```text
GET    /goals
POST   /goals
GET    /goals/:id
PATCH  /goals/:id
POST   /goals/:id/archive
GET    /goals/:id/projection
GET    /financial-health
```

## Query hooks

```text
useGoals
useGoal
useCreateGoal
useUpdateGoal
useArchiveGoal
useGoalProjection
useFinancialHealth
```

## Step-by-step implementation

1. Build goal card + root list.
2. Build create/edit forms.
3. Enforce 3-active-goal rule from server response and UI.
4. Add deterministic projection/feasibility display.
5. Build goal detail.
6. Add scenario entry point.
7. Integrate optional AI clarification route/action.
8. Build Financial Health card.
9. Build factor explanation UI.
10. Integrate Home preview.

## Acceptance criteria

- cannot create a fourth active goal
- goal progress comes from backend data, not mobile recomputation
- missing optional information does not block goal creation unnecessarily
- AI clarification never silently creates/changes a goal
- health score has explainable factor values
- health score is never generated from chat text
- goal/health screens work with cached data offline and clearly show freshness

## Tests

- 3-goal limit UI
- goal form validation
- goal edit mutation invalidation
- status display (on-track/at-risk)
- health factor rendering
- score-version display logic if exposed
- accessibility of progress indicators without relying only on color
