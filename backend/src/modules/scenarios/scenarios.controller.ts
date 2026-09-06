import type { Request, Response } from "express";
import { z } from "zod";
import { CreateScenarioRequestSchema, CompareScenariosRequestSchema, UpdateScenarioRequestSchema } from "./model";
import * as scenariosService from "./scenarios.service";
import * as plansService from "../plans/plans.service";

const IdParamsSchema = z.object({ id: z.string().uuid() });

function getParamId(req: Request): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

export async function create(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const input = CreateScenarioRequestSchema.parse(req.body);
  const result = await scenariosService.createScenario(householdId, input);

  res.status(201).json({
    data: scenariosService.serializeScenario(result),
  });
}

export async function list(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const results = await scenariosService.listScenarios(householdId);

  res.status(200).json({
    data: results.map(scenariosService.serializeScenario),
  });
}

export async function getById(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  IdParamsSchema.parse({ id });
  const result = await scenariosService.getScenarioById(householdId, id);

  res.status(200).json({
    data: scenariosService.serializeScenario(result),
  });
}

export async function update(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  IdParamsSchema.parse({ id });
  const body = { ...req.body };
  const expectedRevision = body.expectedRevision !== undefined
    ? Number(body.expectedRevision)
    : req.header("if-match") ? Number(req.header("if-match")) : undefined;
  delete body.expectedRevision;
  const parsed = UpdateScenarioRequestSchema.parse(body);
  const result = await scenariosService.updateScenario(householdId, id, parsed, expectedRevision);

  res.status(200).json({
    data: scenariosService.serializeScenario(result),
  });
}

export async function remove(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  IdParamsSchema.parse({ id });
  await scenariosService.deleteScenario(householdId, id);

  res.status(204).send();
}

export async function run(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  IdParamsSchema.parse({ id });
  const result = await scenariosService.runScenario(householdId, id);

  res.status(200).json({
    data: result,
  });
}

export async function compare(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const { scenarioIds } = CompareScenariosRequestSchema.parse(req.body);
  const result = await scenariosService.compareScenarios(householdId, scenarioIds);

  res.status(200).json({
    data: result,
  });
}

export async function apply(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  IdParamsSchema.parse({ id });

  const expectedRevision = req.body?.expectedRevision !== undefined
    ? Number(req.body.expectedRevision)
    : undefined;
  const expectedPlanningRevision = req.body?.expectedPlanningRevision !== undefined
    ? Number(req.body.expectedPlanningRevision)
    : undefined;

  const result = await scenariosService.applyScenario(householdId, id, {
    expectedRevision,
    expectedPlanningRevision,
    userId: req.auth!.userId,
  });

  res.status(200).json({
    data: {
      plan: plansService.serializePlan(result.plan),
      version: plansService.serializePlanVersion(result.version),
      snapshot: plansService.serializeSnapshot(result.snapshot),
    },
  });
}
