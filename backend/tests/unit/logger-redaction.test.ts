import { describe, expect, it } from "vitest";
import { redactSensitiveData } from "../../src/shared/logger/logger";

describe("Logger Redaction Unit Tests", () => {
  it("redacts sensitive fields in nested objects", () => {
    const input = {
      username: "ada",
      password: "SuperSecretPassword123",
      authToken: "secret-token-xyz",
      objectKey: "documents/123e4567-e89b-12d3-a456-426614174000",
      signedUrl: "https://r2.cloudflare.com/bucket/documents/123?sig=abcdef",
      nested: {
        cookie: "session=xyz",
        refreshToken: "refresh-token-abc",
        normalField: "visible",
      },
    };

    const redacted = redactSensitiveData(input) as any;

    expect(redacted.username).toBe("ada");
    expect(redacted.password).toBe("[REDACTED]");
    expect(redacted.authToken).toBe("[REDACTED]");
    expect(redacted.objectKey).toBe("[REDACTED]");
    expect(redacted.signedUrl).toBe("[REDACTED]");
    expect(redacted.nested.cookie).toBe("[REDACTED]");
    expect(redacted.nested.refreshToken).toBe("[REDACTED]");
    expect(redacted.nested.normalField).toBe("visible");
  });

  it("redacts Bearer tokens embedded in strings", () => {
    const text = "Authorization failed: Bearer secret.token.here with error";
    const redacted = redactSensitiveData(text);
    expect(redacted).toBe("Authorization failed: Bearer [REDACTED] with error");
  });

  it("handles circular references gracefully", () => {
    const obj: any = { name: "test" };
    obj.self = obj;

    const redacted = redactSensitiveData(obj) as any;
    expect(redacted.name).toBe("test");
    expect(redacted.self).toBe("[CIRCULAR]");
  });
});
