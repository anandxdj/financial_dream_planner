import { describe, expect, it } from "vitest";
import { calculateCashFlow } from "../../src/modules/financial-engine/cash-flow";

describe("financial engine cash flow", () => {
  it("calculates exact cash flow and savings rate with surplus", () => {
    const result = calculateCashFlow({
      income: "100000.00",
      essentialExpenses: "30000.00",
      discretionaryExpenses: "20000.00",
      emis: "15000.00",
      mandatoryObligations: "5000.00",
    });

    expect(result.completeness.status).toBe("complete");
    expect(result.completeness.missing).toHaveLength(0);
    expect(result.completeness.warnings).toHaveLength(0);
    expect(result.monthlyIncome).toBe("100000.00");
    expect(result.essentialExpenses).toBe("30000.00");
    expect(result.discretionaryExpenses).toBe("20000.00");
    expect(result.totalExpenses).toBe("50000.00");
    expect(result.fixedObligations).toBe("20000.00");
    expect(result.totalOutflows).toBe("70000.00");
    expect(result.monthlySurplus).toBe("30000.00");
    expect(result.savingsRate).toBe("30.0000"); // 30000 / 100000 * 100
    expect(result.investableCapacity).toBe("30000.00");
  });

  it("handles negative cash flow with warning and zero investable capacity", () => {
    const result = calculateCashFlow({
      income: "50000.00",
      essentialExpenses: "40000.00",
      discretionaryExpenses: "15000.00",
      emis: "10000.00",
      mandatoryObligations: "5000.00",
    });

    expect(result.completeness.status).toBe("complete");
    expect(result.monthlySurplus).toBe("-20000.00");
    expect(result.savingsRate).toBe("-40.0000");
    expect(result.investableCapacity).toBe("0.00");
    expect(result.completeness.warnings).toContain("NEGATIVE_CASH_FLOW");
  });

  it("handles zero income with ZERO_INCOME warning and null savings rate", () => {
    const result = calculateCashFlow({
      income: "0.00",
      essentialExpenses: "10000.00",
      discretionaryExpenses: "0.00",
      emis: "0.00",
      mandatoryObligations: "0.00",
    });

    expect(result.completeness.status).toBe("complete");
    expect(result.monthlyIncome).toBe("0.00");
    expect(result.monthlySurplus).toBe("-10000.00");
    expect(result.savingsRate).toBeNull();
    expect(result.completeness.warnings).toContain("ZERO_INCOME");
    expect(result.completeness.warnings).toContain("NEGATIVE_CASH_FLOW");
  });

  it("reports incomplete when required fields are missing and does not assume zero", () => {
    const result = calculateCashFlow({
      income: "80000.00",
      essentialExpenses: "25000.00",
      // missing discretionaryExpenses, emis, mandatoryObligations
    });

    expect(result.completeness.status).toBe("incomplete");
    expect(result.completeness.missing).toEqual(["discretionaryExpenses", "emis", "mandatoryObligations"]);
    expect(result.monthlyIncome).toBe("80000.00");
    expect(result.essentialExpenses).toBe("25000.00");
    expect(result.discretionaryExpenses).toBeNull();
    expect(result.totalExpenses).toBeNull();
    expect(result.totalOutflows).toBeNull();
    expect(result.monthlySurplus).toBeNull();
    expect(result.savingsRate).toBeNull();
    expect(result.investableCapacity).toBeNull();
  });

  it("differentiates missing fields from explicit '0' or '0.00'", () => {
    const withZero = calculateCashFlow({
      income: "80000.00",
      essentialExpenses: "25000.00",
      discretionaryExpenses: "0.00",
      emis: "0",
      mandatoryObligations: "0.00",
    });

    expect(withZero.completeness.status).toBe("complete");
    expect(withZero.completeness.missing).toHaveLength(0);
    expect(withZero.totalExpenses).toBe("25000.00");
    expect(withZero.fixedObligations).toBe("0.00");
    expect(withZero.monthlySurplus).toBe("55000.00");
    expect(withZero.savingsRate).toBe("68.7500");
  });
});
