import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  refreshSession: vi.fn(),
  subscribeRun: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: { post: mocks.post },
  refreshSession: mocks.refreshSession,
}));

vi.mock("@/lib/sdk", () => ({
  subscribeRun: mocks.subscribeRun,
}));

import {
  PlannerRunError,
  startPlannerRun,
  waitForPlannerRun,
} from "./run.service";

describe("AI planner run service", () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.refreshSession.mockReset().mockResolvedValue(undefined);
    mocks.subscribeRun.mockReset();
  });

  it("creates a planner run through the authenticated API transport", async () => {
    mocks.post.mockResolvedValue({
      data: {
        data: {
          id: "00000000-0000-0000-0000-000000000010",
          kind: "planner_chat",
          status: "queued",
          createdAt: "2026-09-07T05:00:00.000Z",
        },
      },
    });

    const run = await startPlannerRun({ kind: "chat", message: "Can I afford a car?" });

    expect(mocks.post).toHaveBeenCalledWith("/planner/runs", {
      kind: "chat",
      message: "Can I afford a car?",
    });
    expect(run.status).toBe("queued");
  });

  it("resolves only from a valid completed terminal event", async () => {
    mocks.subscribeRun.mockImplementation(async (_origin, _runId, onEvent) => {
      onEvent({ id: "event-1", type: "stage", data: { stage: "planning" } });
      onEvent({
        id: "event-2",
        type: "completed",
        data: { conversationId: "conversation-1", message: { id: "message-1" } },
      });
    });

    await expect(waitForPlannerRun("run-1")).resolves.toEqual({
      conversationId: "conversation-1",
      message: { id: "message-1" },
    });
  });

  it("resumes from the last event id after a transient stream failure", async () => {
    mocks.subscribeRun
      .mockImplementationOnce(async (_origin, _runId, onEvent) => {
        onEvent({ id: "event-1", type: "stage", data: { stage: "planning" } });
        throw new Error("connection reset");
      })
      .mockImplementationOnce(async (_origin, _runId, onEvent, options) => {
        expect(options.lastEventId).toBe("event-1");
        onEvent({
          id: "event-2",
          type: "completed",
          data: { conversationId: "conversation-1", message: { id: "message-1" } },
        });
      });

    await expect(waitForPlannerRun("run-1")).resolves.toMatchObject({
      conversationId: "conversation-1",
    });
    expect(mocks.subscribeRun).toHaveBeenCalledTimes(2);
  });

  it("refreshes the session before reconnecting an unauthorized stream", async () => {
    mocks.subscribeRun
      .mockRejectedValueOnce(new Error("Run stream failed with 401"))
      .mockImplementationOnce(async (_origin, _runId, onEvent) => {
        onEvent({
          id: "event-2",
          type: "completed",
          data: { conversationId: "conversation-1", message: { id: "message-1" } },
        });
      });

    await waitForPlannerRun("run-1");

    expect(mocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(mocks.subscribeRun).toHaveBeenCalledTimes(2);
  });

  it("surfaces backend failure codes instead of fabricating an assistant response", async () => {
    mocks.subscribeRun.mockImplementation(async (_origin, _runId, onEvent) => {
      onEvent({
        id: "event-1",
        type: "failed",
        data: { code: "RISK_POLICY_VIOLATION", message: "Unsafe output rejected" },
      });
    });

    await expect(waitForPlannerRun("run-1")).rejects.toMatchObject({
      name: "PlannerRunError",
      code: "RISK_POLICY_VIOLATION",
      message: "Unsafe output rejected",
    });
  });

  it("treats cancellation as a terminal planner-run error", async () => {
    mocks.subscribeRun.mockImplementation(async (_origin, _runId, onEvent) => {
      onEvent({ id: "event-1", type: "cancelled", data: { status: "cancelled" } });
    });

    await expect(waitForPlannerRun("run-1")).rejects.toEqual(
      new PlannerRunError("RUN_CANCELLED", "Planner run was cancelled"),
    );
  });
});
