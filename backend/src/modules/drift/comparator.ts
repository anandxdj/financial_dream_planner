import { Decimal, formatMoney, formatRate, parseDecimal } from "../financial-engine/decimal";
import {
  evaluateScenario,
  type ScenarioDomainInputs,
  type ScenarioEvaluationOutput,
  type ScenarioDeltas,
} from "../financial-engine";
import { computeCanonicalHash } from "../../shared/utils/canonical-json";
import type {
  DriftSeverity,
  DriftFinding,
} from "./model";

export const DRIFT_POLICY_VERSION = "DRIFT-IN-2026.1";

export interface CompareDriftInput {
  baselineInputs: ScenarioDomainInputs;
  observedInputs: ScenarioDomainInputs;
  mode?: "lightweight" | "deep";
  financialPolicyVersion?: string;
}

export interface DriftComparisonResult {
  policyVersion: string;
  engineVersion: string;
  isMaterial: boolean;
  findings: DriftFinding[];
  baselineOutput: ScenarioEvaluationOutput["baseline"];
  observedOutput: ScenarioEvaluationOutput["baseline"];
  deltas: ScenarioDeltas | null;
}

function maxSeverity(a: DriftSeverity, b: DriftSeverity): DriftSeverity {
  const rank: Record<DriftSeverity, number> = { notice: 1, warning: 2, critical: 3 };
  return rank[a] >= rank[b] ? a : b;
}

interface ThresholdCheckResult {
  isMaterial: boolean;
  baselineValue: string | null;
  observedValue: string | null;
  absoluteDelta: string | null;
  relativeDelta: string | null;
  deltaValue: Decimal | null; // observed - baseline
  isAdverse: boolean;
  isTwoTimesAdverse: boolean;
  isSignRegression: boolean;
  isSignChange: boolean;
}

/**
 * Helper to check relative and absolute threshold for numeric fields.
 * A relative threshold is inclusive and evaluated only when absolute floor is met.
 * When baseline is zero, non-zero observed is material once absolute floor is met.
 * Missing -> present or present -> missing evaluated against absolute floor.
 */
function checkRelativeAndFloor({
  baseline,
  observed,
  relativeThreshold,
  absoluteFloor,
  adverseDirection, // "decrease" (e.g. income, surplus) or "increase" (e.g. expenses, obligations)
  allowSignChange = false,
}: {
  baseline?: string | null;
  observed?: string | null;
  relativeThreshold: Decimal;
  absoluteFloor: Decimal;
  adverseDirection: "decrease" | "increase";
  allowSignChange?: boolean;
}): ThresholdCheckResult {
  const bVal = baseline !== undefined && baseline !== null ? parseDecimal(baseline) : null;
  const oVal = observed !== undefined && observed !== null ? parseDecimal(observed) : null;

  if (bVal === null && oVal === null) {
    return {
      isMaterial: false,
      baselineValue: null,
      observedValue: null,
      absoluteDelta: null,
      relativeDelta: null,
      deltaValue: null,
      isAdverse: false,
      isTwoTimesAdverse: false,
      isSignRegression: false,
      isSignChange: false,
    };
  }

  if (bVal === null && oVal !== null) {
    const absO = oVal.abs();
    const isMaterial = absO.greaterThanOrEqualTo(absoluteFloor);
    const isAdverse = adverseDirection === "increase" ? oVal.greaterThan(0) : oVal.lessThan(0);
    const twoXFloor = absoluteFloor.mul(2);
    const isTwoTimesAdverse = isAdverse && absO.greaterThanOrEqualTo(twoXFloor);
    const isSignRegression = oVal.lessThan(0);

    return {
      isMaterial,
      baselineValue: null,
      observedValue: formatMoney(oVal),
      absoluteDelta: formatMoney(absO),
      relativeDelta: null,
      deltaValue: oVal,
      isAdverse,
      isTwoTimesAdverse,
      isSignRegression,
      isSignChange: false,
    };
  }

  if (bVal !== null && oVal === null) {
    const absB = bVal.abs();
    const isMaterial = absB.greaterThanOrEqualTo(absoluteFloor);
    const isAdverse = adverseDirection === "decrease" ? bVal.greaterThan(0) : bVal.lessThan(0);
    const twoXFloor = absoluteFloor.mul(2);
    const isTwoTimesAdverse = isAdverse && absB.greaterThanOrEqualTo(twoXFloor);

    return {
      isMaterial,
      baselineValue: formatMoney(bVal),
      observedValue: null,
      absoluteDelta: formatMoney(absB),
      relativeDelta: null,
      deltaValue: bVal.negated(),
      isAdverse,
      isTwoTimesAdverse,
      isSignRegression: false,
      isSignChange: false,
    };
  }

  // Both present
  const delta = oVal!.minus(bVal!);
  const absDelta = delta.abs();
  const isSignChange =
    (bVal!.greaterThan(0) && oVal!.lessThan(0)) ||
    (bVal!.lessThan(0) && oVal!.greaterThan(0)) ||
    (bVal!.greaterThan(0) && oVal!.isZero() && absDelta.greaterThanOrEqualTo(absoluteFloor)) ||
    (bVal!.lessThan(0) && oVal!.isZero() && absDelta.greaterThanOrEqualTo(absoluteFloor));

  const isSignRegression = bVal!.greaterThanOrEqualTo(0) && oVal!.lessThan(0);

  let isMaterial = false;
  let relDeltaFormatted: string | null = null;
  let relRatio: Decimal | null = null;

  if (allowSignChange && isSignChange) {
    isMaterial = true;
    if (!bVal!.isZero()) {
      relRatio = absDelta.div(bVal!.abs());
      relDeltaFormatted = formatRate(relRatio);
    }
  } else if (bVal!.isZero()) {
    isMaterial = absDelta.greaterThanOrEqualTo(absoluteFloor);
  } else {
    relRatio = absDelta.div(bVal!.abs());
    relDeltaFormatted = formatRate(relRatio);
    isMaterial =
      absDelta.greaterThanOrEqualTo(absoluteFloor) &&
      relRatio.greaterThanOrEqualTo(relativeThreshold);
  }

  const isAdverse =
    adverseDirection === "decrease" ? delta.lessThan(0) : delta.greaterThan(0);

  let isTwoTimesAdverse = false;
  if (isAdverse) {
    const twoXFloor = absoluteFloor.mul(2);
    const twoXRel = relativeThreshold.mul(2);
    if (bVal!.isZero()) {
      isTwoTimesAdverse = absDelta.greaterThanOrEqualTo(twoXFloor);
    } else {
      isTwoTimesAdverse =
        absDelta.greaterThanOrEqualTo(twoXFloor) &&
        (relRatio !== null && relRatio.greaterThanOrEqualTo(twoXRel));
    }
  }

  return {
    isMaterial,
    baselineValue: formatMoney(bVal),
    observedValue: formatMoney(oVal),
    absoluteDelta: formatMoney(absDelta),
    relativeDelta: relDeltaFormatted,
    deltaValue: delta,
    isAdverse,
    isTwoTimesAdverse,
    isSignRegression,
    isSignChange,
  };
}

export function compareDrift(input: CompareDriftInput): DriftComparisonResult {
  const policyVersion = DRIFT_POLICY_VERSION;
  const financialPolicyVersion = input.financialPolicyVersion;
  const engineVersion = "1.0.0";
  const mode = input.mode ?? "lightweight";

  // 1. Evaluate baseline inputs
  const baselineEval = evaluateScenario({
    name: "Baseline Drift Eval",
    baseline: input.baselineInputs,
    scenario: {},
    policyVersion: financialPolicyVersion,
  });

  // 2. Fast path: Canonically equal inputs produce no_change without further evaluation
  const baseHash = computeCanonicalHash(input.baselineInputs);
  const obsHash = computeCanonicalHash(input.observedInputs);

  if (baseHash === obsHash) {
    return {
      policyVersion,
      engineVersion,
      isMaterial: false,
      findings: [],
      baselineOutput: baselineEval.baseline,
      observedOutput: baselineEval.baseline,
      deltas: mode === "deep" ? baselineEval.deltas : null,
    };
  }

  // 3. Evaluate observed inputs independently
  const observedEval = evaluateScenario({
    name: "Observed Drift Eval",
    baseline: input.observedInputs,
    scenario: {},
    policyVersion: financialPolicyVersion,
  });

  // 4. Compute deltas for deep mode
  const deepEval =
    mode === "deep"
      ? evaluateScenario({
          name: "Drift Deep Deltas",
          baseline: input.baselineInputs,
          scenario: input.observedInputs,
          policyVersion: financialPolicyVersion,
        })
      : null;

  const findings: DriftFinding[] = [];

  // Finding 1: income_changed (at least 5% and INR 1,000)
  const incomeCheck = checkRelativeAndFloor({
    baseline: input.baselineInputs.cashFlow?.income,
    observed: input.observedInputs.cashFlow?.income,
    relativeThreshold: new Decimal("0.05"),
    absoluteFloor: new Decimal("1000.00"),
    adverseDirection: "decrease",
  });

  if (incomeCheck.isMaterial) {
    const severity: DriftSeverity = incomeCheck.isTwoTimesAdverse ? "warning" : "notice";
    findings.push({
      code: "income_changed",
      description: `Cash-flow monthly income changed from ${incomeCheck.baselineValue ?? "none"} to ${incomeCheck.observedValue ?? "none"} (delta: ${incomeCheck.absoluteDelta ?? "0.00"})`,
      baselineValue: incomeCheck.baselineValue,
      observedValue: incomeCheck.observedValue,
      absoluteDelta: incomeCheck.absoluteDelta,
      relativeDelta: incomeCheck.relativeDelta,
      severity,
      affectedOutputPaths: [
        "cashFlow.monthlyIncome",
        "cashFlow.monthlySurplus",
        "cashFlow.investableCapacity",
        "cashFlow.savingsRate",
      ],
    });
  }

  // Finding 2: spending_changed (essential + discretionary expenses: at least 10% and INR 2,000)
  const getCombinedExpenses = (cf?: ScenarioDomainInputs["cashFlow"]): string | null => {
    if (!cf) return null;
    const ess = cf.essentialExpenses;
    const disc = cf.discretionaryExpenses;
    if (ess === undefined && disc === undefined) return null;
    const sum = new Decimal(ess ?? "0").add(new Decimal(disc ?? "0"));
    return sum.toFixed(2);
  };

  const spendingCheck = checkRelativeAndFloor({
    baseline: getCombinedExpenses(input.baselineInputs.cashFlow),
    observed: getCombinedExpenses(input.observedInputs.cashFlow),
    relativeThreshold: new Decimal("0.10"),
    absoluteFloor: new Decimal("2000.00"),
    adverseDirection: "increase",
  });

  if (spendingCheck.isMaterial) {
    const severity: DriftSeverity = spendingCheck.isTwoTimesAdverse ? "warning" : "notice";
    findings.push({
      code: "spending_changed",
      description: `Total expenses (essential + discretionary) changed from ${spendingCheck.baselineValue ?? "none"} to ${spendingCheck.observedValue ?? "none"} (delta: ${spendingCheck.absoluteDelta ?? "0.00"})`,
      baselineValue: spendingCheck.baselineValue,
      observedValue: spendingCheck.observedValue,
      absoluteDelta: spendingCheck.absoluteDelta,
      relativeDelta: spendingCheck.relativeDelta,
      severity,
      affectedOutputPaths: [
        "cashFlow.totalExpenses",
        "cashFlow.monthlySurplus",
        "cashFlow.savingsRate",
        "emergencyFund.monthlyNeed",
        "emergencyFund.targetAmount",
      ],
    });
  }

  // Finding 3: obligations_changed (EMIs + mandatory obligations: at least 5% and INR 1,000)
  const getCombinedObligations = (cf?: ScenarioDomainInputs["cashFlow"]): string | null => {
    if (!cf) return null;
    const emis = cf.emis;
    const mand = cf.mandatoryObligations;
    if (emis === undefined && mand === undefined) return null;
    const sum = new Decimal(emis ?? "0").add(new Decimal(mand ?? "0"));
    return sum.toFixed(2);
  };

  const obligationsCheck = checkRelativeAndFloor({
    baseline: getCombinedObligations(input.baselineInputs.cashFlow),
    observed: getCombinedObligations(input.observedInputs.cashFlow),
    relativeThreshold: new Decimal("0.05"),
    absoluteFloor: new Decimal("1000.00"),
    adverseDirection: "increase",
  });

  if (obligationsCheck.isMaterial) {
    const severity: DriftSeverity = obligationsCheck.isTwoTimesAdverse ? "warning" : "notice";
    findings.push({
      code: "obligations_changed",
      description: `Fixed obligations (EMIs + mandatory) changed from ${obligationsCheck.baselineValue ?? "none"} to ${obligationsCheck.observedValue ?? "none"} (delta: ${obligationsCheck.absoluteDelta ?? "0.00"})`,
      baselineValue: obligationsCheck.baselineValue,
      observedValue: obligationsCheck.observedValue,
      absoluteDelta: obligationsCheck.absoluteDelta,
      relativeDelta: obligationsCheck.relativeDelta,
      severity,
      affectedOutputPaths: [
        "cashFlow.fixedObligations",
        "cashFlow.totalOutflows",
        "cashFlow.monthlySurplus",
        "emergencyFund.monthlyNeed",
        "emergencyFund.targetAmount",
      ],
    });
  }

  // Finding 4: surplus_changed (calculated monthly surplus: sign change, or at least 10% and INR 1,000)
  const surplusCheck = checkRelativeAndFloor({
    baseline: baselineEval.baseline.cashFlow?.monthlySurplus,
    observed: observedEval.baseline.cashFlow?.monthlySurplus,
    relativeThreshold: new Decimal("0.10"),
    absoluteFloor: new Decimal("1000.00"),
    adverseDirection: "decrease",
    allowSignChange: true,
  });

  if (surplusCheck.isMaterial) {
    let severity: DriftSeverity = "notice";
    if (surplusCheck.isSignRegression) {
      severity = "critical";
    } else if (surplusCheck.isTwoTimesAdverse) {
      severity = "warning";
    }
    findings.push({
      code: "surplus_changed",
      description: `Calculated monthly surplus changed from ${surplusCheck.baselineValue ?? "none"} to ${surplusCheck.observedValue ?? "none"} (delta: ${surplusCheck.absoluteDelta ?? "0.00"})`,
      baselineValue: surplusCheck.baselineValue,
      observedValue: surplusCheck.observedValue,
      absoluteDelta: surplusCheck.absoluteDelta,
      relativeDelta: surplusCheck.relativeDelta,
      severity,
      affectedOutputPaths: [
        "cashFlow.monthlySurplus",
        "cashFlow.investableCapacity",
        "cashFlow.savingsRate",
      ],
    });
  }

  // Finding 5: reserve_runway_changed (calculated emergency-fund runway: at least 1.00 month)
  const baseRunway = baselineEval.baseline.emergencyFund?.runwayMonths;
  const obsRunway = observedEval.baseline.emergencyFund?.runwayMonths;

  if (baseRunway !== undefined && baseRunway !== null || obsRunway !== undefined && obsRunway !== null) {
    const bNum = baseRunway ? new Decimal(baseRunway) : null;
    const oNum = obsRunway ? new Decimal(obsRunway) : null;

    let isMaterial = false;
    let deltaFormatted: string | null = null;
    let severity: DriftSeverity = "notice";

    if (bNum === null && oNum !== null) {
      isMaterial = oNum.greaterThanOrEqualTo(new Decimal("1.00"));
      deltaFormatted = formatRate(oNum);
    } else if (bNum !== null && oNum === null) {
      isMaterial = bNum.greaterThanOrEqualTo(new Decimal("1.00"));
      deltaFormatted = formatRate(bNum);
      if (bNum.greaterThanOrEqualTo(new Decimal("2.00"))) {
        severity = "warning";
      }
    } else if (bNum !== null && oNum !== null) {
      const delta = oNum.minus(bNum);
      const absDelta = delta.abs();
      isMaterial = absDelta.greaterThanOrEqualTo(new Decimal("1.00"));
      deltaFormatted = formatRate(absDelta);
      if (delta.lessThan(0) && absDelta.greaterThanOrEqualTo(new Decimal("2.00"))) {
        severity = "warning";
      }
    }

    if (isMaterial) {
      findings.push({
        code: "reserve_runway_changed",
        description: `Emergency fund runway changed from ${baseRunway ?? "none"} to ${obsRunway ?? "none"} months (delta: ${deltaFormatted ?? "0.0000"})`,
        baselineValue: baseRunway ?? null,
        observedValue: obsRunway ?? null,
        absoluteDelta: deltaFormatted,
        relativeDelta: null,
        severity,
        affectedOutputPaths: [
          "emergencyFund.runwayMonths",
          "emergencyFund.shortfall",
          "emergencyFund.completionMonths",
        ],
      });
    }
  }

  // Finding 6: investment_contribution_changed (monthly SIP: at least 10% and INR 1,000)
  const sipCheck = checkRelativeAndFloor({
    baseline: input.baselineInputs.investment?.monthlySip,
    observed: input.observedInputs.investment?.monthlySip,
    relativeThreshold: new Decimal("0.10"),
    absoluteFloor: new Decimal("1000.00"),
    adverseDirection: "decrease",
  });

  if (sipCheck.isMaterial) {
    const severity: DriftSeverity = sipCheck.isTwoTimesAdverse ? "warning" : "notice";
    findings.push({
      code: "investment_contribution_changed",
      description: `Monthly SIP investment contribution changed from ${sipCheck.baselineValue ?? "none"} to ${sipCheck.observedValue ?? "none"} (delta: ${sipCheck.absoluteDelta ?? "0.00"})`,
      baselineValue: sipCheck.baselineValue,
      observedValue: sipCheck.observedValue,
      absoluteDelta: sipCheck.absoluteDelta,
      relativeDelta: sipCheck.relativeDelta,
      severity,
      affectedOutputPaths: [
        "investment.expectedTotalInvested",
        "investment.expectedFutureValue",
        "investment.expectedGains",
      ],
    });
  }

  // Finding 7: debt_terms_changed
  // principal at least 5% and INR 5,000; rate at least 0.50 percentage point; tenure at least 3 months; or any prepayment added/removed/changed
  const baseLoan = input.baselineInputs.loan;
  const obsLoan = input.observedInputs.loan;

  if (baseLoan || obsLoan) {
    let debtMaterial = false;
    let debtSeverity: DriftSeverity = "notice";
    let desc = "Debt loan terms changed";

    // 7a. Principal (at least 5% and INR 5,000)
    const principalCheck = checkRelativeAndFloor({
      baseline: baseLoan?.principal,
      observed: obsLoan?.principal,
      relativeThreshold: new Decimal("0.05"),
      absoluteFloor: new Decimal("5000.00"),
      adverseDirection: "increase",
    });

    if (principalCheck.isMaterial) {
      debtMaterial = true;
      if (principalCheck.isTwoTimesAdverse) debtSeverity = "warning";
      desc = `Loan principal changed from ${principalCheck.baselineValue ?? "none"} to ${principalCheck.observedValue ?? "none"}`;
    }

    // 7b. Annual Rate (at least 0.50 percentage point)
    const bRate = baseLoan?.annualRate ? parseDecimal(baseLoan.annualRate) : null;
    const oRate = obsLoan?.annualRate ? parseDecimal(obsLoan.annualRate) : null;

    if (bRate === null && oRate !== null) {
      if (oRate.greaterThanOrEqualTo(new Decimal("0.50"))) {
        debtMaterial = true;
        if (oRate.greaterThanOrEqualTo(new Decimal("1.00"))) debtSeverity = "warning";
        desc = `Loan annual rate added: ${formatRate(oRate)}%`;
      }
    } else if (bRate !== null && oRate === null) {
      if (bRate.greaterThanOrEqualTo(new Decimal("0.50"))) {
        debtMaterial = true;
        desc = `Loan annual rate removed: was ${formatRate(bRate)}%`;
      }
    } else if (bRate !== null && oRate !== null) {
      const rateDelta = oRate.minus(bRate);
      const absRateDelta = rateDelta.abs();
      if (absRateDelta.greaterThanOrEqualTo(new Decimal("0.50"))) {
        debtMaterial = true;
        if (rateDelta.greaterThanOrEqualTo(new Decimal("1.00"))) debtSeverity = "warning";
        desc = `Loan annual rate changed from ${formatRate(bRate)}% to ${formatRate(oRate)}% (delta: ${formatRate(absRateDelta)} pp)`;
      }
    }

    // 7c. Tenure (at least 3 months)
    const bTenure = baseLoan?.tenureMonths;
    const oTenure = obsLoan?.tenureMonths;

    if (bTenure === undefined && oTenure !== undefined) {
      if (oTenure >= 3) {
        debtMaterial = true;
        if (oTenure >= 6) debtSeverity = "warning";
        desc = `Loan tenure set to ${oTenure} months`;
      }
    } else if (bTenure !== undefined && oTenure === undefined) {
      if (bTenure >= 3) {
        debtMaterial = true;
        desc = `Loan tenure removed: was ${bTenure} months`;
      }
    } else if (bTenure !== undefined && oTenure !== undefined) {
      const tenureDelta = oTenure - bTenure;
      const absTenureDelta = Math.abs(tenureDelta);
      if (absTenureDelta >= 3) {
        debtMaterial = true;
        if (tenureDelta >= 6) debtSeverity = "warning";
        desc = `Loan tenure changed from ${bTenure} to ${oTenure} months (delta: ${absTenureDelta} mo)`;
      }
    }

    // 7d. Prepayments added/removed/changed
    const bPrepHash = computeCanonicalHash(baseLoan?.prepayments ?? null);
    const oPrepHash = computeCanonicalHash(obsLoan?.prepayments ?? null);
    if (bPrepHash !== oPrepHash) {
      debtMaterial = true;
      desc = "Loan prepayments schedule changed";
    }

    // 7e. Strategy or Refinancing
    if (baseLoan?.prepaymentStrategy !== obsLoan?.prepaymentStrategy && (baseLoan?.prepaymentStrategy || obsLoan?.prepaymentStrategy)) {
      debtMaterial = true;
      desc = `Loan prepayment strategy changed to ${obsLoan?.prepaymentStrategy ?? "none"}`;
    }

    const bRefinHash = computeCanonicalHash(baseLoan?.refinancing ?? null);
    const oRefinHash = computeCanonicalHash(obsLoan?.refinancing ?? null);
    if (bRefinHash !== oRefinHash) {
      debtMaterial = true;
      desc = "Loan refinancing option changed";
    }

    if (debtMaterial) {
      findings.push({
        code: "debt_terms_changed",
        description: desc,
        baselineValue: principalCheck.baselineValue,
        observedValue: principalCheck.observedValue,
        absoluteDelta: principalCheck.absoluteDelta,
        relativeDelta: principalCheck.relativeDelta,
        severity: debtSeverity,
        affectedOutputPaths: [
          "loan.monthlyEmi",
          "loan.totalInterest",
          "loan.totalPayment",
          "loan.tenureMonths",
        ],
      });
    }
  }

  // Finding 8: goal_changed
  // target at least 5% and INR 5,000; horizon at least 3 months; savings/capacity at least 10% and INR 1,000; or feasibility changes
  const baseGoalIn = input.baselineInputs.goal;
  const obsGoalIn = input.observedInputs.goal;
  const baseGoalOut = baselineEval.baseline.goal;
  const obsGoalOut = observedEval.baseline.goal;

  if (baseGoalIn || obsGoalIn || baseGoalOut || obsGoalOut) {
    let goalMaterial = false;
    let goalSeverity: DriftSeverity = "notice";
    let desc = "Goal configuration changed";

    // 8a. Target Amount (at least 5% and INR 5,000)
    const targetCheck = checkRelativeAndFloor({
      baseline: baseGoalIn?.targetAmountToday,
      observed: obsGoalIn?.targetAmountToday,
      relativeThreshold: new Decimal("0.05"),
      absoluteFloor: new Decimal("5000.00"),
      adverseDirection: "increase",
    });

    if (targetCheck.isMaterial) {
      goalMaterial = true;
      if (targetCheck.isTwoTimesAdverse) goalSeverity = maxSeverity(goalSeverity, "warning");
      desc = `Goal target amount changed from ${targetCheck.baselineValue ?? "none"} to ${targetCheck.observedValue ?? "none"}`;
    }

    // 8b. Horizon (at least 3 months)
    const bHor = baseGoalIn?.horizonMonths;
    const oHor = obsGoalIn?.horizonMonths;
    if (bHor === undefined && oHor !== undefined) {
      if (oHor >= 3) {
        goalMaterial = true;
        desc = `Goal horizon set to ${oHor} months`;
      }
    } else if (bHor !== undefined && oHor === undefined) {
      if (bHor >= 3) {
        goalMaterial = true;
        if (bHor >= 6) goalSeverity = maxSeverity(goalSeverity, "warning");
        desc = `Goal horizon removed: was ${bHor} months`;
      }
    } else if (bHor !== undefined && oHor !== undefined) {
      const horDelta = oHor - bHor;
      const absHorDelta = Math.abs(horDelta);
      if (absHorDelta >= 3) {
        goalMaterial = true;
        if (horDelta <= -6) goalSeverity = maxSeverity(goalSeverity, "warning");
        desc = `Goal horizon changed from ${bHor} to ${oHor} months`;
      }
    }

    // 8c. Current Savings (at least 10% and INR 1,000)
    const savingsCheck = checkRelativeAndFloor({
      baseline: baseGoalIn?.currentSavings,
      observed: obsGoalIn?.currentSavings,
      relativeThreshold: new Decimal("0.10"),
      absoluteFloor: new Decimal("1000.00"),
      adverseDirection: "decrease",
    });

    if (savingsCheck.isMaterial) {
      goalMaterial = true;
      if (savingsCheck.isTwoTimesAdverse) goalSeverity = maxSeverity(goalSeverity, "warning");
      desc = `Goal current savings changed from ${savingsCheck.baselineValue ?? "none"} to ${savingsCheck.observedValue ?? "none"}`;
    }

    // 8d. Available Monthly Capacity (at least 10% and INR 1,000)
    const capacityCheck = checkRelativeAndFloor({
      baseline: baseGoalIn?.availableMonthlyCapacity,
      observed: obsGoalIn?.availableMonthlyCapacity,
      relativeThreshold: new Decimal("0.10"),
      absoluteFloor: new Decimal("1000.00"),
      adverseDirection: "decrease",
    });

    if (capacityCheck.isMaterial) {
      goalMaterial = true;
      if (capacityCheck.isTwoTimesAdverse) goalSeverity = maxSeverity(goalSeverity, "warning");
      desc = `Goal available monthly capacity changed from ${capacityCheck.baselineValue ?? "none"} to ${capacityCheck.observedValue ?? "none"}`;
    }

    // 8e. Feasibility change
    const bFeas = baseGoalOut?.feasibility;
    const oFeas = obsGoalOut?.feasibility;
    if (bFeas !== oFeas && (bFeas || oFeas)) {
      goalMaterial = true;
      const isFeasibilityRegression =
        (bFeas === "funded" || bFeas === "feasible") && oFeas === "infeasible";
      if (isFeasibilityRegression) {
        goalSeverity = "critical";
      }
      desc = `Goal feasibility changed from ${bFeas ?? "uncalculated"} to ${oFeas ?? "uncalculated"}`;
    }

    if (goalMaterial) {
      findings.push({
        code: "goal_changed",
        description: desc,
        baselineValue: targetCheck.baselineValue,
        observedValue: targetCheck.observedValue,
        absoluteDelta: targetCheck.absoluteDelta,
        relativeDelta: targetCheck.relativeDelta,
        severity: goalSeverity,
        affectedOutputPaths: [
          "goal.futureGoalCost",
          "goal.fundingRatio",
          "goal.shortfall",
          "goal.requiredSip",
          "goal.feasibility",
        ],
      });
    }
  }

  // Finding 9: net_worth_changed (calculated net worth: sign change, or at least 10% and INR 10,000)
  const netWorthCheck = checkRelativeAndFloor({
    baseline: baselineEval.baseline.netWorth?.netWorth,
    observed: observedEval.baseline.netWorth?.netWorth,
    relativeThreshold: new Decimal("0.10"),
    absoluteFloor: new Decimal("10000.00"),
    adverseDirection: "decrease",
    allowSignChange: true,
  });

  if (netWorthCheck.isMaterial) {
    let severity: DriftSeverity = "notice";
    if (netWorthCheck.isSignRegression) {
      severity = "critical";
    } else if (netWorthCheck.isTwoTimesAdverse) {
      severity = "warning";
    }
    findings.push({
      code: "net_worth_changed",
      description: `Calculated net worth changed from ${netWorthCheck.baselineValue ?? "none"} to ${netWorthCheck.observedValue ?? "none"} (delta: ${netWorthCheck.absoluteDelta ?? "0.00"})`,
      baselineValue: netWorthCheck.baselineValue,
      observedValue: netWorthCheck.observedValue,
      absoluteDelta: netWorthCheck.absoluteDelta,
      relativeDelta: netWorthCheck.relativeDelta,
      severity,
      affectedOutputPaths: [
        "netWorth.netWorth",
        "netWorth.totalAssets",
        "netWorth.totalLiabilities",
      ],
    });
  }

  return {
    policyVersion,
    engineVersion,
    isMaterial: findings.length > 0,
    findings,
    baselineOutput: baselineEval.baseline,
    observedOutput: observedEval.baseline,
    deltas: mode === "deep" ? deepEval?.deltas ?? null : null,
  };
}
