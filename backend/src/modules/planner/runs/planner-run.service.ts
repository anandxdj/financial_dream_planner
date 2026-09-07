import { z } from "zod";
import { AppError } from "../../../shared/errors/app-error";
import { durableJobOptions } from "../../jobs/queue";
import { RUN_EVENT_TYPE } from "../../runs/model";
import type { RunService } from "../../runs/run.service";

export const PlannerRunRequestSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("chat"),
      message: z.string().trim().min(1).max(4000),
      conversationId: z.string().uuid().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("analyze"),
      conversationId: z.string().uuid().optional(),
    })
    .strict(),
]);

export type PlannerRunRequest = z.infer<typeof PlannerRunRequestSchema>;

export interface PlannerRunQueue {
  add(
    name: string,
    data: Record<string, unknown>,
    options?: { jobId?: string },
  ): Promise<unknown>;
}

export class PlannerRunService {
  constructor(
    private readonly runs: RunService,
    private readonly queue: PlannerRunQueue,
  ) {}

  async create(householdId: string, userId: string, rawInput: unknown) {
    const input = PlannerRunRequestSchema.parse(rawInput);
    const jobName = input.kind === "chat" ? "planner_chat" : "planner_analyze";
    const runInput: Record<string, unknown> = {
      householdId,
      userId,
      plannerKind: input.kind,
      ...(input.conversationId ? { conversationId: input.conversationId } : {}),
      ...(input.kind === "chat" ? { message: input.message } : {}),
    };

    const run = await this.runs.create(jobName, runInput);

    try {
      await this.runs.appendEvent(run.id, RUN_EVENT_TYPE.stage, { stage: "queued" });
      await this.queue.add(
        jobName,
        {
          runId: run.id,
          householdId,
          userId,
          input,
        },
        durableJobOptions(run.id),
      );
      return run;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to queue planner run";
      await this.runs.fail(run.id, { code: "QUEUE_UNAVAILABLE", message });
      await this.runs.appendEvent(run.id, RUN_EVENT_TYPE.failed, {
        code: "QUEUE_UNAVAILABLE",
        message,
      });
      throw new AppError(503, "QUEUE_UNAVAILABLE", "Unable to queue planner run");
    }
  }
}
