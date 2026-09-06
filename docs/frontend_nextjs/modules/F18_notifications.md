# F18 — Notifications

## Release phase

Release 3.

## Dependencies

F12 F17.

## Screens and behavior

Center, read states, priority and deep links.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

Notification endpoints only when supported.

## Acceptance criteria

Recover stream failures; no sensitive finance values in notification analytics; navigation stays hidden until usable.

F21 applies. A fixture-only implementation does not meet release acceptance.
