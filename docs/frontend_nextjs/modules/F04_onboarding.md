# F04 — Progressive onboarding

## Release phase

Release 1.

## Dependencies

F02 F03 F10.

## Screens and behavior

Four steps: Goals; Monthly money; Balances and details; Review. Backend autosave and resume.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

GET/PUT /api/v1/households/planning; goals CRUD.

## Acceptance criteria

Saving/Saved/Couldn’t save; unsaved edits survive failure; conflict offers reload; unknown remains unknown; estimates labeled; user assigns contributions.

F21 applies. A fixture-only implementation does not meet release acceptance.
