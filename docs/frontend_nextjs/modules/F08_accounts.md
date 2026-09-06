# F08 — Accounts

## Release phase

Release 1.

## Dependencies

F03 F06.

## Screens and behavior

Manual account list/add/edit; currency, balance and freshness.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

GET/POST /api/v1/accounts; GET/PATCH/DELETE /api/v1/accounts/{id}.

## Acceptance criteria

Unknown balances not zero; saved changes refresh relevant views; no automatic replacement of saved planning assumptions.

F21 applies. A fixture-only implementation does not meet release acceptance.
