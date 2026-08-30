import { describe, expect, it } from "vitest";
import { ToolRegistry } from "../../src/modules/planner/tools/tool-registry";

describe("Closed Typed Tool Registry", () => {
  const registry = new ToolRegistry();
  const testHouseholdId = "00000000-0000-0000-0000-000000000001";
  const testUserId = "00000000-0000-0000-0000-000000000002";

  it("registers closed allowlist of approved tools", () => {
    const defs = registry.getToolDefinitions();
    const toolNames = defs.map((d) => d.name);

    expect(toolNames).toContain("get_current_plan");
    expect(toolNames).toContain("calculate_cash_flow");
    expect(toolNames).toContain("calculate_emergency_fund");
    expect(toolNames).toContain("calculate_loan_amortization");
    expect(toolNames).toContain("calculate_investment_projection");
    expect(toolNames).toContain("calculate_goal_funding");
    expect(toolNames).toContain("calculate_net_worth");
    expect(toolNames).toContain("search_market_research");
  });

  it("fails closed with UNAUTHORIZED_TOOL on unknown tool name", async () => {
    await expect(
      registry.executeTool("execute_raw_sql", { query: "SELECT 1" }, testHouseholdId, testUserId),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED_TOOL",
      statusCode: 400,
    });

    await expect(
      registry.executeTool("create_scenario", {}, testHouseholdId, testUserId),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED_TOOL",
      statusCode: 400,
    });
  });

  it("rejects unknown properties in tool arguments with strict validation", async () => {
    await expect(
      registry.executeTool(
        "calculate_cash_flow",
        {
          income: "100000.00",
          unknownProperty: "malicious_payload",
        },
        testHouseholdId,
        testUserId,
      ),
    ).rejects.toMatchObject({
      code: "INVALID_TOOL_ARGUMENTS",
      statusCode: 400,
    });
  });

  it("executes calculate_cash_flow deterministically", async () => {
    const result: any = await registry.executeTool(
      "calculate_cash_flow",
      {
        income: "100000.00",
        essentialExpenses: "40000.00",
        discretionaryExpenses: "20000.00",
        emis: "10000.00",
        mandatoryObligations: "0.00",
      },
      testHouseholdId,
      testUserId,
    );

    expect(result.monthlySurplus).toBe("30000.00");
  });

  it("executes calculate_emergency_fund deterministically", async () => {
    const result: any = await registry.executeTool(
      "calculate_emergency_fund",
      {
        essentialExpenses: "50000.00",
        emis: "0.00",
        mandatoryObligations: "0.00",
        incomeStability: "stable",
        dependents: 0,
        currentReserves: "100000.00",
      },
      testHouseholdId,
      testUserId,
    );

    expect(result.targetAmount).toBe("300000.00");
    expect(result.shortfall).toBe("200000.00");
    expect(result.runwayMonths).toBe("2.0000");
  });

  it("executes calculate_loan_amortization deterministically", async () => {
    const result: any = await registry.executeTool(
      "calculate_loan_amortization",
      {
        principal: "1000000.00",
        annualRate: "8.50",
        tenureMonths: 120,
      },
      testHouseholdId,
      testUserId,
    );

    expect(result.monthlyEmi).toBe("12398.57");
    expect(result.totalInterest).toBe("487828.27");
  });
});
