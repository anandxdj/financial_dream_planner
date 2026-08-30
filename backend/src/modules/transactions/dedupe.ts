import { createHash } from "node:crypto";

export type TransactionDirection = "DEBIT" | "CREDIT";

export interface DedupeCandidate {
  householdId: string;
  accountId: string;
  amount: string;
  direction: TransactionDirection;
  merchantName?: string;
  occurredAt: Date;
  externalReference?: string;
}

export function normalizeExternalReference(value: string | undefined) {
  const normalized = value?.trim().toUpperCase();
  return normalized || null;
}

export function normalizeMerchant(value: string | undefined) {
  const normalized = value?.trim().toUpperCase().replace(/[^A-Z0-9]+/g, " ").replace(/\s+/g, " ");
  return normalized || null;
}

export function occurredAtBucket(value: Date, bucketMinutes = 5) {
  if (!Number.isInteger(bucketMinutes) || bucketMinutes <= 0) throw new RangeError("bucketMinutes must be a positive integer");
  return Math.floor(value.getTime() / (bucketMinutes * 60_000));
}

export function fallbackFingerprint(candidate: DedupeCandidate) {
  const merchant = normalizeMerchant(candidate.merchantName) ?? "";
  const material = [candidate.householdId, candidate.accountId, candidate.amount, candidate.direction, merchant, occurredAtBucket(candidate.occurredAt)].join("\u001f");
  return createHash("sha256").update(material).digest("hex");
}

export function classifyCandidate(input: { candidate: DedupeCandidate; exactReferenceExists: boolean; fallbackCollisionExists: boolean }) {
  if (normalizeExternalReference(input.candidate.externalReference) && input.exactReferenceExists) return "duplicate" as const;
  if (!normalizeExternalReference(input.candidate.externalReference) && input.fallbackCollisionExists) return "needs_review" as const;
  return "create" as const;
}
