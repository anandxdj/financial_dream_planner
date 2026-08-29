import createClient from "openapi-fetch";
import type { paths } from "./generated/schema";
export type { paths } from "./generated/schema";

export const createApiClient = (baseUrl: string) => createClient<paths>({ baseUrl, credentials: "include" });

export type RunEventType = "run.started" | "stage" | "token" | "evidence" | "completed" | "failed";
export type RunEvent = { id: string; type: RunEventType; data: Record<string, unknown> };
export async function subscribeRun(baseUrl: string, runId: string, onEvent: (event: RunEvent) => void, options: { signal?: AbortSignal; lastEventId?: string; accessToken?: string; maxBufferBytes?: number } = {}) {
  const response = await fetch(`${baseUrl}/api/v1/runs/${encodeURIComponent(runId)}/events`, { signal: options.signal, headers: { Accept: "text/event-stream", ...(options.lastEventId ? { "Last-Event-ID": options.lastEventId } : {}), ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}) } });
  if (!response.ok || !response.body) throw new Error(`Run stream failed with ${response.status}`);
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  const maxBufferBytes = options.maxBufferBytes ?? 1_048_576;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) return;
      buffer += value;
      if (new TextEncoder().encode(buffer).byteLength > maxBufferBytes) throw new Error("Run stream frame exceeds maximum buffer size");
      const frames = buffer.split("\n\n"); buffer = frames.pop() ?? "";
      for (const frame of frames) {
        if (!frame || frame.startsWith(":")) continue;
        const fields = Object.fromEntries(frame.split("\n").map((line) => { const index = line.indexOf(":"); return [line.slice(0, index), line.slice(index + 1).trimStart()]; }));
        if (fields.id && fields.event && fields.data) onEvent({ id: fields.id, type: fields.event as RunEventType, data: JSON.parse(fields.data) as Record<string, unknown> });
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
