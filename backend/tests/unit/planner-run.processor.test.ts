import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../src/shared/errors/app-error";
import {
  PLANNER_RUN_JOB,
  processPlannerRunJob,
} from "../../src/modules/planner/runs/planner-run.processor";
import { RUN_EVENT_TYPE } from "../../src/modules/runs/model";
import { InMemoryRunStore, RunService } from "../../src/modules/runs/run.service";

const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";
const USER_ID = "00000000-0000-0000-0000-000000000002";
const CONVERSATION_ID = "00000000-0000-0000-0000-000000000003";

function plannerChatJob(runId: string) {
  return {
    runId,
    householdId: HOUSEHOLD_ID,
    userId: USER_ID,
    input: {
      kind: "chat" as const,
      message: "Can I afford a car?",
    },
  };
}

describe("planner run processor", () => {
  it("moves a queued chat run through running to completed and emits terminal payload", async () => {
    const runs = new RunService(new InMemoryRunStore());
    const run = await runs.create(PLANNER_RUN_JOB.chat, { householdId: HOUSEHOLD_ID });
    const postChatMessage = vi.fn().mockResolvedValue({
      conversationId: CONVERSATION_ID,
      message: { id: "message-1" },
    });
    const serializeMessage = vi.fn().mockReturnValue({ id: "message-1", content: "Engine-backed answer" });

    const outcome = await processPlannerRunJob(
      PLANNER_RUN_JOB.chat,
      plannerChatJob(run.id),
      runs,
      {
        postChatMessage: postChatMessage as any,
        serializeMessage: serializeMessage as any,
      },
    );

    expect(outcome.status).toBe("completed");
    expect(postChatMessage).toHaveBeenCalledWith(
      HOUSEHOLD_ID,
      USER_ID,
      { message: "Can I afford a car?" },
    );
    expect((await runs.get(run.id)).status).toBe("completed");
    const events = await runs.eventsAfter(run.id);
    expect(events.map((event) => event.type)).toEqual([
      RUN_EVENT_TYPE.started,
      RUN_EVENT_TYPE.stage,
      RUN_EVENT_TYPE.completed,
    ]);
    expect(events.at(-1)?.payload).toMatchObject({
      conversationId: CONVERSATION_ID,
      message: { id: "message-1", content: "Engine-backed answer" },
    });
  });

  it("marks a failed planner run and publishes a safe failure event", async () => {
    const runs = new RunService(new InMemoryRunStore());
    const run = await runs.create(PLANNER_RUN_JOB.chat, { householdId: HOUSEHOLD_ID });
    const error = new AppError(422, "RISK_POLICY_VIOLATION", "Unsafe output rejected");

    await expect(
      processPlannerRunJob(PLANNER_RUN_JOB.chat, plannerChatJob(run.id), runs, {
        postChatMessage: vi.fn().mockRejectedValue(error) as any,
      }),
    ).rejects.toBe(error);

    const failedRun = await runs.get(run.id);
    expect(failedRun.status).toBe("failed");
    expect(failedRun.error).toMatchObject({ code: "RISK_POLICY_VIOLATION", statusCode: 422 });
    expect((await runs.eventsAfter(run.id)).at(-1)).toMatchObject({
      type: RUN_EVENT_TYPE.failed,
      payload: { code: "RISK_POLICY_VIOLATION", statusCode: 422 },
    });
  });

  it("does not execute planner work after a run has already been cancelled", async () => {
    const runs = new RunService(new InMemoryRunStore());
    const run = await runs.create(PLANNER_RUN_JOB.chat, { householdId: HOUSEHOLD_ID });
    await runs.cancel(run.id);
    const postChatMessage = vi.fn();

    const outcome = await processPlannerRunJob(
      PLANNER_RUN_JOB.chat,
      plannerChatJob(run.id),
      runs,
      { postChatMessage: postChatMessage as any },
    );

    expect(outcome.status).toBe("cancelled");
    expect(postChatMessage).not.toHaveBeenCalled();
  });
});
