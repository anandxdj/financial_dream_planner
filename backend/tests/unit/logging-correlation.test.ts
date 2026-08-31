import { describe, expect, it } from "vitest";
import { isValidRequestId, requestId } from "../../src/shared/middleware/request-id";
import { redactSensitiveData } from "../../src/shared/logger/logger";
import type { Request, Response } from "express";

describe("logging & correlation safety", () => {
  it("validates request ID syntax and bounds", () => {
    expect(isValidRequestId("abc-123_456.XYZ")).toBe(true);
    expect(isValidRequestId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidRequestId("")).toBe(false);
    expect(isValidRequestId("a".repeat(128))).toBe(true);
    expect(isValidRequestId("a".repeat(129))).toBe(false);
    expect(isValidRequestId("invalid<script>")).toBe(false);
    expect(isValidRequestId("invalid; DROP TABLE users;")).toBe(false);
    expect(isValidRequestId("newlines\nnot\nallowed")).toBe(false);
  });

  it("requestId middleware preserves valid and replaces invalid/oversized headers", () => {
    let capturedHeader = "";
    const mockRes = {
      setHeader(name: string, value: string) {
        if (name.toLowerCase() === "x-request-id") capturedHeader = value;
      },
    } as unknown as Response;

    const reqValid = {
      header: (name: string) => (name.toLowerCase() === "x-request-id" ? "valid-custom-id" : undefined),
    } as unknown as Request;

    requestId(reqValid, mockRes, () => {});
    expect(reqValid.requestId).toBe("valid-custom-id");
    expect(capturedHeader).toBe("valid-custom-id");

    const reqInvalid = {
      header: (name: string) => (name.toLowerCase() === "x-request-id" ? "unsafe<tag>" : undefined),
    } as unknown as Request;

    requestId(reqInvalid, mockRes, () => {});
    expect(reqInvalid.requestId).not.toBe("unsafe<tag>");
    expect(reqInvalid.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(capturedHeader).toBe(reqInvalid.requestId);
  });

  it("redacts sensitive fields and tokens in logs", () => {
    const rawData = {
      user: {
        id: "user-123",
        email: "user@example.com",
        password: "SuperSecretPassword123!",
      },
      token: "secret-token-value",
      authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M",
      objectKey: "households/h-1/documents/doc.pdf",
      signedUrl: "https://r2.cloudflarestorage.com/bucket/doc.pdf?signature=secret",
      safeMeta: {
        operation: "upload",
        status: "success",
      },
    };

    const redacted = redactSensitiveData(rawData) as Record<string, unknown>;
    expect((redacted.user as Record<string, unknown>).password).toBe("[REDACTED]");
    expect((redacted.user as Record<string, unknown>).email).toBe("[REDACTED]");
    expect(redacted.token).toBe("[REDACTED]");
    expect(redacted.authorization).toBe("[REDACTED]");
    expect(redacted.objectKey).toBe("[REDACTED]");
    expect(redacted.signedUrl).toBe("[REDACTED]");
    expect(redacted.safeMeta).toEqual({ operation: "upload", status: "success" });
  });

  it("redacts error stack traces in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      const err = new Error("Database connection failed");
      const redacted = redactSensitiveData(err) as Record<string, unknown>;
      expect(redacted.name).toBe("Error");
      expect(redacted.message).toBe("Database connection failed");
      expect(redacted.stack).toBeUndefined();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
