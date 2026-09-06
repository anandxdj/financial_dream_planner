import type { Request, Response } from "express";
import { z } from "zod";
import {
  CreateLoanRequestSchema,
  UpdateLoanRequestSchema,
  PrepaymentSimulationRequestSchema,
  CreatePrepaymentScenarioRequestSchema,
} from "./model";
import * as loansService from "./loans.service";
import { serializeScenario } from "../scenarios/scenarios.service";

const IdParamsSchema = z.object({ id: z.string().uuid() });

function getParamId(req: Request): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

export async function list(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const result = await loansService.listLoans(householdId);

  res.status(200).json({
    data: result.loans.map(loansService.serializeLoan),
    summary: result.summary,
  });
}

export async function getById(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  IdParamsSchema.parse({ id });
  const loan = await loansService.getLoanById(householdId, id);

  res.status(200).json({
    data: loansService.serializeLoan(loan),
  });
}

export async function create(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const input = CreateLoanRequestSchema.parse(req.body);
  const loan = await loansService.createLoan(householdId, input);

  res.status(201).json({
    data: loansService.serializeLoan(loan),
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

  const parsed = UpdateLoanRequestSchema.parse(body);
  const updated = await loansService.updateLoan(householdId, id, parsed, expectedRevision);

  res.status(200).json({
    data: loansService.serializeLoan(updated),
  });
}

export async function remove(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  IdParamsSchema.parse({ id });
  await loansService.deleteLoan(householdId, id);

  res.status(204).send();
}

export async function analyze(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  IdParamsSchema.parse({ id });
  const result = await loansService.analyzeLoan(householdId, id);

  res.status(200).json({
    data: result,
  });
}

export async function simulatePrepayment(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  IdParamsSchema.parse({ id });
  const input = PrepaymentSimulationRequestSchema.parse(req.body);
  const result = await loansService.simulatePrepayment(householdId, id, input);

  res.status(200).json({
    data: result,
  });
}

export async function savePrepaymentScenario(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  IdParamsSchema.parse({ id });
  const input = CreatePrepaymentScenarioRequestSchema.parse(req.body);
  const scenario = await loansService.savePrepaymentScenario(householdId, id, input);

  res.status(201).json({
    data: serializeScenario(scenario),
  });
}
