import { describe, expect, it, vi } from "vitest";
import { checkLiveness, checkReadiness } from "../../src/modules/health/health.service";
import { metrics } from "../../src/modules/metrics/metrics";

describe("operational health & readiness", () => {
  it("checkLiveness returns ok without touching any dependencies", () => {
    const liveness = checkLiveness();
    expect(liveness).toEqual({ status: "ok" });
    // Verify no version, credentials, or internal details
    expect(Object.keys(liveness)).toEqual(["status"]);
  });

  it("checkReadiness returns 200 ready when all probes succeed", async () => {
    metrics.reset();
    const checkDb = vi.fn().mockResolvedValue(true);
    const checkRedis = vi.fn().mockResolvedValue(true);

    const result = await checkReadiness({ checkDb, checkRedis });

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      status: "ready",
      checks: {
        database: "ready",
        redis: "ready",
      },
    });
    expect(checkDb).toHaveBeenCalled();
    expect(checkRedis).toHaveBeenCalled();
    expect(metrics.readinessState.get({ dependency: "database" })).toBe(1);
    expect(metrics.readinessState.get({ dependency: "redis" })).toBe(1);
  });

  it("checkReadiness returns 503 when database probe fails", async () => {
    metrics.reset();
    const checkDb = vi.fn().mockRejectedValue(new Error("Database connection lost"));
    const checkRedis = vi.fn().mockResolvedValue(true);

    const result = await checkReadiness({ checkDb, checkRedis });

    expect(result.statusCode).toBe(503);
    expect(result.body).toEqual({
      status: "not_ready",
      checks: {
        database: "not_ready",
        redis: "ready",
      },
    });
    // Ensure raw error message is never exposed in response
    expect(JSON.stringify(result.body)).not.toContain("Database connection lost");
    expect(metrics.readinessState.get({ dependency: "database" })).toBe(0);
    expect(metrics.readinessProbeFailuresTotal.get({ dependency: "database" })).toBe(1);
  });

  it("checkReadiness returns 503 when redis probe fails", async () => {
    metrics.reset();
    const checkDb = vi.fn().mockResolvedValue(true);
    const checkRedis = vi.fn().mockRejectedValue(new Error("Redis ECONNREFUSED"));

    const result = await checkReadiness({ checkDb, checkRedis });

    expect(result.statusCode).toBe(503);
    expect(result.body).toEqual({
      status: "not_ready",
      checks: {
        database: "ready",
        redis: "not_ready",
      },
    });
    expect(JSON.stringify(result.body)).not.toContain("ECONNREFUSED");
    expect(metrics.readinessState.get({ dependency: "redis" })).toBe(0);
    expect(metrics.readinessProbeFailuresTotal.get({ dependency: "redis" })).toBe(1);
  });

  it("checkReadiness returns 503 when server is shutting down", async () => {
    metrics.reset();
    const checkDb = vi.fn().mockResolvedValue(true);
    const checkRedis = vi.fn().mockResolvedValue(true);
    const isShuttingDown = () => true;

    const result = await checkReadiness({ checkDb, checkRedis, isShuttingDown });

    expect(result.statusCode).toBe(503);
    expect(result.body).toEqual({
      status: "not_ready",
      checks: {
        database: "not_ready",
        redis: "not_ready",
      },
    });
    // Probes should not even be called when shutting down
    expect(checkDb).not.toHaveBeenCalled();
    expect(checkRedis).not.toHaveBeenCalled();
  });

  it("checkReadiness fails closed on timeout", async () => {
    metrics.reset();
    const checkDb = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 200)),
    );
    const checkRedis = vi.fn().mockResolvedValue(true);

    const result = await checkReadiness({ checkDb, checkRedis }, 50);

    expect(result.statusCode).toBe(503);
    expect(result.body.checks.database).toBe("not_ready");
    expect(result.body.status).toBe("not_ready");
  });
});
