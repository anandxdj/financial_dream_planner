import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { AppError } from "../../../shared/errors/app-error";
import { getCurrentPlan } from "../../plans/plans.service";
import { executeResearch } from "../../research/research.service";
import type { LlmProvider, LlmRequest } from "../llm/llm-provider";
import type { Citation } from "../model";
import { validateCriticCitations } from "../safety/critic-validator";
import { validateInputAgainstInjection, wrapUntrustedContent } from "../safety/prompt-injection";
import { validateRiskPolicy } from "../safety/risk-validator";
import { ToolRegistry, type ToolExecutionContext } from "../tools/tool-registry";

export const PlannerGraphState = Annotation.Root({
  householdId: Annotation<string>(),
  userId: Annotation<string>(),
  userMessage: Annotation<string>(),
  isAnalyzeOnly: Annotation<boolean>(),

  intentClassification: Annotation<
    | {
        intent: "planning_guidance" | "plan_analysis" | "market_research" | "general_education" | "disallowed";
        requiresResearch: boolean;
        reason?: string;
      }
    | undefined
  >(),

  financialContext: Annotation<
    | {
        hasCurrentPlan: boolean;
        planSummary?: Record<string, unknown>;
      }
    | undefined
  >(),

  evidence: Annotation<Citation[]>({
    reducer: (curr, update) => (update ? [...curr, ...update] : curr),
    default: () => [],
  }),

  plannerOutput: Annotation<
    | {
        content: string;
        citations: Citation[];
      }
    | undefined
  >(),

  riskReview: Annotation<
    | {
        approved: boolean;
        violations?: string[];
      }
    | undefined
  >(),

  criticReview: Annotation<
    | {
        approved: boolean;
        validatedCitations?: Citation[];
        reason?: string;
      }
    | undefined
  >(),

  finalAnswer: Annotation<
    | {
        content: string;
        citations: Citation[];
      }
    | undefined
  >(),

  stepCount: Annotation<number>({
    reducer: (curr, update) => curr + update,
    default: () => 0,
  }),

  providerCallCount: Annotation<number>({
    reducer: (curr, update) => curr + update,
    default: () => 0,
  }),

  hasEmittedVisibleOutput: Annotation<boolean>({
    reducer: (_curr, update) => update,
    default: () => false,
  }),

  error: Annotation<AppError | undefined>({
    reducer: (_curr, update) => update,
    default: () => undefined,
  }),
});

export type PlannerState = typeof PlannerGraphState.State;

export interface PlannerGraphDependencies {
  llmProvider: LlmProvider;
  toolRegistry?: ToolRegistry;
  toolContext?: ToolExecutionContext;
  clock?: () => Date;
}

export function createPlannerGraph(dependencies: PlannerGraphDependencies) {
  const { llmProvider, toolContext, clock = () => new Date() } = dependencies;
  const toolRegistry = dependencies.toolRegistry ?? new ToolRegistry();

  // 1. Supervisor Node
  const supervisorNode = async (state: PlannerState) => {
    try {
      validateInputAgainstInjection(state.userMessage);
    } catch (err: any) {
      return { error: err as AppError, stepCount: 1 };
    }

    if (state.isAnalyzeOnly) {
      return {
        intentClassification: {
          intent: "plan_analysis" as const,
          requiresResearch: false,
        },
        stepCount: 1,
      };
    }

    // Heuristic or structured intent classification
    const lower = state.userMessage.toLowerCase();

    // Check for disallowed intents directly
    if (
      lower.includes("buy stock") ||
      lower.includes("buy shares") ||
      lower.includes("execute trade") ||
      lower.includes("place order") ||
      lower.includes("pay bill") ||
      lower.includes("file my taxes")
    ) {
      return {
        error: new AppError(
          400,
          "DISALLOWED_INTENT",
          "The request asks for autonomous execution or specific security recommendations which are prohibited",
        ),
        stepCount: 1,
      };
    }

    const requiresResearch =
      lower.includes("rate") ||
      lower.includes("tax") ||
      lower.includes("bracket") ||
      lower.includes("inflation") ||
      lower.includes("repo") ||
      lower.includes("rbi") ||
      lower.includes("rules") ||
      lower.includes("market") ||
      lower.includes("ppf") ||
      lower.includes("epf") ||
      lower.includes("fd");

    return {
      intentClassification: {
        intent: "planning_guidance" as const,
        requiresResearch,
      },
      stepCount: 1,
    };
  };

  // 2. Financial State Node
  const financialStateNode = async (state: PlannerState) => {
    try {
      const current = await getCurrentPlan(state.householdId);
      return {
        financialContext: {
          hasCurrentPlan: true,
          // Only pass pre-computed output and completeness — NOT raw inputs or internal IDs.
          // This prevents the LLM from having two overlapping sources of truth.
          planSummary: {
            asOf: current.snapshot.asOf.toISOString(),
            policyVersion: current.snapshot.policyVersion,
            completeness: current.snapshot.completeness,
            calculatedOutput: current.snapshot.calculatedOutput,
          },
        },
        stepCount: 1,
      };
    } catch {
      if (state.isAnalyzeOnly) {
        return {
          error: new AppError(
            400,
            "MISSING_CURRENT_PLAN",
            "No active plan found for household to analyze",
          ),
          stepCount: 1,
        };
      }
      return {
        financialContext: {
          hasCurrentPlan: false,
        },
        stepCount: 1,
      };
    }
  };

  // 3. Research Node
  const researchNode = async (state: PlannerState) => {
    if (!state.intentClassification?.requiresResearch) {
      return { stepCount: 1 };
    }

    try {
      const result = await executeResearch(
        state.householdId,
        state.userId,
        { query: state.userMessage, topic: "financial_planning" },
        toolContext?.researchOptions,
      );

      const citations: Citation[] = result.evidence.map((e) => ({
        evidenceId: e.id,
        topic: e.topic,
        claim: e.claim,
        canonicalSourceUrl: e.canonicalSourceUrl,
        publisher: e.publisher,
        sourceType: e.sourceType as Citation["sourceType"],
        supportingExcerpt: e.supportingExcerpt,
        retrievedAt: e.retrievedAt.toISOString(),
        freshnessExpiresAt: e.freshnessExpiresAt.toISOString(),
      }));

      return {
        evidence: citations,
        stepCount: 1,
      };
    } catch {
      // Non-fatal research skip or failure recording
      return { stepCount: 1 };
    }
  };

  // Helper: formats the household's financial snapshot into a clear, labeled text block
  // for the LLM. Only uses pre-computed calculatedOutput — no raw inputs or internal IDs.
  function buildFinancialContextBlock(financialContext: PlannerState["financialContext"]): string {
    if (!financialContext?.hasCurrentPlan || !financialContext.planSummary) {
      return "No active financial plan found for this household.";
    }

    const summary = financialContext.planSummary as {
      asOf: string;
      policyVersion: string;
      completeness: { status: string; missing: string[]; warnings: string[] };
      calculatedOutput: Record<string, any>;
    };

    const { asOf, policyVersion, completeness, calculatedOutput } = summary;
    const lines: string[] = [
      `Plan as of: ${asOf} | Policy: ${policyVersion}`,
      `Data completeness: ${completeness.status}`,
    ];

    if (completeness.missing.length > 0) {
      lines.push(`⚠ Missing fields: ${completeness.missing.join(", ")}`);
    }
    if (completeness.warnings.length > 0) {
      lines.push(`⚠ Warnings: ${completeness.warnings.join(", ")}`);
    }

    const cf = calculatedOutput?.cashFlow;
    if (cf) {
      lines.push("\n--- Monthly Cash Flow (pre-computed, authoritative) ---");
      lines.push(`  Monthly Income:               ${cf.monthlyIncome ?? "N/A"}`);
      lines.push(`  Essential Expenses:           ${cf.essentialExpenses ?? "N/A"}`);
      lines.push(`  Discretionary Expenses:       ${cf.discretionaryExpenses ?? "N/A"}`);
      lines.push(`  Loan EMIs:                    ${cf.emis ?? "N/A"}`);
      lines.push(`  Mandatory Obligations:        ${cf.mandatoryObligations ?? "N/A"}`);
      lines.push(`  Total Monthly Outflows:       ${cf.totalOutflows ?? "N/A"}`);
      lines.push(`  Monthly Net Surplus/Deficit:  ${cf.monthlySurplus ?? "N/A"}`);
      lines.push(`  Savings Rate:                 ${cf.savingsRate ?? "N/A"}`);
      lines.push(`  Investable Capacity:          ${cf.investableCapacity ?? "N/A"}`);
    }

    const ef = calculatedOutput?.emergencyFund;
    if (ef) {
      lines.push("\n--- Emergency Fund ---");
      lines.push(`  Monthly Need:        ${ef.monthlyNeed ?? "N/A"}`);
      lines.push(`  Target Amount:       ${ef.targetAmount ?? "N/A"}`);
      lines.push(`  Current Reserves:    ${ef.currentReserves ?? "N/A"}`);
      lines.push(`  Shortfall:           ${ef.shortfall ?? "N/A"}`);
      lines.push(`  Months to Complete:  ${ef.completionMonths ?? "N/A"}`);
    }

    const nw = calculatedOutput?.netWorth;
    if (nw) {
      lines.push("\n--- Net Worth ---");
      lines.push(`  Total Assets:       ${nw.totalAssets ?? "N/A"}`);
      lines.push(`  Total Liabilities:  ${nw.totalLiabilities ?? "N/A"}`);
      lines.push(`  Net Worth:          ${nw.netWorth ?? "N/A"}`);
    }

    const loan = calculatedOutput?.loan;
    if (loan) {
      lines.push("\n--- Loan ---");
      lines.push(`  Monthly EMI:    ${loan.monthlyEmi ?? "N/A"}`);
      lines.push(`  Total Interest: ${loan.totalInterest ?? "N/A"}`);
      lines.push(`  Total Payment:  ${loan.totalPayment ?? "N/A"}`);
    }

    const inv = calculatedOutput?.investment;
    if (inv) {
      lines.push("\n--- Investment Projection ---");
      const exp = inv.scenarios?.expected;
      if (exp) {
        lines.push(`  Expected Future Value: ${exp.futureValue ?? "N/A"}`);
        lines.push(`  Total Invested:        ${exp.totalInvested ?? "N/A"}`);
        lines.push(`  Total Gains:           ${exp.totalGains ?? "N/A"}`);
      }
    }

    return lines.join("\n");
  }

  // 4. Planner Node
  const plannerNode = async (state: PlannerState) => {
    const untrustedUserMessage = wrapUntrustedContent("user_input", state.userMessage);
    let evidenceContext = "";
    if (state.evidence && state.evidence.length > 0) {
      evidenceContext = state.evidence
        .map(
          (e) =>
            `<evidence id="${e.evidenceId}">\nSource: ${e.canonicalSourceUrl} (${e.publisher})\nExcerpt: ${e.supportingExcerpt}\n</evidence>`,
        )
        .join("\n\n");
    }

    const systemPrompt = `You are a helpful, prudent personal financial planning assistant for India.
You provide educational financial guidance covering cash flow, emergency funds, debt management, goal planning, and asset allocation principles.
You NEVER recommend specific individual stocks or securities to buy or sell.
You NEVER execute transactions or offer guaranteed investment returns.
When citing external factual rates, tax rules, or market data, reference the available evidence ID.

IMPORTANT INSTRUCTIONS FOR USING FINANCIAL CONTEXT:
- All numbers in the Financial Context below are PRE-COMPUTED and authoritative. Do NOT re-derive or re-calculate them.
- Currency is Indian Rupees (INR, ₹). All monetary values are in INR per month unless stated otherwise.
- A negative Monthly Net Surplus/Deficit means the household is in a CASH FLOW DEFICIT — treat this as the highest-priority issue to address first.
- If data completeness is "incomplete" or fields are marked missing, acknowledge the gaps and caveat your analysis accordingly.
- Do NOT mention policyVersion, engineVersion, internal IDs, or technical metadata in your response to the user.

Financial Context:
${buildFinancialContextBlock(state.financialContext)}

Available Research Evidence:
${evidenceContext || "No external evidence retrieved."}`;

    const messages: LlmRequest["messages"] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: untrustedUserMessage },
      ];

    try {
      let response;
      let providerCalls = 0;
      let toolCalls = 0;

      while (providerCalls < 3) {
        response = await llmProvider.generate({
          messages,
          tools: toolRegistry.getToolDefinitions(),
          timeoutMs: 15000,
        });
        providerCalls += 1;

        if (!response.toolCalls?.length) break;
        if (response.content?.trim()) {
          throw new AppError(502, "INVALID_PROVIDER_OUTPUT", "Provider mixed final output with tool calls");
        }
        if (toolCalls + response.toolCalls.length > 4) {
          throw new AppError(400, "TOOL_BUDGET_EXCEEDED", "Planner exceeded the authorized tool-call budget");
        }

        messages.push({ role: "assistant", content: "", toolCalls: response.toolCalls });
        for (const call of response.toolCalls) {
          const result = await toolRegistry.executeTool(
            call.name,
            call.arguments,
            state.householdId,
            state.userId,
            toolContext,
          );
          toolCalls += 1;
          messages.push({
            role: "tool",
            name: call.name,
            toolCallId: call.id,
            content: wrapUntrustedContent("tool_result", JSON.stringify(result)),
          });
        }
      }

      if (!response || response.toolCalls?.length) {
        throw new AppError(502, "INVALID_PROVIDER_OUTPUT", "Planner did not produce a final answer within its budget");
      }
      const content = response.content?.trim();
      if (!content) {
        throw new AppError(502, "INVALID_PROVIDER_OUTPUT", "Planner produced empty output");
      }

      // Match citations used
      const matchedCitations: Citation[] = [];
      for (const e of state.evidence) {
        if (content.includes(e.evidenceId)) {
          matchedCitations.push(e);
        }
      }

      if (state.evidence.length > 0 && matchedCitations.length === 0) {
        throw new AppError(422, "INSUFFICIENT_EVIDENCE", "Research-backed output did not cite stored evidence");
      }

      return {
        plannerOutput: {
          content,
          citations: matchedCitations,
        },
        stepCount: 1,
        providerCallCount: providerCalls,
      };
    } catch (err: any) {
      return {
        error: err instanceof AppError ? err : new AppError(503, "PROVIDER_UNAVAILABLE", err.message || "LLM failed"),
        stepCount: 1,
      };
    }
  };

  // 5. Risk Node
  const riskNode = async (state: PlannerState) => {
    if (!state.plannerOutput?.content) {
      return {
        error: new AppError(502, "INVALID_PROVIDER_OUTPUT", "Planner produced empty output"),
        stepCount: 1,
      };
    }

    const riskResult = validateRiskPolicy(state.plannerOutput.content);
    if (!riskResult.approved) {
      return {
        error: new AppError(
          422,
          "RISK_POLICY_VIOLATION",
          `Planning output violates safety risk policy: ${riskResult.violations.join("; ")}`,
        ),
        stepCount: 1,
      };
    }

    return {
      riskReview: { approved: true },
      stepCount: 1,
    };
  };

  // 6. Critic Node
  const criticNode = async (state: PlannerState) => {
    if (!state.plannerOutput) {
      return {
        error: new AppError(502, "INVALID_PROVIDER_OUTPUT", "Planner output missing for critic review"),
        stepCount: 1,
      };
    }

    const criticResult = await validateCriticCitations(
      state.householdId,
      state.plannerOutput.content,
      state.plannerOutput.citations,
      clock(),
    );

    if (!criticResult.approved) {
      return {
        error: new AppError(
          422,
          "CRITIC_VALIDATION_FAILED",
          `Critic validation failed: ${criticResult.reason}`,
        ),
        stepCount: 1,
      };
    }

    return {
      criticReview: {
        approved: true,
        validatedCitations: criticResult.validatedCitations,
      },
      finalAnswer: {
        content: state.plannerOutput.content,
        citations: criticResult.validatedCitations,
      },
      stepCount: 1,
    };
  };

  // Build State Graph
  const workflow = new StateGraph(PlannerGraphState)
    .addNode("supervisor", supervisorNode)
    .addNode("financial_state", financialStateNode)
    .addNode("research", researchNode)
    .addNode("planner", plannerNode)
    .addNode("risk", riskNode)
    .addNode("critic", criticNode)
    .addEdge(START, "supervisor")
    .addConditionalEdges("supervisor", (state) => {
      if (state.error) return END;
      return "financial_state";
    })
    .addConditionalEdges("financial_state", (state) => {
      if (state.error) return END;
      if (state.intentClassification?.requiresResearch) return "research";
      return "planner";
    })
    .addConditionalEdges("research", (state) => {
      if (state.error) return END;
      return "planner";
    })
    .addConditionalEdges("planner", (state) => {
      if (state.error) return END;
      return "risk";
    })
    .addConditionalEdges("risk", (state) => {
      if (state.error) return END;
      return "critic";
    })
    .addEdge("critic", END);

  return workflow.compile();
}
