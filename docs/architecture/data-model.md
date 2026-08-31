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

AI planning conversations and cited research evidence:
- `planner_conversations`: Household-scoped conversation threads with status (`active`, `archived`), title, and 90-day `retention_expires_at`.
- `planner_messages`: Append-only ordered dialogue turns (`user`, `assistant`) keyed by `(household_id, conversation_id)` with positive monotonically increasing `sequence_number`, visible citation snapshots, metadata, and 90-day `retention_expires_at`.
- `planner_message_citations`: Tenant-scoped foreign-key links from assistant messages to persisted evidence; cross-household evidence cannot be attached.
- `research_runs`: Household-scoped research execution tracking with query, topic, status (`queued`, `running`, `completed`, `failed`), provider, failure code, and 90-day `retention_expires_at`.
- `evidence`: Household-scoped factual research findings keyed by `(household_id, research_run_id)` with source URL, publisher, source type ranking (rank 1 to 6), excerpt, SHA-256 content hash, 30-day `freshness_expires_at`, and 90-day `retention_expires_at`.

Drift detection and baseline alignment:
- `drift_checks`: Durable, household-scoped evaluation jobs (`queued`, `running`, `completed`, `failed`) keyed by composite foreign key `(household_id, baseline_version_id)` and unique idempotency key `(household_id, idempotency_key)`. Deduplicated by `(household_id, baseline_version_id, mode, observed_input_hash, revision)`. Retained for 90 days.
- `drift_events`: Material findings and baseline alignment events (`pending`, `kept`, `accepted`, `no_change`) referencing `(household_id, check_id)` and `(household_id, baseline_version_id)`. Contains ordered material findings under policy `DRIFT-IN-2026.1`, observed inputs and outputs, and optional `created_version_id` upon acceptance. Kept/no_change records expire after 90 days, while pending/accepted records remain protected.

Privacy, document storage, and account deletion:
- `documents`: Household-scoped document metadata records with uploader, sanitized `display_name`, `media_type`, exact `byte_size`, SHA-256 `checksum`, private opaque `object_key`, lifecycle status (`pending`, `available`, `delete_pending`, `deleted`, `failed`), and optional 30-day tombstone `retention_expires_at`. Object keys are unique and never exposed in APIs.
- `consent_records`: Append-only, compliance-preserving records tracking household, user, purpose (`document_storage`, `privacy_export`, `household_deletion`), policy version, and action (`granted`, `withdrawn`). Intentionally lacks cascading FKs so consent audit trails survive household deletion.
- `privacy_exports`: Durable, household-scoped export requests (`queued`, `running`, `completed`, `failed`, `expired`) keyed by `(household_id, idempotency_key)` with 24-hour artifact `expires_at` and 30-day `retention_expires_at`.
- `household_deletions`: Two-step household deletion requests (`pending_confirmation`, `queued`, `running`, `failed`, `completed`) keyed by `(household_id, idempotency_key)`. Stores the SHA-256 hash of a single-use 15-minute confirmation token until confirmation, then replaces it with a consumed marker. Completed rows are minimal 30-day tombstones without cascading FKs.
- `audit_events`: Append-only, privacy-safe compliance log recording action, non-secret actor reference, entity reference, request ID, and sanitized metadata without before/after financial data, emails, tokens, secrets, or object keys.

`job_runs`, ordered `run_events`, and `outbox_events` provide durable asynchronous state.
