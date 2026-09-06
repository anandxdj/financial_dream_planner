# F20 — Settings, privacy and security

## Release phase

Release 1 essentials; Release 4 remaining preferences.

## Dependencies

F03 F06.

## Screens and behavior

Profile, saved financial details, privacy export/deletion, security/logout; later preferences.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

/users/me; /auth/*; /privacy/exports and /privacy/deletions; household planning.

## Acceptance criteria

Only supported profile/security controls; destructive actions explicitly confirmed with consequences; no unsupported session list claims.

F21 applies. A fixture-only implementation does not meet release acceptance.
