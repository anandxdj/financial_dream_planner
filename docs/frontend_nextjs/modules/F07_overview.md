# F07 — Overview

## Release phase

Release 1.

## Dependencies

F05 F08 F09 F10.

## Screens and behavior

Dominant next action; plan date/completeness; surplus/emergency/goal indicators; projection, planned cash flow, goals, obligations, recorded transactions, sources.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

Current plan, household planning, accounts, goals feasibility, transactions/cash-flow.

## Acceptance criteria

Each panel loads/fails independently; no invented health score; recommendations link to review and never mutate; planned and recorded money separate.

F21 applies. A fixture-only implementation does not meet release acceptance.
