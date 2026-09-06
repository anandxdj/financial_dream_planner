# F13 — Saved scenarios

## Release phase

Release 2.

## Dependencies

F11 F12.

## Screens and behavior

Create, save, compare and explicitly apply a bounded decision.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

Existing /api/v1/scenarios contracts; application creates traceable plan version.

## Acceptance criteria

Compare without baseline mutation; duplicate/conflict recovery; accepted changes versioned.

F21 applies. A fixture-only implementation does not meet release acceptance.
