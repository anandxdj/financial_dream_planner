# Financial Dream Planner - Mobile Feature-Driven Development PRD Pack

This pack breaks the Android-first Expo mobile application into small, dependency-aware feature modules. Each module is designed to be implemented, reviewed, tested, and handed to an AI coding agent independently.

## Recommended reading order

1. `00_mobile_fdd_overview.md` - rules, architecture, folder model, shared conventions
2. `01_foundation_app_shell.md` - Expo setup, providers, navigation, design system, API client
3. `02_auth_onboarding.md` - authentication and progressive onboarding
4. `03_accounts_financial_state.md` - accounts, balance provenance, freshness, financial state
5. `04_transactions_sms_sync.md` - manual transactions, SMS import, parsing, dedupe, review
6. `05_home_dashboard.md` - dashboard summary, freshness, alerts, and plan progress
7. `06_goals_financial_health.md` - max-three goals and deterministic health score
8. `07_plan_drift_scenarios.md` - baseline plan, projection, roadmap, drift, scenarios, history
9. `08_loans_debt.md` - loan management, EMI modeling, prepayment simulations
10. `09_ai_research.md` - chat, SSE, context assembly, research, confirmation boundaries
11. `10_notifications_settings_offline_release.md` - notifications, privacy, offline, Play release gates
12. `11_delivery_roadmap.md` - production sequence, milestones, acceptance gates, Definition of Done

## Core rule

Build vertical slices, not giant layers. A feature is complete only when its route, UI, API integration, error/loading states, tests, analytics-free logs, and acceptance criteria are all complete.

## Product loop

Understand finances -> import reality -> generate plan -> observe change -> detect drift -> research/simulate -> recommend next action -> user confirms meaningful changes.
