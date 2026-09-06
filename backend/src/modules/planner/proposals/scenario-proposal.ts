import { z } from "zod";
import { AppError } from "../../../shared/errors/app-error";
import { evaluateScenario, type ScenarioDomainInputs, type ScenarioEvaluationOutput } from "../../financial-engine";
import { ScenarioDomainInputsSchema } from "../../financial-engine/model";
import { getCurrentPlan } from "../../plans/plans.service";

export const PlannerScenarioProposalInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).optional(),
    overlay: ScenarioDomainInputsSchema,
  })
  .strict();

export type PlannerScenarioProposalInput = z.infer<typeof PlannerScenarioProposalInputSchema>;

export interface PlannerScenarioProposal {
  type: "scenario_draft";
  name: string;
  description: string | null;
  baselineVersionId: string;
  overlay: ScenarioDomainInputs;
  evaluation: ScenarioEvaluationOutput;
  provenance: {
    planVersionNumber: number;
    snapshotAsOf: string;
    engineVersion: string;
    policyVersion: string;
  };
}

export async function evaluatePlannerScenarioProposal(
  householdId: string,
  input: PlannerScenarioProposalInput,
): Promise<PlannerScenarioProposal> {
  const current = await getCurrentPlan(householdId);
  if (!current.currentVersion?.id) {
    throw new AppError(400, "MISSING_CURRENT_PLAN", "A current plan is required to evaluate a scenario draft");
  }

  const evaluation = evaluateScenario({
    name: input.name,
    description: input.description,
    baseline: current.snapshot.inputs,
    scenario: input.overlay,
    policyVersion: current.snapshot.policyVersion,
  });

  return {
    type: "scenario_draft",
    name: input.name,
    description: input.description ?? null,
    baselineVersionId: current.currentVersion.id,
    overlay: input.overlay,
    evaluation,
    provenance: {
      planVersionNumber: current.currentVersion.versionNumber,
      snapshotAsOf: current.snapshot.asOf.toISOString(),
      engineVersion: current.snapshot.engineVersion,
      policyVersion: current.snapshot.policyVersion,
    },
  };
}

export function isPlannerScenarioProposal(value: unknown): value is PlannerScenarioProposal {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PlannerScenarioProposal>;
  return (
    candidate.type === "scenario_draft" &&
    typeof candidate.name === "string" &&
    typeof candidate.baselineVersionId === "string" &&
    !!candidate.overlay &&
    typeof candidate.overlay === "object" &&
    !!candidate.evaluation &&
    typeof candidate.evaluation === "object" &&
    !!candidate.provenance &&
    typeof candidate.provenance === "object"
  );
}

export const PLANNER_SCENARIO_OVERLAY_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  description: "Only the financial fields that should change from the current plan. Omit unchanged domains and fields.",
  properties: {
    cashFlow: {
      type: "object",
      properties: {
        income: { type: "string" },
        essentialExpenses: { type: "string" },
        discretionaryExpenses: { type: "string" },
        emis: { type: "string" },
        mandatoryObligations: { type: "string" },
      },
      additionalProperties: false,
    },
    emergencyFund: {
      type: "object",
      properties: {
        essentialExpenses: { type: "string" },
        emis: { type: "string" },
        mandatoryObligations: { type: "string" },
        incomeStability: { type: "string", enum: ["stable", "variable", "irregular"] },
        dependents: { type: "number" },
        currentReserves: { type: "string" },
        monthlyContribution: { type: "string" },
        customReserveMonths: { type: "number" },
      },
      additionalProperties: false,
    },
    loan: {
      type: "object",
      properties: {
        principal: { type: "string" },
        annualRate: { type: "string" },
        tenureMonths: { type: "number" },
        prepaymentStrategy: { type: "string", enum: ["reduce_tenure", "reduce_emi"] },
      },
      additionalProperties: false,
    },
    investment: {
      type: "object",
      properties: {
        initialLumpSum: { type: "string" },
        monthlySip: { type: "string" },
        annualStepUp: { type: "string" },
        horizonMonths: { type: "number" },
        customAnnualRate: { type: "string" },
      },
      additionalProperties: false,
    },
    goal: {
      type: "object",
      properties: {
        goalName: { type: "string" },
        goalCategory: {
          type: "string",
          enum: ["general", "education", "medical", "retirement", "home", "custom"],
        },
        targetAmountToday: { type: "string" },
        horizonMonths: { type: "number" },
        currentSavings: { type: "string" },
        availableMonthlyCapacity: { type: "string" },
        expectedAnnualReturn: { type: "string" },
        annualInflation: { type: "string" },
      },
      additionalProperties: false,
    },
    netWorth: {
      type: "object",
      properties: {
        assets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              category: { type: "string" },
              value: { type: "string" },
            },
            required: ["name", "category", "value"],
            additionalProperties: false,
          },
        },
        liabilities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              category: { type: "string" },
              value: { type: "string" },
            },
            required: ["name", "category", "value"],
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};
