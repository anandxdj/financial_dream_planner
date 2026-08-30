import type { Request, Response } from "express";
import { RecalculatePlanRequestSchema } from "./model";
import * as plansService from "./plans.service";

export async function recalculate(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const input = RecalculatePlanRequestSchema.parse(req.body);
  const result = await plansService.recalculatePlan(householdId, input);

  res.status(200).json({
    data: {
      plan: plansService.serializePlan(result.plan),
      currentVersion: plansService.serializePlanVersion(result.currentVersion),
      snapshot: plansService.serializeSnapshot(result.snapshot),
    },
  });
}

export async function getCurrent(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const result = await plansService.getCurrentPlan(householdId);

  res.status(200).json({
    data: {
      plan: plansService.serializePlan(result.plan),
      currentVersion: plansService.serializePlanVersion(result.currentVersion),
      snapshot: plansService.serializeSnapshot(result.snapshot),
    },
  });
}

export async function getHistory(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const cursor = req.query.cursor as string | undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const result = await plansService.getPlanHistory(householdId, { cursor, limit });

  res.status(200).json({
    data: result.data.map((item) => ({
      version: plansService.serializePlanVersion(item.version),
      snapshot: plansService.serializeSnapshot(item.snapshot),
    })),
    nextCursor: result.nextCursor,
  });
}
