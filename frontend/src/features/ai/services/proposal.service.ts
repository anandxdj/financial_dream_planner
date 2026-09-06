import {
  createScenario,
  runScenario,
  type ScenarioDomainInputs,
} from "@/features/scenarios/services/scenario.service";
import type { PlannerScenarioProposal } from "../types";

export interface StagePlannerProposalOptions {
  name?: string;
  description?: string;
  overlay?: ScenarioDomainInputs;
}

export async function stagePlannerProposal(
  proposal: PlannerScenarioProposal,
  options: StagePlannerProposalOptions = {},
) {
  const scenario = await createScenario({
    name: options.name?.trim() || proposal.name,
    description: options.description?.trim() || proposal.description || undefined,
    overlay: options.overlay ?? proposal.overlay,
  });

  // A staged scenario stays a draft. Running it is read-only and verifies that the persisted
  // overlay produces the same kind of deterministic evaluation before the UI reports success.
  const evaluation = await runScenario(scenario.id);

  return { scenario, evaluation };
}
