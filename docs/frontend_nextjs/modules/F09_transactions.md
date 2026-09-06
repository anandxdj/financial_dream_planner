# F09 — Transactions

## Release phase

Release 1.

## Dependencies

F08.

## Screens and behavior

Manual entry; labeled phone rows; details and supported review fields.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

GET/POST /api/v1/transactions; GET/PATCH/DELETE /{id}; /cash-flow; category/account APIs.

## Acceptance criteria

URL filters accountId/categoryId/direction/status/startDate/endDate plus cursor/limit; no search; no amount/date editing after creation; refresh recorded views only.

F21 applies. A fixture-only implementation does not meet release acceptance.
