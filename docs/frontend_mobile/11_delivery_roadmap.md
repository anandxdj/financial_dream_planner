# 10 - Mobile Delivery Roadmap and Feature Gates

## Purpose

This is the recommended production sequence. The mobile app should be delivered as independently demonstrable vertical slices rather than by building every backend layer first and all screens later.

Each milestone should leave the application in a coherent state.

## Milestone 0 - Foundation

Deliverables:

- Expo project
- route groups
- tab shell
- providers
- SDK/API transport
- TanStack Query
- SQLite migrations
- SecureStore
- design tokens
- reusable primitives
- test baseline

Exit gate:

- a new feature can be added without modifying root architecture

## Milestone 1 - Authentication

Deliverables:

- register/login
- Google login
- refresh lifecycle
- auth restore
- logout
- forgot/reset/verify

Exit gate:

- authenticated user survives app restart
- failed refresh returns safely to login

## Milestone 2 - Accounts and Manual Financial State

Deliverables:

- accounts list/detail
- add/edit account
- manual balance confirmation
- provenance/freshness labels
- financial snapshot query

Exit gate:

- product can represent user cash/accounts without SMS
- no estimated balance is misrepresented as live

## Milestone 3 - Manual Transactions

Deliverables:

- transaction list/detail
- manual add
- categories
- filters/search baseline
- offline outbox for manual transactions

Exit gate:

- user can operate the transaction ledger without SMS

## Milestone 4 - SMS Engine

Deliverables:

- local Expo Kotlin module
- permission flow
- parser fixtures
- first 60-day scan
- incremental scan
- local dedupe
- backend batch sync
- review queue
- transfer/card-payment handling
- merchant/category correction rules

Exit gate:

- real Android device imports financial SMS safely
- duplicate sync is idempotent
- non-financial SMS is not uploaded

This is a major MVP risk gate. Do not build the rest assuming SMS works without proving it on real devices early.

## Milestone 5 - Onboarding and Initial Plan

Deliverables:

- goal-first onboarding
- income/obligation/balance/loan forms
- SMS optional setup
- financial review
- initial plan generation
- first-plan summary
- resume behavior

Exit gate:

- a new user can install -> onboard -> receive a first plan in one continuous flow

## Milestone 6 - Goals and Financial Health

Deliverables:

- up to 3 active goals
- goal create/edit/detail
- feasibility/projection
- health score card
- factor explanation

Exit gate:

- score is deterministic and explainable
- goal progress is backend-owned and stable

## Milestone 7 - Home

Deliverables:

- financial health
- next-best action
- monthly pulse
- upcoming obligations
- goals preview
- recent transactions
- drift card placeholder/integration
- quick actions

Exit gate:

- Home answers where I stand / what changed / what should I do next within seconds

## Milestone 8 - Plan

Deliverables:

- plan root
- projection
- roadmap
- recommendations
- risks
- data freshness warnings
- regeneration with safe failure behavior

Exit gate:

- user can understand both future projection and next-action roadmap
- failed regeneration never destroys current plan

## Milestone 9 - Loans and Scenarios

Deliverables:

- loan list/detail
- prepayment simulation
- scenario builder
- baseline comparison
- save/apply/discard

Exit gate:

- what-if changes are deterministic and never mutate baseline before confirmation

## Milestone 10 - Plan Drift and History

Deliverables:

- drift review
- accept/keep/review-transactions actions
- plan versions
- version detail
- restore-as-new-version

Exit gate:

- user can see why a plan changed and controls whether baseline changes

## Milestone 11 - AI Chat

Deliverables:

- chat
- SSE streaming
- cancel/retry
- structured cards
- proposal/confirmation actions
- context-aware deep links

Exit gate:

- AI can explain and propose without owning financial truth

## Milestone 12 - Research

Deliverables:

- backend research responses surfaced in chat
- sources/freshness UI
- long-running research job handling
- safe investment-research wording

Exit gate:

- source-backed research is understandable and does not imply unreviewed regulated advice/execution

## Milestone 13 - Notifications, Privacy, Offline Hardening

Deliverables:

- push/in-app notifications
- deep links
- settings
- SMS controls
- data deletion
- session/security UI
- outbox recovery

Exit gate:

- failures do not blank the app
- privacy controls are understandable

## Milestone 14 - Production Hardening

Deliverables:

- accessibility pass
- performance pass
- device matrix testing
- release build
- closed testing
- Play SMS permission documentation/declaration
- privacy policy review
- security/logging audit

Exit gate:

- release candidate ready for Play review

# Feature priority matrix

## P0 - must be excellent

- Auth
- Onboarding
- Accounts basics
- Manual transactions
- SMS transactions
- Review/dedupe/transfers
- Home
- 3 Goals
- Financial Health
- Plan
- Projection
- Roadmap
- Loans
- Scenarios
- Drift
- AI chat
- Research
- Privacy/SMS settings

## P1 - build after P0 stability

- detailed plan history
- richer notification center
- report/PDF request/share flow
- investment planning surface if needed on mobile

## Stretch

- PDF statement transaction import

## Future

- iOS
- dark mode
- Account Aggregator/live bank sync
- brokerage execution
- biometric app lock
- advanced household UX
- universal mobile search

# How to hand a feature to an AI coding agent

For each feature implementation prompt provide only:

1. this module PRD
2. current feature folder
3. relevant generated SDK types/endpoints
4. design tokens/primitives allowed
5. exact acceptance criteria
6. relevant tests

Avoid giving the agent the entire repository unless the task truly requires cross-feature reasoning.

# Pull request sizing

Recommended:

- one vertical feature slice per PR
- avoid "build all transactions" mega-PRs
- split native SMS module, parser, sync, review UI into clear sequential PRs
- keep migrations/API-contract changes explicit

Example SMS PR sequence:

```text
PR 1 - native SMS permission/read module
PR 2 - parser + fixtures
PR 3 - local candidate DB + first scan
PR 4 - backend batch sync integration
PR 5 - review UI
PR 6 - dedupe/transfer/card rules
```

# Global release Definition of Done

Before Android MVP release:

```text
[ ] Auth restore/recovery works
[ ] Onboarding can complete without SMS
[ ] SMS scan works on real Android devices
[ ] Raw personal SMS is never uploaded/logged
[ ] Duplicate sync is idempotent
[ ] Self-transfer/card-payment accounting is correct
[ ] Account balances show provenance/freshness
[ ] Home shows one clear next-best action
[ ] Health Score is explainable
[ ] Max-three-goal rule works
[ ] Plan regeneration failure preserves prior plan
[ ] Scenarios require confirmation to apply
[ ] Drift never silently updates baseline
[ ] AI cannot silently mutate financial state
[ ] AI finance calculations come from deterministic tools
[ ] Research shows sources/freshness
[ ] Offline cached app remains usable
[ ] Pending outbox operations recover
[ ] Deep links from notifications work
[ ] Sensitive financial values are not in default push text
[ ] Account/data deletion paths work
[ ] Accessibility checklist passes
[ ] Mid-range Android performance is acceptable
[ ] Play SMS permission declaration/privacy requirements are ready
```

# Recommended daily development loop

1. Pick one acceptance criterion.
2. Implement smallest vertical path.
3. Add loading/error/offline state immediately, not later.
4. Add/adjust focused tests.
5. Run on Android emulator/device.
6. Review folder boundaries for accidental cross-feature coupling.
7. Mark criterion complete only after real interaction works.

This keeps the project digestible and prevents an AI-generated codebase from becoming a single tangled application.
