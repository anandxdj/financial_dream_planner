import { describe, expect, it } from "vitest";
import { compareDrift, DRIFT_POLICY_VERSION } from "../../src/modules/drift/comparator";
import type { ScenarioDomainInputs } from "../../src/modules/financial-engine";

describe("U7 Drift Comparator & Deterministic Materiality Policy (DRIFT-IN-2026.1)", () => {
  const baseBaseline: ScenarioDomainInputs = {
    cashFlow: {
      income: "100000.00",
      essentialExpenses: "30000.00",
      discretionaryExpenses: "20000.00",
      emis: "10000.00",
      mandatoryObligations: "5000.00",
    },
    emergencyFund: {
      essentialExpenses: "30000.00",
      emis: "10000.00",
      mandatoryObligations: "5000.00",
      incomeStability: "stable",
      dependents: 0,
      currentReserves: "270000.00", // 6 months runway
    },
    investment: {
      initialLumpSum: "100000.00",
      monthlySip: "20000.00",
      horizonMonths: 120,
    },
    loan: {
      principal: "1000000.00",
      annualRate: "8.50",
      tenureMonths: 120,
    },
    goal: {
      targetAmountToday: "500000.00",
      horizonMonths: 60,
      currentSavings: "100000.00",
      availableMonthlyCapacity: "10000.00",
    },
    netWorth: {
      assets: [{ name: "Savings", category: "Cash", value: "370000.00" }],
      liabilities: [{ name: "Loan", category: "Personal", value: "1000000.00" }],
    },
  };

  it("returns no_change with zero findings on canonically equal inputs", () => {
    const result = compareDrift({
      baselineInputs: baseBaseline,
      observedInputs: JSON.parse(JSON.stringify(baseBaseline)),
    });

    expect(result.isMaterial).toBe(false);
    expect(result.findings).toHaveLength(0);
    expect(result.policyVersion).toBe(DRIFT_POLICY_VERSION);
  });

  describe("Finding 1: income_changed (at least 5% and INR 1,000)", () => {
    it("is not material immediately below boundary (delta 4.99% or < 1000)", () => {
      // 4.9% increase on 100,000 is 4,900
      const res1 = compareDrift({
        baselineInputs: { cashFlow: { income: "100000.00" } },
        observedInputs: { cashFlow: { income: "104900.00" } },
      });
      expect(res1.findings.find((f) => f.code === "income_changed")).toBeUndefined();

      // 10% increase on 5,000 is 500 (rel >= 5% but abs 500 < floor 1,000)
      const res2 = compareDrift({
        baselineInputs: { cashFlow: { income: "5000.00" } },
        observedInputs: { cashFlow: { income: "5500.00" } },
      });
      expect(res2.findings.find((f) => f.code === "income_changed")).toBeUndefined();
    });

    it("is material exactly at boundary (exactly 5% and >= 1000)", () => {
      const res = compareDrift({
        baselineInputs: { cashFlow: { income: "100000.00" } },
        observedInputs: { cashFlow: { income: "105000.00" } },
      });
      const finding = res.findings.find((f) => f.code === "income_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("notice");
      expect(finding?.baselineValue).toBe("100000.00");
      expect(finding?.observedValue).toBe("105000.00");
      expect(finding?.absoluteDelta).toBe("5000.00");
    });

    it("is material immediately above boundary", () => {
      const res = compareDrift({
        baselineInputs: { cashFlow: { income: "100000.00" } },
        observedInputs: { cashFlow: { income: "105001.00" } },
      });
      expect(res.findings.find((f) => f.code === "income_changed")).toBeDefined();
    });

    it("emits warning severity for adverse drop >= 2x threshold (>= 10% and >= 2000)", () => {
      const res = compareDrift({
        baselineInputs: { cashFlow: { income: "100000.00" } },
        observedInputs: { cashFlow: { income: "90000.00" } }, // 10% drop, 10,000 delta
      });
      const finding = res.findings.find((f) => f.code === "income_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("warning");
    });

    it("handles zero baseline and missing values correctly", () => {
      // 0 to 1,000 (crosses floor 1,000)
      const res1 = compareDrift({
        baselineInputs: { cashFlow: { income: "0.00" } },
        observedInputs: { cashFlow: { income: "1000.00" } },
      });
      expect(res1.findings.find((f) => f.code === "income_changed")).toBeDefined();

      // 0 to 999.99 (below floor 1,000)
      const res2 = compareDrift({
        baselineInputs: { cashFlow: { income: "0.00" } },
        observedInputs: { cashFlow: { income: "999.99" } },
      });
      expect(res2.findings.find((f) => f.code === "income_changed")).toBeUndefined();
    });
  });

  describe("Finding 2: spending_changed (essential + discretionary: at least 10% and INR 2,000)", () => {
    it("is not material immediately below boundary", () => {
      // Baseline total = 50,000. 9% increase = 4,500.
      const res = compareDrift({
        baselineInputs: { cashFlow: { essentialExpenses: "30000.00", discretionaryExpenses: "20000.00" } },
        observedInputs: { cashFlow: { essentialExpenses: "34500.00", discretionaryExpenses: "20000.00" } },
      });
      expect(res.findings.find((f) => f.code === "spending_changed")).toBeUndefined();
    });

    it("is material exactly at boundary (10% and 5,000 >= 2000)", () => {
      const res = compareDrift({
        baselineInputs: { cashFlow: { essentialExpenses: "30000.00", discretionaryExpenses: "20000.00" } },
        observedInputs: { cashFlow: { essentialExpenses: "35000.00", discretionaryExpenses: "20000.00" } },
      });
      const finding = res.findings.find((f) => f.code === "spending_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("notice");
    });

    it("emits warning severity for adverse spending increase >= 20% and >= 4000", () => {
      const res = compareDrift({
        baselineInputs: { cashFlow: { essentialExpenses: "30000.00", discretionaryExpenses: "20000.00" } },
        observedInputs: { cashFlow: { essentialExpenses: "40000.00", discretionaryExpenses: "20000.00" } }, // 20% increase (10,000)
      });
      const finding = res.findings.find((f) => f.code === "spending_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("warning");
    });
  });

  describe("Finding 3: obligations_changed (EMIs + mandatory: at least 5% and INR 1,000)", () => {
    it("is not material immediately below boundary", () => {
      // Baseline 15,000. 4.5% = 675.
      const res = compareDrift({
        baselineInputs: { cashFlow: { emis: "10000.00", mandatoryObligations: "5000.00" } },
        observedInputs: { cashFlow: { emis: "10675.00", mandatoryObligations: "5000.00" } },
      });
      expect(res.findings.find((f) => f.code === "obligations_changed")).toBeUndefined();
    });

    it("is material exactly at boundary (5% of 20,000 is 1,000)", () => {
      const res = compareDrift({
        baselineInputs: { cashFlow: { emis: "15000.00", mandatoryObligations: "5000.00" } },
        observedInputs: { cashFlow: { emis: "16000.00", mandatoryObligations: "5000.00" } },
      });
      const finding = res.findings.find((f) => f.code === "obligations_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("notice");
    });

    it("emits warning for adverse increase >= 10% and >= 2000", () => {
      const res = compareDrift({
        baselineInputs: { cashFlow: { emis: "15000.00", mandatoryObligations: "5000.00" } },
        observedInputs: { cashFlow: { emis: "17000.00", mandatoryObligations: "5000.00" } }, // 10% increase (2,000)
      });
      const finding = res.findings.find((f) => f.code === "obligations_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("warning");
    });
  });

  describe("Finding 4: surplus_changed (sign change, or at least 10% and INR 1,000)", () => {
    it("emits critical severity on sign regression (positive to negative surplus)", () => {
      const res = compareDrift({
        baselineInputs: {
          cashFlow: { income: "100000.00", essentialExpenses: "30000.00", discretionaryExpenses: "20000.00", emis: "0.00", mandatoryObligations: "0.00" }, // surplus 50,000
        },
        observedInputs: {
          cashFlow: { income: "100000.00", essentialExpenses: "70000.00", discretionaryExpenses: "40000.00", emis: "0.00", mandatoryObligations: "0.00" }, // expenses 110,000 -> surplus -10,000
        },
      });
      const finding = res.findings.find((f) => f.code === "surplus_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("critical");
    });

    it("emits warning for adverse decrease >= 20% and >= 2000", () => {
      const res = compareDrift({
        baselineInputs: {
          cashFlow: { income: "100000.00", essentialExpenses: "30000.00", discretionaryExpenses: "20000.00", emis: "0.00", mandatoryObligations: "0.00" }, // surplus 50,000
        },
        observedInputs: {
          cashFlow: { income: "100000.00", essentialExpenses: "40000.00", discretionaryExpenses: "20000.00", emis: "0.00", mandatoryObligations: "0.00" }, // surplus 40,000 (20% drop, 10,000 delta)
        },
      });
      const finding = res.findings.find((f) => f.code === "surplus_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("warning");
    });
  });

  describe("Finding 5: reserve_runway_changed (at least 1.00 month)", () => {
    it("is not material below 1.00 month delta", () => {
      // Need = 45,000. 270,000 reserves = 6.00 mo. 240,000 reserves = 5.33 mo (delta 0.67 mo < 1.00).
      const res = compareDrift({
        baselineInputs: {
          emergencyFund: { essentialExpenses: "30000.00", emis: "10000.00", mandatoryObligations: "5000.00", incomeStability: "stable", dependents: 0, currentReserves: "270000.00" },
        },
        observedInputs: {
          emergencyFund: { essentialExpenses: "30000.00", emis: "10000.00", mandatoryObligations: "5000.00", incomeStability: "stable", dependents: 0, currentReserves: "240000.00" },
        },
      });
      expect(res.findings.find((f) => f.code === "reserve_runway_changed")).toBeUndefined();
    });

    it("is material at exactly 1.00 month delta", () => {
      // Need = 45,000. 270,000 reserves = 6.00 mo. 225,000 reserves = 5.00 mo (delta 1.00 mo).
      const res = compareDrift({
        baselineInputs: {
          emergencyFund: { essentialExpenses: "30000.00", emis: "10000.00", mandatoryObligations: "5000.00", incomeStability: "stable", dependents: 0, currentReserves: "270000.00" },
        },
        observedInputs: {
          emergencyFund: { essentialExpenses: "30000.00", emis: "10000.00", mandatoryObligations: "5000.00", incomeStability: "stable", dependents: 0, currentReserves: "225000.00" },
        },
      });
      const finding = res.findings.find((f) => f.code === "reserve_runway_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("notice");
    });

    it("emits warning for adverse runway drop >= 2.00 months", () => {
      // Need = 45,000. 270,000 reserves = 6.00 mo. 180,000 reserves = 4.00 mo (delta 2.00 mo drop).
      const res = compareDrift({
        baselineInputs: {
          emergencyFund: { essentialExpenses: "30000.00", emis: "10000.00", mandatoryObligations: "5000.00", incomeStability: "stable", dependents: 0, currentReserves: "270000.00" },
        },
        observedInputs: {
          emergencyFund: { essentialExpenses: "30000.00", emis: "10000.00", mandatoryObligations: "5000.00", incomeStability: "stable", dependents: 0, currentReserves: "180000.00" },
        },
      });
      const finding = res.findings.find((f) => f.code === "reserve_runway_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("warning");
    });
  });

  describe("Finding 6: investment_contribution_changed (monthly SIP: at least 10% and INR 1,000)", () => {
    it("is material at 10% and >= 1000", () => {
      const res = compareDrift({
        baselineInputs: { investment: { monthlySip: "20000.00" } },
        observedInputs: { investment: { monthlySip: "22000.00" } },
      });
      const finding = res.findings.find((f) => f.code === "investment_contribution_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("notice");
    });

    it("emits warning on drop >= 20% and >= 2000", () => {
      const res = compareDrift({
        baselineInputs: { investment: { monthlySip: "20000.00" } },
        observedInputs: { investment: { monthlySip: "16000.00" } },
      });
      const finding = res.findings.find((f) => f.code === "investment_contribution_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("warning");
    });
  });

  describe("Finding 7: debt_terms_changed (principal >= 5% & >= 5000, rate >= 0.50 pp, tenure >= 3 mo, prepayments)", () => {
    it("is material when rate changes by 0.50 percentage point", () => {
      const res = compareDrift({
        baselineInputs: { loan: { principal: "500000.00", annualRate: "8.50", tenureMonths: 60 } },
        observedInputs: { loan: { principal: "500000.00", annualRate: "9.00", tenureMonths: 60 } },
      });
      const finding = res.findings.find((f) => f.code === "debt_terms_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("notice");
    });

    it("emits warning when rate increases by >= 1.00 percentage point", () => {
      const res = compareDrift({
        baselineInputs: { loan: { principal: "500000.00", annualRate: "8.50", tenureMonths: 60 } },
        observedInputs: { loan: { principal: "500000.00", annualRate: "9.50", tenureMonths: 60 } },
      });
      const finding = res.findings.find((f) => f.code === "debt_terms_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("warning");
    });

    it("is material when tenure changes by 3 months", () => {
      const res = compareDrift({
        baselineInputs: { loan: { principal: "500000.00", annualRate: "8.50", tenureMonths: 60 } },
        observedInputs: { loan: { principal: "500000.00", annualRate: "8.50", tenureMonths: 63 } },
      });
      const finding = res.findings.find((f) => f.code === "debt_terms_changed");
      expect(finding).toBeDefined();
    });

    it("is material when prepayment schedule changes", () => {
      const res = compareDrift({
        baselineInputs: { loan: { principal: "500000.00", annualRate: "8.50", tenureMonths: 60 } },
        observedInputs: {
          loan: {
            principal: "500000.00",
            annualRate: "8.50",
            tenureMonths: 60,
            prepayments: [{ month: 12, amount: "50000.00" }],
          },
        },
      });
      const finding = res.findings.find((f) => f.code === "debt_terms_changed");
      expect(finding).toBeDefined();
    });
  });

  describe("Finding 8: goal_changed (target >= 5% & >= 5000, horizon >= 3 mo, savings >= 10% & >= 1000, feasibility)", () => {
    it("emits critical on feasibility regression to infeasible", () => {
      // Feasible goal becoming infeasible due to huge target increase
      const res = compareDrift({
        baselineInputs: {
          goal: {
            targetAmountToday: "500000.00",
            horizonMonths: 60,
            currentSavings: "200000.00",
            availableMonthlyCapacity: "10000.00",
          },
        },
        observedInputs: {
          goal: {
            targetAmountToday: "5000000.00", // huge target -> infeasible
            horizonMonths: 60,
            currentSavings: "200000.00",
            availableMonthlyCapacity: "10000.00",
          },
        },
      });
      const finding = res.findings.find((f) => f.code === "goal_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("critical");
    });
  });

  describe("Finding 9: net_worth_changed (sign change, or >= 10% and >= 10,000)", () => {
    it("emits critical on sign regression from positive to negative net worth", () => {
      const res = compareDrift({
        baselineInputs: {
          netWorth: {
            assets: [{ name: "Savings", category: "Cash", value: "500000.00" }],
            liabilities: [{ name: "Debt", category: "Loan", value: "200000.00" }], // net worth +300,000
          },
        },
        observedInputs: {
          netWorth: {
            assets: [{ name: "Savings", category: "Cash", value: "100000.00" }],
            liabilities: [{ name: "Debt", category: "Loan", value: "400000.00" }], // net worth -300,000
          },
        },
      });
      const finding = res.findings.find((f) => f.code === "net_worth_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("critical");
    });

    it("emits warning on net worth drop >= 20% and >= 20000", () => {
      const res = compareDrift({
        baselineInputs: {
          netWorth: {
            assets: [{ name: "Savings", category: "Cash", value: "500000.00" }],
            liabilities: [{ name: "Debt", category: "Loan", value: "200000.00" }], // +300,000
          },
        },
        observedInputs: {
          netWorth: {
            assets: [{ name: "Savings", category: "Cash", value: "400000.00" }],
            liabilities: [{ name: "Debt", category: "Loan", value: "200000.00" }], // +200,000 (33% drop, 100k delta)
          },
        },
      });
      const finding = res.findings.find((f) => f.code === "net_worth_changed");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("warning");
    });
  });

  it("enforces below, exact, and above boundaries for every remaining numeric threshold", () => {
    const cases: Array<{
      code: string;
      baseline: ScenarioDomainInputs;
      below: ScenarioDomainInputs;
      exact: ScenarioDomainInputs;
      above: ScenarioDomainInputs;
    }> = [
      {
        code: "surplus_changed",
        baseline: { cashFlow: { income: "20000.00", essentialExpenses: "10000.00", discretionaryExpenses: "0", emis: "0", mandatoryObligations: "0" } },
        below: { cashFlow: { income: "19001.00", essentialExpenses: "10000.00", discretionaryExpenses: "0", emis: "0", mandatoryObligations: "0" } },
        exact: { cashFlow: { income: "19000.00", essentialExpenses: "10000.00", discretionaryExpenses: "0", emis: "0", mandatoryObligations: "0" } },
        above: { cashFlow: { income: "18999.00", essentialExpenses: "10000.00", discretionaryExpenses: "0", emis: "0", mandatoryObligations: "0" } },
      },
      {
        code: "investment_contribution_changed",
        baseline: { investment: { monthlySip: "10000.00" } },
        below: { investment: { monthlySip: "10999.00" } },
        exact: { investment: { monthlySip: "11000.00" } },
        above: { investment: { monthlySip: "11001.00" } },
      },
      {
        code: "debt_terms_changed",
        baseline: { loan: { principal: "100000.00" } },
        below: { loan: { principal: "104999.00" } },
        exact: { loan: { principal: "105000.00" } },
        above: { loan: { principal: "105001.00" } },
      },
      {
        code: "debt_terms_changed",
        baseline: { loan: { annualRate: "8.00" } },
        below: { loan: { annualRate: "8.49" } },
        exact: { loan: { annualRate: "8.50" } },
        above: { loan: { annualRate: "8.51" } },
      },
      {
        code: "debt_terms_changed",
        baseline: { loan: { tenureMonths: 60 } },
        below: { loan: { tenureMonths: 62 } },
        exact: { loan: { tenureMonths: 63 } },
        above: { loan: { tenureMonths: 64 } },
      },
      {
        code: "goal_changed",
        baseline: { goal: { targetAmountToday: "100000.00" } },
        below: { goal: { targetAmountToday: "104999.00" } },
        exact: { goal: { targetAmountToday: "105000.00" } },
        above: { goal: { targetAmountToday: "105001.00" } },
      },
      {
        code: "goal_changed",
        baseline: { goal: { horizonMonths: 60 } },
        below: { goal: { horizonMonths: 62 } },
        exact: { goal: { horizonMonths: 63 } },
        above: { goal: { horizonMonths: 64 } },
      },
      {
        code: "goal_changed",
        baseline: { goal: { currentSavings: "10000.00" } },
        below: { goal: { currentSavings: "10999.00" } },
        exact: { goal: { currentSavings: "11000.00" } },
        above: { goal: { currentSavings: "11001.00" } },
      },
      {
        code: "goal_changed",
        baseline: { goal: { availableMonthlyCapacity: "10000.00" } },
        below: { goal: { availableMonthlyCapacity: "10999.00" } },
        exact: { goal: { availableMonthlyCapacity: "11000.00" } },
        above: { goal: { availableMonthlyCapacity: "11001.00" } },
      },
      {
        code: "net_worth_changed",
        baseline: { netWorth: { assets: [{ name: "Cash", category: "cash", value: "100000.00" }], liabilities: [] } },
        below: { netWorth: { assets: [{ name: "Cash", category: "cash", value: "109999.00" }], liabilities: [] } },
        exact: { netWorth: { assets: [{ name: "Cash", category: "cash", value: "110000.00" }], liabilities: [] } },
        above: { netWorth: { assets: [{ name: "Cash", category: "cash", value: "110001.00" }], liabilities: [] } },
      },
    ];

    for (const testCase of cases) {
      const below = compareDrift({ baselineInputs: testCase.baseline, observedInputs: testCase.below });
      const exact = compareDrift({ baselineInputs: testCase.baseline, observedInputs: testCase.exact });
      const above = compareDrift({ baselineInputs: testCase.baseline, observedInputs: testCase.above });
      expect(below.findings.some((finding) => finding.code === testCase.code), `${testCase.code} below`).toBe(false);
      expect(exact.findings.some((finding) => finding.code === testCase.code), `${testCase.code} exact`).toBe(true);
      expect(above.findings.some((finding) => finding.code === testCase.code), `${testCase.code} above`).toBe(true);
    }
  });

  it("emits findings in stable code order 1 through 9", () => {
    const res = compareDrift({
      baselineInputs: baseBaseline,
      observedInputs: {
        cashFlow: {
          income: "150000.00", // 1: income_changed
          essentialExpenses: "50000.00", // 2: spending_changed (30k+20k -> 50k+20k = 70k)
          discretionaryExpenses: "20000.00",
          emis: "20000.00", // 3: obligations_changed (10k+5k -> 20k+5k = 25k)
          mandatoryObligations: "5000.00",
        },
        emergencyFund: {
          essentialExpenses: "50000.00",
          emis: "20000.00",
          mandatoryObligations: "5000.00",
          incomeStability: "stable",
          dependents: 0,
          currentReserves: "100000.00", // 5: reserve_runway_changed
        },
        investment: {
          monthlySip: "30000.00", // 6: investment_contribution_changed
        },
        loan: {
          principal: "1000000.00",
          annualRate: "11.00", // 7: debt_terms_changed
          tenureMonths: 120,
        },
        goal: {
          targetAmountToday: "800000.00", // 8: goal_changed
          horizonMonths: 60,
          currentSavings: "100000.00",
          availableMonthlyCapacity: "10000.00",
        },
        netWorth: {
          assets: [{ name: "Cash", category: "Cash", value: "1000000.00" }], // 9: net_worth_changed
        },
      },
    });

    const emittedCodes = res.findings.map((f) => f.code);
    const expectedOrder = [
      "income_changed",
      "spending_changed",
      "obligations_changed",
      "surplus_changed",
      "reserve_runway_changed",
      "investment_contribution_changed",
      "debt_terms_changed",
      "goal_changed",
      "net_worth_changed",
    ];

    expect(emittedCodes).toEqual(expectedOrder);
  });
});
