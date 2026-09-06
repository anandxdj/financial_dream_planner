# F15 — Investments

## Release phase

Release 2.

## Dependencies

F11 F13.

## Screens and behavior

Planning projections and contributions with assumptions, no execution.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

Financial engine investment projection and saved plan outputs.

## Acceptance criteria

Scenario ranges explained; missing values visible; no invented holdings or unsupported trading.

F21 applies. A fixture-only implementation does not meet release acceptance.
