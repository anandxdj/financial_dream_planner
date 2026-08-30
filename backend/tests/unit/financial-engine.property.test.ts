import Decimal from "decimal.js";
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
import { AppError } from "../../src/shared/errors/app-error";

describe("financial engine mathematical invariant & property-style test suite", () => {
  it("property: cash-flow exact accounting identity: surplus + totalExpenses + fixedObligations == income", () => {
    // Generate various randomized/varied combinations
    const testCases = [
      { inc: "123456.78", ess: "34567.89", disc: "23456.78", emi: "12345.67", mand: "5432.10" },
      { inc: "50000.00", ess: "20000.00", disc: "10000.00", emi: "15000.00", mand: "5000.00" },
      { inc: "10000.00", ess: "8000.00", disc: "5000.00", emi: "3000.00", mand: "1000.00" }, // negative surplus
      { inc: "999999.99", ess: "0.00", disc: "0.00", emi: "0.00", mand: "0.00" },
    ];

    for (const tc of testCases) {
      const result = calculateCashFlow({
        income: tc.inc,
        essentialExpenses: tc.ess,
        discretionaryExpenses: tc.disc,
        emis: tc.emi,
        mandatoryObligations: tc.mand,
      });

      const income = new Decimal(result.monthlyIncome!);
      const totalExpenses = new Decimal(result.totalExpenses!);
      const fixedObligations = new Decimal(result.fixedObligations!);
      const surplus = new Decimal(result.monthlySurplus!);

      // Identity: income = surplus + totalExpenses + fixedObligations
      const reconstructed = surplus.add(totalExpenses).add(fixedObligations);
      expect(reconstructed.toFixed(2)).toBe(income.toFixed(2));
    }
  });

  it("property: loan amortization exact principal conservation for any tenure and interest rate", () => {
    const loanScenarios = [
      { p: "500000.00", r: "7.2500", n: 60 },
      { p: "1500000.00", r: "9.0000", n: 120 },
      { p: "8500000.00", r: "8.7500", n: 240 },
      { p: "100000.00", r: "0.0000", n: 18 },
      { p: "75000.00", r: "14.5000", n: 36 },
    ];

    for (const sc of loanScenarios) {
      const res = calculateLoan({
        principal: sc.p,
        annualRate: sc.r,
        tenureMonths: sc.n,
      });

      // Exact principal conservation: totalPrincipal matches loan principal exactly
      expect(res.totalPrincipal).toBe(sc.p);
      // Final remaining balance must be exactly 0.00
      expect(res.schedule[res.schedule.length - 1].remainingBalance).toBe("0.00");
    }
  });

  it("property: investment projection monotonicity: higher return or higher contribution strictly increases future value", () => {
    // 1. Return rate monotonicity: 6% < 9% < 12% < 15%
    const proj = calculateInvestmentProjection({
      initialLumpSum: "50000.00",
      monthlySip: "10000.00",
      horizonMonths: 60,
      customAnnualRate: "15.0000",
    });

    const cons = new Decimal(proj.scenarios.conservative.futureValue);
    const exp = new Decimal(proj.scenarios.expected.futureValue);
    const opt = new Decimal(proj.scenarios.optimistic.futureValue);
    const cust = new Decimal(proj.scenarios.custom.futureValue);

    expect(cons.lessThan(exp)).toBe(true);
    expect(exp.lessThan(opt)).toBe(true);
    expect(opt.lessThan(cust)).toBe(true);

    // 2. Contribution monotonicity: SIP 5k < SIP 10k < SIP 15k
    const sip5k = calculateInvestmentProjection({ initialLumpSum: "0.00", monthlySip: "5000.00", horizonMonths: 36 });
    const sip10k = calculateInvestmentProjection({ initialLumpSum: "0.00", monthlySip: "10000.00", horizonMonths: 36 });
    const sip15k = calculateInvestmentProjection({ initialLumpSum: "0.00", monthlySip: "15000.00", horizonMonths: 36 });

    const fv5k = new Decimal(sip5k.scenarios.expected.futureValue);
    const fv10k = new Decimal(sip10k.scenarios.expected.futureValue);
    const fv15k = new Decimal(sip15k.scenarios.expected.futureValue);

    expect(fv5k.lessThan(fv10k)).toBe(true);
    expect(fv10k.lessThan(fv15k)).toBe(true);
  });

  it("property: deterministic repeatability (calling 100 times produces bit-exact identical output)", () => {
    const input = {
      income: "150000.00",
      essentialExpenses: "45000.00",
      discretionaryExpenses: "25000.00",
      emis: "30000.00",
      mandatoryObligations: "10000.00",
    };

    const firstRun = JSON.stringify(calculateCashFlow(input));

    for (let i = 0; i < 100; i++) {
      const currentRun = JSON.stringify(calculateCashFlow(input));
      expect(currentRun).toBe(firstRun);
    }
  });

  it("property: strict base-10 parsing and rejection of invalid decimals and negative terms where forbidden", () => {
    expect(() => calculateCashFlow({ income: "-100.00" as never })).toThrowError(AppError);
    expect(() => calculateCashFlow({ income: "abc" as never })).toThrowError(AppError);
    expect(() => calculateCashFlow({ income: 12345 as never })).toThrowError(AppError); // Reject JS number
    expect(() => calculateLoan({ principal: "-5000.00", annualRate: "8.0", tenureMonths: 12 })).toThrowError(AppError);
    expect(() => calculateLoan({ principal: "50000.00", annualRate: "8.0", tenureMonths: -12 })).toThrowError(AppError);
    expect(() => calculateGoalFunding({ targetAmountToday: "0.00", horizonMonths: 12, currentSavings: "0.00" })).toThrowError(AppError); // PV must be positive
    expect(() => calculateEmergencyFund({ incomeStability: "invalid_stability" as never })).toThrowError(AppError);
  });

  it("property: net worth accounting identity totalAssets - totalLiabilities == netWorth", () => {
    const nw = calculateNetWorth({
      assets: [
        { name: "A1", category: "Equities", value: "350000.00" },
        { name: "A2", category: "Cash", value: "150000.00" },
      ],
      liabilities: [
        { name: "L1", category: "Mortgage", value: "200000.00" },
      ],
    });

    const assets = new Decimal(nw.totalAssets!);
    const liabilities = new Decimal(nw.totalLiabilities!);
    const net = new Decimal(nw.netWorth!);

    expect(assets.minus(liabilities).toFixed(2)).toBe(net.toFixed(2));
  });

  it("property: scenario delta conservation baseline + delta == scenario", () => {
    const scen = evaluateScenario({
      name: "Property test scenario",
      baseline: {
        cashFlow: {
          income: "100000.00",
          essentialExpenses: "40000.00",
          discretionaryExpenses: "20000.00",
          emis: "10000.00",
          mandatoryObligations: "0.00",
        },
      },
      scenario: {
        cashFlow: {
          income: "135000.00",
          essentialExpenses: "40000.00",
          discretionaryExpenses: "25000.00",
          emis: "10000.00",
          mandatoryObligations: "0.00",
        },
      },
    });

    const baseSurplus = new Decimal(scen.baseline.cashFlow!.monthlySurplus!);
    const scenSurplus = new Decimal(scen.scenario.cashFlow!.monthlySurplus!);
    const deltaSurplus = new Decimal(scen.deltas.cashFlow!.monthlySurplusDelta!);

    expect(baseSurplus.add(deltaSurplus).toFixed(2)).toBe(scenSurplus.toFixed(2));
  });
});
