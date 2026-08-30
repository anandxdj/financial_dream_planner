# Canonical Ledger

U3 builds one household-scoped canonical ledger for manual and normalized SMS observations. Accounts, categories, canonical transactions, and every provenance row carry or derive the authenticated household boundary; client-provided household identifiers are never authorization inputs.

Money is stored as PostgreSQL `numeric(19,4)` and crosses TypeScript/API boundaries as decimal strings. Amounts are positive and direction is `DEBIT` or `CREDIT`. Cash-flow snapshots return missing values when no observations exist and exact decimal zero when observed credits and debits cancel.

## Tenancy and Entity Models

- **Accounts (`accounts`)**: Holds bank, card, wallet, and cash accounts scoped to `household_id`. Supported types: `SAVINGS`, `CURRENT`, `CREDIT_CARD`, `WALLET`, `BROKERAGE`, `LOAN`, `CASH`, `OTHER`. Balances use exact `numeric(19,4)`.
- **Categories (`categories`)**: Supports system pre-defined categories (`household_id` is null, `is_system` is true) and user custom categories (`household_id` set to authenticated household). System categories are read-only for households.
- **Canonical Transactions (`transactions`)**: The single authoritative source of truth for observed and manual financial movements. Stores exact `amount`, `direction` (`DEBIT` | `CREDIT`), `occurred_at`, `status` (`verified` | `needs_review` | `pending`), optional `account_id`, `category_id`, and `fallback_fingerprint`.
- **Transaction Provenance (`transaction_sources`)**: Records provenance for every observation. Stores `source_type` (e.g. `SMS`, `MANUAL`, `BANK_PROVIDER`), `client_id`, `external_reference`, safe metadata JSON (e.g. `accountLast4`, `balanceAfter`), `confidence`, and `imported_at`. Raw SMS bodies are never accepted or persisted.

## Deduplication and Concurrency Architecture

- **Exact Normalized External Reference**: An exact normalized external reference (e.g. UTR, RRN, bank reference) is the strongest deduplication key and is constrained by a PostgreSQL unique index on `(household_id, external_reference)`. Concurrent replays resolve through this database constraint in the same transaction, guaranteeing that concurrent requests cannot create duplicate canonical transaction rows. Exact replays recognize existing records and attach provenance idempotently.
- **Conservative Fallback Fingerprinting**: Reference-free observations compute a conservative SHA-256 fingerprint over `householdId`, `accountId`, exact `amount` string, `direction`, normalized merchant name, and a 5-minute UTC epoch bucket. A fingerprint collision indicates ambiguous observations: both rows are preserved as distinct canonical rows in `transactions` and marked `needs_review` for explicit user reconciliation.

## Cash-Flow Snapshot

- `GET /api/v1/transactions/cash-flow` computes exact cash flow sums for one requested currency (INR by default) using `decimal.js` (40 digits precision, half-up rounding); different currencies are never silently added together.
- When no transaction observations exist for the period, `totalIncome`, `totalExpenses`, and `netCashFlow` are explicitly returned as `null` with `hasData: false`.
- When observed credits and debits cancel out (e.g. ₹500 income and ₹500 expenses), `netCashFlow` returns exact `"0.00"` with `hasData: true`.
