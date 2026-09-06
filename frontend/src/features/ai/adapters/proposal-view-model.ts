import type { PlannerScenarioProposal } from "../types";

export interface ProposalMetricViewModel {
  label: string;
  baseline: string;
  proposed: string;
  delta?: string;
}

export interface ProposalProjectionPoint {
  year: string;
  current: number;
  proposed: number;
}

export interface ProposalViewModel {
  id: string;
  badge: string;
  title: string;
  summary: string;
  impactHighlight: string;
  sources: string[];
  metrics: ProposalMetricViewModel[];
  projection?: {
    proposedTotal: string;
    baselineTotal: string;
    delta: string;
    chartData: ProposalProjectionPoint[];
  };
  proposal: PlannerScenarioProposal;
}

function formatMoney(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Not available";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return `₹ ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatNumber(value: string | number | null | undefined, suffix = ""): string {
  if (value === null || value === undefined || value === "") return "Not available";
  return `${value}${suffix}`;
}

function signedMoney(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  const sign = amount > 0 ? "+" : "";
  return `${sign}${formatMoney(String(amount))}`;
}

function sourceLabels(proposal: PlannerScenarioProposal): string[] {
  return [
    `Plan v${proposal.provenance.planVersionNumber}`,
    `Engine ${proposal.provenance.engineVersion}`,
    `As of ${new Date(proposal.provenance.snapshotAsOf).toLocaleDateString("en-IN")}`,
  ];
}

function investmentViewModel(proposal: PlannerScenarioProposal): ProposalViewModel | null {
  const baseline = proposal.evaluation.baseline.investment;
  const proposed = proposal.evaluation.scenario.investment;
  if (!baseline || !proposed) return null;

  const baselineExpected = baseline.scenarios?.expected;
  const proposedExpected = proposed.scenarios?.expected;
  const delta = proposal.evaluation.deltas.investment;
  const baselineMilestones = baselineExpected?.milestones ?? [];
  const proposedMilestones = proposedExpected?.milestones ?? [];
  const proposedByMonth = new Map(proposedMilestones.map((point) => [point.month, point]));
  const chartData = baselineMilestones.flatMap((point) => {
    const proposedPoint = proposedByMonth.get(point.month);
    if (!proposedPoint) return [];
    return [
      {
        year: `Y${point.year}`,
        current: Number(point.futureValue) / 100000,
        proposed: Number(proposedPoint.futureValue) / 100000,
      },
    ];
  });

  const futureValueDelta = signedMoney(delta?.expectedFutureValueDelta);
  return {
    id: `${proposal.baselineVersionId}:${proposal.name}`,
    badge: "Engine-evaluated scenario",
    title: proposal.name,
    summary: proposal.description ?? "Compare this investment change with your current plan before staging it.",
    impactHighlight: futureValueDelta
      ? `Expected future value changes by ${futureValueDelta}.`
      : "Compared with the current plan using the financial engine.",
    sources: sourceLabels(proposal),
    metrics: [
      {
        label: "Monthly SIP",
        baseline: formatMoney(baseline.monthlySip),
        proposed: formatMoney(proposed.monthlySip),
      },
      {
        label: "Expected value",
        baseline: formatMoney(baselineExpected?.futureValue),
        proposed: formatMoney(proposedExpected?.futureValue),
        delta: futureValueDelta,
      },
    ],
    projection:
      baselineExpected && proposedExpected && chartData.length > 0
        ? {
            proposedTotal: formatMoney(proposedExpected.futureValue),
            baselineTotal: formatMoney(baselineExpected.futureValue),
            delta: futureValueDelta ?? "No material change",
            chartData,
          }
        : undefined,
    proposal,
  };
}

function emergencyFundViewModel(proposal: PlannerScenarioProposal): ProposalViewModel | null {
  const baseline = proposal.evaluation.baseline.emergencyFund;
  const proposed = proposal.evaluation.scenario.emergencyFund;
  if (!baseline || !proposed) return null;
  const delta = proposal.evaluation.deltas.emergencyFund;

  return {
    id: `${proposal.baselineVersionId}:${proposal.name}`,
    badge: "Engine-evaluated scenario",
    title: proposal.name,
    summary: proposal.description ?? "Compare this emergency-fund change with your current plan.",
    impactHighlight:
      delta?.completionMonthsDelta !== null && delta?.completionMonthsDelta !== undefined
        ? `Completion timeline changes by ${delta.completionMonthsDelta} month(s).`
        : "Emergency-fund impact evaluated against the current plan.",
    sources: sourceLabels(proposal),
    metrics: [
      {
        label: "Runway",
        baseline: formatNumber(baseline.runwayMonths, " months"),
        proposed: formatNumber(proposed.runwayMonths, " months"),
      },
      {
        label: "Shortfall",
        baseline: formatMoney(baseline.shortfall),
        proposed: formatMoney(proposed.shortfall),
        delta: signedMoney(delta?.shortfallDelta),
      },
    ],
    proposal,
  };
}

function loanViewModel(proposal: PlannerScenarioProposal): ProposalViewModel | null {
  const baseline = proposal.evaluation.baseline.loan;
  const proposed = proposal.evaluation.scenario.loan;
  if (!baseline || !proposed) return null;
  const delta = proposal.evaluation.deltas.loan;

  return {
    id: `${proposal.baselineVersionId}:${proposal.name}`,
    badge: "Engine-evaluated scenario",
    title: proposal.name,
    summary: proposal.description ?? "Compare this loan change with your current plan.",
    impactHighlight: signedMoney(delta?.totalInterestDelta)
      ? `Total interest changes by ${signedMoney(delta?.totalInterestDelta)}.`
      : "Loan impact evaluated against the current plan.",
    sources: sourceLabels(proposal),
    metrics: [
      {
        label: "Monthly EMI",
        baseline: formatMoney(baseline.monthlyEmi),
        proposed: formatMoney(proposed.monthlyEmi),
        delta: signedMoney(delta?.monthlyEmiDelta),
      },
      {
        label: "Total interest",
        baseline: formatMoney(baseline.totalInterest),
        proposed: formatMoney(proposed.totalInterest),
        delta: signedMoney(delta?.totalInterestDelta),
      },
    ],
    proposal,
  };
}

function goalViewModel(proposal: PlannerScenarioProposal): ProposalViewModel | null {
  const baseline = proposal.evaluation.baseline.goal;
  const proposed = proposal.evaluation.scenario.goal;
  if (!baseline || !proposed) return null;
  const delta = proposal.evaluation.deltas.goal;

  return {
    id: `${proposal.baselineVersionId}:${proposal.name}`,
    badge: "Engine-evaluated scenario",
    title: proposal.name,
    summary: proposal.description ?? "Compare this goal-funding change with your current plan.",
    impactHighlight: delta?.feasibilityChanged
      ? `Goal feasibility changes from ${baseline.feasibility ?? "unknown"} to ${proposed.feasibility ?? "unknown"}.`
      : "Goal feasibility evaluated against the current plan.",
    sources: sourceLabels(proposal),
    metrics: [
      {
        label: "Required SIP",
        baseline: formatMoney(baseline.requiredSip),
        proposed: formatMoney(proposed.requiredSip),
        delta: signedMoney(delta?.requiredSipDelta),
      },
      {
        label: "Shortfall",
        baseline: formatMoney(baseline.shortfall),
        proposed: formatMoney(proposed.shortfall),
        delta: signedMoney(delta?.shortfallDelta),
      },
    ],
    proposal,
  };
}

function cashFlowViewModel(proposal: PlannerScenarioProposal): ProposalViewModel | null {
  const baseline = proposal.evaluation.baseline.cashFlow;
  const proposed = proposal.evaluation.scenario.cashFlow;
  if (!baseline || !proposed) return null;
  const delta = proposal.evaluation.deltas.cashFlow;

  return {
    id: `${proposal.baselineVersionId}:${proposal.name}`,
    badge: "Engine-evaluated scenario",
    title: proposal.name,
    summary: proposal.description ?? "Compare this cash-flow change with your current plan.",
    impactHighlight: signedMoney(delta?.monthlySurplusDelta)
      ? `Monthly surplus changes by ${signedMoney(delta?.monthlySurplusDelta)}.`
      : "Cash-flow impact evaluated against the current plan.",
    sources: sourceLabels(proposal),
    metrics: [
      {
        label: "Monthly surplus",
        baseline: formatMoney(baseline.monthlySurplus),
        proposed: formatMoney(proposed.monthlySurplus),
        delta: signedMoney(delta?.monthlySurplusDelta),
      },
      {
        label: "Investable capacity",
        baseline: formatMoney(baseline.investableCapacity),
        proposed: formatMoney(proposed.investableCapacity),
        delta: signedMoney(delta?.investableCapacityDelta),
      },
    ],
    proposal,
  };
}

export function toProposalViewModel(proposal: PlannerScenarioProposal): ProposalViewModel {
  return (
    investmentViewModel(proposal) ??
    emergencyFundViewModel(proposal) ??
    loanViewModel(proposal) ??
    goalViewModel(proposal) ??
    cashFlowViewModel(proposal) ?? {
      id: `${proposal.baselineVersionId}:${proposal.name}`,
      badge: "Engine-evaluated scenario",
      title: proposal.name,
      summary: proposal.description ?? "Review this scenario before staging it.",
      impactHighlight: "Evaluated by the backend financial engine.",
      sources: sourceLabels(proposal),
      metrics: [],
      proposal,
    }
  );
}
