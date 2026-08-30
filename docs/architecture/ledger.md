# Canonical Ledger

U3 builds one household-scoped canonical ledger for manual and normalized SMS observations. Accounts, categories, canonical transactions, and every provenance row carry or derive the authenticated household boundary; client-provided household identifiers are never authorization inputs.

Money is stored as PostgreSQL `numeric(19,4)` and crosses TypeScript/API boundaries as decimal strings. Amounts are positive and direction is `DEBIT` or `CREDIT`. Cash-flow snapshots return missing values when no observations exist and exact decimal zero when observed credits and debits cancel.

An exact normalized external reference is the strongest deduplication key and is unique per household at the provenance boundary. Concurrent replay resolves through a database uniqueness constraint in the same transaction that creates or links provenance, so it cannot create two canonical rows.

Reference-free observations use a conservative fingerprint over household, account, exact amount string, direction, normalized merchant, and a five-minute UTC epoch bucket. A fingerprint collision is evidence for review, not proof of duplication: both legitimate observations remain durable and are marked `needs_review` until explicitly reconciled. Raw SMS bodies are never accepted or stored.

The first acceptance slice covers deterministic normalization/fingerprinting. The shipping gate adds Docker-backed concurrent replay, cross-household isolation, ambiguous-twin preservation, provenance linking, and exact cash-flow aggregation tests before U3 can be accepted.
