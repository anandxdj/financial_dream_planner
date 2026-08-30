import type { Request, Response } from "express";
import { calculateCashFlow } from "./cash-flow";
import { calculateEmergencyFund } from "./emergency-fund";
import { calculateLoan } from "./loan";
import { calculateInvestmentProjection } from "./investment-projection";
import { calculateGoalFunding } from "./goal-funding";
import { calculateNetWorth } from "./net-worth";
import { evaluateScenario } from "./scenario";

export function cashFlow(req: Request, res: Response) {
  const result = calculateCashFlow(req.body);
  res.json({ data: result });
}

export function emergencyFund(req: Request, res: Response) {
  const result = calculateEmergencyFund(req.body);
  res.json({ data: result });
}

export function loan(req: Request, res: Response) {
  const result = calculateLoan(req.body);
  res.json({ data: result });
}

export function investmentProjection(req: Request, res: Response) {
  const result = calculateInvestmentProjection(req.body);
  res.json({ data: result });
}

export function goalFunding(req: Request, res: Response) {
  const result = calculateGoalFunding(req.body);
  res.json({ data: result });
}

export function netWorth(req: Request, res: Response) {
  const result = calculateNetWorth(req.body);
  res.json({ data: result });
}

export function scenario(req: Request, res: Response) {
  const result = evaluateScenario(req.body);
  res.json({ data: result });
}
