"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Home,
  Lock,
  MessageCircleMore,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  X,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ChevronDown,
  ExternalLink,
  Car,
  Target,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { sdk } from "@/lib/sdk";
import { action, secondary, ErrorNotice, Loading, PageTitle } from "@/features/planner/ui";
import { unwrap, useCurrentPlan } from "@/features/planner/queries";
import { usePlanning, useGoals } from "@/features/planner/planning-queries";
import { demoStore } from "@/lib/demo-store";
import { cn } from "@/lib/utils";

const PROJECTION_DATA_POINTS = [
  { year: "2024", current: 12.45, proposed: 12.45 },
  { year: "2028", current: 24.5, proposed: 29.8 },
  { year: "2032", current: 41.2, proposed: 54.6 },
  { year: "2036", current: 62.0, proposed: 87.5 },
  { year: "2040", current: 74.5, proposed: 108.2 },
  { year: "2044", current: 82.0, proposed: 124.0 },
];

/** Formats bold, currency, and emphasis inline */
function renderFormattedLine(line: string): React.ReactNode {
  const parts = line.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return (
        <strong key={i} className="font-semibold text-[#1F2A44]">
          {inner}
        </strong>
      );
    }
    return part;
  });
}

/**
 * Clean markdown parser that replaces raw headings, bold tags, and bullet lists
 * with elegant editorial typography and section badges.
 */
function MarkdownContent({ content }: { content: string }) {
  const blocks = useMemo(() => {
    const lines = content.split("\n");
    const parsedBlocks: React.ReactNode[] = [];
    let listBuffer: string[] = [];

    const flushList = (keyPrefix: string) => {
      if (listBuffer.length > 0) {
        parsedBlocks.push(
          <ul key={`${keyPrefix}-list`} className="my-2 space-y-1.5 pl-1">
            {listBuffer.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-[#344054] leading-relaxed">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#5E55C9]" />
                <div>{renderFormattedLine(item)}</div>
              </li>
            ))}
          </ul>
        );
        listBuffer = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList(`flush-${idx}`);
        return;
      }

      // Bullet items
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        listBuffer.push(trimmed.slice(2));
        return;
      }

      flushList(`flush-${idx}`);

      // Headings
      if (trimmed.startsWith("#")) {
        const headingMatch = trimmed.match(/^(#{1,4})\s*(.+)$/);
        if (headingMatch) {
          const headingText = headingMatch[2];
          const stepMatch = headingText.match(/^(\d+)[\.\s]+(.+)$/);

          if (stepMatch) {
            parsedBlocks.push(
              <div key={`heading-${idx}`} className="mt-4 mb-2 flex items-center gap-2.5">
                <span className="flex size-6 items-center justify-center rounded-lg bg-[#5E55C9]/15 text-[#5E55C9] font-sans text-xs font-bold shadow-2xs">
                  {stepMatch[1]}
                </span>
                <h3 className="font-serif text-base font-semibold text-[#1F2A44]">
                  {stepMatch[2]}
                </h3>
              </div>
            );
          } else {
            parsedBlocks.push(
              <h3
                key={`heading-${idx}`}
                className="mt-4 mb-2 font-serif text-base font-semibold text-[#1F2A44] border-b border-[#E8E1D6]/40 pb-1"
              >
                {headingText}
              </h3>
            );
          }
          return;
        }
      }

      // Blockquotes
      if (trimmed.startsWith("> ")) {
        parsedBlocks.push(
          <blockquote
            key={`quote-${idx}`}
            className="my-2 rounded-r-xl border-l-3 border-[#5E55C9] bg-[#5E55C9]/5 px-3.5 py-2 text-xs text-[#1F2A44] italic"
          >
            {renderFormattedLine(trimmed.slice(2))}
          </blockquote>
        );
        return;
      }

      // Paragraph
      parsedBlocks.push(
        <p key={`p-${idx}`} className="my-1.5 text-sm leading-relaxed text-[#344054]">
          {renderFormattedLine(trimmed)}
        </p>
      );
    });

    flushList("final");
    return parsedBlocks;
  }, [content]);

  return <div className="space-y-1">{blocks}</div>;
}

type Conversation = Awaited<ReturnType<typeof getConversations>>["data"][number];
type PlannerMessage = Awaited<ReturnType<typeof getMessages>>[number];
type DisplayMessage = Pick<PlannerMessage, "id" | "sender" | "content" | "citations">;

const QUICK_STARTER_PILLS = [
  "Can I afford a dream vacation?",
  "How can I reach ₹1 Cr net worth?",
  "Review my loan prepayment options",
  "Analyze monthly cash flow drift",
] as const;

const TRY_STARTER_CHIPS = [
  "Plan for a home",
  "Save on taxes",
  "Should I invest in an index fund?",
  "Retire early?",
] as const;

const SUGGESTED_PROMPT_CARDS = [
  {
    icon: Home,
    category: "Buy a Home",
    prompt: "Can I afford a home in 5 years?",
    description: "Model savings, EMI limits, and down payment readiness.",
  },
  {
    icon: TrendingUp,
    category: "Grow Investments",
    prompt: "What's the best investment strategy for my goals?",
    description: "Explore asset allocation across equity, debt, and cash.",
  },
  {
    icon: PiggyBank,
    category: "Plan for Retirement",
    prompt: "Will I be able to retire early?",
    description: "Simulate corpus sustainability and inflation-adjusted withdrawals.",
  },
  {
    icon: GraduationCap,
    category: "Plan Education",
    prompt: "How much will my child's education cost?",
    description: "Estimate higher education inflation and required SIP.",
  },
];

export interface ProposalProjection {
  proposedTotal: string;
  baselineTotal: string;
  percentageDelta: string;
  chartData: Array<{ year: string; current: number; proposed: number }>;
}

export interface ProposalCardData {
  id: string;
  badge: string;
  title: string;
  summary: string;
  impactHighlight: string;
  sources: string[];
  metrics: {
    label: string;
    baseline: string;
    proposed: string;
    delta?: string;
  }[];
  projection?: ProposalProjection;
  recommendedSip?: number;
  sipRange?: { min: number; max: number; step: number };
}

function calculateCompoundProjection(
  initialLumpSum: number,
  monthlySip: number,
  annualRate = 0.1,
  years = 20
): { finalValue: number; yearlyPoints: Array<{ year: string; value: number }> } {
  const r = annualRate / 12;
  const currentYear = new Date().getFullYear();
  const yearlyPoints: Array<{ year: string; value: number }> = [];

  for (let y = 0; y <= years; y += 4) {
    const n = y * 12;
    const fvLump = initialLumpSum * Math.pow(1 + annualRate, y);
    const fvSip = n === 0 ? 0 : monthlySip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const total = fvLump + fvSip;
    yearlyPoints.push({
      year: String(currentYear + y),
      value: Math.round((total / 100000) * 10) / 10,
    });
  }

  const nTotal = years * 12;
  const fvLumpFinal = initialLumpSum * Math.pow(1 + annualRate, years);
  const fvSipFinal = monthlySip * ((Math.pow(1 + r, nTotal) - 1) / r) * (1 + r);
  const finalValue = Math.round(fvLumpFinal + fvSipFinal);

  return { finalValue, yearlyPoints };
}

function formatInr(amount: number): string {
  return `₹ ${Math.round(amount).toLocaleString("en-IN")}`;
}

export function generateUserProposals(
  currentPlanData: ReturnType<typeof useCurrentPlan>["data"],
  planningData: ReturnType<typeof usePlanning>["data"],
  goalsData: ReturnType<typeof useGoals>["data"]
): ProposalCardData[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputs = planningData?.inputs as any;
  const output = currentPlanData?.snapshot?.calculatedOutput;
  const goals = goalsData || [];

  const planVersion = currentPlanData?.currentVersion?.versionNumber
    ? `Derived from Plan v${currentPlanData.currentVersion.versionNumber}`
    : "Derived from Active Plan";

  const asOfDate = currentPlanData?.snapshot?.asOf ? new Date(currentPlanData.snapshot.asOf) : null;
  const asOfSavingsRate = asOfDate && !isNaN(asOfDate.getTime())
    ? `Based on ${asOfDate.toLocaleString("en-US", { month: "short", year: "numeric" })} savings rate`
    : "Based on May 2026 savings rate";

  const sources = [planVersion, asOfSavingsRate];

  // Extract financial context dynamically with scale-aware intelligent defaults
  const income = Number(
    inputs?.cashFlow?.income ||
    output?.cashFlow?.monthlyIncome ||
    (inputs?.annualIncome ? Number(inputs.annualIncome) / 12 : 0) ||
    150000
  );

  const essentialExpenses = Number(inputs?.cashFlow?.essentialExpenses || output?.cashFlow?.essentialExpenses || (income > 60000 ? 45000 : 15000));
  const discretionaryExpenses = Number(inputs?.cashFlow?.discretionaryExpenses || output?.cashFlow?.discretionaryExpenses || (income > 60000 ? 18000 : 3000));
  const emis = Number(inputs?.cashFlow?.emis || output?.cashFlow?.emis || 0);
  const totalMonthlyExpenses = essentialExpenses + discretionaryExpenses + emis || Number(output?.cashFlow?.totalOutflows || (income > 60000 ? 63000 : 18000));

  const monthlySurplus = Math.max(0, income - totalMonthlyExpenses);
  const currentReserves = Number(
    inputs?.emergencyFund?.currentReserves ||
    output?.emergencyFund?.currentReserves ||
    (inputs?.netWorth?.cash ? Number(inputs.netWorth.cash) : 0) ||
    (income > 60000 ? 360000 : 12000)
  );

  const baselineSip = Number(
    inputs?.investment?.monthlySip ||
    (income > 60000 ? 10000 : 2000)
  );

  const initialLiquid = Number(
    output?.netWorth?.totalAssets ||
    inputs?.investment?.initialLumpSum ||
    currentReserves ||
    (income > 60000 ? 1250000 : 48000)
  );

  const proposalsList: ProposalCardData[] = [];

  // 1. SIP Acceleration Proposal
  const sipIncrement = monthlySurplus > 2000
    ? Math.min(Math.round((monthlySurplus * 0.3) / 500) * 500, 10000) || (income > 60000 ? 5000 : 1000)
    : (income > 60000 ? 5000 : 1000);
  const proposedSip = baselineSip + sipIncrement;

  const baselineProj = calculateCompoundProjection(initialLiquid, baselineSip, 0.10, 20);
  const proposedProj = calculateCompoundProjection(initialLiquid, proposedSip, 0.10, 20);

  const deltaPct = Math.max(1, Math.round(((proposedProj.finalValue - baselineProj.finalValue) / baselineProj.finalValue) * 100));

  const chartData = baselineProj.yearlyPoints.map((pt, idx) => ({
    year: pt.year,
    current: pt.value,
    proposed: proposedProj.yearlyPoints[idx]?.value ?? pt.value,
  }));

  proposalsList.push({
    id: "prop-sip-increase",
    badge: "Scenario Draft",
    title: "Increase Monthly SIP Contributions",
    summary: `Increase monthly SIP by ${formatInr(sipIncrement)} allocated towards low-cost index funds to accelerate retirement timeline.`,
    impactHighlight: `Projected portfolio reaches ${formatInr(proposedProj.finalValue)} vs ${formatInr(baselineProj.finalValue)} baseline (+${deltaPct}%)`,
    sources,
    metrics: [
      { label: "Monthly SIP", baseline: formatInr(baselineSip), proposed: formatInr(proposedSip), delta: `+${formatInr(sipIncrement)}` },
      { label: "20-Yr Value", baseline: formatInr(baselineProj.finalValue), proposed: formatInr(proposedProj.finalValue), delta: `+${deltaPct}%` },
      { label: "Retirement Target", baseline: "Age 63", proposed: "Age 60", delta: "3 yrs early" },
    ],
    recommendedSip: proposedSip,
    sipRange: {
      min: Math.max(1000, Math.round((baselineSip * 0.5) / 500) * 500),
      max: Math.max(10000, Math.round((proposedSip * 2.5) / 1000) * 1000),
      step: proposedSip > 5000 ? 1000 : 500,
    },
    projection: {
      proposedTotal: formatInr(proposedProj.finalValue),
      baselineTotal: formatInr(baselineProj.finalValue),
      percentageDelta: `+${deltaPct}%`,
      chartData,
    },
  });

  // 2. Emergency Buffer Proposal
  const runwayMonths = totalMonthlyExpenses > 0 ? currentReserves / totalMonthlyExpenses : 0;
  const targetBuffer = Math.round(totalMonthlyExpenses * 6);
  const bufferShortfall = Math.max(0, targetBuffer - currentReserves);
  const monthlyBufferAllocation = monthlySurplus > 0
    ? Math.min(Math.round((monthlySurplus * 0.4) / 500) * 500, Math.max(500, monthlySurplus))
    : Math.max(1000, Math.round((totalMonthlyExpenses * 0.1) / 500) * 500);

  proposalsList.push({
    id: "prop-emergency-fund",
    badge: "Buffer Proposal",
    title: "Strengthen Emergency Buffer to 6 Months",
    summary: `Route ${formatInr(monthlyBufferAllocation)}/month of unallocated surplus into DICGC-insured scheduled commercial bank deposits.`,
    impactHighlight: `Expands emergency buffer from ${formatInr(currentReserves)} (${runwayMonths.toFixed(1)} mos) to ${formatInr(targetBuffer)} (6.0 mos)`,
    sources: [...sources, "RBI DICGC coverage rules"],
    metrics: [
      { label: "Current Buffer", baseline: formatInr(currentReserves), proposed: formatInr(targetBuffer), delta: `+${formatInr(bufferShortfall)}` },
      { label: "Runway", baseline: `${runwayMonths.toFixed(1)} months`, proposed: "6.0 months", delta: `+${Math.max(0, 6 - runwayMonths).toFixed(1)} mos` },
    ],
    recommendedSip: baselineSip,
    sipRange: { min: 1000, max: 50000, step: 1000 },
    projection: {
      proposedTotal: formatInr(proposedProj.finalValue),
      baselineTotal: formatInr(baselineProj.finalValue),
      percentageDelta: `+${deltaPct}%`,
      chartData,
    },
  });

  // 3. Milestone Goal Proposal
  const topGoal = goals[0];
  if (topGoal) {
    const goalName = topGoal.name || "Target Goal";
    const goalTarget = Number(topGoal.targetAmount || 0) || (income > 60000 ? 7500000 : 220000);
    const goalSaved = Number((topGoal as { currentSavings?: string; currentAmount?: string }).currentSavings ?? (topGoal as { currentSavings?: string; currentAmount?: string }).currentAmount ?? 0);
    const isHome = goalName.toLowerCase().includes("home") || goalName.toLowerCase().includes("house");

    if (isHome) {
      const downPaymentBaseline = Math.round(goalTarget * 0.15);
      const downPaymentProposed = Math.round(goalTarget * 0.20);
      proposalsList.push({
        id: "prop-home-track",
        badge: "Milestone Proposal",
        title: `Optimize ${goalName} Horizon`,
        summary: `Based on current savings and 35% debt-to-income ceiling, adjust target purchase budget.`,
        impactHighlight: `Feasible purchase price of ${formatInr(goalTarget)} achievable with 20% down payment`,
        sources: [...sources, "Deterministic Affordability Engine"],
        metrics: [
          { label: "Target Home", baseline: formatInr(Math.round(goalTarget * 0.85)), proposed: formatInr(goalTarget), delta: `+${formatInr(Math.round(goalTarget * 0.15))}` },
          { label: "Down Payment Target", baseline: formatInr(downPaymentBaseline), proposed: formatInr(downPaymentProposed), delta: "20% equity" },
        ],
        recommendedSip: proposedSip,
        sipRange: { min: 1000, max: 50000, step: 1000 },
        projection: {
          proposedTotal: formatInr(proposedProj.finalValue),
          baselineTotal: formatInr(baselineProj.finalValue),
          percentageDelta: `+${deltaPct}%`,
          chartData,
        },
      });
    } else {
      proposalsList.push({
        id: "prop-milestone-track",
        badge: "Milestone Proposal",
        title: `Accelerate "${goalName}" Target`,
        summary: `Target ${formatInr(goalTarget)} milestone with disciplined monthly allocations and zero high-interest debt.`,
        impactHighlight: `Milestone ${goalName} on track for fulfillment within target schedule`,
        sources: [...sources, "Deterministic Goal Solver"],
        metrics: [
          { label: "Target Cost", baseline: formatInr(goalTarget), proposed: formatInr(goalTarget), delta: "100% funded" },
          { label: "Current Progress", baseline: formatInr(goalSaved), proposed: formatInr(goalTarget), delta: `+${formatInr(Math.max(0, goalTarget - goalSaved))}` },
        ],
        recommendedSip: proposedSip,
        sipRange: { min: 1000, max: 50000, step: 1000 },
        projection: {
          proposedTotal: formatInr(proposedProj.finalValue),
          baselineTotal: formatInr(baselineProj.finalValue),
          percentageDelta: `+${deltaPct}%`,
          chartData,
        },
      });
    }
  } else {
    proposalsList.push({
      id: "prop-home-track",
      badge: "Milestone Proposal",
      title: "Optimize Home Down Payment Horizon",
      summary: "Based on current savings and 35% debt-to-income ceiling, adjust target purchase budget.",
      impactHighlight: "Feasible purchase price achievable with disciplined savings",
      sources: [...sources, "Deterministic Affordability Engine"],
      metrics: [
        { label: "Affordable Home", baseline: "₹65,00,000", proposed: "₹80,00,000", delta: "+₹15,00,000" },
        { label: "Down Payment Target", baseline: "₹13,00,000", proposed: "₹16,00,000", delta: "20% equity" },
      ],
      recommendedSip: proposedSip,
      sipRange: { min: 1000, max: 50000, step: 1000 },
      projection: {
        proposedTotal: formatInr(proposedProj.finalValue),
        baselineTotal: formatInr(baselineProj.finalValue),
        percentageDelta: `+${deltaPct}%`,
        chartData,
      },
    });
  }

  return proposalsList;
}

async function getConversations() {
  const response = await sdk.GET("/api/v1/planner/conversations", {
    params: { query: { limit: 30 } },
  });
  return unwrap(response);
}

async function getMessages(conversationId: string) {
  const response = await sdk.GET("/api/v1/planner/conversations/{id}/messages", {
    params: { path: { id: conversationId } },
  });
  return unwrap(response).data;
}

export function AiPlanner() {
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>();
  const [draft, setDraft] = useState("");
  const [localUserMessage, setLocalUserMessage] = useState<string>();
  const [reviewingProposal, setReviewingProposal] = useState<ProposalCardData | null>(null);
  const [dismissedProposalIds, setDismissedProposalIds] = useState<Set<string>>(new Set());
  const [stagedNotification, setStagedNotification] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showContextSidebar, setShowContextSidebar] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Grounding queries for live context
  const planningQuery = usePlanning();
  const goalsQuery = useGoals();
  const currentPlanQuery = useCurrentPlan();

  // Listen to demoStore changes so switching personas in DemoBanner updates AI Copilot immediately
  useEffect(() => {
    const unsub = demoStore.subscribe(() => {
      void queryClient.invalidateQueries({ queryKey: ["planning"] });
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
      void queryClient.invalidateQueries({ queryKey: ["plan"] });
    });
    return unsub;
  }, [queryClient]);

  const planVersionNumber = currentPlanQuery.data?.currentVersion?.versionNumber;
  const activePlanTag = planVersionNumber ? `Plan v${planVersionNumber}` : "Active Plan";

  const asOfDate = currentPlanQuery.data?.snapshot?.asOf ? new Date(currentPlanQuery.data.snapshot.asOf) : null;
  const asOfSavingsRateText = asOfDate && !isNaN(asOfDate.getTime())
    ? `Based on ${asOfDate.toLocaleString("en-US", { month: "short", year: "numeric" })} savings rate`
    : "Based on May 2026 savings rate";

  const dynamicProposals = useMemo(() => {
    return generateUserProposals(
      currentPlanQuery.data,
      planningQuery.data,
      goalsQuery.data
    );
  }, [currentPlanQuery.data, planningQuery.data, goalsQuery.data]);

  const proposals = useMemo(() => {
    return dynamicProposals.filter((p) => !dismissedProposalIds.has(p.id));
  }, [dynamicProposals, dismissedProposalIds]);

  const suggestedPrompts = useMemo(() => {
    const goals = goalsQuery.data || [];
    const vehicleGoal = goals.find(
      (g) =>
        g.category === "car" ||
        (g.name && (
          g.name.toLowerCase().includes("car") ||
          g.name.toLowerCase().includes("bullet") ||
          g.name.toLowerCase().includes("bike")
        ))
    );
    const educationGoal = goals.find(
      (g) =>
        g.category === "education" ||
        (g.name && (
          g.name.toLowerCase().includes("child") ||
          g.name.toLowerCase().includes("education")
        ))
    );

    const cards = [];

    if (vehicleGoal) {
      cards.push({
        icon: Car,
        category: "Vehicle Goal",
        prompt: `Can I afford ${vehicleGoal.name}?`,
        description: "Model down payment, loan tenure, and savings runway.",
      });
    } else {
      cards.push({
        icon: Home,
        category: "Buy a Home",
        prompt: "Can I afford a home in 5 years?",
        description: "Model savings, EMI limits, and down payment readiness.",
      });
    }

    cards.push({
      icon: TrendingUp,
      category: "Grow Investments",
      prompt: "What's the best investment strategy for my goals?",
      description: "Explore asset allocation across equity, debt, and cash.",
    });

    cards.push({
      icon: PiggyBank,
      category: "Plan for Retirement",
      prompt: "Will I be able to retire early?",
      description: "Simulate corpus sustainability and inflation-adjusted withdrawals.",
    });

    if (educationGoal) {
      cards.push({
        icon: GraduationCap,
        category: "Plan Education",
        prompt: "How much will my child's education cost?",
        description: "Estimate higher education inflation and required SIP.",
      });
    } else {
      cards.push({
        icon: ShieldCheck,
        category: "Emergency Cushion",
        prompt: "How much emergency fund do I need?",
        description: "Simulate 6 months of living expenses and liquid buffer.",
      });
    }

    return cards;
  }, [goalsQuery.data]);

  const conversations = useQuery({
    queryKey: ["planner", "conversations"],
    queryFn: getConversations,
  });
  const activeConversationId =
    conversationId === undefined ? conversations.data?.data[0]?.id : conversationId;
  const activeConversation = conversations.data?.data.find((c) => c.id === activeConversationId);
  const messages = useQuery({
    queryKey: ["planner", "messages", activeConversationId],
    queryFn: () => getMessages(activeConversationId!),
    enabled: Boolean(activeConversationId),
  });

  const isChatActive = Boolean(activeConversationId || localUserMessage);

  // Dynamic Financial Context derived from live user data
  const contextMetrics = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputs = planningQuery.data?.inputs as any;
    const output = currentPlanQuery.data?.snapshot?.calculatedOutput;
    const activeGoals = goalsQuery.data || [];
    const activeGoalsCount = activeGoals.length;

    const annualIncomeVal =
      inputs?.cashFlow?.income
        ? Number(inputs.cashFlow.income) * 12
        : inputs?.annualIncome
          ? Number(inputs.annualIncome)
          : output?.cashFlow?.monthlyIncome
            ? Number(output.cashFlow.monthlyIncome) * 12
            : 0;

    const monthlyExpensesVal =
      inputs?.cashFlow?.essentialExpenses
        ? Number(inputs.cashFlow.essentialExpenses) +
          Number(inputs.cashFlow?.discretionaryExpenses || 0) +
          Number(inputs.cashFlow?.emis || 0)
        : inputs?.monthlyExpenses
          ? Number(inputs.monthlyExpenses)
          : output?.cashFlow?.totalOutflows
            ? Number(output.cashFlow.totalOutflows)
            : 0;

    const savingsVal =
      inputs?.netWorth?.investments
        ? Number(inputs.netWorth.investments) + Number(inputs.netWorth?.cash || 0)
        : inputs?.savingsInvestments
          ? Number(inputs.savingsInvestments)
          : output?.netWorth?.totalAssets
            ? Number(output.netWorth.totalAssets)
            : inputs?.emergencyFund?.currentReserves
              ? Number(inputs.emergencyFund.currentReserves)
              : 0;

    const riskVal = inputs?.investment?.riskTolerance || inputs?.riskProfile;

    let maxHorizon = 0;
    const currentYear = new Date().getFullYear();
    activeGoals.forEach((g) => {
      if (g?.targetDate) {
        const yr = new Date(g.targetDate).getFullYear();
        if (!isNaN(yr) && yr > currentYear) {
          maxHorizon = Math.max(maxHorizon, yr - currentYear);
        }
      }
    });
    const horizonVal =
      maxHorizon > 0
        ? `${maxHorizon}+ years`
        : inputs?.investment?.horizonMonths
          ? `${Math.round(inputs.investment.horizonMonths / 12)} years`
          : "Unspecified";

    const dependents = inputs?.emergencyFund?.dependents;
    const familyVal =
      dependents !== undefined && dependents !== null
        ? Number(dependents) === 0
          ? "Single / 0 dependents"
          : `${dependents} dependent${Number(dependents) > 1 ? "s" : ""}`
        : "Not specified";

    return [
      {
        label: "Annual Income",
        value: annualIncomeVal > 0 ? `₹ ${annualIncomeVal.toLocaleString("en-IN")}` : "Not recorded",
        note: annualIncomeVal > 0 ? "Primary household earner" : "Complete cash flow in Plan",
      },
      {
        label: "Monthly Expenses",
        value: monthlyExpensesVal > 0 ? `₹ ${monthlyExpensesVal.toLocaleString("en-IN")}` : "Not recorded",
        note: monthlyExpensesVal > 0 ? "Essentials + living commitments" : "No expense data",
      },
      {
        label: "Savings & Investments",
        value: savingsVal > 0 ? `₹ ${savingsVal.toLocaleString("en-IN")}` : "₹ 0",
        note: savingsVal > 0 ? "Liquid reserves + investments" : "No liquid savings recorded",
      },
      {
        label: "Active Goals",
        value: `${activeGoalsCount} active goal${activeGoalsCount === 1 ? "" : "s"}`,
        note: activeGoalsCount > 0 ? activeGoals.map((g) => g?.name || "Goal").slice(0, 3).join(", ") : "No active goals yet",
      },
      {
        label: "Risk Profile",
        value: riskVal ? riskVal.charAt(0).toUpperCase() + riskVal.slice(1) : "Not assessed",
        note: riskVal ? `${riskVal.charAt(0).toUpperCase() + riskVal.slice(1)} growth orientation` : "Assess risk in Plan settings",
      },
      {
        label: "Time Horizon",
        value: horizonVal,
        note: maxHorizon > 0 ? "Derived from target goals" : "Set goals to define horizon",
      },
      {
        label: "Family",
        value: familyVal,
        note:
          dependents !== undefined && Number(dependents) === 0
            ? "Independent earner"
            : Number(dependents) > 0
              ? "Household dependents"
              : "Update in Emergency Fund inputs",
      },
    ];
  }, [planningQuery.data, goalsQuery.data, currentPlanQuery.data]);

  // Isolated scroll listener: detects when user has scrolled up
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 100;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom <= threshold;
    setIsAtBottom(atBottom);
    setShowScrollBottomBtn(!atBottom && el.scrollHeight > el.clientHeight + 100);
  };

  // Safe isolated smooth scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = scrollContainerRef.current;
    if (el) {
      if (typeof el.scrollTo === "function") {
        el.scrollTo({ top: el.scrollHeight, behavior });
      } else {
        el.scrollTop = el.scrollHeight;
      }
    }
  };

  // Auto-scroll trigger: scrolls smoothly only when user sends message or is already at bottom
  useEffect(() => {
    if (localUserMessage) {
      scrollToBottom("smooth");
    } else if (isAtBottom) {
      scrollToBottom("smooth");
    }
  }, [messages.data, localUserMessage]);

  async function refreshConversation(id: string) {
    setConversationId(id);
    setLocalUserMessage(undefined);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["planner", "conversations"] }),
      queryClient.invalidateQueries({ queryKey: ["planner", "messages", id] }),
    ]);
  }

  const chat = useMutation({
    mutationFn: async (message: string) => {
      const response = await sdk.POST("/api/v1/planner/chat", {
        body: activeConversationId ? { message, conversationId: activeConversationId } : { message },
      });
      return unwrap(response).data;
    },
    onSuccess: (result) => void refreshConversation(result.conversationId),
  });

  const analyze = useMutation({
    mutationFn: async () => {
      const response = await sdk.POST("/api/v1/planner/analyze", {
        body: activeConversationId ? { conversationId: activeConversationId } : {},
      });
      return unwrap(response).data;
    },
    onSuccess: (result) => {
      setDismissedProposalIds(new Set());
      void refreshConversation(result.conversationId);
    },
  });

  const isWorking = chat.isPending || analyze.isPending;
  const requestError = chat.error ?? analyze.error;
  const displayedError = conversations.error ?? messages.error ?? requestError;

  function retryDisplayedError() {
    if (conversations.error) {
      void conversations.refetch();
    } else if (messages.error) {
      void messages.refetch();
    } else if (chat.error && localUserMessage) {
      chat.mutate(localUserMessage);
    } else if (analyze.error) {
      analyze.mutate();
    }
  }

  function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isWorking) return;
    setDraft("");
    setLocalUserMessage(message);
    chat.mutate(message);
  }

  function handleStarterPrompt(prompt: string) {
    if (isWorking) return;
    setDraft("");
    setLocalUserMessage(prompt);
    chat.mutate(prompt);
  }

  function selectConversation(next: Conversation) {
    setConversationId(next.id);
    setLocalUserMessage(undefined);
    setIsHistoryOpen(false);
  }

  function startNewConversation() {
    setConversationId(null);
    setLocalUserMessage(undefined);
    setDraft("");
  }

  function handleConfirmStage() {
    if (!reviewingProposal) return;
    const stagedTitle = reviewingProposal.title;
    const idToStage = reviewingProposal.id;
    setStagedNotification(
      `Proposal "${stagedTitle}" staged in Scenarios workbench. Your baseline plan remains safe.`
    );
    setDismissedProposalIds((prev) => new Set([...prev, idToStage]));
    setReviewingProposal(null);
  }

  function handleDismissProposal(id: string) {
    setDismissedProposalIds((prev) => new Set([...prev, id]));
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-70px)] lg:h-[calc(100dvh-40px)] min-h-[580px] max-w-[1440px] mx-auto overflow-hidden">
      {/* 1. Sleek Unified Header Bar */}
      <header className="shrink-0 mb-2 flex items-center justify-between gap-2 px-3 py-2 rounded-2xl border border-[#E8E1D6] bg-white shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-xl bg-[#5E55C9]/10 border border-[#5E55C9]/20 flex items-center justify-center shrink-0">
            <Sparkles className="size-4 text-[#5E55C9]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-base sm:text-lg font-normal text-[#1A2238] truncate tracking-tight">
                {isChatActive && activeConversation?.title ? activeConversation.title : "AI planner"}
              </h1>
              {isChatActive ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1E7E34]/10 text-[10px] font-semibold text-[#1E7E34] border border-[#1E7E34]/20 shrink-0">
                  <span className="size-1.5 rounded-full bg-[#1E7E34] animate-pulse" />
                  Active Session
                </span>
              ) : (
                <span className="rounded-full bg-[#5E55C9]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5E55C9] border border-[#5E55C9]/20 shrink-0">
                  {activePlanTag}
                </span>
              )}
            </div>
            {!isChatActive && (
              <p className="text-[11px] text-[#475467] truncate hidden sm:block">
                Ask questions about your saved financial picture and review evidence before acting.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* History Toggle Button */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="inline-flex min-h-8 items-center justify-center rounded-xl border border-[#E8E1D6] bg-[#FAF8F5] px-2.5 py-1 text-xs font-semibold text-[#1A2238] shadow-2xs hover:bg-white hover:border-[#5E55C9] transition-colors cursor-pointer"
            aria-label={isHistoryOpen ? "Close history" : "Recent chats"}
          >
            {isHistoryOpen ? (
              <PanelLeftClose className="size-3.5 text-[#5E55C9] mr-1" aria-hidden="true" />
            ) : (
              <PanelLeftOpen className="size-3.5 text-[#5E55C9] mr-1" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Recent chats</span>
          </button>

          {/* Context Sidebar Toggle Button */}
          {isChatActive && (
            <button
              type="button"
              className={cn(
                "inline-flex min-h-8 items-center justify-center rounded-xl border px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors cursor-pointer",
                showContextSidebar
                  ? "border-[#5E55C9] bg-[#5E55C9]/10 text-[#5E55C9]"
                  : "border-[#E8E1D6] bg-[#FAF8F5] text-[#1A2238] hover:bg-white hover:border-[#5E55C9]"
              )}
              onClick={() => setShowContextSidebar(!showContextSidebar)}
              aria-label="Financial context"
            >
              <SlidersHorizontal className="size-3.5 text-[#5E55C9] mr-1" aria-hidden="true" />
              <span className="hidden sm:inline">Financial Context</span>
            </button>
          )}

          {/* Start New Conversation button (when in active chat) */}
          {isChatActive && (
            <button
              type="button"
              className="inline-flex min-h-8 items-center justify-center rounded-xl bg-white border border-[#E8E1D6] px-2.5 py-1 text-xs font-semibold text-[#1A2238] shadow-2xs hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              onClick={startNewConversation}
            >
              <Plus className="size-3.5 text-[#5E55C9] mr-1" />
              <span className="hidden md:inline">Start fresh</span>
            </button>
          )}

          {/* Analyze Plan CTA button */}
          <button
            type="button"
            className="inline-flex min-h-8 items-center justify-center rounded-xl bg-[#5E55C9] text-white px-3 py-1 text-xs font-semibold shadow-2xs hover:bg-[#4d45b5] transition-colors disabled:opacity-50 cursor-pointer"
            onClick={() => analyze.mutate()}
            disabled={isWorking}
          >
            <Sparkles className="mr-1 size-3.5" aria-hidden="true" />
            <span className="hidden md:inline">Analyze plan</span>
          </button>
        </div>
      </header>

      {/* 2. Slim Single-Line Compliance Strip (Legal Requirement) */}
      <div
        className="shrink-0 mb-2 px-2 flex items-center justify-between text-[11px] text-[#667085]"
        role="note"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <ShieldCheck className="size-3.5 text-[#3B5B8C] shrink-0" aria-hidden="true" />
          <p className="text-xs text-[#1A2238] font-medium truncate">
            AI provides deterministic decision assistance. It does not provide SEBI-registered investment advice or auto-execute trades.
          </p>
        </div>
        <span className="text-[10px] text-[#98A2B3] shrink-0 hidden lg:inline-block ml-2">
          Suggestions never mutate baseline plans automatically
        </span>
      </div>

      <ErrorNotice error={displayedError} retry={retryDisplayedError} />

      {/* Staged Notification Toast */}
      {stagedNotification && (
        <div
          role="status"
          className="shrink-0 mb-2 flex items-start justify-between gap-3 rounded-2xl border border-[#1E7E34]/30 bg-[#EDF7ED] p-3 text-xs sm:text-sm text-[#1E4620] shadow-2xs animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[#1E7E34] shrink-0" aria-hidden="true" />
            <span>{stagedNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setStagedNotification(null)}
            className="text-[#1E7E34] hover:opacity-70 cursor-pointer"
            aria-label="Dismiss status notification"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* 3. Main Workspace Split-Pane Container (Viewport Locked) */}
      <div className="relative flex flex-1 min-h-0 rounded-3xl border border-[#E8E1D6] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)] overflow-hidden">
        {/* Left Collapsible Aside: Recent Conversations */}
        <aside
          className={cn(
            "shrink-0 flex flex-col justify-between border-r border-[#E8E1D6] bg-[#FFFCF8] p-4 transition-all duration-300 z-20 overflow-y-auto custom-scrollbar",
            isHistoryOpen ? "w-64" : "hidden"
          )}
          aria-label="AI conversations"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D6]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#667085]">
                Recent conversations
              </h2>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="text-[#667085] hover:text-[#1A2238] p-1 rounded-lg cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <button
              type="button"
              className="mt-3 w-full inline-flex min-h-9 items-center justify-center rounded-xl bg-white border border-[#E8E1D6] px-3 py-1.5 text-xs font-semibold text-[#1A2238] shadow-2xs hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              onClick={startNewConversation}
            >
              <Plus className="mr-1.5 size-3.5 text-[#5E55C9]" />
              <span>New conversation</span>
            </button>

            <div className="mt-3 space-y-1">
              {conversations.isLoading ? (
                <Loading />
              ) : (
                <>
                  {conversations.data?.data.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectConversation(item)}
                      aria-pressed={item.id === activeConversationId}
                      className={cn(
                        "w-full text-left rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer",
                        item.id === activeConversationId
                          ? "bg-white font-semibold text-[#1A2238] border border-[#E8E1D6] shadow-2xs"
                          : "text-[#475467] hover:bg-white/60"
                      )}
                    >
                      <span className="block truncate">{item.title}</span>
                      <span className="block text-[10px] text-[#667085] mt-0.5">
                        {new Date(item.updatedAt).toLocaleDateString("en-IN")}
                      </span>
                    </button>
                  ))}
                  {conversations.data?.data.length === 0 ? (
                    <p className="px-2 py-4 text-xs text-[#667085]">No conversations yet.</p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#E8E1D6] bg-white p-3 text-xs text-[#475467]">
            <div className="flex items-center gap-1.5 font-semibold text-[#1A2238]">
              <Lock className="size-3.5 text-[#3B5B8C]" aria-hidden="true" />
              <span>Data stays yours</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#667085]">
              Strictly private and deterministic. Never used for automated trades.
            </p>
          </div>
        </aside>

        {/* Center Conversational Column */}
        <div className="flex flex-1 flex-col min-w-0 h-full relative">
          {!isChatActive ? (
            /* ========================================================================= */
            /* 1. INITIAL WELCOME OVERVIEW (Board 09 Screens 01, 02 & 04)                */
            /* ========================================================================= */
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-8">
              {/* Screen 01: Hero Banner */}
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FAF8F5] via-[#FFFFFF] to-[#F4EFEA] border border-[#EAE5DE] p-6 sm:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="space-y-3 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5E55C9]/10 border border-[#5E55C9]/20 text-[#5E55C9] text-xs font-semibold">
                      <Sparkles className="size-3.5" />
                      <span>Deterministic Copilot Engine</span>
                    </div>
                    <h2 className="font-serif text-3xl sm:text-4xl text-[#1A2238] leading-tight font-normal">
                      Your AI copilot for a brighter tomorrow.
                    </h2>
                    <p className="text-sm sm:text-base text-[#475467] leading-relaxed">
                      Ask questions, get personalized insights, and take confident steps toward your financial goals.
                    </p>
                  </div>

                  <div className="relative shrink-0 flex items-center justify-center">
                    <div className="relative size-32 sm:size-40 rounded-2xl overflow-hidden shadow-sm border border-[#E8E1D6] bg-white">
                      <Image
                        src="/Assets/Characters/woman_with_laptop.png"
                        alt="AI Copilot assistance"
                        fill
                        className="object-cover object-top"
                        priority
                      />
                    </div>
                  </div>
                </div>

                {/* Floating Prompt Input inside Hero */}
                <form onSubmit={sendMessage} className="mt-8 relative max-w-2xl">
                  <label htmlFor="hero-planner-message" className="sr-only">
                    Ask anything about your finances
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="hero-planner-message"
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Ask anything about your finances, goals, or loans…"
                      className="w-full rounded-2xl border border-[#E8E1D6] bg-white pl-4 pr-12 py-3.5 text-sm text-[#1A2238] shadow-sm outline-none placeholder:text-[#667085] focus-visible:ring-2 focus-visible:ring-[#5E55C9]"
                      disabled={isWorking}
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim() || isWorking}
                      className="absolute right-2 p-2 rounded-xl bg-[#5E55C9] text-white hover:bg-[#4d45b5] disabled:opacity-40 transition-colors cursor-pointer"
                      aria-label="Send query"
                    >
                      <ArrowRight className="size-4" />
                    </button>
                  </div>

                  {/* Try chips */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[#667085]">
                    <span className="font-medium text-[#1A2238]">Try:</span>
                    {TRY_STARTER_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleStarterPrompt(chip)}
                        disabled={isWorking}
                        className="rounded-full bg-white border border-[#E8E1D6] px-2.5 py-0.5 text-xs text-[#475467] hover:border-[#5E55C9] hover:text-[#5E55C9] transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </form>
              </section>

              {/* Quick Starter Pills Bar (Required test heading) */}
              <div className="p-4 rounded-2xl bg-[#FFFCF8] border border-[#E8E1D6]">
                <h3 className="sr-only">Start with a planning question</h3>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] block mb-2.5">
                  Popular Planning Questions
                </span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_STARTER_PILLS.map((pill) => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => handleStarterPrompt(pill)}
                      disabled={isWorking}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E1D6] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1A2238] shadow-2xs hover:border-[#5E55C9] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    >
                      <Sparkles className="size-3 text-[#5E55C9]" aria-hidden="true" />
                      {pill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screen 02: Suggested Prompts Grid */}
              <section className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-xl font-normal text-[#1A2238]">
                      Not sure where to start?
                    </h3>
                    <p className="text-xs text-[#475467] mt-0.5">
                      Try one of these prompts to get helpful, personalized insights.
                    </p>
                  </div>
                  {/* Decorative botanical leaf in corner */}
                  <div className="relative size-12 hidden sm:block opacity-60">
                    <Image
                      src="/Assets/Botanical/asset_026.png"
                      alt="Botanical illustration"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {suggestedPrompts.map((card) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.category}
                        type="button"
                        onClick={() => handleStarterPrompt(card.prompt)}
                        disabled={isWorking}
                        className="group flex flex-col justify-between rounded-2xl border border-[#E8E1D6] bg-white p-5 text-left transition-all hover:border-[#5E55C9] hover:shadow-xs cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-[#5E55C9]/10 text-[#5E55C9]">
                            <Icon className="size-4" aria-hidden="true" />
                          </span>
                          <ChevronRight className="size-4 text-[#667085] transition-transform group-hover:translate-x-0.5 group-hover:text-[#5E55C9]" />
                        </div>
                        <div className="mt-4">
                          <span className="text-[11px] font-semibold text-[#5E55C9] uppercase tracking-wider block">
                            {card.category}
                          </span>
                          <p className="mt-1 text-sm font-semibold text-[#1A2238]">
                            &quot;{card.prompt}&quot;
                          </p>
                          <p className="mt-1 text-xs text-[#475467] leading-relaxed">
                            {card.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Screen 04: Personalized Recommendations */}
              {proposals.length > 0 && (
                <section className="space-y-3 pt-2">
                  <div>
                    <h3 className="font-serif text-xl font-normal text-[#1A2238]">
                      Personalized for your goals
                    </h3>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Grounded recommendations simulated from your active plan. Changes are never applied without your review.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {proposals.map((proposal) => (
                      <ProposalPreviewCard
                        key={proposal.id}
                        proposal={proposal}
                        onReview={() => setReviewingProposal(proposal)}
                        onDismiss={() => handleDismissProposal(proposal.id)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. ACTIVE CONVERSATION THREAD (Isolated Message Scroll)                   */
            /* ========================================================================= */
            <div className="flex flex-1 flex-col min-h-0 h-full">
              {/* Isolated Message Stream with Custom Scrollbar */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6"
                aria-live="polite"
                aria-busy={isWorking}
              >
                <div className="max-w-3xl mx-auto space-y-6 pb-2">
                  {messages.isLoading ? <Loading /> : null}

                  {messages.data?.map((message) => (
                    <MessageCard
                      key={message.id}
                      message={message}
                      planTag={activePlanTag}
                      asOfSavingsRateText={asOfSavingsRateText}
                    />
                  ))}

                  {localUserMessage ? (
                    <MessageCard
                      message={{
                        id: "pending-user",
                        sender: "user",
                        content: localUserMessage,
                        citations: [],
                      }}
                      planTag={activePlanTag}
                      asOfSavingsRateText={asOfSavingsRateText}
                    />
                  ) : null}

                  {isWorking ? (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#FBF9FE] border border-[#E5E0F8] text-xs text-[#1F2A44] max-w-sm shadow-2xs">
                      <div className="relative size-8 shrink-0 rounded-full border border-[#5E55C9]/20 bg-[#F4F1FD] p-1 overflow-hidden">
                        <Image
                          src="/Assets/Characters/ai_assistant_orb.png"
                          alt="AI Assistant"
                          fill
                          className="object-contain animate-spin"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-[#5E55C9]">Reviewing your financial context…</p>
                        <p className="text-[11px] text-[#667085]">Grounding insights in {activePlanTag}</p>
                      </div>
                    </div>
                  ) : null}

                  <div ref={messageEndRef} />
                </div>
              </div>

              {/* Floating "Scroll to Bottom" Indicator */}
              {showScrollBottomBtn && (
                <button
                  type="button"
                  onClick={() => scrollToBottom("smooth")}
                  className="absolute bottom-32 right-6 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#1F2A44] px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-[#2A3755] active:scale-95 transition-all cursor-pointer"
                  aria-label="Scroll to bottom"
                >
                  <ChevronDown className="size-3.5 text-[#E6B46A]" />
                  <span>Latest messages</span>
                </button>
              )}

              {/* Quick Starter Pills Bar (Compact & Non-Trapping) */}
              <div className="shrink-0 border-t border-[#E8E1D6]/70 bg-[#FAF8F5]/80 px-3 py-1 sm:px-4 relative">
                <div
                  className="max-w-3xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs text-[#475467] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  onWheel={(e) => {
                    // Forward vertical trackpad/wheel gestures to parent message container so scrolling is never trapped
                    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && scrollContainerRef.current) {
                      scrollContainerRef.current.scrollTop += e.deltaY;
                    }
                  }}
                >
                  <span className="shrink-0 font-medium text-[11px] text-[#1A2238] flex items-center gap-1">
                    <Sparkles className="size-3 text-[#5E55C9]" />
                    Try:
                  </span>
                  {QUICK_STARTER_PILLS.map((pill) => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => handleStarterPrompt(pill)}
                      disabled={isWorking}
                      className="shrink-0 rounded-full border border-[#E8E1D6] bg-white px-2.5 py-0.5 text-[11px] text-[#1A2238] hover:border-[#5E55C9] hover:bg-[#5E55C9]/5 hover:text-[#5E55C9] transition-all shadow-2xs disabled:opacity-50 active:scale-95 cursor-pointer"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Permanently Docked Compact Composer Form (rendered in BOTH empty and active states) */}
          <form onSubmit={sendMessage} className="shrink-0 border-t border-[#E8E1D6] bg-white px-3 py-2 sm:px-4">
            <div className="max-w-3xl mx-auto">
              <label htmlFor="planner-message" className="sr-only">
                Ask the AI planner
              </label>
              <div className="relative flex items-center gap-2 rounded-2xl border border-[#E8E1D6] bg-[#FAF8F5] p-1.5 focus-within:border-[#5E55C9] focus-within:ring-2 focus-within:ring-[#5E55C9]/20 transition-all">
                <textarea
                  id="planner-message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage(event);
                    }
                  }}
                  maxLength={4000}
                  rows={1}
                  placeholder="Ask about your plan, goals, loans, or assumptions…"
                  className="flex-1 min-h-[36px] max-h-[120px] resize-none border-0 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-[#1A2238] outline-none placeholder:text-[#98A2B3]"
                  disabled={isWorking}
                />
                <button
                  type="submit"
                  className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-xl bg-[#5E55C9] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#4d45b5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  disabled={!draft.trim() || isWorking}
                >
                  {isWorking ? (
                    <>
                      <Sparkles className="mr-1.5 size-3.5 animate-spin" />
                      <span>Analyzing…</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-1.5 size-3.5" />
                      <span>Send question</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 px-1 mt-1 text-[10px] text-[#667085]">
                <span className="truncate hidden sm:inline">
                  Press <kbd className="px-1 py-0.5 rounded bg-[#FAF8F5] border border-[#E8E1D6] text-[9px] font-medium text-[#1A2238]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-[#FAF8F5] border border-[#E8E1D6] text-[9px] font-medium text-[#1A2238]">Shift + Enter</kbd> for newline
                </span>
                <span className="truncate text-right flex-1 sm:flex-initial">
                  Deterministic assistance · Private & verified
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* Right Grounding Drawer: Financial Context (Slide-Over Drawer) */}
        {isChatActive && showContextSidebar && (
          <>
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/20 z-40 backdrop-blur-xs transition-opacity"
              onClick={() => setShowContextSidebar(false)}
              aria-hidden="true"
            />
            <aside
              className="fixed top-0 right-0 bottom-0 z-50 w-88 max-w-[90vw] bg-[#FFFCF8] border-l border-[#E8E1D6] shadow-2xl flex flex-col justify-between overflow-y-auto custom-scrollbar p-5 transition-transform duration-200 animate-in slide-in-from-right"
              aria-label="Financial context sidebar"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D6]">
                  <div>
                    <h3 className="font-serif text-base font-normal text-[#1A2238]">
                      Your Financial Context
                    </h3>
                    <p className="text-[11px] text-[#667085]">Grounding AI in live data</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#5E55C9]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5E55C9]">
                      {activePlanTag}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowContextSidebar(false)}
                      className="p-1 rounded-lg text-[#667085] hover:bg-[#FAF8F5] cursor-pointer"
                      aria-label="Close context sidebar"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Dynamic Financial Metrics */}
                <div className="space-y-2">
                  {contextMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-xl border border-[#E8E1D6] bg-white p-2.5 text-xs shadow-2xs"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#667085]">
                        {metric.label}
                      </p>
                      <p className="mt-0.5 font-sans font-bold text-sm text-[#1A2238] tabular-nums">
                        {metric.value}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#475467]">{metric.note}</p>
                    </div>
                  ))}
                </div>

                {/* Personalized quick recommendation mini-cards */}
                <div className="pt-2 border-t border-[#E8E1D6]/80">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] block mb-2">
                    Suggested Actions
                  </span>
                  <div className="space-y-2">
                    {proposals.slice(0, 2).map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-[#E8E1D6] bg-white p-2.5 text-xs hover:border-[#5E55C9]/40 transition-colors"
                      >
                        <p className="font-semibold text-[#1A2238]">{p.title}</p>
                        <p className="mt-0.5 text-[10px] text-[#475467] line-clamp-2">{p.summary}</p>
                        <button
                          type="button"
                          onClick={() => setReviewingProposal(p)}
                          className="mt-2 text-[11px] font-semibold text-[#5E55C9] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Review scenario</span>
                          <ChevronRight className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Privacy Lock Banner */}
              <div className="mt-4 rounded-xl border border-[#5E55C9]/20 bg-[#5E55C9]/5 p-3 text-xs text-[#1A2238]">
                <div className="flex items-center gap-1.5 font-semibold text-[#5E55C9]">
                  <Lock className="size-3.5" />
                  <span>Your data stays yours</span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-[#475467]">
                  Used only to provide personalized insights. Your household records are strictly private.
                </p>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Structured Proposal Review Modal (Board 09 Screen 06) */}
      {reviewingProposal && (
        <ProposalReviewModal
          proposal={reviewingProposal}
          onClose={() => setReviewingProposal(null)}
          onConfirm={handleConfirmStage}
        />
      )}
    </div>
  );
}

/**
 * MessageCard component with warm editorial styling matching user_chat_bubble.png
 * and ai_chat_bubble.png with assistant orb avatar.
 */
function MessageCard({
  message,
  planTag = "Plan v2",
  asOfSavingsRateText = "Based on May 2026 savings rate",
}: {
  message: DisplayMessage;
  planTag?: string;
  asOfSavingsRateText?: string;
}) {
  const isUser = message.sender === "user";

  if (isUser) {
    return (
      <article className="ml-auto max-w-[85%] sm:max-w-2xl flex flex-col items-end">
        <div className="mb-1 flex items-center gap-1.5 text-xs text-[#667085]">
          <span className="font-semibold text-[#1A2238]">You</span>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="rounded-2xl rounded-tr-xs border border-[#E8E1D6] bg-[#FFFCF8] px-4 py-3 text-sm text-[#1F2A44] shadow-xs leading-relaxed">
            {message.content}
          </div>
          <div className="size-8 rounded-full bg-[#1F2A44] text-white flex items-center justify-center text-xs font-semibold shrink-0 shadow-2xs mt-0.5">
            You
          </div>
        </div>
      </article>
    );
  }

  // Assistant response card
  return (
    <article className="mr-auto max-w-full sm:max-w-3xl w-full flex items-start gap-3">
      {/* AI Assistant Avatar matching ai_chat_bubble.png */}
      <div className="relative size-10 shrink-0 rounded-full border border-[#5E55C9]/20 bg-[#F4F1FD] p-1 overflow-hidden shadow-2xs mt-1">
        <Image
          src="/Assets/Characters/ai_assistant_orb.png"
          alt="AI planner"
          fill
          className="object-contain p-0.5"
        />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-[#1A2238]">AI planner</p>
          <span className="rounded-full bg-[#5E55C9]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5E55C9] border border-[#5E55C9]/20">
            Deterministic
          </span>
        </div>

        {/* Attributable Source Chips */}
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Attributable sources">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#8FA9D6]/40 bg-[#8FA9D6]/15 px-2.5 py-0.5 text-xs font-medium text-[#1A2238]">
            <Sparkles className="size-3 text-[#5E55C9]" aria-hidden="true" />
            Derived from {planTag}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#8FA9D6]/40 bg-[#8FA9D6]/15 px-2.5 py-0.5 text-xs font-medium text-[#1A2238]">
            {asOfSavingsRateText}
          </span>
          {message.citations.map((citation) => (
            <span
              key={citation.evidenceId}
              className="inline-flex items-center gap-1 rounded-full border border-[#E8E1D6] bg-white px-2.5 py-0.5 text-xs font-medium text-[#5E55C9]"
            >
              <BookOpen className="size-3 text-[#5E55C9]" aria-hidden="true" />
              {citation.publisher}
            </span>
          ))}
        </div>

        {/* Formatted Content Card with Markdown Parsing */}
        <div className="rounded-2xl rounded-tl-xs border border-[#E5E0F8] bg-[#FBF9FE] p-5 text-sm text-[#1F2A44] shadow-2xs leading-relaxed">
          <MarkdownContent content={message.content} />
        </div>

        {/* Research Citations Accordion (Board 09 Screen 05) */}
        {message.citations.length > 0 && (
          <details className="mt-2 rounded-2xl border border-[#EAE5DE] bg-white px-4 py-2 shadow-2xs">
            <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-semibold text-[#1A2238]">
              <BookOpen className="size-4 text-[#5E55C9]" aria-hidden="true" />Sources ({message.citations.length})
            </summary>
            <ul className="space-y-2.5 pb-2 pt-1 text-xs">
              {message.citations.map((citation) => (
                <li key={citation.evidenceId} className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-3">
                  <a
                    className="font-semibold text-[#5E55C9] underline underline-offset-2 flex items-center gap-1"
                    href={citation.canonicalSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{citation.publisher}: {citation.topic}</span>
                    <ExternalLink className="size-3" />
                  </a>
                  <p className="mt-1 text-[#475467]">Supports: {citation.claim}</p>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </article>
  );
}

function getProposalBadgeConfig(badge: string) {
  const lower = badge.toLowerCase();
  if (lower.includes("scenario") || lower.includes("sip")) {
    return {
      icon: TrendingUp,
      className: "bg-[#5E55C9]/10 text-[#5E55C9] border-[#5E55C9]/20",
    };
  }
  if (lower.includes("buffer") || lower.includes("emergency")) {
    return {
      icon: ShieldCheck,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    };
  }
  if (lower.includes("milestone") || lower.includes("goal")) {
    return {
      icon: Target,
      className: "bg-amber-50 text-amber-800 border-amber-200/60",
    };
  }
  return {
    icon: Sparkles,
    className: "bg-[#5E55C9]/10 text-[#5E55C9] border-[#5E55C9]/20",
  };
}

/**
 * ProposalPreviewCard with Review & Apply to Plan and Dismiss actions.
 */
function ProposalPreviewCard({
  proposal,
  onReview,
  onDismiss,
}: {
  proposal: ProposalCardData;
  onReview: () => void;
  onDismiss: () => void;
}) {
  const badgeConfig = getProposalBadgeConfig(proposal.badge);
  const Icon = badgeConfig.icon;
  const primarySource = proposal.sources[0]?.replace(/^Derived from\s+/i, "") || "Active Plan";
  const allSourcesTooltip = proposal.sources.join(" • ");

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-xs transition-all hover:border-[#5E55C9]/40 hover:shadow-sm">
      <div>
        {/* Single-line header: Clean category badge on left, primary plan provenance on right */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${badgeConfig.className}`}
          >
            <Icon className="size-3" />
            <span>{proposal.badge}</span>
          </span>

          <span
            className="rounded-full bg-[#FAF8F5] border border-[#EAE5DE] px-2.5 py-0.5 text-[10px] font-medium text-[#667085] cursor-default"
            title={allSourcesTooltip}
          >
            {primarySource}
          </span>
        </div>

        {/* Title */}
        <h4
          className="mt-3.5 font-serif text-base font-normal text-[#1A2238] tracking-tight leading-snug line-clamp-1"
          title={proposal.title}
        >
          {proposal.title}
        </h4>

        {/* Summary with consistent height for grid alignment */}
        <p className="mt-1.5 text-xs text-[#667085] leading-relaxed line-clamp-2 min-h-[36px]">
          {proposal.summary}
        </p>

        {/* Key Metrics: Streamlined 2-column panel (no redundant beige callout box) */}
        <div
          className="mt-4 rounded-xl bg-[#FAF8F5]/80 border border-[#E8E1D6]/70 p-3"
          title={proposal.impactHighlight}
        >
          <div className="grid grid-cols-2 gap-3 divide-x divide-[#E8E1D6]/60">
            {proposal.metrics.slice(0, 2).map((m, idx) => (
              <div key={m.label} className={idx > 0 ? "pl-3 space-y-1" : "space-y-1"}>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#8C877D] block truncate">
                  {m.label}
                </span>
                <div className="text-sm sm:text-[15px] font-bold text-[#1A2238] tabular-nums leading-tight truncate">
                  {m.proposed}
                </div>
                {m.delta && (
                  <span className="inline-flex items-center text-[10px] font-semibold text-[#1E7E34] bg-[#EBF7EE] px-1.5 py-0.5 rounded leading-tight">
                    {m.delta}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-[#E8E1D6]/70">
        <button
          type="button"
          onClick={onReview}
          className="flex-1 inline-flex min-h-9 items-center justify-center rounded-xl bg-[#1A2238] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2A3755] active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
        >
          Review & Apply to Plan
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex min-h-9 items-center justify-center rounded-xl border border-[#E8E1D6] bg-white px-3 py-1.5 text-xs font-medium text-[#667085] hover:text-[#1A2238] hover:bg-[#FAF8F5] active:scale-[0.98] transition-all cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

/**
 * Interactive Scenario Draft Workbench Modal (Board 09 Screen 06)
 * Features monthly SIP slider and side-by-side projected portfolio growth chart (+51%).
 */
function ProposalReviewModal({
  proposal,
  onClose,
  onConfirm,
}: {
  proposal: ProposalCardData;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const defaultSip = proposal.recommendedSip ?? 15000;
  const [sipAmount, setSipAmount] = useState(defaultSip);
  const [scenarioName, setScenarioName] = useState(proposal.title);
  const [timeHorizon, setTimeHorizon] = useState("20 years");

  const minSip = proposal.sipRange?.min ?? 1000;
  const maxSip = proposal.sipRange?.max ?? 50000;
  const stepSip = proposal.sipRange?.step ?? 500;

  const chartData = proposal.projection?.chartData ?? PROJECTION_DATA_POINTS;
  const proposedTotal = proposal.projection?.proposedTotal ?? "₹ 1,24,00,000";
  const baselineTotal = proposal.projection?.baselineTotal ?? "₹ 82,00,000";
  const percentageDelta = proposal.projection?.percentageDelta ?? "+51%";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="w-full max-w-3xl rounded-3xl border border-[#E8E1D6] bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E8E1D6]">
          <div>
            <span className="inline-block rounded-full bg-[#5E55C9]/15 px-2.5 py-0.5 text-xs font-semibold text-[#5E55C9]">
              {proposal.badge}
            </span>
            <h3 id="proposal-modal-title" className="mt-2 font-serif text-2xl font-normal text-[#1A2238]">
              Try a new scenario
            </h3>
            <p className="text-xs text-[#475467] mt-0.5">
              Make changes and see how it impacts your financial future.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#667085] hover:bg-[#FAF8F5] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Form: Parameters */}
          <div className="space-y-4">
            <div>
              <label htmlFor="scenario-name-input" className="block text-xs font-semibold text-[#1A2238] mb-1">
                Scenario name
              </label>
              <input
                id="scenario-name-input"
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full rounded-xl border border-[#E8E1D6] bg-[#FAF8F5] px-3 py-2 text-sm text-[#1A2238] outline-none focus:ring-2 focus:ring-[#5E55C9]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label htmlFor="sip-slider-input" className="font-semibold text-[#1A2238]">
                  Monthly SIP amount
                </label>
                <span className="font-sans font-bold text-sm text-[#5E55C9]">
                  ₹ {sipAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <input
                id="sip-slider-input"
                type="range"
                min={minSip}
                max={maxSip}
                step={stepSip}
                value={sipAmount}
                onChange={(e) => setSipAmount(Number(e.target.value))}
                className="w-full accent-[#5E55C9] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#667085] mt-0.5">
                <span>₹ {minSip.toLocaleString("en-IN")}</span>
                <span>₹ {maxSip.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div>
              <label htmlFor="time-horizon-select" className="block text-xs font-semibold text-[#1A2238] mb-1">
                Time horizon
              </label>
              <select
                id="time-horizon-select"
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(e.target.value)}
                className="w-full rounded-xl border border-[#E8E1D6] bg-[#FAF8F5] px-3 py-2 text-sm text-[#1A2238] outline-none focus:ring-2 focus:ring-[#5E55C9]"
              >
                <option value="10 years">10 years</option>
                <option value="15 years">15 years</option>
                <option value="20 years">20 years</option>
                <option value="25 years">25 years</option>
              </select>
            </div>

            <div className="rounded-xl border border-[#E8E1D6] bg-[#FAF8F5] p-3 text-xs space-y-1.5">
              <span className="font-semibold text-[#1A2238] block">Attribution & Context:</span>
              <div className="flex flex-wrap gap-1">
                {proposal.sources.map((source) => (
                  <span
                    key={source}
                    className="rounded-md border border-[#8FA9D6]/40 bg-[#8FA9D6]/15 px-2 py-0.5 text-[11px] font-medium text-[#1A2238]"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Preview: Projection Comparison Chart (Board 09 Screen 06) */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-4">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
                    Projected Portfolio Value
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-sans font-bold text-xl text-[#1A2238]">
                      {proposedTotal}
                    </span>
                    <span className="rounded-full bg-[#EDF7EE] px-2 py-0.5 text-xs font-semibold text-[#1E7E34] border border-[#D4EDDA]">
                      {percentageDelta}
                    </span>
                  </div>
                  <span className="text-xs text-[#667085]">vs. {baselineTotal} (current plan)</span>
                </div>
              </div>

              {/* Projection Line Chart */}
              <div className="mt-4 h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E1D6" vertical={false} />
                    <XAxis dataKey="year" stroke="#667085" fontSize={10} tickLine={false} />
                    <YAxis stroke="#667085" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}L`} />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(val: any) => [`₹ ${val ?? 0} Lakhs`, "Value"]}
                      contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "8px", borderColor: "#E8E1D6", fontSize: "11px" }}
                    />
                    <Line type="monotone" dataKey="proposed" name="New Plan" stroke="#5E55C9" strokeWidth={2.5} dot={{ r: 3, fill: "#5E55C9" }} />
                    <Line type="monotone" dataKey="current" name="Current Plan" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#5E55C9]" />
                  <span className="font-medium text-[#1A2238]">New Plan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#94A3B8]" />
                  <span className="font-medium text-[#667085]">Current Plan</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Disclaimer */}
        <div className="mt-5 rounded-xl border border-[#8FA9D6]/40 bg-[#8FA9D6]/10 p-3 text-xs text-[#1A2238]">
          <p className="font-semibold">
            AI provides deterministic decision assistance. It does not provide SEBI-registered investment advice or auto-execute trades.
          </p>
          <p className="mt-0.5 text-[#475467]">
            Staging prepares this scenario in your workspace without modifying your live plan. You retain full control over any final commit.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-[#E8E1D6]">
          <button
            type="button"
            onClick={onClose}
            className={secondary}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={action}
          >
            Confirm & Stage in Scenarios
          </button>
        </div>
      </div>
    </div>
  );
}
