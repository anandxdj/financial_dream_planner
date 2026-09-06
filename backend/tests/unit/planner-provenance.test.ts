import { describe, expect, it } from "vitest";
import {
  classifyPlannerTool,
  createToolExecutionProvenance,
  extractResearchCitations,
} from "../../src/modules/planner/provenance/tool-provenance";

describe("Planner tool provenance", () => {
  it("classifies deterministic financial tools separately from research", () => {
    expect(classifyPlannerTool("calculate_cash_flow")).toBe("financial_calculation");
    expect(classifyPlannerTool("search_market_research")).toBe("research");
    expect(classifyPlannerTool("get_current_plan")).toBe("financial_context");
  });

  it("extracts stored research evidence from a tool result", () => {
    const citations = extractResearchCitations({
      evidence: [
        {
          id: "00000000-0000-0000-0000-000000000111",
          topic: "repo rate",
          claim: "RBI repo-rate evidence",
          canonicalSourceUrl: "https://rbi.org.in/example",
          publisher: "Reserve Bank of India",
          sourceType: "official",
          supportingExcerpt: "Official policy evidence",
          retrievedAt: "2026-09-07T00:00:00.000Z",
          freshnessExpiresAt: "2026-09-08T00:00:00.000Z",
        },
      ],
    });

    expect(citations).toHaveLength(1);
    expect(citations[0].publisher).toBe("Reserve Bank of India");
    expect(citations[0].evidenceId).toBe("00000000-0000-0000-0000-000000000111");
  });

  it("records tool arguments and evidence IDs without copying the full tool result", () => {
    const provenance = createToolExecutionProvenance(
      {
        id: "call-1",
        name: "search_market_research",
        arguments: { query: "current PPF rate", topic: "ppf" },
      },
      {
        evidence: [
          {
            id: "00000000-0000-0000-0000-000000000222",
            topic: "ppf",
            claim: "PPF rate",
            canonicalSourceUrl: "https://example.gov.in/ppf",
            publisher: "Government source",
            sourceType: "official",
            supportingExcerpt: "PPF evidence",
            retrievedAt: "2026-09-07T00:00:00.000Z",
            freshnessExpiresAt: "2026-09-08T00:00:00.000Z",
          },
        ],
        veryLargePayload: { shouldNot: "be persisted in provenance" },
      },
    );

    expect(provenance.kind).toBe("research");
    expect(provenance.arguments).toEqual({ query: "current PPF rate", topic: "ppf" });
    expect(provenance.evidenceIds).toEqual(["00000000-0000-0000-0000-000000000222"]);
    expect(provenance).not.toHaveProperty("veryLargePayload");
  });
});
