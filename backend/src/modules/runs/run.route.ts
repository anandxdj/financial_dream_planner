import { Router } from "express";
import type { RunService } from "./run.service";

export function createRunRouter(service: RunService) {
  const router = Router();
  router.get("/:id", async (req, res) => { res.json({ data: await service.get(req.params.id!) }); });
  router.post("/:id/cancel", async (req, res) => { res.json({ data: await service.cancel(req.params.id!) }); });
  router.get("/:id/events", async (req, res) => {
    const runId = req.params.id!;
    await service.get(runId);
    res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    res.flushHeaders();
    let cursor = req.header("last-event-id");
    let stopped = false;
    let pollTimer: NodeJS.Timeout | undefined;
    const poll = async (): Promise<void> => {
      if (stopped) return;
      try {
        for (const event of await service.eventsAfterKnownRun(runId, cursor)) {
          res.write(`id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`);
          cursor = event.id;
        }
        pollTimer = setTimeout(() => void poll(), 1000);
      } catch { res.end(); }
    };
    await poll();
    const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 15000);
    req.on("close", () => { stopped = true; if (pollTimer) clearTimeout(pollTimer); clearInterval(heartbeat); });
  });
  return router;
}
