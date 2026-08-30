# 05 - Home Dashboard and Daily Financial Pulse

## Feature objective

Make Home the fastest way to understand financial state and act. Home is not a report page. It should answer, in order:

1. Where do I stand?
2. What changed?
3. What is the one thing worth doing next?

## Dependencies

- Accounts/Financial State
- Transactions
- Goals/Financial Health for final score and goal preview
- Plan/Drift for final next-action and drift card

Home can be implemented in stages while downstream features are still being built. Use backend summary contracts rather than importing feature internals.

## In scope

- top greeting/header
- Financial Health card
- one Next Best Action card
- monthly income/spending/surplus pulse
- plan drift/change alert when meaningful
- upcoming obligations
- goal preview
- recent transactions preview
- quick actions
- refresh/freshness handling
- cached/offline rendering

## Out of scope

- deep analytics
- full net-worth dashboard
- many competing recommendations
- full transaction table
- full goal detail
- full projection charts

## Route

```text
(tabs)/home.tsx
```

## Feature folder

```text
features/home/
|-- screens/
|   `-- HomeScreen/
|       |-- HomeScreen.tsx
|       |-- styles.ts
|       `-- index.ts
|-- components/
|   |-- FinancialHealthCard/
|   |-- NextBestActionCard/
|   |-- MonthlyPulse/
|   |-- PlanDriftCard/
|   |-- UpcomingSection/
|   |-- GoalsPreview/
|   |-- RecentTransactionsPreview/
|   `-- QuickActions/
|-- hooks/
|-- services/
`-- types.ts
```

## Home data contract

Prefer one backend/mobile summary endpoint rather than 8 independent requests if the backend can provide a coherent snapshot efficiently.

Conceptual response:

```text
HomeSummary
|-- generatedAt
|-- financialHealth
|-- monthlyPulse
|-- nextBestAction
|-- driftSummary optional
|-- upcomingItems[]
|-- goalPreviews[]
|-- recentTransactions[]
`-- staleInputs[]
```

The backend is responsible for deciding the canonical next-best action and health summary. Mobile renders and routes actions.

If a single summary endpoint is not available initially, compose feature queries through hooks without putting calculations in Home.

## Exact screen hierarchy

```text
Home
|
|-- Header
|   |-- greeting/name
|   |-- notifications
|   `-- avatar
|
|-- FinancialHealthCard
|
|-- NextBestActionCard
|
|-- MonthlyPulse
|
|-- PlanDriftCard            conditional
|
|-- UpcomingSection
|
|-- GoalsPreview
|
|-- RecentTransactionsPreview
|
`-- QuickActions
```

## Header

Keep compact.

Recommended:

- time-appropriate greeting or simply first name
- notification icon with unread indicator
- profile avatar

Do not place search, settings, sync, AI, and profile all in the top bar.

## Financial Health card

Show:

- score, e.g. 78/100
- plain status, e.g. Good
- small change since prior period if available
- one short explanation

Tap opens health-factor detail or sheet.

The score is deterministic and backend-calculated.

## Next Best Action

This is the most important Home component.

Exactly one primary recommendation.

Example:

```text
Best move this week
Add INR 3,000 to your emergency fund.
This improves coverage from 2.4 to 2.6 months.
```

Actions:

- Do this / View action
- Why?
- Ask AI when explanation is useful

Do not show a carousel of 12 recommendations.

## Monthly Pulse

Compact metrics:

```text
Income       INR 58,000
Spent        INR 31,400
Surplus      INR 18,100
```

Optional small trend indicator.

Do not use a large pie chart by default.

## Drift card

Only render when a meaningful drift event exists.

Example:

> Your plan may need an update.
> Spending is about 14% above baseline over the latest review window.

Actions:

- Review changes
- Not now

The card deep-links to `plan/review/:id`.

## Upcoming

Show only near-term meaningful obligations:

- EMI due
- recurring bill
- insurance premium
- expected major payment
- goal contribution due if modeled

Limit initial list to 2-4 items, then View all if needed later.

## Goal preview

Show up to 3 active goals with:

- name
- progress
- on-track/at-risk
- target date or next milestone

Tap opens Goal detail.

## Recent Transactions

Show last 3-5 relevant transactions.

Tap row -> Transaction detail.

Header action -> View all Transactions.

## Quick actions

Recommended:

- Add transaction
- Sync transactions
- Ask AI

Do not add 8 shortcuts.

## Loading/caching

If cached Home data exists:

- render immediately
- show freshness, e.g. Updated 12 min ago
- refresh in background

If no cached data exists:

- use skeletons for major cards

Pull-to-refresh should trigger Home summary refresh and selected dependent queries, not force a full app reset.

## Offline behavior

Offline:

- show cached Home snapshot
- show Offline banner
- disable actions that require server execution with clear explanation
- manual transaction quick action may still work through local outbox
- SMS sync may still parse locally and queue results

Never replace cached Home with an empty screen just because network is unavailable.

## API requirements

Preferred conceptual endpoint:

```text
GET /home-summary
```

Alternatively composed endpoints:

```text
GET /financial-state/current
GET /financial-health
GET /plans/current/summary
GET /plan-drift/current
GET /goals?status=active
GET /transactions?limit=5
GET /obligations/upcoming
```

## Query hooks

Preferred:

```text
useHomeSummary
```

If composed:

```text
useFinancialSnapshot
useFinancialHealth
useCurrentPlanSummary
useCurrentDrift
useGoalsPreview
useRecentTransactions
useUpcomingObligations
```

Avoid turning Home into a component with 30 ad hoc fetch calls.

## Step-by-step implementation

### Phase A - Static shell

1. Header
2. health placeholder
3. next action placeholder
4. monthly pulse
5. goal/transaction previews

### Phase B - Real financial state

1. connect snapshot
2. connect recent transactions
3. connect goal previews
4. add cached/refetch state

### Phase C - Planning intelligence

1. health score
2. next-best action
3. drift card
4. upcoming obligations

### Phase D - polish

1. skeletons
2. offline state
3. accessibility
4. motion
5. performance profiling

## Acceptance criteria

- user understands current status in under a few seconds
- exactly one primary next-best action is visually dominant
- Home does not independently compute canonical financial metrics
- cached Home remains visible offline
- drift card appears only when backend marks drift meaningful
- goal and transaction previews deep-link correctly
- refresh does not produce full-screen flicker when cached data exists
- screen remains useful even before AI is available

## Tests

- Home summary loading/success/error
- cached offline state
- drift conditional render
- next-action deep-link/action handling
- goal/transaction navigation
- pull-to-refresh behavior
- accessibility labels for score and monetary metrics
