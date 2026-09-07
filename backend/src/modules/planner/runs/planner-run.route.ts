import { Router } from "express";
import { requireAuth } from "../../../shared/middleware/require-auth";
import type { PlannerRunService } from "./planner-run.service";

export function createPlannerRunRouter(service: PlannerRunService) {
  const router = Router();
  router.use(requireAuth);

  router.post("/", async (req, res) => {
    const run = await service.create(req.auth!.householdId, req.auth!.userId, req.body);
    res.status(202).json({
      data: {
        id: run.id,
        kind: run.kind,
        status: run.status,
        createdAt: run.createdAt.toISOString(),
      },
    });
  });

  return router;
}
