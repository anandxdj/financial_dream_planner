# F03 — Authentication continuity

## Release phase

Release 1.

## Dependencies

F00.

## Screens and behavior

Login, signup, OAuth, verification, password recovery and safe return path.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

/api/v1/auth/*; /api/v1/users/me; planning draft claim.

## Acceptance criteria

One refresh coordinator, CSRF header, __Host- cookies, no redirect loop, logout clears cache, onboarding protected.

F21 applies. A fixture-only implementation does not meet release acceptance.
