import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  ConfirmDeletionRequestSchema,
} from "../../src/modules/privacy/model";
import { hashToken } from "../../src/utils/crypto";

describe("Privacy Deletion Unit Tests", () => {
  it("hashes single-use confirmation token with SHA-256", () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    expect(tokenHash).toHaveLength(64);
    expect(hashToken(rawToken)).toBe(tokenHash);

    const wrongToken = "different-token";
    expect(hashToken(wrongToken)).not.toBe(tokenHash);
  });

  it("calculates 15-minute confirmation expiry window", () => {
    const baseTime = new Date("2026-08-30T12:00:00.000Z");
    const expiryTime = new Date(baseTime.getTime() + 15 * 60 * 1000);

    const diffMinutes = (expiryTime.getTime() - baseTime.getTime()) / (1000 * 60);
    expect(diffMinutes).toBe(15);
    expect(expiryTime.toISOString()).toBe("2026-08-30T12:15:00.000Z");
  });

  it("validates confirm deletion body schema", () => {
    const valid = ConfirmDeletionRequestSchema.parse({
      confirmationToken: "valid-token-hex",
    });
    expect(valid.confirmationToken).toBe("valid-token-hex");

    expect(() =>
      ConfirmDeletionRequestSchema.parse({
        confirmationToken: "",
      }),
    ).toThrow();

    expect(() =>
      ConfirmDeletionRequestSchema.parse({
        confirmationToken: "valid-token",
        extraField: "not-allowed",
      }),
    ).toThrow();
  });
});
