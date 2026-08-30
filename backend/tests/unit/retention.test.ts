import { describe, expect, it } from "vitest";
import {
  computeFreshnessExpiresAt,
  computeRetentionExpiresAt,
  sanitizeInputString,
} from "../../src/modules/research/research.service";

describe("Retention & Freshness Policy Unit Tests", () => {
  it("calculates 90-day retention expiration exactly from injected base date", () => {
    const baseDate = new Date("2026-08-30T10:00:00.000Z");
    const retentionDate = computeRetentionExpiresAt(baseDate, 90);

    const diffDays = (retentionDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(90);
    expect(retentionDate.toISOString()).toBe("2026-11-28T10:00:00.000Z");
  });

  it("calculates 30-day evidence freshness expiration exactly", () => {
    const baseDate = new Date("2026-08-30T10:00:00.000Z");
    const freshnessDate = computeFreshnessExpiresAt(baseDate, 30);

    const diffDays = (freshnessDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(30);
    expect(freshnessDate.toISOString()).toBe("2026-09-29T10:00:00.000Z");
  });

  it("sanitizes input strings and rejects NUL or forbidden control characters", () => {
    expect(sanitizeInputString("  Hello World  ")).toBe("Hello World");
    try {
      sanitizeInputString("Hello\x00World");
      expect.unreachable("Should have thrown error");
    } catch (err: any) {
      expect(err.code).toBe("INVALID_INPUT");
      expect(err.statusCode).toBe(400);
    }
    try {
      sanitizeInputString("Test\x08Invalid");
      expect.unreachable("Should have thrown error");
    } catch (err: any) {
      expect(err.code).toBe("INVALID_INPUT");
      expect(err.statusCode).toBe(400);
    }
  });
});
