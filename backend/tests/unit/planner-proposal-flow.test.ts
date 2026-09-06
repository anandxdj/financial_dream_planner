import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createPlannerGraph } from "../../src/modules/planner/graph/planner-graph";
import type { LlmProvider } from "../../src/modules/planner/llm/llm-provider";
import { ToolRegistry } from "../../src/modules/planner/tools/tool-registry";

describe("Planner structured proposal flow", () => {
  it("preserves an engine-evaluated scenario draft in final message metadata", async () => {
    const registry = new ToolRegistry();
    registry.registerTool({
      name: "evaluate_scenario_draft",
      description: "test scenario evaluator",
      parametersSchema: z.object({}).passthrough(),
      jsonSchema: { type: "object", additionalProperties: true },
      execute: async () => ({
        type: "scenario_draft",
        name: "Increase SIP",
        description: "Test a higher monthly SIP",
        baselineVersionId: "00000000-0000-0000-0000-000000000010",
        overlay: { investment: { monthlySip: "15000", horizonMonths: 240 } },
        evaluation: {
          name: "Increase SIP",
          description: "Test a higher monthly SIP",
          baseline: {},
          scenario: {},
          deltas: {},
          policyVersion: "IN-2026.1",
          engineVersion: "1.0.0",
        },
        provenance: {
          planVersionNumber: 4,
          snapshotAsOf: "2026-09-07T00:00:00.000Z",
          engineVersion: "1.0.0",
          policyVersion: "IN-2026.1",
        },
      }),
    });

    let providerCall = 0;
    const llmProvider: LlmProvider = {
      providerName: "mock-llm",
      generate: async () => {
        providerCall += 1;
        if (providerCall === 1) {
          return {
            content: null,
            toolCalls: [
              {
                id: "proposal-call-1",
                name: "evaluate_scenario_draft",
                arguments: {},
              },
            ],
            provider: "mock-llm",
            model: "mock-model",
          };
        }
        return {
          content: "I evaluated a higher SIP as a draft scenario. Review it before staging.",
          provider: "mock-llm",
          model: "mock-model",
        };
      },
    };

    const result = await createPlannerGraph({ llmProvider, toolRegistry: registry }).invoke({
      householdId: "00000000-0000-0000-0000-000000000001",
      userId: "00000000-0000-0000-0000-000000000002",
      userMessage: "What if I increase my SIP?",
      isAnalyzeOnly: false,
    });

    expect(result.error).toBeUndefined();
    expect(result.finalAnswer?.metadata).toMatchObject({
      proposals: [
        {
          type: "scenario_draft",
          name: "Increase SIP",
          baselineVersionId: "00000000-0000-0000-0000-000000000010",
        },
      ],
    });
  });
});
