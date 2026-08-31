# Next.js Feature-Driven UI PRD Modules

Use these files one feature at a time with a coding agent. The master PRD remains the source of truth.

Recommended order:

1. F00 Foundation
2. F01 Marketing
3. F02 Anonymous Affordability
4. F03 Authentication
5. F04 Web Onboarding
6. F05 First Plan Reveal
7. F06 App Shell
8. F07 Overview
9. F08 Accounts & Data Confidence
10. F09 Transactions
11. F10 Goals
12. F11 Plan
13. F12 Plan History & Drift
14. F13 Scenarios
15. F14 Loans
16. F15 Investments
17. F16 AI Copilot
18. F17 Android Connection
19. F18 Notifications
20. F19 Reports
21. F20 Settings / Privacy / Security
22. F21 Accessibility / Performance / Release

Each module should be implemented as a vertical slice: route + feature UI + query hooks + states + tests, without moving financial business logic into Next.js.
