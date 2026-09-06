# F16 — AI assistance

## Release phase

Release 3.

## Dependencies

F11 F13.

## Screens and behavior

Narrative assistance with structured reviewable proposals.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

Planner/run endpoints and credentialed SSE subscription.

## Acceptance criteria

Cancellation/reconnection recover; source attribution; any mutation requires reviewed confirmation.

F21 applies. A fixture-only implementation does not meet release acceptance.
