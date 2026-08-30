import { Router } from "express";
import { requireAuth } from "../../shared/middleware/require-auth";
import { validate } from "../../shared/middleware/validate";
import * as financialEngineController from "./financial-engine.controller";
import {
  CashFlowRequestSchema,
  EmergencyFundRequestSchema,
  GoalFundingRequestSchema,
  InvestmentProjectionRequestSchema,
  LoanRequestSchema,
  NetWorthRequestSchema,
  ScenarioEvaluationRequestSchema,
} from "./model";

export const financialEngineRouter = Router();

financialEngineRouter.use(requireAuth);

financialEngineRouter.post(
  "/cash-flow",
  validate(CashFlowRequestSchema),
  financialEngineController.cashFlow,
);

financialEngineRouter.post(
  "/emergency-fund",
  validate(EmergencyFundRequestSchema),
  financialEngineController.emergencyFund,
);

financialEngineRouter.post(
  "/loan",
  validate(LoanRequestSchema),
  financialEngineController.loan,
);

financialEngineRouter.post(
  "/investment-projection",
  validate(InvestmentProjectionRequestSchema),
  financialEngineController.investmentProjection,
);

financialEngineRouter.post(
  "/goal-funding",
  validate(GoalFundingRequestSchema),
  financialEngineController.goalFunding,
);

financialEngineRouter.post(
  "/net-worth",
  validate(NetWorthRequestSchema),
  financialEngineController.netWorth,
);

financialEngineRouter.post(
  "/scenario",
  validate(ScenarioEvaluationRequestSchema),
  financialEngineController.scenario,
);
