import { beforeEach, describe, expect, it } from "vitest";
import {
  metrics,
  normalizeRoute,
  recordAuthFailure,
  recordHttpRequest,
  recordJobOutcome,
  recordPrivacyOperation,
  recordStorageOperation,
  sanitizeStatusClass,
  setReadinessState,
  verifyMetricsToken,
} from "../../src/modules/metrics/metrics";

describe("Prometheus metrics registry", () => {
  beforeEach(() => {
    metrics.reset();
  });

  it("normalizes route parameters to prevent label explosion", () => {
    expect(normalizeRoute("/api/v1/accounts/123e4567-e89b-12d3-a456-426614174000")).toBe(
      "/api/v1/accounts/:id",
    );
    expect(normalizeRoute("/api/v1/categories/123e4567-e89b-12d3-a456-426614174000?foo=bar")).toBe(
      "/api/v1/categories/:id",
    );
    expect(normalizeRoute("/health")).toBe("/health");
    expect(normalizeRoute("/ready")).toBe("/ready");
    expect(normalizeRoute("/metrics")).toBe("/metrics");
    expect(normalizeRoute("/non-existent/secret-endpoint/12345")).toBe("/other");
  });

  it("sanitizes HTTP status classes", () => {
    expect(sanitizeStatusClass(200)).toBe("2xx");
    expect(sanitizeStatusClass(201)).toBe("2xx");
    expect(sanitizeStatusClass(302)).toBe("3xx");
    expect(sanitizeStatusClass(400)).toBe("4xx");
    expect(sanitizeStatusClass(404)).toBe("4xx");
    expect(sanitizeStatusClass(500)).toBe("5xx");
    expect(sanitizeStatusClass(503)).toBe("5xx");
    expect(sanitizeStatusClass(999)).toBe("unknown");
  });

  it("records HTTP requests and durations correctly", () => {
    recordHttpRequest("GET", "/api/v1/accounts/123e4567-e89b-12d3-a456-426614174000", 200, 0.045);
    recordHttpRequest("GET", "/api/v1/accounts/223e4567-e89b-12d3-a456-426614174000", 200, 0.055);

    const serialized = metrics.serialize();
    expect(serialized).toContain("fdp_http_requests_total");
    expect(serialized).toContain('method="GET",route="/api/v1/accounts/:id",status_class="2xx"} 2');
    expect(serialized).toContain("fdp_http_request_duration_seconds");
  });

  it("records job and privacy outcomes with bounded labels", () => {
    recordJobOutcome("privacy_export", "completed");
    recordJobOutcome("privacy_export", "failed");
    recordJobOutcome("unknown_untrusted_job", "completed");

    recordPrivacyOperation("export", "completed");
    recordPrivacyOperation("deletion", "failed");

    const serialized = metrics.serialize();
    expect(serialized).toContain('name="privacy_export",outcome="completed"} 1');
    expect(serialized).toContain('name="privacy_export",outcome="failed"} 1');
    // Untrusted job mapped to generic_job
    expect(serialized).toContain('name="generic_job",outcome="completed"} 1');
    expect(serialized).toContain('operation="export",outcome="completed"} 1');
    expect(serialized).toContain('operation="deletion",outcome="failed"} 1');
  });

  it("records storage and auth failures safely", () => {
    recordStorageOperation("upload", "success");
    recordStorageOperation("download", "failure");
    recordStorageOperation("arbitrary_op", "failure");

    recordAuthFailure("invalid_credentials");
    recordAuthFailure("csrf_failed");
    recordAuthFailure("unrecognized_reason");

    const serialized = metrics.serialize();
    expect(serialized).toContain('operation="upload",status="success"} 1');
    expect(serialized).toContain('operation="download",status="failure"} 1');
    expect(serialized).toContain('operation="unknown",status="failure"} 1');

    expect(serialized).toContain('reason="invalid_credentials"} 1');
    expect(serialized).toContain('reason="csrf_failed"} 1');
    expect(serialized).toContain('reason="unknown"} 1');
  });

  it("records readiness states and probe failures", () => {
    setReadinessState("database", true);
    setReadinessState("redis", false);

    const serialized = metrics.serialize();
    expect(serialized).toContain('dependency="database"} 1');
    expect(serialized).toContain('dependency="redis"} 0');
    expect(serialized).toContain('fdp_readiness_probe_failures_total{dependency="redis"} 1');
  });

  it("timing-safely verifies bearer token", () => {
    const validToken = "my-super-secret-metrics-token-12345";

    expect(verifyMetricsToken(`Bearer ${validToken}`, validToken)).toBe(true);
    expect(verifyMetricsToken(`bearer ${validToken}`, validToken)).toBe(true);
    expect(verifyMetricsToken("Bearer wrong-token", validToken)).toBe(false);
    expect(verifyMetricsToken("Bearer ", validToken)).toBe(false);
    expect(verifyMetricsToken(undefined, validToken)).toBe(false);
    expect(verifyMetricsToken("", validToken)).toBe(false);
    expect(verifyMetricsToken(`Bearer ${validToken}`, "")).toBe(false);
    // Length mismatch safe handling
    expect(verifyMetricsToken(`Bearer ${validToken}extra`, validToken)).toBe(false);
  });
});
