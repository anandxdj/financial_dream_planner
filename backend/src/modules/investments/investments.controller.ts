import type { Request, Response } from "express";
import {
  UpdateInvestmentInputsRequestSchema,
  SimulateInvestmentRequestSchema,
} from "./model";
import * as investmentsService from "./investments.service";

export async function getSummary(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const summary = await investmentsService.getInvestmentSummary(householdId);

  res.status(200).json({
    data: summary,
  });
}

export async function updateInputs(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const userId = req.auth!.userId;
  const input = UpdateInvestmentInputsRequestSchema.parse(req.body);
  const updated = await investmentsService.updateInvestmentInputs(householdId, userId, input);

  res.status(200).json({
    data: updated,
  });
}

export function simulate(req: Request, res: Response) {
  const input = SimulateInvestmentRequestSchema.parse(req.body);
  const projection = investmentsService.simulateInvestment(input);

  res.status(200).json({
    data: projection,
  });
}
