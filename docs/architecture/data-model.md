# Data Model

Core ownership is `user → household → household member`. All financial data is household scoped. Accounts own transaction sources and canonical transactions. Canonical rows retain provenance, review state, categorization history, and supersession links.

U2 provisions one household and one primary owner membership in the same transaction as every new account. Version 1 permits only one active household membership per user and one active primary member per household. The request `AuthContext` derives `householdId` and `role` from that membership; client-provided household identifiers are never authorization inputs.

Authentication separates identity, device family, and token version. `auth_identities` preserves password and legacy Google rows and keys OIDC identities by unique `(issuer, subject)`. `session_families` owns fixed expiry/revocation and household context; `sessions` holds hashed rotating refresh token versions. Invitations and one-time auth challenges store hashes, expiries, and conditional consumption timestamps.

The U2 migration checks for duplicate `lower(users.email)` values and aborts with a remediation message before replacing the legacy case-sensitive unique index. This prevents a partial or ambiguous identity migration.

Income, recurring expenses, loans, investments, insurance, and goals form normalized planning inputs. Snapshots capture an as-of date, household data revision, completeness, engine/policy versions, inputs, assumptions, and hashes. Plans contain immutable sequential versions. Scenarios reference one baseline version and create a new version only after explicit apply.

`job_runs`, ordered `run_events`, and `outbox_events` provide durable asynchronous state. Audit events are append-only and privacy-safe. Documents store metadata and private object keys; consent/export/deletion records make privacy operations durable.
