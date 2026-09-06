# F05 — First plan

## Release phase

Release 1.

## Dependencies

F04 F11.

## Screens and behavior

Review → Generate my plan → saved reveal. Synchronous pending state only.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

POST /api/v1/households/planning/generate reuses existing recalculation; GET /api/v1/plans/current.

## Acceptance criteria

Idempotency and revision checks; failure keeps active plan; no fictional stages or calculation SSE.

F21 applies. A fixture-only implementation does not meet release acceptance.
