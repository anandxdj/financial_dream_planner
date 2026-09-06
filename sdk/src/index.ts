import createClient from "openapi-fetch";
import type { paths } from "./generated/schema";
export type { paths } from "./generated/schema";

/** Generated paths already include /api/v1; pass an origin (or empty string for same-origin). */
export const createApiClient = (baseUrl = "", options: { fetch?: typeof fetch } = {}) =>
  createClient<paths>({ baseUrl: baseUrl.replace(/\/$/, ""), credentials: "include", ...options });

export type RunEventType = "run.started" | "stage" | "token" | "evidence" | "completed" | "failed";
export type RunEvent = { id: string; type: RunEventType; data: Record<string, unknown> };
export async function subscribeRun(baseUrl: string, runId: string, onEvent: (event: RunEvent) => void, options: { signal?: AbortSignal; lastEventId?: string; accessToken?: string; maxBufferBytes?: number } = {}) {
  const origin = baseUrl.replace(/\/$/, "");
  const response = await fetch(`${origin}/api/v1/runs/${encodeURIComponent(runId)}/events`, { credentials: "include", signal: options.signal, headers: { Accept: "text/event-stream", ...(options.lastEventId ? { "Last-Event-ID": options.lastEventId } : {}), ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}) } });
  if (!response.ok || !response.body) throw new Error(`Run stream failed with ${response.status}`);
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  const maxBufferBytes = options.maxBufferBytes ?? 1_048_576;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) return;
      buffer += value;
      if (new TextEncoder().encode(buffer).byteLength > maxBufferBytes) throw new Error("Run stream frame exceeds maximum buffer size");
      const frames = buffer.split(/\r?\n\r?\n/); buffer = frames.pop() ?? "";
      for (const frame of frames) {
        if (!frame || frame.startsWith(":")) continue;
        const fields = new Map<string, string>();
        for (const line of frame.split(/\r?\n/)) {
          const index = line.indexOf(":");
          const key = index < 0 ? line : line.slice(0, index);
          const value = index < 0 ? "" : line.slice(index + 1).trimStart();
          if (key === "data") fields.set(key, `${fields.get(key) ? `${fields.get(key)}\n` : ""}${value}`);
          else fields.set(key, value);
        }
        const id = fields.get("id"); const event = fields.get("event"); const data = fields.get("data");
        if (id && event && data) onEvent({ id, type: event as RunEventType, data: JSON.parse(data) as Record<string, unknown> });
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
