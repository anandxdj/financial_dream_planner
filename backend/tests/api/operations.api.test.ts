import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { env } from "../../src/config/env";

describe("operational endpoints API (/health, /ready, /metrics)", () => {
  it("GET /health returns 200 ok and echoes x-request-id", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/health")
      .set("x-request-id", "test-req-12345");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
    expect(res.headers["x-request-id"]).toBe("test-req-12345");
  });

  it("GET /ready returns 200 when probes pass", async () => {
    const app = createApp({
      health: {
        checkDb: async () => true,
        checkRedis: async () => true,
      },
    });

    const res = await request(app).get("/ready");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "ready",
      checks: {
        database: "ready",
        redis: "ready",
      },
    });
  });

  it("GET /ready returns 503 when a probe fails", async () => {
    const app = createApp({
      health: {
        checkDb: async () => false,
        checkRedis: async () => true,
      },
    });

    const res = await request(app).get("/ready");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      status: "not_ready",
      checks: {
        database: "not_ready",
        redis: "ready",
      },
    });
  });

  it("GET /metrics returns 404 when disabled or unauthorized", async () => {
    const app = createApp();

    // With disabled metrics or no token -> 404
    const resNoToken = await request(app).get("/metrics");
    expect(resNoToken.status).toBe(404);

    const resWrongToken = await request(app)
      .get("/metrics")
      .set("Authorization", "Bearer wrong-token-12345");
    expect(resWrongToken.status).toBe(404);
  });

  it("GET /metrics returns 200 with Prometheus text when enabled with valid token", async () => {
    const originalEnabled = env.METRICS_ENABLED;
    const originalToken = env.METRICS_BEARER_TOKEN;

    try {
      (env as any).METRICS_ENABLED = true;
      (env as any).METRICS_BEARER_TOKEN = "test-metrics-bearer-token-12345";

      const app = createApp();
      const res = await request(app)
        .get("/metrics")
        .set("Authorization", "Bearer test-metrics-bearer-token-12345");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/plain");
      expect(res.text).toContain("fdp_http_requests_total");
      expect(res.text).toContain("fdp_readiness_state");
    } finally {
      (env as any).METRICS_ENABLED = originalEnabled;
      (env as any).METRICS_BEARER_TOKEN = originalToken;
    }
  });
});
