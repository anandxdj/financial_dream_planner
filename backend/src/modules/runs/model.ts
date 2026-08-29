export const RUN_EVENT_TYPE = {
  started: "run.started",
  stage: "stage",
  token: "token",
  evidence: "evidence",
  completed: "completed",
  failed: "failed",
} as const;

export type RunEventType = (typeof RUN_EVENT_TYPE)[keyof typeof RUN_EVENT_TYPE];
