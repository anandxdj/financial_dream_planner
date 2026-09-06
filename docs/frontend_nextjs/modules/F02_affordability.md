# F02 — Anonymous affordability

## Release phase

Release 1.

## Dependencies

F00 F03.

## Screens and behavior

Purchase amount and monthly inputs; result before signup; expiring opaque draft handoff.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

POST /api/v1/affordability; /api/v1/planning/drafts and authenticated claim.

## Acceptance criteria

Backend verdict, surplus, buffer impact, time-to-afford and buy/wait comparison; expired reference recoverable; no finance values in URL/analytics.

F21 applies. A fixture-only implementation does not meet release acceptance.
