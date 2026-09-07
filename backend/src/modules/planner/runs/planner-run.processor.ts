import { z } from "zod";
import { AppError } from "../../../shared/errors/app-error";
import { RUN_EVENT_TYPE } from "../../runs/model";
import type { RunService } from "../../runs/run.service";
import {
  analyzePlan as analyzePlanDefault,
  postChatMessage as postChatMessageDefault,
  serializeMessage as serializeMessageDefault,
} from "../planner.service";
import { PlannerRunRequestSchema } from "./planner-run.service";

export const PLANNER_RUN_JOB = {
  chat: "planner_chat",
  analyze: "planner_analyze",
} as const;

export type PlannerRunJobName = (typeof PLANNER_RUN_JOB)[keyof typeof PLANNER_RUN_JOB];

const PlannerRunJobDataSchema = z.object({
  runId: z.string().uuid(),
  householdId: z.string().uuid(),
  userId: z.string().uuid(),
  input: PlannerRunRequestSchema,
});

export interface PlannerRunProcessorDependencies {
  postChatMessage?: typeof postChatMessageDefault;
  analyzePlan?: typeof analyzePlanDefault;
  serializeMessage?: typeof serializeMessageDefault;
}

export function isPlannerRunJob(name: string): name is PlannerRunJobName {
  return name === PLANNER_RUN_JOB.chat || name === PLANNER_RUN_JOB.analyze;
}

function serializeFailure(error: unknown): Record<string, unknown> {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    };
  }
  return {
    code: "PLANNER_RUN_FAILED",
    message: "The planner run could not be completed",
  };
}

export async function processPlannerRunJob(
  name: PlannerRunJobName,
  rawData: unknown,
  runs: RunService,
  dependencies: PlannerRunProcessorDependencies = {},
) {
  const postChatMessage = dependencies.postChatMessage ?? postChatMessageDefault;
  const analyzePlan = dependencies.analyzePlan ?? analyzePlanDefault;
  const serializeMessage = dependencies.serializeMessage ?? serializeMessageDefault;
  const data = PlannerRunJobDataSchema.parse(rawData);

  const existing = await runs.get(data.runId);
  if (existing.status === "cancelled" || existing.cancelRequestedAt) {
    return { status: "cancelled" as const };
  }

  const running = await runs.markRunning(data.runId);
  if (running.status !== "running") {
    return { status: running.status };
  }

  await runs.appendEvent(data.runId, RUN_EVENT_TYPE.started, { name });
  await runs.appendEvent(data.runId, RUN_EVENT_TYPE.stage, { stage: "planning" });

  try {
    const result =
      data.input.kind === "chat"
        ? await postChatMessage(data.householdId, data.userId, {
            message: data.input.message,
            ...(data.input.conversationId ? { conversationId: data.input.conversationId } : {}),
          })
        : await analyzePlan(
            data.householdId,
            data.userId,
            data.input.conversationId ? { conversationId: data.input.conversationId } : {},
          );

    const payload: Record<string, unknown> = {
      conversationId: result.conversationId,
      message: serializeMessage(result.message),
    };

    const latest = await runs.get(data.runId);
    if (latest.status === "cancelled" || latest.cancelRequestedAt) {
      return { status: "cancelled" as const, ...payload };
    }

    await runs.complete(data.runId, payload);
    await runs.appendEvent(data.runId, RUN_EVENT_TYPE.completed, payload);
    return { status: "completed" as const, ...payload };
  } catch (error) {
    const latest = await runs.get(data.runId);
    if (latest.status === "cancelled" || latest.cancelRequestedAt) {
      return { status: "cancelled" as const };
    }

    const failure = serializeFailure(error);
    await runs.fail(data.runId, failure);
    await runs.appendEvent(data.runId, RUN_EVENT_TYPE.failed, failure);
    throw error;
  }
}
