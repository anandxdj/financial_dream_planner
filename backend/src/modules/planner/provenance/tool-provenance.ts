import type { LlmToolCall } from "../llm/llm-provider";
import type { Citation } from "../model";

export type PlannerToolKind = "financial_calculation" | "research" | "financial_context" | "other";

export interface PlannerToolExecutionProvenance {
  callId: string;
  toolName: string;
  kind: PlannerToolKind;
  arguments: Record<string, unknown>;
  evidenceIds: string[];
}

const FINANCIAL_CALCULATION_TOOLS = new Set([
  "calculate_cash_flow",
  "calculate_emergency_fund",
  "calculate_loan_amortization",
  "calculate_investment_projection",
  "calculate_goal_funding",
  "calculate_net_worth",
]);

export function classifyPlannerTool(toolName: string): PlannerToolKind {
  if (FINANCIAL_CALCULATION_TOOLS.has(toolName)) return "financial_calculation";
  if (toolName === "search_market_research") return "research";
  if (toolName === "get_current_plan") return "financial_context";
  return "other";
}

export function extractResearchCitations(result: unknown): Citation[] {
  if (!result || typeof result !== "object") return [];
  const evidence = (result as { evidence?: unknown }).evidence;
  if (!Array.isArray(evidence)) return [];

  return evidence.flatMap((item): Citation[] => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.topic !== "string" ||
      typeof candidate.claim !== "string" ||
      typeof candidate.canonicalSourceUrl !== "string" ||
      typeof candidate.publisher !== "string" ||
      typeof candidate.sourceType !== "string" ||
      typeof candidate.supportingExcerpt !== "string" ||
      typeof candidate.retrievedAt !== "string" ||
      typeof candidate.freshnessExpiresAt !== "string"
    ) {
      return [];
    }

    return [
      {
        evidenceId: candidate.id,
        topic: candidate.topic,
        claim: candidate.claim,
        canonicalSourceUrl: candidate.canonicalSourceUrl,
        publisher: candidate.publisher,
        sourceType: candidate.sourceType as Citation["sourceType"],
        supportingExcerpt: candidate.supportingExcerpt,
        retrievedAt: candidate.retrievedAt,
        freshnessExpiresAt: candidate.freshnessExpiresAt,
      },
    ];
  });
}

export function createToolExecutionProvenance(
  call: LlmToolCall,
  result: unknown,
): PlannerToolExecutionProvenance {
  const evidenceIds = extractResearchCitations(result).map((citation) => citation.evidenceId);
  return {
    callId: call.id,
    toolName: call.name,
    kind: classifyPlannerTool(call.name),
    arguments: call.arguments,
    evidenceIds,
  };
}

export function deduplicateCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  return citations.filter((citation) => {
    if (seen.has(citation.evidenceId)) return false;
    seen.add(citation.evidenceId);
    return true;
  });
}
