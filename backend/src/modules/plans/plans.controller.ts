import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/app-error";
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
      driftSummary: item.driftSummary ?? null,
    })),
    nextCursor: result.nextCursor,
  });
}

export async function getVersionById(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const versionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await plansService.getPlanVersionById(householdId, versionId);

  res.status(200).json({
    data: {
      version: plansService.serializePlanVersion(result.version),
      snapshot: plansService.serializeSnapshot(result.snapshot),
      isCurrent: result.isCurrent,
      drift: result.drift,
    },
  });
}

export async function restore(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const versionId = paramId || req.body?.versionId;
  if (!versionId) {
    throw new AppError(400, "VERSION_ID_REQUIRED", "versionId is required");
  }

  const expectedRevision = req.body?.expectedRevision !== undefined
    ? Number(req.body.expectedRevision)
    : undefined;

  const result = await plansService.restorePlanVersion(householdId, versionId, {
    expectedRevision,
    userId: req.auth!.userId,
  });

  res.status(200).json({
    data: {
      plan: plansService.serializePlan(result.plan),
      currentVersion: plansService.serializePlanVersion(result.currentVersion),
      snapshot: plansService.serializeSnapshot(result.snapshot),
    },
  });
}
