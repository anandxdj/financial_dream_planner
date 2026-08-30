import { describe, expect, it } from "vitest";
import { calculateEmergencyFund } from "../../src/modules/financial-engine/emergency-fund";

describe("financial engine emergency fund", () => {
  it("calculates target amount, runway, shortfall and completion months for stable income", () => {
    // Stable income -> 6 months base, 1 dependent -> +1 month = 7 months target
    // Essential 30000 + EMI 10000 + Mandatory 5000 = 45000 monthly need
    // Target = 45000 * 7 = 315000
    // Current reserves = 90000 -> runway = 90000 / 45000 = 2.0000 months
    // Shortfall = 315000 - 90000 = 225000
    // Monthly contribution = 25000 -> ceil(225000 / 25000) = 9 months
    const result = calculateEmergencyFund({
      essentialExpenses: "30000.00",
      emis: "10000.00",
      mandatoryObligations: "5000.00",
      incomeStability: "stable",
      dependents: 1,
      currentReserves: "90000.00",
      monthlyContribution: "25000.00",
    });

    expect(result.completeness.status).toBe("complete");
    expect(result.monthlyNeed).toBe("45000.00");
    expect(result.baseReserveMonths).toBe(6);
    expect(result.dependentsUpliftMonths).toBe(1);
    expect(result.targetReserveMonths).toBe(7);
    expect(result.targetAmount).toBe("315000.00");
    expect(result.currentReserves).toBe("90000.00");
    expect(result.runwayMonths).toBe("2.0000");
    expect(result.shortfall).toBe("225000.00");
    expect(result.completionMonths).toBe(9);
    expect(result.completeness.warnings).toContain("INSUFFICIENT_RUNWAY");
  });

  it("handles variable and irregular income stability with 3+ dependents uplift", () => {
    // Variable income -> 9 months base, 3 dependents -> +2 months = 11 months target
    const variableRes = calculateEmergencyFund({
      essentialExpenses: "20000.00",
      emis: "0.00",
      mandatoryObligations: "0.00",
      incomeStability: "variable",
      dependents: 3,
      currentReserves: "100000.00",
    });

    expect(variableRes.baseReserveMonths).toBe(9);
    expect(variableRes.dependentsUpliftMonths).toBe(2);
    expect(variableRes.targetReserveMonths).toBe(11);
    expect(variableRes.targetAmount).toBe("220000.00");

    // Irregular income -> 12 months base, 0 dependents -> +0 = 12 months
    const irregularRes = calculateEmergencyFund({
      essentialExpenses: "20000.00",
      emis: "0.00",
      mandatoryObligations: "0.00",
      incomeStability: "irregular",
      dependents: 0,
      currentReserves: "250000.00",
    });

    expect(irregularRes.baseReserveMonths).toBe(12);
    expect(irregularRes.dependentsUpliftMonths).toBe(0);
    expect(irregularRes.targetReserveMonths).toBe(12);
    expect(irregularRes.targetAmount).toBe("240000.00");
    expect(irregularRes.shortfall).toBe("0.00");
    expect(irregularRes.completionMonths).toBe(0);
    expect(irregularRes.completeness.warnings).toContain("TARGET_ALREADY_FUNDED");
  });

  it("returns an explicit reserve-month override in resolved assumptions", () => {
    const result = calculateEmergencyFund({
      essentialExpenses: "10000",
      emis: "0",
      mandatoryObligations: "0",
      incomeStability: "stable",
      dependents: 0,
      currentReserves: "0",
      customReserveMonths: 8,
    });

    expect(result.targetReserveMonths).toBe(8);
    expect(result.resolvedAssumptions.emergencyReserveMonths.stable).toBe(8);
  });

  it("returns null completionMonths when monthly contribution is not provided or zero", () => {
    const result = calculateEmergencyFund({
      essentialExpenses: "20000.00",
      emis: "5000.00",
      mandatoryObligations: "0.00",
      incomeStability: "stable",
      dependents: 0,
      currentReserves: "50000.00",
    });

    expect(result.shortfall).toBe("100000.00");
    expect(result.completionMonths).toBeNull();
  });

  it("handles missing inputs cleanly according to completeness contract", () => {
    const incomplete = calculateEmergencyFund({
      essentialExpenses: "30000.00",
      incomeStability: "stable",
      // missing emis, mandatoryObligations, dependents, currentReserves
    });

    expect(incomplete.completeness.status).toBe("incomplete");
    expect(incomplete.completeness.missing).toEqual(["emis", "mandatoryObligations", "dependents", "currentReserves"]);
    expect(incomplete.monthlyNeed).toBeNull();
    expect(incomplete.targetAmount).toBeNull();
    expect(incomplete.runwayMonths).toBeNull();
    expect(incomplete.shortfall).toBeNull();
  });

  it("does not invent a finite runway when monthly need is zero", () => {
    const result = calculateEmergencyFund({
      essentialExpenses: "0",
      emis: "0",
      mandatoryObligations: "0",
      incomeStability: "stable",
      dependents: 0,
      currentReserves: "1000",
    });

    expect(result.runwayMonths).toBeNull();
    expect(result.completeness.warnings).toContain("ZERO_EXPENSES");
  });
});
