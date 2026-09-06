import type {
  ScenarioDomainInputs,
  runScenario,
} from "@/features/scenarios/services/scenario.service";

export type ScenarioEvaluation = Awaited<ReturnType<typeof runScenario>>;

export interface PlannerScenarioProposal {
  type: "scenario_draft";
  name: string;
  description: string | null;
  baselineVersionId: string;
  overlay: ScenarioDomainInputs;
  evaluation: ScenarioEvaluation;
  provenance: {
    planVersionNumber: number;
    snapshotAsOf: string;
    engineVersion: string;
    policyVersion: string;
  };
}

export interface PlannerToolExecutionMetadata {
  callId: string;
  toolName: string;
  kind: "financial_calculation" | "research" | "financial_context" | "other";
  arguments: Record<string, unknown>;
  evidenceIds: string[];
}

export interface PlannerMessageMetadata {
  grounding?: string;
  planAsOf?: string;
  policyVersion?: string;
  toolExecutions?: PlannerToolExecutionMetadata[];
  proposals?: PlannerScenarioProposal[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isPlannerScenarioProposal(value: unknown): value is PlannerScenarioProposal {
  if (!isRecord(value)) return false;
  return (
    value.type === "scenario_draft" &&
    typeof value.name === "string" &&
    typeof value.baselineVersionId === "string" &&
    isRecord(value.overlay) &&
    isRecord(value.evaluation) &&
    isRecord(value.provenance) &&
    typeof value.provenance.planVersionNumber === "number" &&
    typeof value.provenance.snapshotAsOf === "string" &&
    typeof value.provenance.engineVersion === "string" &&
    typeof value.provenance.policyVersion === "string"
  );
}

export function getPlannerMessageMetadata(metadata: unknown): PlannerMessageMetadata {
  if (!isRecord(metadata)) return {};
  const proposals = Array.isArray(metadata.proposals)
    ? metadata.proposals.filter(isPlannerScenarioProposal)
    : [];
  const toolExecutions = Array.isArray(metadata.toolExecutions)
    ? (metadata.toolExecutions.filter(isRecord) as unknown as PlannerToolExecutionMetadata[])
    : [];

  return {
    grounding: typeof metadata.grounding === "string" ? metadata.grounding : undefined,
    planAsOf: typeof metadata.planAsOf === "string" ? metadata.planAsOf : undefined,
    policyVersion: typeof metadata.policyVersion === "string" ? metadata.policyVersion : undefined,
    proposals,
    toolExecutions,
  };
}
