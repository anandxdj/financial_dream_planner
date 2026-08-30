import { describe, expect, it } from "vitest";
import {
  CreateDriftCheckRequestSchema,
  DriftFindingSchema,
  DriftEventListQuerySchema,
  serializeDriftCheck,
  serializeDriftEvent,
  DRIFT_POLICY_VERSION,
  type SelectDriftCheck,
  type SelectDriftEvent,
} from "../../src/modules/drift";

describe("U7 Drift Rules & Model Schemas", () => {
  it("strictly validates CreateDriftCheckRequestSchema and rejects unknown fields", () => {
    const valid = {
      baselineVersionId: "123e4567-e89b-12d3-a456-426614174000",
      mode: "lightweight",
      asOf: "2026-08-30T10:00:00.000Z",
      revision: 1,
      inputs: {
        cashFlow: { income: "100000.00" },
      },
      idempotencyKey: "test-key-12345",
    };

    expect(CreateDriftCheckRequestSchema.safeParse(valid).success).toBe(true);

    // Reject unknown fields
    const invalidWithExtra = { ...valid, unknownField: "bad" };
    expect(CreateDriftCheckRequestSchema.safeParse(invalidWithExtra).success).toBe(false);

    // Reject invalid mode
    const invalidMode = { ...valid, mode: "unknown_mode" };
    expect(CreateDriftCheckRequestSchema.safeParse(invalidMode).success).toBe(false);

    // Reject negative revision
    const invalidRevision = { ...valid, revision: -1 };
    expect(CreateDriftCheckRequestSchema.safeParse(invalidRevision).success).toBe(false);
  });

  it("validates DriftFindingSchema structure", () => {
    const finding = {
      code: "income_changed" as const,
      description: "Income changed",
      baselineValue: "100000.00",
      observedValue: "105000.00",
      absoluteDelta: "5000.00",
      relativeDelta: "0.0500",
      severity: "notice" as const,
      affectedOutputPaths: ["cashFlow.monthlyIncome"],
    };

    expect(DriftFindingSchema.safeParse(finding).success).toBe(true);
  });

  it("validates DriftEventListQuerySchema with strict constraints", () => {
    expect(DriftEventListQuerySchema.safeParse({ limit: "20", status: "pending" }).success).toBe(true);
    expect(DriftEventListQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(DriftEventListQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(DriftEventListQuerySchema.safeParse({ status: "invalid_status" }).success).toBe(false);
    expect(DriftEventListQuerySchema.safeParse({ extraField: "not_allowed" }).success).toBe(false);
  });

  it("serializes drift check properly with ISO timestamps and string fields", () => {
    const now = new Date();
    const rawCheck: SelectDriftCheck = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      householdId: "223e4567-e89b-12d3-a456-426614174000",
      baselineVersionId: "323e4567-e89b-12d3-a456-426614174000",
      mode: "lightweight",
      asOf: now,
      revision: 0,
      observedInputHash: "hash123",
      inputs: { cashFlow: { income: "100000.00" } },
      idempotencyKey: "key-123",
      status: "queued",
      attempts: 0,
      failureCode: null,
      failureMessage: null,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      retentionExpiresAt: new Date(now.getTime() + 90 * 86400000),
    };

    const serialized = serializeDriftCheck(rawCheck);
    expect(serialized.asOf).toBe(now.toISOString());
    expect(serialized.createdAt).toBe(now.toISOString());
    expect(serialized.startedAt).toBeNull();
  });

  it("serializes drift event properly with ISO timestamps", () => {
    const now = new Date();
    const rawEvent: SelectDriftEvent = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      householdId: "223e4567-e89b-12d3-a456-426614174000",
      checkId: "323e4567-e89b-12d3-a456-426614174000",
      baselineVersionId: "423e4567-e89b-12d3-a456-426614174000",
      status: "pending",
      findings: [],
      policyVersion: DRIFT_POLICY_VERSION,
      engineVersion: "1.0.0",
      observedInputs: { cashFlow: { income: "100000.00" } },
      observedCalculatedOutput: null,
      observedOutputHash: "output-hash",
      deltas: null,
      createdVersionId: null,
      resolvedAt: null,
      createdAt: now,
      retentionExpiresAt: new Date(now.getTime() + 90 * 86400000),
    };

    const serialized = serializeDriftEvent(rawEvent);
    expect(serialized.createdAt).toBe(now.toISOString());
    expect(serialized.createdVersionId).toBeNull();
    expect(serialized.status).toBe("pending");
  });
});
