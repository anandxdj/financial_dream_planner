import type { Request, Response } from "express";
import {
  CreateDriftCheckRequestSchema,
  DriftEventListQuerySchema,
  DriftIdParamsSchema,
  EmptyDriftActionBodySchema,
} from "./model";
import * as driftService from "./drift.service";
import * as plansService from "../plans/plans.service";

function getParamId(req: Request): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

export async function createCheck(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const input = CreateDriftCheckRequestSchema.parse(req.body);
  const result = await driftService.createOrDeduplicateCheck(householdId, input);

  res.status(result.statusCode).json({
    data: driftService.serializeDriftCheck(result.check),
  });
}

export async function getCheckById(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  DriftIdParamsSchema.parse({ id });
  const result = await driftService.getDriftCheckById(householdId, id);

  res.status(200).json({
    data: {
      check: driftService.serializeDriftCheck(result.check),
      event: result.event ? driftService.serializeDriftEvent(result.event) : null,
    },
  });
}

export async function getCurrent(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const event = await driftService.getCurrentPendingDriftEvent(householdId);

  res.status(200).json({
    data: event ? driftService.serializeDriftEvent(event) : null,
  });
}

export async function list(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const query = DriftEventListQuerySchema.parse(req.query);
  const result = await driftService.listDriftEvents(householdId, query);

  res.status(200).json({
    data: result.data.map(driftService.serializeDriftEvent),
    nextCursor: result.nextCursor,
  });
}

export async function accept(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  DriftIdParamsSchema.parse({ id });
  EmptyDriftActionBodySchema.parse(req.body ?? {});
  const result = await driftService.acceptDriftEvent(householdId, id);

  res.status(200).json({
    data: {
      event: driftService.serializeDriftEvent(result.event),
      plan: plansService.serializePlan(result.plan),
      version: plansService.serializePlanVersion(result.version),
      snapshot: plansService.serializeSnapshot(result.snapshot),
    },
  });
}

export async function keep(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  DriftIdParamsSchema.parse({ id });
  EmptyDriftActionBodySchema.parse(req.body ?? {});
  const result = await driftService.keepDriftEvent(householdId, id);

  res.status(200).json({
    data: driftService.serializeDriftEvent(result),
  });
}
