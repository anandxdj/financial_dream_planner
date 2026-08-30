import { z } from "zod";
import { AppError } from "../../../shared/errors/app-error";
import {
  calculateCashFlow,
  calculateEmergencyFund,
  calculateGoalFunding,
  calculateInvestmentProjection,
  calculateLoan,
  calculateNetWorth,
} from "../../financial-engine";
import {
  CashFlowRequestSchema,
  EmergencyFundRequestSchema,
  GoalFundingRequestSchema,
  InvestmentProjectionRequestSchema,
  LoanRequestSchema,
  NetWorthRequestSchema,
} from "../../financial-engine/model";
import { getCurrentPlan } from "../../plans/plans.service";
import {
  executeResearch,
  serializeEvidence,
  type ResearchExecutionOptions,
} from "../../research/research.service";
import type { LlmToolDefinition } from "../llm/llm-provider";

export interface ToolExecutionContext {
  researchOptions?: ResearchExecutionOptions;
}

export interface RegisteredTool {
  name: string;
  description: string;
  parametersSchema: z.ZodType<any>;
  jsonSchema: Record<string, unknown>;
  execute: (
    householdId: string,
    userId: string,
    args: unknown,
    context?: ToolExecutionContext,
  ) => Promise<unknown>;
}

const GetCurrentPlanSchema = z.object({}).strict();

const SearchMarketResearchSchema = z
  .object({
    query: z.string().trim().min(1).max(500),
    topic: z.string().trim().min(1).max(100),
  })
  .strict();

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  constructor() {
    this.registerDefaults();
  }

  registerTool(tool: RegisteredTool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  getToolDefinitions(): LlmToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.jsonSchema,
    }));
  }

  async executeTool(
    name: string,
    rawArgs: unknown,
    householdId: string,
    userId: string,
    context?: ToolExecutionContext,
  ): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new AppError(400, "UNAUTHORIZED_TOOL", `Tool '${name}' is not authorized or registered`);
    }

    let parsedArgs: unknown;
    try {
      parsedArgs = tool.parametersSchema.parse(rawArgs ?? {});
    } catch {
      throw new AppError(
        400,
        "INVALID_TOOL_ARGUMENTS",
        `Arguments for tool '${name}' failed schema validation`,
      );
    }

    return await tool.execute(householdId, userId, parsedArgs, context);
  }

  private registerDefaults() {
    // 1. get_current_plan
    this.registerTool({
      name: "get_current_plan",
      description: "Retrieves the authenticated household's active financial plan, latest version, and calculated snapshot.",
      parametersSchema: GetCurrentPlanSchema,
      jsonSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      execute: async (householdId) => {
        try {
          const current = await getCurrentPlan(householdId);
          return {
            hasCurrentPlan: true,
            versionNumber: current.currentVersion.versionNumber,
            asOf: current.snapshot.asOf.toISOString(),
            engineVersion: current.snapshot.engineVersion,
            policyVersion: current.snapshot.policyVersion,
            completeness: current.snapshot.completeness,
            calculatedOutput: current.snapshot.calculatedOutput,
          };
        } catch (err: any) {
          if (err.statusCode === 404) {
            return { hasCurrentPlan: false, message: "No active plan found for household" };
          }
          throw err;
        }
      },
    });

    // 2. calculate_cash_flow
    this.registerTool({
      name: "calculate_cash_flow",
      description: "Calculates monthly net cash flow, debt-to-income ratio, and savings capacity deterministically.",
      parametersSchema: CashFlowRequestSchema,
      jsonSchema: {
        type: "object",
        properties: {
          income: { type: "string", description: "Monthly income as decimal string" },
          essentialExpenses: { type: "string", description: "Monthly essential expenses as decimal string" },
          discretionaryExpenses: { type: "string", description: "Monthly discretionary expenses as decimal string" },
          emis: { type: "string", description: "Monthly loan EMIs as decimal string" },
          mandatoryObligations: { type: "string", description: "Monthly mandatory obligations as decimal string" },
          policyVersion: { type: "string", description: "Financial policy version" },
        },
        additionalProperties: false,
      },
      execute: async (_householdId, _userId, args) => {
        return calculateCashFlow(args as z.infer<typeof CashFlowRequestSchema>);
      },
    });

    // 3. calculate_emergency_fund
    this.registerTool({
      name: "calculate_emergency_fund",
      description: "Calculates target emergency fund requirements, target range, and funding gap.",
      parametersSchema: EmergencyFundRequestSchema,
      jsonSchema: {
        type: "object",
        properties: {
          essentialExpenses: { type: "string", description: "Monthly essential expenses as decimal string" },
          emis: { type: "string", description: "Monthly EMI obligations" },
          mandatoryObligations: { type: "string", description: "Monthly mandatory obligations" },
          incomeStability: { type: "string", enum: ["stable", "variable", "irregular"] },
          dependents: { type: "number" },
          currentReserves: { type: "string", description: "Current liquid reserves as decimal string" },
          monthlyContribution: { type: "string" },
          customReserveMonths: { type: "number" },
          policyVersion: { type: "string" },
        },
        additionalProperties: false,
      },
      execute: async (_householdId, _userId, args) => {
        return calculateEmergencyFund(args as z.infer<typeof EmergencyFundRequestSchema>);
      },
    });

    // 4. calculate_loan_amortization
    this.registerTool({
      name: "calculate_loan_amortization",
      description: "Calculates loan EMI, total interest payable, total payment, and amortization schedule.",
      parametersSchema: LoanRequestSchema,
      jsonSchema: {
        type: "object",
        properties: {
          principal: { type: "string", description: "Loan principal amount as decimal string" },
          annualRate: { type: "string", description: "Annual interest rate as percentage decimal string" },
          tenureMonths: { type: "number", description: "Tenure in months" },
          prepaymentStrategy: { type: "string", enum: ["reduce_tenure", "reduce_emi"] },
          policyVersion: { type: "string" },
        },
        additionalProperties: false,
      },
      execute: async (_householdId, _userId, args) => {
        return calculateLoan(args as z.infer<typeof LoanRequestSchema>);
      },
    });

    // 5. calculate_investment_projection
    this.registerTool({
      name: "calculate_investment_projection",
      description: "Calculates compound investment growth projections with monthly contributions.",
      parametersSchema: InvestmentProjectionRequestSchema,
      jsonSchema: {
        type: "object",
        properties: {
          initialLumpSum: { type: "string", description: "Initial principal lump sum amount" },
          monthlySip: { type: "string", description: "Monthly SIP contribution amount" },
          annualStepUp: { type: "string", description: "Annual step-up percentage" },
          horizonMonths: { type: "number", description: "Horizon in months" },
          customAnnualRate: { type: "string", description: "Expected annual return rate as percentage" },
          policyVersion: { type: "string" },
        },
        additionalProperties: false,
      },
      execute: async (_householdId, _userId, args) => {
        return calculateInvestmentProjection(args as z.infer<typeof InvestmentProjectionRequestSchema>);
      },
    });

    // 6. calculate_goal_funding
    this.registerTool({
      name: "calculate_goal_funding",
      description: "Calculates required monthly savings and feasibility for a specific financial goal.",
      parametersSchema: GoalFundingRequestSchema,
      jsonSchema: {
        type: "object",
        properties: {
          goalName: { type: "string" },
          goalCategory: { type: "string", enum: ["general", "education", "medical", "retirement", "home", "custom"] },
          targetAmountToday: { type: "string", description: "Target goal amount today" },
          horizonMonths: { type: "number", description: "Horizon in months" },
          currentSavings: { type: "string", description: "Current amount saved towards goal" },
          availableMonthlyCapacity: { type: "string" },
          expectedAnnualReturn: { type: "string" },
          annualInflation: { type: "string" },
          policyVersion: { type: "string" },
        },
        additionalProperties: false,
      },
      execute: async (_householdId, _userId, args) => {
        return calculateGoalFunding(args as z.infer<typeof GoalFundingRequestSchema>);
      },
    });

    // 7. calculate_net_worth
    this.registerTool({
      name: "calculate_net_worth",
      description: "Calculates total assets, total liabilities, and total net worth.",
      parametersSchema: NetWorthRequestSchema,
      jsonSchema: {
        type: "object",
        properties: {
          assets: {
            type: "array",
            items: {
              type: "object",
              properties: {
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
                name: { type: "string" },
                category: { type: "string" },
                value: { type: "string" },
              },
              required: ["name", "category", "value"],
              additionalProperties: false,
            },
          },
          includeBreakdown: { type: "boolean" },
          policyVersion: { type: "string" },
        },
        additionalProperties: false,
      },
      execute: async (_householdId, _userId, args) => {
        return calculateNetWorth(args as z.infer<typeof NetWorthRequestSchema>);
      },
    });

    // 8. search_market_research
    this.registerTool({
      name: "search_market_research",
      description: "Searches approved official financial sources and retrieves verified, safe evidence snippets.",
      parametersSchema: SearchMarketResearchSchema,
      jsonSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query string" },
          topic: { type: "string", description: "Topic category" },
        },
        required: ["query", "topic"],
        additionalProperties: false,
      },
      execute: async (householdId, userId, args, context) => {
        const { query, topic } = args as { query: string; topic: string };
        const result = await executeResearch(
          householdId,
          userId,
          { query, topic },
          context?.researchOptions,
        );
        return {
          researchRunId: result.run.id,
          evidence: result.evidence.map(serializeEvidence),
        };
      },
    });
  }
}
