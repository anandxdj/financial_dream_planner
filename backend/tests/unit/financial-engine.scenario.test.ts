import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src/modules/financial-engine/scenario";

describe("financial engine scenario evaluation", () => {
  it("evaluates what-if scenario deltas against baseline deterministically", () => {
    const result = evaluateScenario({
      name: "Salary Hike & Prepayment Scenario",
      description: "Evaluate 20k salary increase and 5k additional EMI prepayment",
      baseline: {
        cashFlow: {
          income: "100000.00",
          essentialExpenses: "30000.00",
          discretionaryExpenses: "20000.00",
          emis: "20000.00",
          mandatoryObligations: "5000.00",
        },
        emergencyFund: {
          essentialExpenses: "30000.00",
          emis: "20000.00",
          mandatoryObligations: "5000.00",
          incomeStability: "stable",
          dependents: 1,
          currentReserves: "100000.00",
          monthlyContribution: "10000.00",
        },
      },
      scenario: {
        cashFlow: {
          income: "120000.00", // +20,000 income
          essentialExpenses: "30000.00",
          discretionaryExpenses: "20000.00",
          emis: "20000.00",
          mandatoryObligations: "5000.00",
        },
        emergencyFund: {
          essentialExpenses: "30000.00",
          emis: "20000.00",
          mandatoryObligations: "5000.00",
          incomeStability: "stable",
          dependents: 1,
          currentReserves: "100000.00",
          monthlyContribution: "25000.00", // +15,000 monthly contribution
        },
      },
    });

    expect(result.completeness.status).toBe("complete");
    expect(result.baseline.cashFlow?.monthlySurplus).toBe("25000.00");
    expect(result.scenario.cashFlow?.monthlySurplus).toBe("45000.00");
    expect(result.deltas.cashFlow?.monthlySurplusDelta).toBe("20000.00");
    expect(result.deltas.cashFlow?.savingsRateDelta).toBe("12.5000"); // 37.5% - 25.0% = 12.5%

    // Emergency fund completion speedup:
    // Need = 55,000 * 7 = 385,000. Shortfall = 285,000
    // Baseline completion: ceil(285,000 / 10,000) = 29 months
    // Scenario completion: ceil(285,000 / 25,000) = 12 months
    // Delta = 12 - 29 = -17 months
    expect(result.baseline.emergencyFund?.completionMonths).toBe(29);
    expect(result.scenario.emergencyFund?.completionMonths).toBe(12);
    expect(result.deltas.emergencyFund?.completionMonthsDelta).toBe(-17);
  });

  it("applies partial scenario changes over complete baseline inputs", () => {
    const result = evaluateScenario({
      name: "Salary increase",
      baseline: {
        cashFlow: {
          income: "100000",
          essentialExpenses: "30000",
          discretionaryExpenses: "20000",
          emis: "20000",
          mandatoryObligations: "5000",
        },
      },
      scenario: { cashFlow: { income: "120000" } },
    });

    expect(result.completeness.status).toBe("complete");
    expect(result.scenario.cashFlow?.monthlySurplus).toBe("45000.00");
    expect(result.deltas.cashFlow?.monthlySurplusDelta).toBe("20000.00");
  });
});
