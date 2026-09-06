# F12 — History and drift

## Release phase

Release 2.

## Dependencies

F11.

## Screens and behavior

Version list and meaningful drift review against saved baseline.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

GET /api/v1/plans/history; saved version outputs; missing comparison summaries added in backend.

## Acceptance criteria

Unchanged baseline until confirmed; differences trace to input/version IDs; unavailable routes hidden until integration passes.

F21 applies. A fixture-only implementation does not meet release acceptance.
