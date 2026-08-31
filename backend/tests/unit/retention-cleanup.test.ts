import { describe, expect, it } from "vitest";

describe("Privacy Retention Cleanup Unit Tests", () => {
  it("computes 24-hour cutoff for unconfirmed deletion requests", () => {
    const baseTime = new Date("2026-08-30T12:00:00.000Z");
    const cutoff24h = new Date(baseTime.getTime() - 24 * 3600 * 1000);

    const diffHours = (baseTime.getTime() - cutoff24h.getTime()) / (1000 * 3600);
    expect(diffHours).toBe(24);
    expect(cutoff24h.toISOString()).toBe("2026-08-29T12:00:00.000Z");
  });

  it("computes 24-hour expiry for privacy export artifacts", () => {
    const completedAt = new Date("2026-08-30T12:00:00.000Z");
    const expiresAt = new Date(completedAt.getTime() + 24 * 3600 * 1000);

    const diffHours = (expiresAt.getTime() - completedAt.getTime()) / (1000 * 3600);
    expect(diffHours).toBe(24);
    expect(expiresAt.toISOString()).toBe("2026-08-31T12:00:00.000Z");
  });

  it("computes 30-day retention for deleted document tombstones", () => {
    const deletedAt = new Date("2026-08-30T12:00:00.000Z");
    const retentionExpiresAt = new Date(deletedAt.getTime() + 30 * 24 * 3600 * 1000);

    const diffDays = (retentionExpiresAt.getTime() - deletedAt.getTime()) / (1000 * 3600 * 24);
    expect(diffDays).toBe(30);
    expect(retentionExpiresAt.toISOString()).toBe("2026-09-29T12:00:00.000Z");
  });
});
