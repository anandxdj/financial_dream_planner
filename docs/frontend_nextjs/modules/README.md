# Frontend modules

Stable module identifiers, release phases, and implementation specifications. See the [master PRD](../NEXTJS_PRODUCT_UI_PRD.md) and the [Release 2 Acceptance Checklist](../RELEASE2_ACCEPTANCE.md).

## Release 2 Decision Tools (Implementation-Ready)

Release 2 expands the deterministic planning engine into advanced household decision-making tools. All four modules enforce strict baseline immutability, explicit user confirmation for financial mutations, backend calculation ownership, and zero financial telemetry leakage:

- **[F12 — History and drift](F12_plan_history_drift.md)** — Release 2: Version timeline, meaningful drift detection, side-by-side snapshot review, and explicit version restoration / drift acceptance.
- **[F13 — Saved scenarios](F13_scenarios.md)** — Release 2: Bounded "what-if" decision overlays, multi-scenario comparison matrix (2-4 scenarios), deterministic simulation, and explicit confirmation before applying changes to a new traceable plan version.
- **[F14 — Loan analysis](F14_loans.md)** — Release 2: Debt portfolio overview, mathematical amortization schedules, prepayment strategy analyzer (`reduce_tenure` vs `reduce_emi`), refinancing comparator with net savings, buffer impact warnings, and prominent non-lender disclaimer.
- **[F15 — Investments](F15_investments.md)** — Release 2: Wealth accumulation projections, multi-scenario compounding curves (conservative, expected, optimistic), annual SIP step-up simulation, milestone tables, and explicit labeling of missing/estimated inputs with strictly NO trading or broker execution.

For end-to-end verification across backend, SDK, frontend, and browser viewports, consult the [Release 2 Acceptance Checklist](../RELEASE2_ACCEPTANCE.md).

## Full Module Index

| Module | Name | Release Phase | Specification Status |
| :--- | :--- | :--- | :--- |
| **[F00](F00_foundation.md)** | Foundation | Foundation | Released (R1) |
| **[F01](F01_marketing.md)** | Marketing | Release 1 | Released (R1) |
| **[F02](F02_affordability.md)** | Anonymous affordability | Release 1 | Released (R1) |
| **[F03](F03_auth.md)** | Authentication continuity | Release 1 | Released (R1) |
| **[F04](F04_onboarding.md)** | Progressive onboarding | Release 1 | Released (R1) |
| **[F05](F05_first_plan.md)** | First plan | Release 1 | Released (R1) |
| **[F06](F06_app_shell.md)** | App shell | Release 1 | Released (R1) |
| **[F07](F07_overview.md)** | Overview | Release 1 | Released (R1) |
| **[F08](F08_accounts.md)** | Accounts | Release 1 | Released (R1) |
| **[F09](F09_transactions.md)** | Transactions | Release 1 | Released (R1) |
| **[F10](F10_goals.md)** | Goals | Release 1 | Released (R1) |
| **[F11](F11_plan.md)** | Plan | Release 1 | Released (R1) |
| **[F12](F12_plan_history_drift.md)** | History and drift | Release 2 | **Implementation-Ready** |
| **[F13](F13_scenarios.md)** | Saved scenarios | Release 2 | **Implementation-Ready** |
| **[F14](F14_loans.md)** | Loan analysis | Release 2 | **Implementation-Ready** |
| **[F15](F15_investments.md)** | Investments | Release 2 | **Implementation-Ready** |
| **[F16](F16_ai.md)** | AI assistance | Release 3 | Future |
| **[F17](F17_android_connection.md)** | Android connection | Release 3 | Future |
| **[F18](F18_notifications.md)** | Notifications | Release 3 | Future |
| **[F19](F19_reports.md)** | Reports | Release 4 | Future |
| **[F20](F20_settings.md)** | Settings, privacy and security | R1 essentials; R4 preferences | R1 Active |
| **[F21](F21_release_polish.md)** | Accessibility, performance and release | Every stage | Active Gate |
