# F06 — App shell

## Release phase

Release 1.

## Dependencies

F00 F03.

## Screens and behavior

Overview, Transactions, Goals, Plan, Accounts, Settings. Drawer below 1024px.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

Authenticated user and logout endpoints.

## Acceptance criteria

248px sidebar, 68px header, max 1440px content; 24px tablet/16px phone gutters; focus restoration and active route.

F21 applies. A fixture-only implementation does not meet release acceptance.
