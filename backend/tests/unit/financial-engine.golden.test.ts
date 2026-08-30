import { describe, expect, it } from "vitest";
import {
  calculateCashFlow,
  calculateEmergencyFund,
  calculateGoalFunding,
  calculateInvestmentProjection,
  calculateLoan,
  calculateNetWorth,
  evaluateScenario,
} from "../../src/modules/financial-engine";

describe("financial engine golden reference acceptance suite", () => {
  it("golden: published policy IN-2026.1 resolution and defaults", () => {
    const cf = calculateCashFlow({
      income: "100000.00",
      essentialExpenses: "30000.00",
      discretionaryExpenses: "20000.00",
      emis: "10000.00",
      mandatoryObligations: "0.00",
    });

    expect(cf.policyVersion).toBe("IN-2026.1");
    expect(cf.resolvedAssumptions).toEqual({
      policyVersion: "IN-2026.1",
      generalInflation: "6.0000",
      educationInflation: "8.0000",
      medicalInflation: "8.0000",
      returns: {
        conservative: "6.0000",
        expected: "9.0000",
        optimistic: "12.0000",
      },
      annualStepUp: "0.0000",
      emergencyReserveMonths: {
        stable: 6,
        variable: 9,
        irregular: 12,
      },
    });
  });

  it("golden: exact zero-rate loan amortization schedule", () => {
    // 6-month zero-cost EMI on 60,000 INR
    const loan = calculateLoan({
      principal: "60000.00",
      annualRate: "0.0000",
      tenureMonths: 6,
    });

    expect(loan.monthlyEmi).toBe("10000.00");
    expect(loan.totalPrincipal).toBe("60000.00");
    expect(loan.totalInterest).toBe("0.00");
    expect(loan.totalPayment).toBe("60000.00");
    expect(loan.schedule).toEqual([
      { month: 1, payment: "10000.00", principal: "10000.00", interest: "0.00", remainingBalance: "50000.00" },
      { month: 2, payment: "10000.00", principal: "10000.00", interest: "0.00", remainingBalance: "40000.00" },
      { month: 3, payment: "10000.00", principal: "10000.00", interest: "0.00", remainingBalance: "30000.00" },
      { month: 4, payment: "10000.00", principal: "10000.00", interest: "0.00", remainingBalance: "20000.00" },
      { month: 5, payment: "10000.00", principal: "10000.00", interest: "0.00", remainingBalance: "10000.00" },
      { month: 6, payment: "10000.00", principal: "10000.00", interest: "0.00", remainingBalance: "0.00" },
    ]);
  });

  it("golden: standard 10-lakh 12% 1-year loan with final principal conservation", () => {
    // Principal: 1,000,000, Annual Rate: 12% (1% monthly), Tenure: 12 months
    // Formula: EMI = 1,000,000 * 0.01 * (1.01)^12 / ((1.01)^12 - 1) = 88,848.79
    const loan = calculateLoan({
      principal: "1000000.00",
      annualRate: "12.0000",
      tenureMonths: 12,
    });

    expect(loan.monthlyEmi).toBe("88848.79");
    expect(loan.totalPrincipal).toBe("1000000.00");
    expect(loan.totalInterest).toBe("66185.46");
    expect(loan.totalPayment).toBe("1066185.46");
    expect(loan.schedule[11].remainingBalance).toBe("0.00");
  });

  it("golden: 10k monthly SIP over 3 years across published return tiers", () => {
    // 36 months of 10,000 SIP = 360,000 total invested
    const proj = calculateInvestmentProjection({
      initialLumpSum: "0.00",
      monthlySip: "10000.00",
      horizonMonths: 36,
    });

    expect(proj.scenarios.conservative.totalInvested).toBe("360000.00");
    expect(proj.scenarios.expected.totalInvested).toBe("360000.00");
    expect(proj.scenarios.optimistic.totalInvested).toBe("360000.00");

    // End-of-month formula: FutureValue = 10000 * ((1+r)^36 - 1) / r
    expect(proj.scenarios.conservative.futureValue).toBe("393361.05");
    expect(proj.scenarios.expected.futureValue).toBe("411527.16");
    expect(proj.scenarios.optimistic.futureValue).toBe("430768.78");
  });

  it("golden: higher education goal cost with 8% inflation and required SIP at 9%", () => {
    // Target 2,000,000 today in 5 years (60 months)
    // Future cost at 8% monthly: 2,000,000 * (1 + 0.08/12)^60 = 2,979,691.42
    // Current savings 500,000 at 9% grows to: 500,000 * (1 + 0.09/12)^60 = 782,840.52
    // Shortfall = 2,196,850.90
    // Required SIP at 9% (r=0.0075, n=60): 2,196,850.90 * 0.0075 / ((1.0075)^60 - 1) = 29,126.18
    const goal = calculateGoalFunding({
      goalName: "MBA Degree",
      goalCategory: "education",
      targetAmountToday: "2000000.00",
      horizonMonths: 60,
      currentSavings: "500000.00",
      availableMonthlyCapacity: "35000.00",
    });

    expect(goal.annualInflationUsed).toBe("8.0000");
    expect(goal.expectedReturnUsed).toBe("9.0000");
    expect(goal.futureGoalCost).toBe("2979691.42");
    expect(goal.currentSavingsFutureValue).toBe("782840.51");
    expect(goal.shortfall).toBe("2196850.90");
    expect(goal.requiredSip).toBe("29126.63");
    expect(goal.feasibility).toBe("feasible");
  });

  it("golden: emergency fund runway for irregular income with 2 dependents", () => {
    // Irregular income: 12 months base
    // 2 dependents: +1 month uplift -> Target = 13 months
    // Essential 40,000 + EMI 20,000 + Mandatory 10,000 = 70,000 monthly need
    // Target amount = 70,000 * 13 = 910,000.00
    // Current reserves = 350,000.00
    // Runway = 350,000 / 70,000 = 5.0000 months
    // Shortfall = 910,000 - 350,000 = 560,000.00
    // Monthly contribution = 50,000 -> ceil(560,000 / 50,000) = 12 months
    const ef = calculateEmergencyFund({
      essentialExpenses: "40000.00",
      emis: "20000.00",
      mandatoryObligations: "10000.00",
      incomeStability: "irregular",
      dependents: 2,
      currentReserves: "350000.00",
      monthlyContribution: "50000.00",
    });

    expect(ef.baseReserveMonths).toBe(12);
    expect(ef.dependentsUpliftMonths).toBe(1);
    expect(ef.targetReserveMonths).toBe(13);
    expect(ef.targetAmount).toBe("910000.00");
    expect(ef.runwayMonths).toBe("5.0000");
    expect(ef.shortfall).toBe("560000.00");
    expect(ef.completionMonths).toBe(12);
  });

  it("golden: net worth calculation and stable asset allocation percentages", () => {
    const nw = calculateNetWorth({
      assets: [
        { name: "Checking Account", category: "Cash", value: "100000.00" },
        { name: "Index Fund", category: "Equities", value: "300000.00" },
      ],
      liabilities: [
        { name: "Car Loan", category: "Auto", value: "150000.00" },
      ],
    });

    expect(nw.totalAssets).toBe("400000.00");
    expect(nw.totalLiabilities).toBe("150000.00");
    expect(nw.netWorth).toBe("250000.00");
    expect(nw.assetAllocations).toEqual([
      { category: "Cash", totalValue: "100000.00", percentage: "25.0000" },
      { category: "Equities", totalValue: "300000.00", percentage: "75.0000" },
    ]);
  });

  it("golden: scenario evaluation with cash flow and emergency fund deltas", () => {
    const scen = evaluateScenario({
      name: "Income Increase",
      baseline: {
        cashFlow: {
          income: "100000.00",
          essentialExpenses: "30000.00",
          discretionaryExpenses: "20000.00",
          emis: "10000.00",
          mandatoryObligations: "0.00",
        },
      },
      scenario: {
        cashFlow: {
          income: "120000.00",
          essentialExpenses: "30000.00",
          discretionaryExpenses: "20000.00",
          emis: "10000.00",
          mandatoryObligations: "0.00",
        },
      },
    });

    expect(scen.deltas.cashFlow?.monthlySurplusDelta).toBe("20000.00");
    expect(scen.baseline.cashFlow?.monthlySurplus).toBe("40000.00");
    expect(scen.scenario.cashFlow?.monthlySurplus).toBe("60000.00");
  });
});
