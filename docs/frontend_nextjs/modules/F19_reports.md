# F19 — Reports

## Release phase

Release 4.

## Dependencies

F11 F12.

## Screens and behavior

Saved-version reports, previews and exports.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

Report/export APIs; immutable saved version identifiers.

## Acceptance criteria

Exports match selected version and report failures are recoverable; no fictional completed jobs.

F21 applies. A fixture-only implementation does not meet release acceptance.
