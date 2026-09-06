# F17 — Android connection

## Release phase

Release 3.

## Dependencies

F09.

## Screens and behavior

Optional automation handoff and sync provenance.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

Existing ingestion/sync/device contracts; add only missing summaries.

## Acceptance criteria

All Release 1 flows work without Android; web never reads SMS; sync freshness explicit.

F21 applies. A fixture-only implementation does not meet release acceptance.
