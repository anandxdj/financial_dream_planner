# F14 — Loan analysis

## Release phase

Release 2.

## Dependencies

F11 F13.

## Screens and behavior

Repayment and prepayment analysis with accessible amortization alternative.

## Screen states

Loading; populated; empty with a next action; partial error with retry; stale/refetch while retaining populated content; offline read state. Forms add validation, saving, saved, failed save retaining edits, and recoverable revision conflict where applicable. Unknown and estimated values are labeled explicitly.

## API mapping

Financial engine loan and scenario contracts; backend remains calculation owner.

## Acceptance criteria

Baseline preserved; assumptions/fees explicit; result not presented as a lender offer.

F21 applies. A fixture-only implementation does not meet release acceptance.
