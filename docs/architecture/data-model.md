# Data Model

Core ownership is `user → household → household member`. All financial data is household scoped. Accounts own transaction sources and canonical transactions. Canonical rows retain provenance, review state, categorization history, and supersession links.

U2 provisions one household and one primary owner membership in the same transaction as every new account. Version 1 permits only one active household membership per user and one active primary member per household. The request `AuthContext` derives `householdId` and `role` from that membership; client-provided household identifiers are never authorization inputs.

Authentication separates identity, device family, and token version. `auth_identities` preserves password and legacy Google rows and keys OIDC identities by unique `(issuer, subject)`. `session_families` owns fixed expiry/revocation and household context; `sessions` holds hashed rotating refresh token versions. Invitations and one-time auth challenges store hashes, expiries, and conditional consumption timestamps.

The U2 migration checks for duplicate `lower(users.email)` values and aborts with a remediation message before replacing the legacy case-sensitive unique index. This prevents a partial or ambiguous identity migration.

Income, recurring expenses, loans, investments, insurance, and goals form normalized planning inputs:
- `financial_snapshots`: Append-only, household-scoped records of `as_of`, caller data `revision`, `engine_version`, `policy_version`, full input envelope, resolved assumptions, completeness results, calculated baseline outputs, and canonical SHA-256 `input_hash` and `output_hash`.
- `plans`: At most one plan per household (`unique (household_id)`), pointing to the `current_version_id`.
- `plan_versions`: Append-only, monotonically increasing version numbers per plan (`unique (plan_id, version_number)`), referencing an immutable snapshot and resolved scenario output.
- `scenarios`: Household-scoped draft overlays linked to an immutable baseline version. `status` is `draft` or `applied`. Applying a scenario creates a new snapshot and advances the plan version atomically, failing with `409` if the baseline has become stale.

`job_runs`, ordered `run_events`, and `outbox_events` provide durable asynchronous state. Audit events are append-only and privacy-safe. Documents store metadata and private object keys; consent/export/deletion records make privacy operations durable.
