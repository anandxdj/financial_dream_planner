# F21 — Accessibility, performance and release

## Release phase

Every stage.

## Dependencies

All applicable modules.

## Screens and behavior

Keyboard, responsive, chart alternatives, loading/error/offline checks and release evidence.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

Contract fixtures restricted to test/development; live backend journeys required for release.

## Acceptance criteria

360/768/1024/1440px no page overflow; focus/announcements/reduced motion; lint/types/build/SDK/backend tests; funnel events contain no entered financial values.

F21 applies. A fixture-only implementation does not meet release acceptance.
