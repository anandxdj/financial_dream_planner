import { describe, expect, it } from "vitest";
import { calculateInvestmentProjection } from "../../src/modules/financial-engine/investment-projection";

describe("financial engine investment projections", () => {
  it("projects lump sum and monthly SIP across conservative (6%), expected (9%), and optimistic (12%) policy defaults", () => {
    const result = calculateInvestmentProjection({
      initialLumpSum: "100000.00",
      monthlySip: "10000.00",
      horizonMonths: 120, // 10 years
    });

    expect(result.completeness.status).toBe("complete");
    expect(result.scenarios.conservative).toBeDefined();
    expect(result.scenarios.expected).toBeDefined();
    expect(result.scenarios.optimistic).toBeDefined();

    // Total invested = 100,000 + (10,000 * 120) = 1,300,000.00
    expect(result.scenarios.conservative.totalInvested).toBe("1300000.00");
    expect(result.scenarios.expected.totalInvested).toBe("1300000.00");
    expect(result.scenarios.optimistic.totalInvested).toBe("1300000.00");

    const consFV = parseFloat(result.scenarios.conservative.futureValue);
    const expFV = parseFloat(result.scenarios.expected.futureValue);
    const optFV = parseFloat(result.scenarios.optimistic.futureValue);

    expect(consFV).toBeGreaterThan(1300000);
    expect(expFV).toBeGreaterThan(consFV);
    expect(optFV).toBeGreaterThan(expFV);

    expect(result.scenarios.expected.milestones).toHaveLength(10);
    expect(result.scenarios.expected.milestones[9].month).toBe(120);
  });

  it("applies step-up once after each completed 12-month block", () => {
    const withoutStepUp = calculateInvestmentProjection({
      initialLumpSum: "0.00",
      monthlySip: "10000.00",
      annualStepUp: "0.0000",
      horizonMonths: 24,
    });

    const withStepUp = calculateInvestmentProjection({
      initialLumpSum: "0.00",
      monthlySip: "10000.00",
      annualStepUp: "10.0000", // 10% annual step up
      horizonMonths: 24,
    });

    // Month 1-12: 10,000/mo = 120,000
    // Month 13-24: 11,000/mo = 132,000 -> Total invested = 252,000
    expect(withoutStepUp.scenarios.expected.totalInvested).toBe("240000.00");
    expect(withStepUp.scenarios.expected.totalInvested).toBe("252000.00");
    expect(parseFloat(withStepUp.scenarios.expected.futureValue)).toBeGreaterThan(parseFloat(withoutStepUp.scenarios.expected.futureValue));
  });

  it("supports custom annual rate when provided", () => {
    const result = calculateInvestmentProjection({
      initialLumpSum: "50000.00",
      monthlySip: "5000.00",
      horizonMonths: 36,
      customAnnualRate: "15.0000",
    });

    expect(result.scenarios.custom).toBeDefined();
    expect(result.scenarios.custom.annualRate).toBe("15.0000");
    expect(parseFloat(result.scenarios.custom.futureValue)).toBeGreaterThan(parseFloat(result.scenarios.optimistic.futureValue));
  });

  it("returns incomplete when horizonMonths or both contribution fields are missing", () => {
    const incomplete = calculateInvestmentProjection({
      initialLumpSum: "100000.00",
      // missing horizonMonths
    });

    expect(incomplete.completeness.status).toBe("incomplete");
    expect(incomplete.completeness.missing).toEqual(["horizonMonths"]);
    expect(Object.keys(incomplete.scenarios)).toHaveLength(0);
  });

  it("treats explicit zero contributions as complete without unrelated warnings", () => {
    const result = calculateInvestmentProjection({
      initialLumpSum: "0",
      monthlySip: "0",
      horizonMonths: 12,
    });

    expect(result.completeness).toEqual({ status: "complete", missing: [], warnings: [] });
    expect(result.scenarios.expected.futureValue).toBe("0.00");
  });

  it("returns an explicit step-up override in resolved assumptions", () => {
    const result = calculateInvestmentProjection({
      monthlySip: "1000",
      annualStepUp: "5.5",
      horizonMonths: 24,
    });

    expect(result.annualStepUp).toBe("5.5000");
    expect(result.resolvedAssumptions.annualStepUp).toBe("5.5000");
  });
});
