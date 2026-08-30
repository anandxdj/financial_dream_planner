# Drift Architecture

## Boundary

`backend/src/modules/drift` owns deterministic material-change comparison, durable drift checks, immutable findings, user resolution, and retention. It depends on the financial engine for calculations and the plans module's immutable snapshot/version model. It does not depend on planner or research output.

Policy `DRIFT-IN-2026.1` defines inclusive exact-decimal thresholds and stable finding order. The accepted financial policy stored on the baseline snapshot remains the calculation policy for observed output and any accepted replacement snapshot; drift-policy and financial-policy identities are separate.

## Durable workflow

Creating a check takes the household advisory lock, verifies that the supplied baseline is still current, deduplicates both the client idempotency key and canonical observed-state identity, then writes `drift_checks` and a `drift_check` outbox event in one transaction. The canonical identity is enforced by a unique database index. The outbox dispatcher uses the check UUID as BullMQ's durable job ID, so duplicate publication and queue delivery converge on one check.

The worker locks the check, evaluates its immutable baseline snapshot against the stored observed envelope, inserts at most one event, and marks the check completed atomically. Completed delivery is a no-op. Failures roll back partial event work, persist a bounded sanitized failure, and are rethrown so BullMQ applies its bounded retry policy. Redis loss can delay a check but cannot lose the database request or result.

## Acceptance boundary

Detection never changes a plan. `accept` is the only drift operation that may create a baseline. It takes the household advisory lock and row locks, requires a completed pending material event whose baseline is still current, recomputes and hash-verifies its observed input/output, then atomically appends a snapshot and plan version, advances the current pointer, and marks the event accepted. Same-event retries return the one created version; competing events against the old baseline fail with `DRIFT_BASELINE_STALE` and leave no partial history.

`keep` only transitions pending to kept. No-change events cannot be resolved. Cross-household IDs are always non-disclosing 404 responses, and action bodies cannot supply replacement state.

## Retention

Checks and non-accepted events expire after 90 days and are hidden by reads before cleanup. Bounded cleanup deletes only expired failed/completed checks whose events are not pending or accepted, plus expired kept/no-change events. Pending checks/events, accepted provenance, snapshots, versions, and plan history are never removed by drift retention.
