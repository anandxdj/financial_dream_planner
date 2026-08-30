import { describe, expect, it } from "vitest";
import { classifyCandidate, fallbackFingerprint, normalizeExternalReference, normalizeMerchant, occurredAtBucket } from "../../src/modules/transactions/dedupe";
import { syncTransactionsSchema } from "../../src/modules/transactions/transactions.controller";

const candidate = {
  householdId: "household-1",
  accountId: "account-1",
  amount: "650.00",
  direction: "DEBIT" as const,
  merchantName: "  Swiggy*Order  ",
  occurredAt: new Date("2026-08-29T13:00:00.000Z"),
};

describe("ledger deduplication policy", () => {
  it("normalizes reference and merchant material deterministically", () => {
    expect(normalizeExternalReference(" utr-123 ")).toBe("UTR-123");
    expect(normalizeMerchant("  Swiggy*Order  ")).toBe("SWIGGY ORDER");
  });

  it("produces the same fallback fingerprint inside a time bucket", () => {
    const replay = { ...candidate, merchantName: "SWIGGY ORDER", occurredAt: new Date("2026-08-29T13:04:59.999Z") };
    expect(fallbackFingerprint(replay)).toBe(fallbackFingerprint(candidate));
    expect(occurredAtBucket(new Date("2026-08-29T13:05:00.000Z"))).not.toBe(occurredAtBucket(candidate.occurredAt));
  });

  it("deduplicates exact references but preserves fallback collisions for review", () => {
    expect(classifyCandidate({ candidate: { ...candidate, externalReference: "UTR-123" }, exactReferenceExists: true, fallbackCollisionExists: false })).toBe("duplicate");
    expect(classifyCandidate({ candidate, exactReferenceExists: false, fallbackCollisionExists: true })).toBe("needs_review");
    expect(classifyCandidate({ candidate, exactReferenceExists: false, fallbackCollisionExists: false })).toBe("create");
  });

  it("rejects invalid bucket configuration", () => {
    expect(() => occurredAtBucket(candidate.occurredAt, 0)).toThrow(RangeError);
  });

  it("rejects raw SMS or unknown fields at the ingestion boundary", () => {
    const result = syncTransactionsSchema.safeParse({
      syncId: "sync-1",
      transactions: [{ clientId: "sms-1", amount: "10.00", direction: "DEBIT", occurredAt: "2026-08-29T13:00:00.000Z", rawSms: "secret message" }],
    });
    expect(result.success).toBe(false);
  });
});
