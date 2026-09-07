import { Router } from "express";
import { requireAuth } from "../../shared/middleware/require-auth";
import { RUN_EVENT_TYPE } from "./model";
import type { RunService } from "./run.service";

const TERMINAL_EVENTS = new Set<string>([
  RUN_EVENT_TYPE.completed,
  RUN_EVENT_TYPE.failed,
  RUN_EVENT_TYPE.cancelled,
]);

export function createRunRouter(service: RunService) {
  const router = Router();
  router.use(requireAuth);

  router.get("/:id", async (req, res) => {
    res.json({ data: await service.getForHousehold(req.params.id!, req.auth!.householdId) });
  });

  router.post("/:id/cancel", async (req, res) => {
    const runId = req.params.id!;
    const householdId = req.auth!.householdId;
    const run = await service.cancelForHousehold(runId, householdId);
    if (run.status === "cancelled") {
      const events = await service.eventsAfterForHousehold(runId, householdId);
      if (!events.some((event) => event.type === RUN_EVENT_TYPE.cancelled)) {
        await service.appendEvent(runId, RUN_EVENT_TYPE.cancelled, { status: "cancelled" });
      }
    }
    res.json({ data: run });
  });

  router.get("/:id/events", async (req, res) => {
    const runId = req.params.id!;
    const householdId = req.auth!.householdId;
    await service.getForHousehold(runId, householdId);

    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    let cursor = req.header("last-event-id");
    let stopped = false;
    let pollTimer: NodeJS.Timeout | undefined;
    let heartbeat: NodeJS.Timeout | undefined;

    const stop = () => {
      stopped = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (heartbeat) clearInterval(heartbeat);
    };

    const poll = async (): Promise<void> => {
      if (stopped) return;
      try {
        for (const event of await service.eventsAfterKnownRun(runId, cursor)) {
          res.write(
            `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`,
          );
          cursor = event.id;
          if (TERMINAL_EVENTS.has(event.type)) {
            stop();
            res.end();
            return;
          }
        }
        pollTimer = setTimeout(() => void poll(), 1000);
      } catch {
        stop();
        res.end();
      }
    };

    await poll();
    if (!stopped) {
      heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 15000);
    }
    req.on("close", stop);
  });

  return router;
}
