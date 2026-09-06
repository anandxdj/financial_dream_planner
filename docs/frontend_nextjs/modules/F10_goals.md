# F10 — Goals

## Release phase

Release 1.

## Dependencies

F03 F06.

## Screens and behavior

Up to three active goals; name/category/target/date/saved/contribution; detail 65/35 split.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

/api/v1/goals CRUD and /feasibility.

## Acceptance criteria

Backend enforces fourth-goal rejection and over-allocation; user contributions never redistributed; edit and Update Plan only; scenarios deferred.

F21 applies. A fixture-only implementation does not meet release acceptance.
