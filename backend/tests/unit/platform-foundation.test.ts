import { describe, expect, it } from "vitest";
import { DecimalAmount, parseCursor, serializeCursor } from "../../src/shared/api/primitives";
import { InMemoryRunStore, RunService } from "../../src/modules/runs/run.service";
import { createApp } from "../../src/app";
import request from "supertest";
import { RUN_EVENT_TYPE } from "../../src/modules/runs/model";

describe("platform primitives", () => {
  it("keeps decimal arithmetic exact and serializes fixed scale", () => {
    expect(DecimalAmount.from("0.10").add("0.20").toString()).toBe("0.30");
    expect(() => DecimalAmount.from("1.001")).toThrow(/two decimal places/i);
  });

  it("round-trips opaque cursors and rejects malformed values", () => {
    const cursor = serializeCursor({
      id: "0190d6a0-0000-7000-8000-000000000001",
      createdAt: "2026-08-29T00:00:00.000Z",
    });
    expect(parseCursor(cursor)).toEqual({
      id: "0190d6a0-0000-7000-8000-000000000001",
      createdAt: "2026-08-29T00:00:00.000Z",
    });
    expect(() => parseCursor("not-a-cursor")).toThrow(/cursor/i);
  });
});

describe("run API", () => {
  it("requires authentication before exposing durable run state", async () => {
    const service = new RunService(new InMemoryRunStore());
    const run = await service.create("snapshot", { householdId: "household-1" });
    const app = createApp({ runService: service });

    await request(app)
      .get(`/api/v1/runs/${run.id}`)
      .set("x-request-id", "platform-test")
      .expect(401)
      .expect(({ body, headers }) => {
        expect(body.error.code).toBe("UNAUTHORIZED");
        expect(headers["x-request-id"]).toBe("platform-test");
      });
  });
});

describe("durable run service", () => {
  it("orders events, resumes after an event id, and cancels once", async () => {
    const service = new RunService(new InMemoryRunStore());
    const run = await service.create("planner", { householdId: "household-1" });
    const first = await service.appendEvent(run.id, RUN_EVENT_TYPE.started, { stage: "queued" });
    const second = await service.appendEvent(run.id, RUN_EVENT_TYPE.stage, { stage: "working" });

    expect((await service.eventsAfter(run.id, first.id)).map((event) => event.id)).toEqual([second.id]);
    expect((await service.cancel(run.id)).status).toBe("cancelled");
    expect((await service.cancel(run.id)).status).toBe("cancelled");
  });

  it("scopes run lookup and cancellation to the owning household", async () => {
    const service = new RunService(new InMemoryRunStore());
    const run = await service.create("planner", { householdId: "household-1" });

    expect((await service.getForHousehold(run.id, "household-1")).id).toBe(run.id);
    await expect(service.getForHousehold(run.id, "household-2")).rejects.toMatchObject({
      code: "RUN_NOT_FOUND",
    });
    await expect(service.cancelForHousehold(run.id, "household-2")).rejects.toMatchObject({
      code: "RUN_NOT_FOUND",
    });
  });

  it("does not rewrite terminal runs when cancellation arrives late", async () => {
    const store = new InMemoryRunStore();
    const service = new RunService(store);
    const run = await service.create("planner", {});
    run.status = "completed";
    run.completedAt = new Date("2026-08-29T00:00:00.000Z");

    const unchanged = await service.cancel(run.id);
    expect(unchanged.status).toBe("completed");
    expect(unchanged.cancelRequestedAt).toBeNull();
  });
});
