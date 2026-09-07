import { API_ORIGIN } from "@/constants/api";
import { api } from "@/lib/api";
import { subscribeRun, type RunEvent } from "@/lib/sdk";

export type PlannerRunRequest =
  | { kind: "chat"; message: string; conversationId?: string }
  | { kind: "analyze"; conversationId?: string };

export interface PlannerRunCreated {
  id: string;
  kind: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  createdAt: string;
}

export interface PlannerRunCompletedPayload {
  conversationId: string;
  message: Record<string, unknown>;
}

export class PlannerRunError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PlannerRunError";
    this.code = code;
  }
}

function isCompletedPayload(value: Record<string, unknown>): value is PlannerRunCompletedPayload {
  return typeof value.conversationId === "string" && Boolean(value.message) && typeof value.message === "object";
}

export async function startPlannerRun(input: PlannerRunRequest): Promise<PlannerRunCreated> {
  const response = await api.post<{ data: PlannerRunCreated }>("/planner/runs", input);
  return response.data.data;
}

export async function cancelPlannerRun(runId: string) {
  const response = await api.post(`/runs/${encodeURIComponent(runId)}/cancel`);
  return response.data.data;
}

export async function waitForPlannerRun(
  runId: string,
  options: {
    signal?: AbortSignal;
    onEvent?: (event: RunEvent) => void;
    maxReconnects?: number;
  } = {},
): Promise<PlannerRunCompletedPayload> {
  const maxReconnects = options.maxReconnects ?? 2;
  let lastEventId: string | undefined;
  let terminal:
    | { type: "completed"; data: PlannerRunCompletedPayload }
    | { type: "failed"; code: string; message: string }
    | { type: "cancelled" }
    | undefined;

  for (let attempt = 0; attempt <= maxReconnects && !terminal; attempt += 1) {
    try {
      await subscribeRun(
        API_ORIGIN,
        runId,
        (event) => {
          lastEventId = event.id;
          options.onEvent?.(event);

          if (event.type === "completed") {
            if (!isCompletedPayload(event.data)) {
              terminal = {
                type: "failed",
                code: "INVALID_RUN_RESULT",
                message: "Planner run completed without a valid result",
              };
              return;
            }
            terminal = { type: "completed", data: event.data };
            return;
          }

          if (event.type === "failed") {
            terminal = {
              type: "failed",
              code: typeof event.data.code === "string" ? event.data.code : "PLANNER_RUN_FAILED",
              message:
                typeof event.data.message === "string"
                  ? event.data.message
                  : "The planner run could not be completed",
            };
            return;
          }

          if (event.type === "cancelled") {
            terminal = { type: "cancelled" };
          }
        },
        {
          signal: options.signal,
          ...(lastEventId ? { lastEventId } : {}),
        },
      );
    } catch (error) {
      if (options.signal?.aborted) throw error;
      if (attempt >= maxReconnects) throw error;
      continue;
    }
  }

  if (!terminal) {
    throw new PlannerRunError("RUN_STREAM_ENDED", "Planner run stream ended before completion");
  }
  if (terminal.type === "failed") {
    throw new PlannerRunError(terminal.code, terminal.message);
  }
  if (terminal.type === "cancelled") {
    throw new PlannerRunError("RUN_CANCELLED", "Planner run was cancelled");
  }
  return terminal.data;
}

export async function executePlannerRun(
  input: PlannerRunRequest,
  options: {
    signal?: AbortSignal;
    onEvent?: (event: RunEvent) => void;
  } = {},
) {
  const run = await startPlannerRun(input);
  const result = await waitForPlannerRun(run.id, options);
  return { run, result };
}
