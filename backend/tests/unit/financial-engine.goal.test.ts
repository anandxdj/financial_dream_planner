import { describe, expect, it } from "vitest";
import { calculateGoalFunding } from "../../src/modules/financial-engine/goal-funding";

describe("financial engine goal funding", () => {
  it("compounds future goal cost using policy general inflation (6%) and calculates required SIP", () => {
    // Target today: 1,000,000, Horizon: 60 months (5 years)
    // Inflation: 6% default, Expected return: 9% default
    // Current savings: 200,000
    const result = calculateGoalFunding({
      goalName: "Car Purchase",
      goalCategory: "general",
      targetAmountToday: "1000000.00",
      horizonMonths: 60,
      currentSavings: "200000.00",
      availableMonthlyCapacity: "20000.00",
    });

    expect(result.completeness.status).toBe("complete");
    expect(result.targetAmountToday).toBe("1000000.00");
    expect(result.annualInflationUsed).toBe("6.0000");
    expect(result.expectedReturnUsed).toBe("9.0000");

    // Future goal cost at 6% over 5 years (monthly compounding: (1 + 0.06/12)^60 = 1.34885)
    // 1,000,000 * 1.34885 = 1,348,850.15
    expect(result.futureGoalCost).toBe("1348850.15");

    // Current savings at 9% over 5 years (monthly compounding: (1 + 0.09/12)^60 = 1.56568102697...)
    // 200,000 * 1.56568102697 = 313,136.21
    expect(result.currentSavingsFutureValue).toBe("313136.21");

    // Shortfall = 1,348,850.15 - 313,136.21 = 1,035,713.95 (derived unrounded)
    expect(result.shortfall).toBe("1035713.95");

    // Required SIP to reach shortfall of 1,035,713.94 at 9% in 60 months:
    expect(result.requiredSip).toBe("13731.86");
    expect(result.feasibility).toBe("feasible");
    expect(result.completeness.warnings).toHaveLength(0);
  });

  it("uses 8% inflation for education and medical goals automatically from policy", () => {
    const eduGoal = calculateGoalFunding({
      goalCategory: "education",
      targetAmountToday: "2500000.00",
      horizonMonths: 120, // 10 years
      currentSavings: "500000.00",
    });

    expect(eduGoal.annualInflationUsed).toBe("8.0000");
    // (1 + 0.08/12)^120 = 2.21964
    expect(parseFloat(eduGoal.futureGoalCost!)).toBeGreaterThan(5000000);

    const medGoal = calculateGoalFunding({
      goalCategory: "medical",
      targetAmountToday: "1000000.00",
      horizonMonths: 60,
      currentSavings: "0.00",
    });

    expect(medGoal.annualInflationUsed).toBe("8.0000");
  });

  it("detects when goal is already funded", () => {
    const result = calculateGoalFunding({
      targetAmountToday: "500000.00",
      horizonMonths: 36,
      currentSavings: "600000.00",
    });

    expect(result.shortfall).toBe("0.00");
    expect(result.requiredSip).toBe("0.00");
    expect(result.requiredLumpSum).toBe("0.00");
    expect(result.feasibility).toBe("funded");
    expect(result.completeness.warnings).toContain("TARGET_ALREADY_FUNDED");
  });

  it("flags infeasible goal when available capacity is less than required SIP", () => {
    const result = calculateGoalFunding({
      targetAmountToday: "5000000.00",
      horizonMonths: 24,
      currentSavings: "0.00",
      availableMonthlyCapacity: "10000.00",
    });

    expect(result.feasibility).toBe("infeasible");
    expect(result.completeness.warnings).toContain("INSUFFICIENT_MONTHLY_CAPACITY");
  });

  it("returns explicit inflation and return overrides in resolved assumptions", () => {
    const result = calculateGoalFunding({
      goalCategory: "education",
      targetAmountToday: "1000000",
      horizonMonths: 60,
      currentSavings: "100000",
      annualInflation: "7.5",
      expectedAnnualReturn: "10.25",
    });

    expect(result.resolvedAssumptions.educationInflation).toBe("7.5000");
    expect(result.resolvedAssumptions.returns.expected).toBe("10.2500");
    expect(result.annualInflationUsed).toBe("7.5000");
    expect(result.expectedReturnUsed).toBe("10.2500");
  });
});
