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
    const cursor = serializeCursor({ id: "0190d6a0-0000-7000-8000-000000000001", createdAt: "2026-08-29T00:00:00.000Z" });
    expect(parseCursor(cursor)).toEqual({ id: "0190d6a0-0000-7000-8000-000000000001", createdAt: "2026-08-29T00:00:00.000Z" });
    expect(() => parseCursor("not-a-cursor")).toThrow(/cursor/i);
  });
});

describe("run API", () => {
  it("returns durable run state and request-correlated errors", async () => {
    const service = new RunService(new InMemoryRunStore());
    const run = await service.create("snapshot", {});
    const app = createApp({ runService: service });

    await request(app).get(`/api/v1/runs/${run.id}`).set("x-request-id", "platform-test").expect(200).expect(({ body, headers }) => {
      expect(body.data.id).toBe(run.id);
      expect(headers["x-request-id"]).toBe("platform-test");
    });
    await request(app).get("/api/v1/runs/00000000-0000-0000-0000-000000000000").set("x-request-id", "missing-run").expect(404).expect(({ body }) => {
      expect(body.error).toMatchObject({ code: "RUN_NOT_FOUND", requestId: "missing-run" });
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
