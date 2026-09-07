import { API_ORIGIN } from "@/constants/api";
import { api, refreshSession } from "@/lib/api";
import { subscribeRun, type RunEvent } from "@/lib/sdk";

export type PlannerRunRequest =
  | { kind: "chat"; message: string; conversationId?: string }
  | { kind: "analyze"; conversationId?: string };

export type PlannerRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface PlannerRunCreated {
  id: string;
  kind: string;
  status: PlannerRunStatus;
  createdAt: string;
}

export interface PlannerRunState extends PlannerRunCreated {
  result: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
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
  return (
    typeof value.conversationId === "string" &&
    Boolean(value.message) &&
    typeof value.message === "object"
  );
}

function isUnauthorizedStreamError(error: unknown) {
  return error instanceof Error && /run stream failed with 401/i.test(error.message);
}

function failureFromRun(run: PlannerRunState) {
  return new PlannerRunError(
    typeof run.error?.code === "string" ? run.error.code : "PLANNER_RUN_FAILED",
    typeof run.error?.message === "string"
      ? run.error.message
      : "The planner run could not be completed",
  );
}

export async function startPlannerRun(input: PlannerRunRequest): Promise<PlannerRunCreated> {
  const response = await api.post<{ data: PlannerRunCreated }>("/planner/runs", input);
  return response.data.data;
}

export async function getPlannerRun(runId: string): Promise<PlannerRunState> {
  const response = await api.get<{ data: PlannerRunState }>(`/runs/${encodeURIComponent(runId)}`);
  return response.data.data;
}

export async function cancelPlannerRun(runId: string) {
  const response = await api.post(`/runs/${encodeURIComponent(runId)}/cancel`);
  return response.data.data;
}

async function recoverTerminalRun(runId: string): Promise<PlannerRunCompletedPayload | undefined> {
  const run = await getPlannerRun(runId);
  if (run.status === "completed") {
    if (!run.result || !isCompletedPayload(run.result)) {
      throw new PlannerRunError(
        "INVALID_RUN_RESULT",
        "Planner run completed without a valid result",
      );
    }
    return run.result;
  }
  if (run.status === "failed") throw failureFromRun(run);
  if (run.status === "cancelled") {
    throw new PlannerRunError("RUN_CANCELLED", "Planner run was cancelled");
  }
  return undefined;
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

      if (!terminal) {
        const recovered = await recoverTerminalRun(runId);
        if (recovered) return recovered;
      }
    } catch (error) {
      if (options.signal?.aborted) throw error;
      if (error instanceof PlannerRunError) throw error;
      if (isUnauthorizedStreamError(error)) {
        await refreshSession();
      }
      try {
        const recovered = await recoverTerminalRun(runId);
        if (recovered) return recovered;
      } catch (recoveryError) {
        if (recoveryError instanceof PlannerRunError) throw recoveryError;
      }
      if (attempt >= maxReconnects) throw error;
      continue;
    }
  }

  if (!terminal) {
    const recovered = await recoverTerminalRun(runId);
    if (recovered) return recovered;
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
