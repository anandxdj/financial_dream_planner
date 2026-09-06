# F11 — Plan

## Release phase

Release 1.

## Dependencies

F04 F05 F10.

## Screens and behavior

Saved immutable version, projections, assumptions, missing/estimated inputs and explicit Update Plan.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

GET /api/v1/plans/current; planning inputs GET/PUT; generation POST.

## Acceptance criteria

Input revisions independent of snapshots; stale banner; old plan remains during regeneration/failure; charts have summary and expandable table.

F21 applies. A fixture-only implementation does not meet release acceptance.
