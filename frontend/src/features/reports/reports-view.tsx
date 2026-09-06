"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ChevronRight,
  Download,
  FileText,
  PieChart,
  Receipt,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageTitle, Panel, secondary } from "@/features/planner/ui";

export type ReportMetric = {
  label: string;
  value: string;
  note: string;
};

export type CashFlowItem = {
  category: string;
  amount: string;
  type: "inflow" | "outflow";
  classification: "saved" | "estimated" | "calculated";
};

export type GoalSnapshot = {
  name: string;
  target: string;
  current: string;
  status: string;
  targetDate: string;
  percentage?: number;
};

export type ReportAssumption = {
  label: string;
  value: string;
  nature: "estimated" | "manual" | "unknown";
};

export type NetWorthProjectionPoint = {
  year: number;
  label: string;
  currentPlan: number;
  optimizedPlan: number;
};

export type AssetAllocationItem = {
  category: string;
  currentValue: string;
  allocationPercent: number;
  targetPercent: number;
  riskLevel: "High" | "Moderate" | "Low";
  rebalanceAction: string;
};

export type SampleReport = {
  id: string;
  title: string;
  period: string;
  generatedOn: string;
  version: { id: string; number: number; savedOn: string };
  status: "Ready" | "Current" | "Archived" | "On track";
  summary: string;
  metrics: ReportMetric[];
  cashFlow: CashFlowItem[];
  goals: GoalSnapshot[];
  assumptions: ReportAssumption[];
  recommendations: string[];
  netWorthProjection?: NetWorthProjectionPoint[];
  assetAllocation?: AssetAllocationItem[];
};

export const sampleReports: readonly SampleReport[] = [
  {
    id: "monthly-plan-sep-2026",
    title: "September plan summary",
    period: "September 2026",
    generatedOn: "6 Sep 2026",
    version: { id: "v3.0", number: 3, savedOn: "5 Sep 2026" },
    status: "Current",
    summary: "A stable monthly surplus supports the current emergency-fund and home goals.",
    metrics: [
      { label: "Monthly income", value: "₹1,50,000", note: "Saved planning input" },
      { label: "Planned outflows", value: "₹90,000", note: "Expenses, EMIs and allocations" },
      { label: "Monthly surplus", value: "₹60,000", note: "Before any unplanned activity" },
      { label: "Emergency runway", value: "4 months", note: "From saved reserves" },
    ],
    cashFlow: [
      { category: "Base take-home salary", amount: "₹1,30,000", type: "inflow", classification: "saved" },
      { category: "Consulting / bonus", amount: "₹20,000", type: "inflow", classification: "saved" },
      { category: "Fixed living necessities", amount: "₹45,000", type: "outflow", classification: "saved" },
      { category: "Discretionary lifestyle", amount: "₹20,000", type: "outflow", classification: "saved" },
      { category: "Home loan EMI", amount: "₹15,000", type: "outflow", classification: "saved" },
      { category: "Goal SIP allocations", amount: "₹10,000", type: "outflow", classification: "calculated" },
    ],
    goals: [
      { name: "Emergency Reserve", target: "₹3,60,000", current: "₹2,40,000", status: "On track", targetDate: "March 2027", percentage: 67 },
      { name: "First Home Down Payment", target: "₹25,00,000", current: "₹6,50,000", status: "On track", targetDate: "December 2029", percentage: 26 },
      { name: "Child Education Fund", target: "₹40,00,000", current: "₹8,00,000", status: "On track", targetDate: "June 2035", percentage: 20 },
      { name: "Retirement Freedom Corpus", target: "₹2,50,00,000", current: "₹35,00,000", status: "On track", targetDate: "October 2046", percentage: 14 },
    ],
    assumptions: [
      { label: "General annual inflation", value: "6.0% p.a.", nature: "estimated" },
      { label: "Equity portfolio return", value: "12.0% p.a.", nature: "estimated" },
      { label: "Fixed deposit / liquid return", value: "6.5% p.a.", nature: "estimated" },
      { label: "Planned retirement age", value: "60 years", nature: "manual" },
      { label: "Tax optimization deductions", value: "Not provided", nature: "unknown" },
    ],
    recommendations: [
      "Maintain the ₹10,000 monthly SIP allocation to reach your 6-month runway milestone by March 2027.",
      "Review discretionary expenses if floating home loan interest rates rise by more than 0.5%.",
      "Accelerate equity SIP allocations during bonus cycles to close the home down payment buffer sooner.",
    ],
    netWorthProjection: [
      { year: 2024, label: "2024", currentPlan: 1250000, optimizedPlan: 1250000 },
      { year: 2028, label: "2028", currentPlan: 2400000, optimizedPlan: 2840000 },
      { year: 2032, label: "2032", currentPlan: 4100000, optimizedPlan: 5200000 },
      { year: 2036, label: "2036", currentPlan: 6500000, optimizedPlan: 8650000 },
      { year: 2040, label: "2040", currentPlan: 9800000, optimizedPlan: 13500000 },
      { year: 2044, label: "2044", currentPlan: 14200000, optimizedPlan: 21000000 },
    ],
    assetAllocation: [
      { category: "Equity & Mutual Funds", currentValue: "₹13,20,000", allocationPercent: 55, targetPercent: 50, riskLevel: "High", rebalanceAction: "Direct ₹10k monthly surplus to Debt" },
      { category: "Debt & Fixed Income (EPF/PPF)", currentValue: "₹6,00,000", allocationPercent: 25, targetPercent: 30, riskLevel: "Low", rebalanceAction: "Step up voluntary EPF contributions" },
      { category: "Cash & Emergency Liquid Reserves", currentValue: "₹3,60,000", allocationPercent: 15, targetPercent: 15, riskLevel: "Low", rebalanceAction: "Optimal 4-month liquidity cushion" },
      { category: "Gold & Sovereign Gold Bonds (SGB)", currentValue: "₹1,20,000", allocationPercent: 5, targetPercent: 5, riskLevel: "Moderate", rebalanceAction: "Hold planned gold tranche allocations" },
    ],
  },
  {
    id: "quarterly-check-in-jun-2026",
    title: "Quarterly plan check-in",
    period: "April–June 2026",
    generatedOn: "1 Jul 2026",
    version: { id: "v2.0", number: 2, savedOn: "30 Jun 2026" },
    status: "Archived",
    summary: "Goal contributions increased while the plan retained a positive monthly buffer.",
    metrics: [
      { label: "Monthly income", value: "₹1,42,000", note: "Saved planning input" },
      { label: "Planned outflows", value: "₹88,000", note: "Expenses, EMIs and allocations" },
      { label: "Monthly surplus", value: "₹54,000", note: "Before any unplanned activity" },
      { label: "Emergency runway", value: "3.6 months", note: "From saved reserves" },
    ],
    cashFlow: [
      { category: "Base take-home pay", amount: "₹1,25,000", type: "inflow", classification: "saved" },
      { category: "Variable bonus payout", amount: "₹17,000", type: "inflow", classification: "saved" },
      { category: "Fixed living necessities", amount: "₹44,000", type: "outflow", classification: "saved" },
      { category: "Discretionary lifestyle", amount: "₹21,000", type: "outflow", classification: "saved" },
      { category: "Home loan EMI", amount: "₹15,000", type: "outflow", classification: "saved" },
      { category: "Goal SIP allocations", amount: "₹8,000", type: "outflow", classification: "calculated" },
    ],
    goals: [
      { name: "Emergency Reserve", target: "₹3,60,000", current: "₹2,00,000", status: "On track", targetDate: "May 2027", percentage: 56 },
      { name: "First Home Down Payment", target: "₹25,00,000", current: "₹5,20,000", status: "On track", targetDate: "December 2029", percentage: 21 },
    ],
    assumptions: [
      { label: "General annual inflation", value: "6.0% p.a.", nature: "estimated" },
      { label: "Equity portfolio return", value: "12.0% p.a.", nature: "estimated" },
      { label: "Planned retirement age", value: "60 years", nature: "manual" },
      { label: "Employer bonus expectation", value: "Not provided", nature: "unknown" },
    ],
    recommendations: [
      "Surplus was reallocated toward emergency reserve, improving runway from 3.0 to 3.6 months.",
      "Consider stepping up home down payment SIP once emergency runway reaches 4 months.",
    ],
    netWorthProjection: [
      { year: 2024, label: "2024", currentPlan: 1100000, optimizedPlan: 1100000 },
      { year: 2028, label: "2028", currentPlan: 2100000, optimizedPlan: 2500000 },
      { year: 2032, label: "2032", currentPlan: 3600000, optimizedPlan: 4500000 },
      { year: 2036, label: "2036", currentPlan: 5700000, optimizedPlan: 7400000 },
    ],
    assetAllocation: [
      { category: "Equity & Mutual Funds", currentValue: "₹10,50,000", allocationPercent: 52, targetPercent: 50, riskLevel: "High", rebalanceAction: "Normal market accumulation" },
      { category: "Debt & Fixed Income", currentValue: "₹5,20,000", allocationPercent: 26, targetPercent: 30, riskLevel: "Low", rebalanceAction: "Steady EPF deduction" },
      { category: "Cash Reserves", currentValue: "₹3,00,000", allocationPercent: 15, targetPercent: 15, riskLevel: "Low", rebalanceAction: "Optimal 3.6-month liquidity" },
      { category: "Gold & SGB", currentValue: "₹1,40,000", allocationPercent: 7, targetPercent: 5, riskLevel: "Moderate", rebalanceAction: "Slight overweight on gold" },
    ],
  },
] as const;


export const BOARD09_TABS = [
  { id: "reports", label: "Reports", icon: FileText },
  { id: "net-worth", label: "Net Worth", icon: TrendingUp },
  { id: "goals", label: "Goals", icon: Target },
  { id: "cash-flow", label: "Cash Flow", icon: ArrowDownUp },
  { id: "investments", label: "Investments", icon: PieChart },
  { id: "tax", label: "Tax Summary", icon: Receipt },
] as const;

export function NetWorthProjectionCurve({
  points,
}: {
  points?: readonly NetWorthProjectionPoint[];
}) {
  const defaultPoints: NetWorthProjectionPoint[] = [
    { year: 2024, label: "2024", currentPlan: 1250000, optimizedPlan: 1250000 },
    { year: 2028, label: "2028", currentPlan: 2400000, optimizedPlan: 2840000 },
    { year: 2032, label: "2032", currentPlan: 4100000, optimizedPlan: 5200000 },
    { year: 2036, label: "2036", currentPlan: 6500000, optimizedPlan: 8650000 },
    { year: 2040, label: "2040", currentPlan: 9800000, optimizedPlan: 13500000 },
    { year: 2044, label: "2044", currentPlan: 14200000, optimizedPlan: 21000000 },
  ];

  const data = points && points.length > 0 ? points : defaultPoints;

  const paddingLeft = 58;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 36;
  const chartWidth = 560 - paddingLeft - paddingRight;
  const chartHeight = 220 - paddingTop - paddingBottom;
  const maxVal = 25000000;

  function getX(index: number) {
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  }

  function getY(val: number) {
    return paddingTop + chartHeight - (val / maxVal) * chartHeight;
  }

  const currentPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.currentPlan)}`)
    .join(" ");

  const optimizedPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.optimizedPlan)}`)
    .join(" ");

  const areaPath = `${optimizedPath} L ${getX(data.length - 1)} ${paddingTop + chartHeight} L ${getX(0)} ${paddingTop + chartHeight} Z`;

  return (
    <div className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-4 sm:p-5" aria-label="Net Worth projection curve">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-[#1F2A44]">Net Worth Projection Curve</h3>
          <p className="text-xs text-[#475467]">20-year long-term wealth trajectory under current vs optimized plan</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-full bg-[#5E55C9]" />
            <span className="font-medium text-[#1F2A44]">Optimized Plan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 border-t-2 border-dashed border-[#98A2B3]" />
            <span className="text-[#475467]">Current Baseline</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 560 220"
          className="w-full h-52 min-w-[380px]"
          role="img"
          aria-label="Net Worth projection chart"
        >
          <defs>
            <linearGradient id="optGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5E55C9" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#5E55C9" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {[0, 5000000, 10000000, 15000000, 20000000, 25000000].map((tick) => {
            const y = getY(tick);
            const label = tick === 0 ? "₹0" : tick >= 10000000 ? `₹${tick / 10000000}Cr` : `₹${tick / 100000}L`;
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartWidth}
                  y2={y}
                  stroke="#E8E1D6"
                  strokeDasharray={tick === 0 ? undefined : "3 3"}
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#475467"
                  className="font-mono"
                >
                  {label}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#optGradient)" />
          <path d={currentPath} fill="none" stroke="#98A2B3" strokeWidth="2" strokeDasharray="5 5" />
          <path d={optimizedPath} fill="none" stroke="#5E55C9" strokeWidth="3" strokeLinecap="round" />

          {data.map((d, i) => {
            const x = getX(i);
            const yOpt = getY(d.optimizedPlan);
            const yCur = getY(d.currentPlan);
            return (
              <g key={d.year}>
                <text
                  x={x}
                  y={paddingTop + chartHeight + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#475467"
                  fontWeight="500"
                >
                  {d.label}
                </text>
                <circle cx={x} cy={yOpt} r="4" fill="#5E55C9" stroke="#FFFCF8" strokeWidth="2" />
                <circle cx={x} cy={yCur} r="3" fill="#98A2B3" stroke="#FFFCF8" strokeWidth="1.5" />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E8E1D6] pt-3 text-xs text-[#475467]">
        <span>Current baseline: ₹1.42 Cr by 2044</span>
        <span className="font-semibold text-[#5E55C9]">
          Optimized plan: ₹2.10 Cr by 2044 (+₹68 Lakhs / +48% surplus compounding)
        </span>
      </div>
    </div>
  );
}

export function AssetAllocationTable({
  items,
}: {
  items?: readonly AssetAllocationItem[];
}) {
  const defaultAllocation: AssetAllocationItem[] = [
    { category: "Equity & Mutual Funds", currentValue: "₹13,20,000", allocationPercent: 55, targetPercent: 50, riskLevel: "High", rebalanceAction: "Direct ₹10k monthly surplus to Debt" },
    { category: "Debt & Fixed Income (EPF/PPF)", currentValue: "₹6,00,000", allocationPercent: 25, targetPercent: 30, riskLevel: "Low", rebalanceAction: "Step up voluntary EPF contributions" },
    { category: "Cash & Emergency Liquid Reserves", currentValue: "₹3,60,000", allocationPercent: 15, targetPercent: 15, riskLevel: "Low", rebalanceAction: "Optimal 4-month liquidity cushion" },
    { category: "Gold & Sovereign Gold Bonds (SGB)", currentValue: "₹1,20,000", allocationPercent: 5, targetPercent: 5, riskLevel: "Moderate", rebalanceAction: "Hold planned gold tranche allocations" },
  ];

  const data = items && items.length > 0 ? items : defaultAllocation;

  return (
    <div className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-4 sm:p-5" aria-label="Asset Allocation section">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-[#1F2A44]">Asset Allocation</h3>
          <p className="text-xs text-[#475467]">Current distribution vs targeted portfolio risk balance</p>
        </div>
        <Badge tone="purple" size="sm">Moderate Risk Profile</Badge>
      </div>

      <div className="mb-4">
        <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-[#E8E1D6]">
          <div style={{ width: "55%" }} className="bg-[#3B5B8C]" title="Equity 55%" />
          <div style={{ width: "25%" }} className="bg-[#5E55C9]" title="Debt 25%" />
          <div style={{ width: "15%" }} className="bg-[#3D5C4A]" title="Cash 15%" />
          <div style={{ width: "5%" }} className="bg-[#7D5200]" title="Gold 5%" />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#475467]">
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#3B5B8C]" />Equity (55%)</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#5E55C9]" />Debt (25%)</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#3D5C4A]" />Cash (15%)</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#7D5200]" />Gold (5%)</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" aria-label="Asset allocation table">
          <thead>
            <tr className="border-b border-[#E8E1D6] text-xs font-semibold uppercase tracking-wider text-[#475467]">
              <th scope="col" className="pb-3 pr-4">Asset Class</th>
              <th scope="col" className="pb-3 pr-4 text-right">Current Value</th>
              <th scope="col" className="pb-3 pr-4 text-right">Current %</th>
              <th scope="col" className="pb-3 pr-4 text-right">Target %</th>
              <th scope="col" className="pb-3 pr-4 text-right">Variance</th>
              <th scope="col" className="pb-3">Rebalance Guidance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E1D6]">
            {data.map((row) => {
              const variance = row.allocationPercent - row.targetPercent;
              return (
                <tr key={row.category} className="hover:bg-[#FFF9F0]/50">
                  <td className="py-3 pr-4 font-medium text-[#1F2A44]">{row.category}</td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums text-[#1F2A44]">{row.currentValue}</td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums font-semibold text-[#1F2A44]">{row.allocationPercent}%</td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums text-[#475467]">{row.targetPercent}%</td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums text-xs">
                    <span className={variance > 0 ? "text-[#3B5B8C] font-semibold" : variance < 0 ? "text-[#7D5200] font-semibold" : "text-[#3D5C4A]"}>
                      {variance > 0 ? `+${variance}%` : variance < 0 ? `${variance}%` : "0%"}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-[#475467]">{row.rebalanceAction}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GoalMilestonesBreakdown({
  goals,
}: {
  goals?: readonly GoalSnapshot[];
}) {
  const defaultGoals: GoalSnapshot[] = [
    { name: "Emergency Reserve", target: "₹3,60,000", current: "₹2,40,000", status: "On track", targetDate: "March 2027", percentage: 67 },
    { name: "First Home Down Payment", target: "₹25,00,000", current: "₹6,50,000", status: "On track", targetDate: "December 2029", percentage: 26 },
    { name: "Child Education Fund", target: "₹40,00,000", current: "₹8,00,000", status: "On track", targetDate: "June 2035", percentage: 20 },
    { name: "Retirement Freedom Corpus", target: "₹2,50,00,000", current: "₹35,00,000", status: "On track", targetDate: "October 2046", percentage: 14 },
  ];

  const data = goals && goals.length > 0 ? goals : defaultGoals;

  return (
    <div className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-4 sm:p-5" aria-label="Goal Milestones section">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-[#1F2A44]">Goal Milestones Breakdown</h3>
          <p className="text-xs text-[#475467]">Funded progress, milestone dates, and SIP allocation health</p>
        </div>
        <Badge tone="sage" size="sm">4 Active Milestones</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((goal) => {
          const pct = goal.percentage ?? 50;
          return (
            <div key={goal.name} className="rounded-xl border border-[#E8E1D6] bg-[#FFF9F0]/60 p-4 transition-all hover:border-[#5E55C9]/40">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm text-[#1F2A44]">{goal.name}</h4>
                <Badge tone="sage" size="sm">{goal.status}</Badge>
              </div>

              <div className="mt-3 flex items-baseline justify-between text-xs">
                <span className="text-[#475467]">Current: <strong className="font-mono text-[#1F2A44]">{goal.current}</strong></span>
                <span className="text-[#475467]">Target: <strong className="font-mono text-[#1F2A44]">{goal.target}</strong></span>
              </div>

              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E8E1D6]">
                <div
                  className="h-full rounded-full bg-[#5E55C9] transition-all"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-[#475467]">
                <span>{pct}% funded</span>
                <span>Target ETA: <strong className="text-[#1F2A44]">{goal.targetDate}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DocumentPreviewCard({
  report,
  onDownloadPdf,
}: {
  report: SampleReport;
  onDownloadPdf: () => void;
}) {
  return (
    <section
      aria-label="Document summary card and blueprint preview"
      className="mb-8 rounded-2xl border-2 border-[#5E55C9]/30 bg-[#FFFCF8] p-5 sm:p-6 shadow-xs print:border-gray-300"
    >
      <div className="mb-6 flex flex-col md:flex-row items-center gap-4 rounded-xl border border-[#E8E1D6] bg-[#FFF9F0] p-4">
        <div className="relative h-28 w-full md:w-72 shrink-0 overflow-hidden rounded-lg bg-white/70 p-2 shadow-2xs">
          <Image
            src="/Assets/Cards/document_summary_card.png"
            alt="Document summary card"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 320px"
            priority
          />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5E55C9]">
              Executive Document Preview
            </span>
            <Badge tone="purple" size="sm">Plan Version {report.version.number}</Badge>
            <Badge tone="sage" size="sm">{report.status}</Badge>
          </div>
          <h2 className="mt-1 text-xl font-serif font-bold text-[#1F2A44]">
            {report.title} — Executive Blueprint
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#475467] leading-relaxed">
            {report.summary} Bound to immutable plan snapshot {report.version.id} generated on {report.generatedOn}.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 print:hidden">
            <button
              type="button"
              onClick={onDownloadPdf}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#5E55C9] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#4F46E5] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]"
              aria-label="Download PDF Report"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Download PDF Report</span>
            </button>
            <span className="text-xs text-[#475467]">
              Print-friendly PDF formatting included
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <NetWorthProjectionCurve points={report.netWorthProjection} />
        <AssetAllocationTable items={report.assetAllocation} />
        <GoalMilestonesBreakdown goals={report.goals} />
      </div>
    </section>
  );
}

export function Board09QuickReports({
  onSelectTab,
}: {
  onSelectTab: (tab: string) => void;
}) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      <div className="flex flex-col justify-between rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#3B5B8C]/10 text-[#3B5B8C] mb-3">
            <FileText className="size-5" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#1F2A44]">Financial Health Report</h3>
          <p className="mt-1 text-xs text-[#475467]">Overall summary of your finances.</p>
        </div>
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#E8E1D6]">
          <span className="text-[11px] text-[#475467]">Last updated 12 Mar 2024</span>
          <Link
            href="/dashboard/reports/monthly-plan-sep-2026"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3B5B8C] hover:underline"
          >
            View <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#5E55C9]/10 text-[#5E55C9] mb-3">
            <Target className="size-5" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#1F2A44]">Goal Progress Report</h3>
          <p className="mt-1 text-xs text-[#475467]">Progress towards your financial goals.</p>
        </div>
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#E8E1D6]">
          <span className="text-[11px] text-[#475467]">Last updated 12 Mar 2024</span>
          <button
            type="button"
            onClick={() => onSelectTab("goals")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#5E55C9] hover:underline"
          >
            View <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#7D5200]/10 text-[#7D5200] mb-3">
            <Receipt className="size-5" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#1F2A44]">Tax Planning Report</h3>
          <p className="mt-1 text-xs text-[#475467]">Deductions, savings and tax optimization ideas.</p>
        </div>
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#E8E1D6]">
          <span className="text-[11px] text-[#475467]">Last updated 12 Mar 2024</span>
          <button
            type="button"
            onClick={() => onSelectTab("tax")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#7D5200] hover:underline"
          >
            View <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Reports() {
  const [reportsList, setReportsList] = useState<SampleReport[]>(() => [...sampleReports]);
  const [selectedVersion, setSelectedVersion] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("reports");
  const [generationToast, setGenerationToast] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const versions = useMemo(() => {
    const set = new Set(sampleReports.map((r) => r.version.number.toString()));
    return ["all", ...Array.from(set)];
  }, []);

  const visibleReports = useMemo(() => {
    return reportsList.filter((r) => {
      if (selectedVersion === "all") return true;
      return r.version.number.toString() === selectedVersion;
    });
  }, [reportsList, selectedVersion]);

  function restoreReports() {
    setReportsList([...sampleReports]);
    setSelectedVersion("all");
  }

  function handleGenerateNewReport() {
    const nextVer = reportsList.length + 2;
    const newReport: SampleReport = {
      id: `custom-annual-report-${Date.now()}`,
      title: `Executive Annual Strategy (v${nextVer})`,
      period: "Calendar 2026",
      generatedOn: "6 Sep 2026",
      version: { id: `v${nextVer}.0`, number: nextVer, savedOn: "6 Sep 2026" },
      status: "Ready",
      summary: "Comprehensive executive blueprint reflecting enhanced monthly surplus and milestone trajectories.",
      metrics: [
        { label: "Monthly income", value: "₹1,55,000", note: "Saved planning input" },
        { label: "Planned outflows", value: "₹90,000", note: "Expenses & allocations" },
        { label: "Monthly surplus", value: "₹65,000", note: "Before discretionary investments" },
        { label: "Emergency runway", value: "4.8 months", note: "Liquid reserves" },
      ],
      cashFlow: [
        { category: "Base compensation", amount: "₹1,35,000", type: "inflow", classification: "saved" },
        { category: "Incentive / advisory", amount: "₹20,000", type: "inflow", classification: "saved" },
        { category: "Fixed essentials", amount: "₹45,000", type: "outflow", classification: "saved" },
        { category: "Discretionary spend", amount: "₹20,000", type: "outflow", classification: "saved" },
        { category: "Home loan EMI", amount: "₹15,000", type: "outflow", classification: "saved" },
        { category: "Goal SIP allocations", amount: "₹10,000", type: "outflow", classification: "calculated" },
      ],
      goals: [
        { name: "Emergency Reserve", target: "₹3,60,000", current: "₹2,70,000", status: "On track", targetDate: "Jan 2027", percentage: 75 },
        { name: "First Home Down Payment", target: "₹25,00,000", current: "₹7,20,000", status: "On track", targetDate: "Nov 2029", percentage: 29 },
      ],
      assumptions: [
        { label: "General annual inflation", value: "6.0% p.a.", nature: "estimated" },
        { label: "Equity portfolio return", value: "12.0% p.a.", nature: "estimated" },
        { label: "Fixed deposit / liquid return", value: "6.5% p.a.", nature: "estimated" },
        { label: "Planned retirement age", value: "60 years", nature: "manual" },
      ],
      recommendations: [
        "Maintain current surplus allocations to reach target reserves ahead of schedule.",
      ],
      netWorthProjection: [
        { year: 2024, label: "2024", currentPlan: 1300000, optimizedPlan: 1300000 },
        { year: 2028, label: "2028", currentPlan: 2600000, optimizedPlan: 3100000 },
        { year: 2032, label: "2032", currentPlan: 4500000, optimizedPlan: 5800000 },
      ],
    };
    setReportsList([newReport, ...reportsList]);
    setGenerationToast(`Generated new report snapshot for Plan version ${nextVer}.`);
  }

  function handleDownloadPdf(report?: SampleReport) {
    const target = report ?? visibleReports[0] ?? sampleReports[0];
    setExportNotice(
      `Preparing print-friendly PDF report for Plan version ${target.version.number} (${target.version.id}). Use browser Print dialog to save as PDF.`
    );
    if (typeof window !== "undefined" && typeof window.print === "function") {
      try {
        window.print();
      } catch {
        // Fallback gracefully in test/headless environments
      }
    }
  }

  const activeFeaturedReport = visibleReports[0] ?? sampleReports[0];

  return (
    <>
      <div className="print:hidden">
        <PageTitle
          title="Reports"
          description="Get a clear view of your progress. Export and share anytime."
        >
          <button
            type="button"
            onClick={handleGenerateNewReport}
            className="inline-flex items-center gap-2 rounded-xl bg-[#5E55C9] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#4F46E5] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Generate New Report</span>
          </button>
        </PageTitle>

        {generationToast && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 flex items-center justify-between rounded-xl border border-[#3D5C4A]/40 bg-[#3D5C4A]/10 p-4 text-sm font-medium text-[#3D5C4A]"
          >
            <span>{generationToast}</span>
            <button
              type="button"
              onClick={() => setGenerationToast(null)}
              className="text-xs font-semibold uppercase tracking-wider text-[#3D5C4A] hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {exportNotice && (
          <p
            role="status"
            aria-live="polite"
            className="mb-6 rounded-xl bg-[#FFF9F0] border border-[#E6B46A]/60 p-3 text-sm font-semibold text-[#8A531D]"
          >
            {exportNotice}
          </p>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-serif text-[#1F2A44]">Your Financial Reports</h2>
            <p className="text-sm text-[#475467]">
              Get a clear view of your progress. Export and share anytime.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="purple" size="sm">v3 Latest</Badge>
            <span className="text-xs text-[#475467]">Updated 6 Sep 2026</span>
          </div>
        </div>

        <nav
          aria-label="Reports sub-navigation"
          className="mb-6 flex flex-wrap gap-1.5 border-b border-[#E8E1D6] pb-3"
        >
          {BOARD09_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9] ${
                  isActive
                    ? "bg-[#1F2A44] text-white shadow-xs"
                    : "text-[#475467] hover:bg-[#FFF9F0] hover:text-[#1F2A44]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "reports" && (
        <>
          <div className="print:hidden">
            <Board09QuickReports onSelectTab={setActiveTab} />
          </div>

          {activeFeaturedReport && (
            <DocumentPreviewCard
              report={activeFeaturedReport}
              onDownloadPdf={() => handleDownloadPdf(activeFeaturedReport)}
            />
          )}

          <section aria-labelledby="archive-heading" className="mt-8 print:hidden">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="archive-heading" className="text-2xl font-serif text-[#1F2A44]">
                  Saved Reports Archive
                </h2>
                <p className="text-xs text-[#475467]">
                  Historical plan versions, immutable snapshots, and generated archive summaries.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="version-filter" className="text-sm font-semibold text-[#344054]">
                    Plan version:
                  </label>
                  <select
                    id="version-filter"
                    value={selectedVersion}
                    onChange={(e) => setSelectedVersion(e.target.value)}
                    className="min-h-11 rounded-lg border border-[#E8E1D6] bg-[#FFFCF8] px-3 py-1.5 text-sm text-[#1F2A44] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]"
                  >
                    <option value="all">All versions ({reportsList.length})</option>
                    {versions.filter((v) => v !== "all").map((v) => (
                      <option key={v} value={v}>Version {v}</option>
                    ))}
                  </select>
                </div>
                {reportsList.length > 0 && (
                  <button
                    type="button"
                    className="min-h-11 self-start sm:self-auto text-sm font-semibold text-[#475467] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]"
                    onClick={() => setReportsList([])}
                  >
                    Clear report list
                  </button>
                )}
              </div>
            </div>

            {visibleReports.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {visibleReports.map((report) => (
                  <Panel key={report.id} title={report.title}>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#475467]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>{report.period}</span>
                        <span aria-hidden="true">·</span>
                        <span>Previewed {report.generatedOn}</span>
                        <span aria-hidden="true">·</span>
                        <span>Generation timestamp: <strong className="font-semibold text-[#1F2A44]">{report.generatedOn}</strong></span>
                      </div>
                      <Badge tone={report.status === "Current" ? "sage" : "neutral"} size="sm">
                        {report.status}
                      </Badge>
                    </div>
                    <div className="mt-4 rounded-xl border border-[#E8E1D6] bg-[#FFF9F0] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#475467]">Saved Plan Snapshot</p>
                      <p className="mt-1 font-semibold text-[#1F2A44]">
                        Snapshot version: <span className="font-bold">Plan version {report.version.number}</span>
                      </p>
                      <p className="text-xs text-[#475467]">{report.version.id} · saved {report.version.savedOn}</p>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-[#475467]">{report.summary}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Link
                        className={`${secondary} w-full sm:w-auto`}
                        href={`/dashboard/reports/${report.id}`}
                        aria-label={`Open report for ${report.title}`}
                      >
                        Open report
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(report)}
                        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[10px] border border-[#E8E1D6] bg-[#FFFCF8] px-3 py-2 text-xs font-semibold text-[#1F2A44] hover:bg-[#FFF9F0] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]"
                        aria-label={`Download PDF Report for ${report.title}`}
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Download PDF Report</span>
                      </button>
                    </div>
                  </Panel>
                ))}
              </div>
            ) : (
              <section
                className="rounded-2xl border border-dashed border-[#B8AFE8] bg-[#FFFCF8] px-5 py-10 text-center"
                aria-labelledby="empty-reports-title"
              >
                <h2 id="empty-reports-title" className="text-2xl font-serif text-[#1F2A44]">
                  {reportsList.length === 0 ? "No report previews available" : "No reports for selected version"}
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-[#475467]">
                  {reportsList.length === 0
                    ? "All saved reports have been cleared. Restore default reports to continue previewing plan summaries."
                    : "Choose 'All versions' or restore the full list to view reports."}
                </p>
                <div className="mt-5 flex justify-center">
                  {reportsList.length === 0 ? (
                    <button type="button" className={secondary} onClick={restoreReports}>
                      Restore default reports
                    </button>
                  ) : (
                    <button type="button" className={secondary} onClick={() => setSelectedVersion("all")}>
                      Show all versions
                    </button>
                  )}
                </div>
              </section>
            )}
          </section>
        </>
      )}

      {activeTab === "net-worth" && (
        <section aria-label="Net Worth detailed report" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif text-[#1F2A44]">Net Worth Report</h2>
            <button
              type="button"
              onClick={() => handleDownloadPdf()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#5E55C9] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#4F46E5]"
              aria-label="Download PDF Report"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF Report</span>
            </button>
          </div>
          <NetWorthProjectionCurve points={activeFeaturedReport.netWorthProjection} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-4">
              <p className="text-xs font-semibold uppercase text-[#475467]">Current Total Assets</p>
              <p className="text-2xl font-bold font-mono text-[#1F2A44] mt-1">₹24,00,000</p>
              <p className="text-xs text-[#3D5C4A] mt-1">+12% annual expansion</p>
            </div>
            <div className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-4">
              <p className="text-xs font-semibold uppercase text-[#475467]">Current Liabilities</p>
              <p className="text-2xl font-bold font-mono text-[#1F2A44] mt-1">₹11,50,000</p>
              <p className="text-xs text-[#475467] mt-1">Home loan balance remaining</p>
            </div>
            <div className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-4">
              <p className="text-xs font-semibold uppercase text-[#475467]">Calculated Net Worth</p>
              <p className="text-2xl font-bold font-mono text-[#5E55C9] mt-1">₹12,50,000</p>
              <p className="text-xs text-[#3D5C4A] mt-1">Solid foundation for acceleration</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === "goals" && (
        <section aria-label="Goal Progress detailed report" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif text-[#1F2A44]">Goal Progress Report</h2>
            <button
              type="button"
              onClick={() => handleDownloadPdf()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#5E55C9] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#4F46E5]"
              aria-label="Download PDF Report"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF Report</span>
            </button>
          </div>
          <GoalMilestonesBreakdown goals={activeFeaturedReport.goals} />
        </section>
      )}

      {activeTab === "cash-flow" && (
        <section aria-label="Cash Flow detailed report" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif text-[#1F2A44]">Cash Flow Allocation Report</h2>
            <button
              type="button"
              onClick={() => handleDownloadPdf()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#5E55C9] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#4F46E5]"
              aria-label="Download PDF Report"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF Report</span>
            </button>
          </div>
          <Panel title="Monthly cash flow allocation">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" aria-label="Cash flow allocation table">
                <thead>
                  <tr className="border-b border-[#E8E1D6] text-xs font-semibold uppercase tracking-wider text-[#475467]">
                    <th scope="col" className="pb-3 pr-4">Category</th>
                    <th scope="col" className="pb-3 pr-4">Type</th>
                    <th scope="col" className="pb-3 pr-4 text-right">Amount</th>
                    <th scope="col" className="pb-3 text-right">Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E1D6]">
                  {activeFeaturedReport.cashFlow.map((row) => (
                    <tr key={row.category} className="hover:bg-[#FFF9F0]/50">
                      <td className="py-3 pr-4 font-medium text-[#1F2A44]">{row.category}</td>
                      <td className="py-3 pr-4 text-xs text-[#475467]">
                        <span className={`capitalize ${row.type === "inflow" ? "font-semibold text-[#3D5C4A]" : "text-[#344054]"}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums text-[#1F2A44]">{row.amount}</td>
                      <td className="py-3 text-right text-xs">
                        <Badge tone={row.classification === "calculated" ? "blue" : "neutral"} size="sm">
                          {row.classification === "calculated" ? "Calculated" : "Saved input"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>
      )}

      {activeTab === "investments" && (
        <section aria-label="Investments detailed report" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif text-[#1F2A44]">Investment Portfolio Report</h2>
            <button
              type="button"
              onClick={() => handleDownloadPdf()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#5E55C9] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#4F46E5]"
              aria-label="Download PDF Report"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF Report</span>
            </button>
          </div>
          <AssetAllocationTable items={activeFeaturedReport.assetAllocation} />
        </section>
      )}

      {activeTab === "tax" && (
        <section aria-label="Tax Summary detailed report" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif text-[#1F2A44]">Tax Planning & Deductions Report</h2>
            <button
              type="button"
              onClick={() => handleDownloadPdf()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#5E55C9] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#4F46E5]"
              aria-label="Download PDF Report"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF Report</span>
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-4">
              <p className="text-xs font-semibold uppercase text-[#475467]">Section 80C Deductions</p>
              <p className="text-2xl font-bold font-mono text-[#1F2A44] mt-1">₹1,50,000</p>
              <p className="text-xs text-[#3D5C4A] mt-1">Fully utilized (EPF + ELSS)</p>
            </div>
            <div className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-4">
              <p className="text-xs font-semibold uppercase text-[#475467]">Section 80D Health</p>
              <p className="text-2xl font-bold font-mono text-[#1F2A44] mt-1">₹25,000</p>
              <p className="text-xs text-[#475467] mt-1">Family health insurance</p>
            </div>
            <div className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-4">
              <p className="text-xs font-semibold uppercase text-[#475467]">Estimated Tax Savings</p>
              <p className="text-2xl font-bold font-mono text-[#5E55C9] mt-1">₹54,600</p>
              <p className="text-xs text-[#3D5C4A] mt-1">Old vs New regime optimized</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export function ReportDetail({ id }: { id: string }) {
  const report = sampleReports.find((item) => item.id === id);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [simulatedError, setSimulatedError] = useState<string | null>(null);

  if (!report) {
    return (
      <>
        <PageTitle title="Report not found" description="This report could not be found." />
        <Link className={secondary} href="/dashboard/reports">Back to reports</Link>
      </>
    );
  }

  function handleExport(format: "summary" | "csv") {
    setSimulatedError(null);
    const formatLabel = format === "csv" ? "CSV figures" : "summary";
    setExportMessage(
      `Preparing report export for Plan version ${report!.version.number} (${report!.version.id}). Format: ${formatLabel}.`
    );
  }

  function handleSimulateError() {
    setExportMessage(null);
    setSimulatedError("Simulated service alert: Unable to generate report export. Please try again.");
  }

  function handleRetryExport() {
    setSimulatedError(null);
    setExportMessage(
      `Recovered export preview: Report generated for Plan version ${report!.version.number} (${report!.version.id}).`
    );
  }

  function handleDownloadPdf() {
    setSimulatedError(null);
    setExportMessage(
      `Preparing print-friendly PDF report for Plan version ${report!.version.number} (${report!.version.id}). Formatting print-friendly PDF report.`
    );
    if (typeof window !== "undefined" && typeof window.print === "function") {
      try {
        window.print();
      } catch {
        // Fallback gracefully in test/headless environments
      }
    }
  }

  return (
    <>
      {/* Hidden print header */}
      <div className="hidden print:block mb-6 border-b-2 border-[#1F2A44] pb-4">
        <h1 className="text-2xl font-serif font-bold text-[#1F2A44]">
          Financial Dream Planner — Executive Summary Report
        </h1>
        <p className="text-sm text-[#475467]">
          Plan version {report.version.number} ({report.version.id}) · Generated date: {report.generatedOn} · Status: {report.status}
        </p>
      </div>

      <PageTitle title={report.title} description={`${report.period} · Plan Report`}>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#5E55C9] px-4 py-2 font-semibold text-white shadow-xs hover:bg-[#4F46E5] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]"
            aria-label="Download PDF Report"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Download PDF Report</span>
          </button>
          <Link className={secondary} href="/dashboard/reports">Back to reports</Link>
        </div>
      </PageTitle>

      {/* Executive Summary Report Header Card */}
      <header className="mb-6 rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-4 sm:p-5 shadow-xs print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5E55C9]">
              Executive Summary Report
            </span>
            <Badge tone="purple" size="sm">Plan version {report.version.number}</Badge>
            <Badge tone={report.status === "Current" ? "sage" : "neutral"} size="sm">{report.status}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#475467]">
            <span>Generated date: <strong className="font-semibold text-[#1F2A44]">{report.generatedOn}</strong></span>
          </div>
        </div>
      </header>

      <section aria-labelledby="report-source" className="mb-6 rounded-2xl border-2 border-[#5E55C9] bg-[#FFFCF8] p-5 sm:p-6 print:border-gray-300">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="report-source" className="text-xl font-serif text-[#1F2A44]">Preview source: Plan version {report.version.number}</h2>
            <p className="mt-1 text-sm text-[#475467]">Plan Snapshot {report.version.id} · saved {report.version.savedOn}</p>
          </div>
          <Badge tone="neutral" size="sm">Read-only snapshot</Badge>
        </div>
        <p className="mt-4 text-sm text-[#344054]">Every figure below belongs to this selected plan snapshot. Switching reports never updates or recalculates it.</p>
      </section>

      <div className="space-y-6">
        {/* Document Preview Card with Net Worth curve, Asset Allocation table, Goal Milestones */}
        <DocumentPreviewCard report={report} onDownloadPdf={handleDownloadPdf} />

        {/* Core Plan Snapshot */}
        <Panel title="Plan snapshot" className="print:break-inside-avoid">
          <dl className="grid gap-4 sm:grid-cols-2">
            {report.metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-[#E8E1D6] bg-[#FFF9F0]/60 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-[#475467]">{metric.label}</dt>
                <dd className="mt-1 text-2xl tabular-nums text-[#1F2A44]">{metric.value}</dd>
                <dd className="mt-1 text-xs text-[#475467]">{metric.note}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-sm text-[#344054]">{report.summary}</p>
        </Panel>

        {/* Monthly Cash Flow Breakdown */}
        {report.cashFlow && report.cashFlow.length > 0 && (
          <Panel title="Monthly cash flow allocation">
            <p className="mb-4 text-sm text-[#475467]">
              Planned cash allocation locked to version {report.version.number} baseline inputs.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" aria-label="Cash flow allocation table">
                <thead>
                  <tr className="border-b border-[#E8E1D6] text-xs font-semibold uppercase tracking-wider text-[#475467]">
                    <th scope="col" className="pb-3 pr-4">Category</th>
                    <th scope="col" className="pb-3 pr-4">Type</th>
                    <th scope="col" className="pb-3 pr-4 text-right">Amount</th>
                    <th scope="col" className="pb-3 text-right">Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E1D6]">
                  {report.cashFlow.map((row) => (
                    <tr key={row.category} className="hover:bg-[#FFF9F0]/50">
                      <td className="py-3 pr-4 font-medium text-[#1F2A44]">{row.category}</td>
                      <td className="py-3 pr-4 text-xs text-[#475467]">
                        <span className={`capitalize ${row.type === "inflow" ? "font-semibold text-[#3D5C4A]" : "text-[#344054]"}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums text-[#1F2A44]">{row.amount}</td>
                      <td className="py-3 text-right text-xs">
                        <Badge tone={row.classification === "calculated" ? "blue" : "neutral"} size="sm">
                          {row.classification === "calculated" ? "Calculated" : "Saved input"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {/* Goals Snapshot */}
        {report.goals && report.goals.length > 0 && (
          <Panel title="Goals snapshot in this version">
            <div className="grid gap-4 sm:grid-cols-2">
              {report.goals.map((g) => (
                <div key={g.name} className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[#1F2A44]">{g.name}</h3>
                    <Badge tone="sage" size="sm">{g.status}</Badge>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between text-sm">
                    <span className="text-[#475467]">Current / Target</span>
                    <span className="font-mono tabular-nums font-semibold text-[#1F2A44]">
                      {g.current} / {g.target}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#475467]">Target completion: {g.targetDate}</p>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Assumptions & Unknown/Estimated Disclosures */}
        {report.assumptions && report.assumptions.length > 0 && (
          <Panel title="Assumptions and data disclosures">
            <p className="mb-4 text-sm text-[#475467]">
              Mathematical assumptions and source completeness recorded for this plan version. Unknown and estimated values are labeled explicitly.
            </p>
            <div className="divide-y divide-[#E8E1D6]">
              {report.assumptions.map((item) => (
                <div key={item.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#1F2A44]">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="font-mono tabular-nums text-sm text-[#344054]">{item.value}</span>
                    {item.nature === "estimated" && (
                      <Badge tone="warning" size="sm">Estimated assumption</Badge>
                    )}
                    {item.nature === "unknown" && (
                      <Badge tone="neutral" size="sm">Unknown</Badge>
                    )}
                    {item.nature === "manual" && (
                      <Badge tone="sage" size="sm">Saved input</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Strategic Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <Panel title="Recommendations">
            <ul className="space-y-2 list-disc pl-5 text-sm leading-relaxed text-[#344054]">
              {report.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </Panel>
        )}

        {/* Export Actions Panel */}
        <section aria-labelledby="export-heading" className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 sm:p-6 shadow-xs">
          <h2 id="export-heading" className="text-xl font-serif text-[#1F2A44]">Report export controls</h2>
          <p className="mt-1 text-sm text-[#475467]">
            Export your financial snapshot. Exports are compiled from Plan version {report.version.number} ({report.version.id}).
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className={secondary}
              onClick={() => handleExport("summary")}
            >
              Export Summary (PDF)
            </button>
            <button
              type="button"
              className={secondary}
              onClick={() => handleExport("csv")}
            >
              Export Raw Data (CSV)
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg px-3 text-sm font-semibold text-[#A13F39] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]"
              onClick={handleSimulateError}
            >
              Simulate export error
            </button>
          </div>

          {simulatedError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-[#A13F39]/40 bg-[#A13F39]/10 p-4 text-sm text-[#A13F39]"
            >
              <p className="font-semibold">{simulatedError}</p>
              <p className="mt-1 text-xs text-[#344054]">Report failures are recoverable without corrupting the selected version.</p>
              <button
                type="button"
                className={`${secondary} mt-3 text-sm`}
                onClick={handleRetryExport}
              >
                Retry export
              </button>
            </div>
          )}

          {exportMessage && (
            <p
              role="status"
              aria-live="polite"
              className="mt-4 rounded-xl bg-[#FFF9F0] border border-[#E6B46A]/60 p-3 text-sm font-semibold text-[#8A531D]"
            >
              {exportMessage}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
