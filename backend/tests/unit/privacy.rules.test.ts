import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { sanitizeDisplayName, serializeDocument } from "../../src/modules/documents/documents.service";
import {
  serializeHouseholdDeletion,
  serializePrivacyExport,
} from "../../src/modules/privacy/privacy.service";
import { redactSensitiveData } from "../../src/shared/logger/logger";

describe("Privacy Rules & Data Protection Unit Tests", () => {
  describe("Display Name Sanitization", () => {
    it("sanitizes valid display names", () => {
      expect(sanitizeDisplayName("  tax_return_2025.pdf  ")).toBe("tax_return_2025.pdf");
      expect(sanitizeDisplayName("Salary Slip - March")).toBe("Salary Slip - March");
    });

    it("rejects empty names or names exceeding 255 chars", () => {
      expect(() => sanitizeDisplayName("   ")).toThrow();
      expect(() => sanitizeDisplayName("a".repeat(256))).toThrow();
    });

    it("rejects control characters such as NUL, backspace, LF, CR", () => {
      expect(() => sanitizeDisplayName("bad\x00name.pdf")).toThrow();
      expect(() => sanitizeDisplayName("bad\x08name.pdf")).toThrow();
      expect(() => sanitizeDisplayName("bad\nname.pdf")).toThrow();
    });
  });

  describe("Token Hashing & Single-Use Secrets", () => {
    it("hashes confirmation token with SHA-256 and never matches raw token", () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      expect(tokenHash).toHaveLength(64);
      expect(tokenHash).not.toBe(rawToken);

      const computedHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      expect(computedHash).toBe(tokenHash);

      const wrongHash = crypto.createHash("sha256").update("wrong-token").digest("hex");
      expect(wrongHash).not.toBe(tokenHash);
    });

    it("calculates exact 15-minute confirmation expiry", () => {
      const now = new Date("2026-08-30T10:00:00.000Z");
      const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

      expect(expiresAt.toISOString()).toBe("2026-08-30T10:15:00.000Z");
      expect((expiresAt.getTime() - now.getTime()) / 60000).toBe(15);
    });
  });

  describe("Structural Redaction & Sensitive Key Masking", () => {
    it("redacts sensitive fields in nested payloads and objects", () => {
      const input = {
        userId: "user-123",
        email: "user@example.com",
        password: "SuperSecretPassword123!",
        token: "jwt-token-value",
        confirmationToken: "conf-token-secret-value",
        objectKey: "documents/1234-5678",
        object_key: "exports/9876-5432.json",
        signedUrl: "https://r2.cloudflarestorage.com/vault/documents/1234?signature=xyz",
        nested: {
          accessToken: "access-token-xyz",
          refreshToken: "refresh-token-abc",
          secretAccessKey: "aws-secret-access-key",
          normalField: "allowed",
        },
      };

      const redacted = redactSensitiveData(input) as any;

      expect(redacted.userId).toBe("user-123");
      expect(redacted.password).toBe("[REDACTED]");
      expect(redacted.token).toBe("[REDACTED]");
      expect(redacted.confirmationToken).toBe("[REDACTED]");
      expect(redacted.objectKey).toBe("[REDACTED]");
      expect(redacted.object_key).toBe("[REDACTED]");
      expect(redacted.signedUrl).toBe("[REDACTED]");
      expect(redacted.nested.accessToken).toBe("[REDACTED]");
      expect(redacted.nested.refreshToken).toBe("[REDACTED]");
      expect(redacted.nested.secretAccessKey).toBe("[REDACTED]");
      expect(redacted.nested.normalField).toBe("allowed");
    });

    it("redacts bearer tokens in string messages", () => {
      const logMessage = "Request authorized with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz";
      const redacted = redactSensitiveData(logMessage);
      expect(redacted).toBe("Request authorized with Bearer [REDACTED]");
    });
  });

  describe("API Serializer Non-Disclosure", () => {
    it("serializes document metadata without exposing private object key", () => {
      const doc = {
        id: "d4b1a1a2-1111-2222-3333-444455556666",
        householdId: "h1b1a1a2-1111-2222-3333-444455556666",
        uploaderUserId: "u1b1a1a2-1111-2222-3333-444455556666",
        displayName: "statement.pdf",
        mediaType: "application/pdf",
        byteSize: 1024,
        checksum: "abc123sha256",
        objectKey: "documents/internal-private-key-do-not-leak",
        status: "available",
        retentionExpiresAt: null,
        createdAt: new Date("2026-08-30T10:00:00.000Z"),
        updatedAt: new Date("2026-08-30T10:00:00.000Z"),
      };

      const serialized = serializeDocument(doc as any);
      expect(serialized).not.toHaveProperty("objectKey");
      expect((serialized as any).objectKey).toBeUndefined();
      expect(serialized.displayName).toBe("statement.pdf");
    });

    it("serializes export record without exposing object key", () => {
      const exp = {
        id: "e4b1a1a2-1111-2222-3333-444455556666",
        householdId: "h1b1a1a2-1111-2222-3333-444455556666",
        requestedByUserId: "u1b1a1a2-1111-2222-3333-444455556666",
        idempotencyKey: "exp-idem-key-1",
        status: "completed",
        attempts: 1,
        objectKey: "exports/private-export-key.json",
        byteSize: 4096,
        checksum: "checksum123",
        failureCode: null,
        failureMessage: null,
        expiresAt: new Date("2026-08-31T10:00:00.000Z"),
        startedAt: new Date("2026-08-30T10:00:00.000Z"),
        completedAt: new Date("2026-08-30T10:01:00.000Z"),
        retentionExpiresAt: new Date("2026-09-29T10:00:00.000Z"),
        createdAt: new Date("2026-08-30T10:00:00.000Z"),
        updatedAt: new Date("2026-08-30T10:01:00.000Z"),
      };

      const serialized = serializePrivacyExport(exp as any);
      expect(serialized).not.toHaveProperty("objectKey");
      expect(serialized.status).toBe("completed");
    });

    it("serializes deletion tombstone without exposing confirmation token hash", () => {
      const del = {
        id: "del-uuid",
        householdId: "h-uuid",
        requestedByUserId: "u-uuid",
        sessionId: "s-uuid",
        idempotencyKey: "del-idem",
        confirmationTokenHash: "super-secret-token-hash",
        confirmationExpiresAt: new Date("2026-08-30T10:15:00.000Z"),
        confirmedAt: new Date("2026-08-30T10:05:00.000Z"),
        status: "queued",
        attempts: 0,
        failureCode: null,
        failureMessage: null,
        startedAt: null,
        completedAt: null,
        retentionExpiresAt: new Date("2026-09-29T10:00:00.000Z"),
        createdAt: new Date("2026-08-30T10:00:00.000Z"),
        updatedAt: new Date("2026-08-30T10:05:00.000Z"),
      };

      const serialized = serializeHouseholdDeletion(del as any);
      expect(serialized).not.toHaveProperty("confirmationTokenHash");
      expect(serialized.status).toBe("queued");
    });
  });
});
