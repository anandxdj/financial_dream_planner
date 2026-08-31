# F02 - Anonymous Affordability Tool

## Route
`/can-i-afford-this`

## Inputs
Decision name, amount, take-home income, recurring obligations, liquid savings, optional target date.

## Output before signup
Safe/Tight/Risky, monthly surplus, buffer impact, time-to-afford, one recommendation, Buy now vs Wait comparison.

## Backend boundary
No finance math in React. Call anonymous deterministic scenario endpoint. Preserve result through short-lived backend draft token rather than persistent sensitive browser storage.

## Conversion
After useful result: `Build my full plan`. Signup should preserve supplied context.

## Acceptance criteria
- <~1 minute completion path
- useful result without signup
- error/retry state
- accessible amount fields
- signup continuity works
