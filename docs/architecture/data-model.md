# Data Model

Core ownership is `user → household → household member`. All financial data is household scoped. Accounts own transaction sources and canonical transactions. Canonical rows retain provenance, review state, categorization history, and supersession links.

Income, recurring expenses, loans, investments, insurance, and goals form normalized planning inputs. Snapshots capture an as-of date, household data revision, completeness, engine/policy versions, inputs, assumptions, and hashes. Plans contain immutable sequential versions. Scenarios reference one baseline version and create a new version only after explicit apply.

`job_runs`, ordered `run_events`, and `outbox_events` provide durable asynchronous state. Audit events are append-only and privacy-safe. Documents store metadata and private object keys; consent/export/deletion records make privacy operations durable.
