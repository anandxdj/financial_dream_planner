"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Pencil,
  Sprout,
  Home,
  GraduationCap,
  Flag,
  BarChart3,
  Coins,
  Shield,
  FileText,
  TrendingUp,
} from "lucide-react";
import { sdk } from "@/lib/sdk";
import { useCurrentPlan, unwrap } from "@/features/planner/queries";
import { usePlanning } from "@/features/planner/planning-queries";
import { useCurrentDrift } from "@/features/planner/decision-queries";
import {
  action,
  secondary,
  Panel,
  ErrorNotice,
  Loading,
  money,
  date,
} from "@/features/planner/ui";
import { Badge } from "@/components/planner/badge";
import { trackFunnel } from "@/features/planner/analytics";

import { PlanningSubNav } from "@/components/planner/sub-nav";

export function Plan() {
  const query = useCurrentPlan();
  const planning = usePlanning();
  const driftQuery = useCurrentDrift();
  const client = useQueryClient();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const [updated, setUpdated] = useState(false);
  const request = useRef<{ revision: number; key: string } | null>(null);

  // Assumptions state (editable)
  const [isEditingAssumptions, setIsEditingAssumptions] = useState(false);
  const [currentAge, setCurrentAge] = useState("30");
  const [retirementAge, setRetirementAge] = useState("60");
  const [lifeExpectancy, setLifeExpectancy] = useState("90");
  const [expectedReturn, setExpectedReturn] = useState("8.5");
  const [inflationRate, setInflationRate] = useState("5.0");
  const [monthlySavingsInput, setMonthlySavingsInput] = useState("50,000");

  async function generate() {
    if (!planning.data) return;
    setPending(true);
    setError(null);
    setUpdated(false);
    const revision = planning.data.revision;
    const generationRequest =
      request.current?.revision === revision
        ? request.current
        : { revision, key: crypto.randomUUID() };
    request.current = generationRequest;
    const key = generationRequest.key;
    try {
      const result = unwrap(
        await sdk.POST("/api/v1/households/planning/generate", {
          params: { header: { "Idempotency-Key": key } },
          body: { expectedRevision: revision },
        })
      );
      client.setQueryData(["plan"], result.data);
      await client.invalidateQueries({ queryKey: ["plan"] });
      trackFunnel(query.data ? "plan_updated" : "first_plan_generated");
      setUpdated(true);
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }

  const current = query.data;
  const output = current?.snapshot.calculatedOutput;
  const needsUpdate =
    !!current && !!planning.data && current.snapshot.revision !== planning.data.revision;
  const pendingDrift = driftQuery.data?.status === "pending" ? driftQuery.data : null;

  // Key metrics
  const formattedNetWorth = "₹28.4L";
  const monthlySavings = output?.cashFlow?.monthlySurplus
    ? money(output.cashFlow.monthlySurplus)
    : "₹1.5L";
  const goalProgress = "68%";

  return (
    <div className="space-y-10 pb-16">
      <PlanningSubNav />

      {/* Drift Alert Banner */}
      {pendingDrift && (
        <div
          role="status"
          className="rounded-2xl border border-[#7D5200] bg-[#FFF9F0] p-5 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-[#7D5200] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-medium text-[#1F2A44]">
                  Observed drift detected against active plan
                </h2>
                <p className="mt-1 text-sm text-[#475467]">
                  Recorded activity differs from your saved baseline. Your baseline remains strictly unchanged until you review.
                </p>
              </div>
            </div>
            <Link className={action} href={`/dashboard/plan/review/${pendingDrift.id}`}>
              Review drift findings
            </Link>
          </div>
        </div>
      )}

      {/* Conditional Stale Alert Banner */}
      {needsUpdate && (
        <div
          role="status"
          className="rounded-2xl border border-[#7D5200] bg-[#FFF9F0] p-5 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-[#7D5200] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-2xl font-serif text-[#1F2A44]">Your plan needs updating</h2>
              <p className="mt-2 text-sm text-[#344054]">
                Your saved inputs have changed. Review them, then generate a new version when you are ready.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global Error Notice */}
      <ErrorNotice error={error} />
      <ErrorNotice error={query.error} retry={() => void query.refetch()} />
      {query.isPending && <Loading />}

      {/* ========================================================================= */}
      {/* 01 PLAN SUMMARY (Board 08 Panel 01) */}
      {/* ========================================================================= */}
      <section aria-labelledby="plan-summary-heading" className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-wider uppercase text-[#5E55C9]">
                01 Plan Summary
              </span>
              {current && (
                <Badge tone="purple" size="sm">
                  Version {current.currentVersion.versionNumber}
                </Badge>
              )}
            </div>
            <h1
              id="plan-summary-heading"
              className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#1F2A44] leading-tight"
            >
              Your plan at a glance
            </h1>
            <p className="mt-2 text-base md:text-lg text-[#475467] max-w-2xl">
              A clear summary of where you are, where you want to be, and what's possible.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link className={secondary} href="/dashboard/plan/history">
              Plan history
            </Link>
            <Link className={secondary} href="/onboarding">
              Edit financial inputs
            </Link>
            <button
              type="button"
              className={action}
              disabled={pending || !planning.data}
              onClick={() => void generate()}
            >
              {pending ? "Generating…" : current ? "Update Plan" : "Generate my plan"}
            </button>
          </div>
        </div>

        {updated && (
          <p role="status" className="text-sm font-semibold text-[#3D5C4A]">
            Your new plan version is saved.
          </p>
        )}

        {/* Summary Content: 3 Metric Cards + Right Artwork */}
        <div className="grid gap-6 lg:grid-cols-12 items-stretch">
          {/* Left Column: 3 Key Metrics Cards + Monthly Money */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
              {/* Metric 1: Current Net Worth */}
              <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 sm:p-6 flex flex-col justify-center shadow-xs">
                <span className="text-xs font-semibold text-[#475467] uppercase tracking-wider">
                  Current Net Worth
                </span>
                <p className="mt-2 text-3xl sm:text-2xl xl:text-3xl font-serif font-bold text-[#1F2A44] tabular-nums">
                  {formattedNetWorth}
                </p>
                <span className="mt-1 text-xs text-[#3D5C4A] flex items-center gap-1 font-medium">
                  <TrendingUp className="size-3" /> Baseline
                </span>
              </div>

              {/* Metric 2: Monthly Savings */}
              <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 sm:p-6 flex flex-col justify-center shadow-xs">
                <span className="text-xs font-semibold text-[#475467] uppercase tracking-wider">
                  Monthly Savings
                </span>
                <p className="mt-2 text-3xl sm:text-2xl xl:text-3xl font-serif font-bold text-[#1F2A44] tabular-nums">
                  {monthlySavings}
                </p>
                <span className="mt-1 text-xs text-[#475467]">
                  Surplus capacity
                </span>
              </div>

              {/* Metric 3: Goal Progress */}
              <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 sm:p-6 flex flex-col justify-center shadow-xs">
                <span className="text-xs font-semibold text-[#475467] uppercase tracking-wider">
                  Goal Progress
                </span>
                <p className="mt-2 text-3xl sm:text-2xl xl:text-3xl font-serif font-bold text-[#5E55C9] tabular-nums">
                  {goalProgress}
                </p>
                <span className="mt-1 text-xs text-[#3D5C4A] font-medium">
                  On track
                </span>
              </div>
            </div>

            {/* Sub-card: Planned monthly money */}
            <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-xs">
              <h3 className="text-base font-serif font-semibold text-[#1F2A44] mb-3">
                Planned monthly money
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-[#E8E1D6]/70 bg-[#FFF9F0]/40 p-3">
                  <dt className="text-[#475467]">Income</dt>
                  <dd className="mt-1 font-semibold text-sm tabular-nums text-[#1F2A44]">
                    {money(output?.cashFlow?.monthlyIncome ?? "100000")}
                  </dd>
                </div>
                <div className="rounded-xl border border-[#E8E1D6]/70 bg-[#FFF9F0]/40 p-3">
                  <dt className="text-[#475467]">Total outflows</dt>
                  <dd className="mt-1 font-semibold text-sm tabular-nums text-[#1F2A44]">
                    {money(output?.cashFlow?.totalOutflows ?? "60000")}
                  </dd>
                </div>
                <div className="rounded-xl border border-[#E8E1D6]/70 bg-[#FFF9F0]/40 p-3">
                  <dt className="text-[#475467]">Monthly surplus</dt>
                  <dd className="mt-1 font-semibold text-sm tabular-nums text-[#3D5C4A]">
                    {money(output?.cashFlow?.monthlySurplus ?? "40000")}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-[11px] text-[#475467]">
                These are planning inputs, separate from recorded transaction totals.
              </p>
            </div>
          </div>

          {/* Right Column: Artwork with Woman with Laptop & Coffee */}
          <div className="lg:col-span-6 relative rounded-2xl border border-[#E8E1D6] bg-gradient-to-br from-[#FFF9F0] via-[#FAF6EF] to-[#ECE5D8]/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden shadow-xs">
            {/* Lavender decorative background leaves */}
            <div className="absolute top-0 right-0 w-44 h-44 opacity-20 pointer-events-none">
              <Image
                src="/Assets/Assets/lavender_leaves_decor.png"
                alt=""
                width={176}
                height={176}
                className="object-contain"
              />
            </div>

            <div className="relative z-10 max-w-sm space-y-4 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#5E55C9]/30 bg-[#5E55C9]/10 px-3 py-1 text-xs font-semibold text-[#5E55C9]">
                <span>A clearer tomorrow</span>
              </div>
              <blockquote className="font-serif italic text-lg sm:text-xl text-[#1F2A44] leading-relaxed">
                “Plans turn today’s choices into a brighter tomorrow.”
              </blockquote>
              <p className="text-xs text-[#475467]">
                Your plan gives you confidence to navigate life's big decisions.
              </p>
            </div>

            <div className="relative shrink-0 z-10">
              <div className="relative w-48 sm:w-56 h-48 sm:h-56">
                <Image
                  src="/Assets/Characters/woman_with_laptop.png"
                  alt="Woman with coffee and laptop planning finances"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02 FINANCIAL ROADMAP (Board 08 Panel 02) */}
      {/* ========================================================================= */}
      <section aria-labelledby="roadmap-heading" className="space-y-6 pt-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-[#5E55C9]">
              02 Financial Roadmap
            </span>
            <h2
              id="roadmap-heading"
              className="text-2xl md:text-3xl font-serif text-[#1F2A44]"
            >
              Your journey to financial freedom
            </h2>
            <p className="mt-1 text-sm md:text-base text-[#475467]">
              A step-by-step roadmap tailored to your goals.
            </p>
          </div>
          <div className="hidden sm:block">
            <span className="font-serif italic text-[#5E55C9] text-sm">
              A better financial future, step by step.
            </span>
          </div>
        </div>

        {/* 4 Sequential Milestone Cards */}
        <div className="relative">
          {/* Connecting line behind icons for desktop */}
          <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-0.5 border-t-2 border-dashed border-[#CBD5E1] -z-0" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
            {/* Milestone 1 */}
            <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-xs flex flex-col items-center text-center">
              <div className="size-12 rounded-full bg-[#EDE9FE] text-[#5E55C9] flex items-center justify-center font-bold text-base shadow-xs mb-4">
                <Sprout className="size-5" />
              </div>
              <span className="text-[11px] font-bold text-[#5E55C9] tracking-wider uppercase mb-1">
                Step 1
              </span>
              <h3 className="font-serif font-semibold text-lg text-[#1F2A44] mb-2">
                Build Foundation
              </h3>
              <p className="text-xs text-[#475467] leading-relaxed">
                Organize your finances, track spending and build savings.
              </p>
            </div>

            {/* Milestone 2 */}
            <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-xs flex flex-col items-center text-center">
              <div className="size-12 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold text-base shadow-xs mb-4">
                <Home className="size-5" />
              </div>
              <span className="text-[11px] font-bold text-[#2563EB] tracking-wider uppercase mb-1">
                Step 2
              </span>
              <h3 className="font-serif font-semibold text-lg text-[#1F2A44] mb-2">
                Grow Wealth
              </h3>
              <p className="text-xs text-[#475467] leading-relaxed">
                Invest for long-term growth with a plan that fits you.
              </p>
            </div>

            {/* Milestone 3 */}
            <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-xs flex flex-col items-center text-center">
              <div className="size-12 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center font-bold text-base shadow-xs mb-4">
                <GraduationCap className="size-5" />
              </div>
              <span className="text-[11px] font-bold text-[#7C3AED] tracking-wider uppercase mb-1">
                Step 3
              </span>
              <h3 className="font-serif font-semibold text-lg text-[#1F2A44] mb-2">
                Achieve Goals
              </h3>
              <p className="text-xs text-[#475467] leading-relaxed">
                Plan for major life goals like home, education and retirement.
              </p>
            </div>

            {/* Milestone 4 */}
            <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-xs flex flex-col items-center text-center">
              <div className="size-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-bold text-base shadow-xs mb-4">
                <Flag className="size-5" />
              </div>
              <span className="text-[11px] font-bold text-[#16A34A] tracking-wider uppercase mb-1">
                Step 4
              </span>
              <h3 className="font-serif font-semibold text-lg text-[#1F2A44] mb-2">
                Stay on Track
              </h3>
              <p className="text-xs text-[#475467] leading-relaxed">
                Review, adjust and stay confident through life's changes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 03 LONG-TERM PROJECTION CHART (Board 08 Panel 03) */}
      {/* ========================================================================= */}
      <section aria-labelledby="projection-heading" className="space-y-6 pt-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-[#5E55C9]">
            03 Long-term Projection Chart
          </span>
          <h2
            id="projection-heading"
            className="text-2xl md:text-3xl font-serif text-[#1F2A44]"
          >
            See your future take shape
          </h2>
          <p className="mt-1 text-sm md:text-base text-[#475467]">
            Visualize your net worth, income and goals over time.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 sm:p-7 shadow-xs">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            {/* Left Chart Area */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E1D6]/70 pb-3">
                <h3 className="text-base font-serif font-semibold text-[#1F2A44]">
                  Projected Net Worth
                </h3>
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#3B82F6]" />
                    <span className="text-[#475467]">Base Case</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#10B981]" />
                    <span className="text-[#475467]">Optimistic</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#8B5CF6]" />
                    <span className="text-[#475467]">Conservative</span>
                  </div>
                </div>
              </div>

              {/* Multi-Curve SVG Chart */}
              <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] max-h-80">
                <svg
                  viewBox="0 0 680 280"
                  className="w-full h-full overflow-visible font-sans text-xs"
                  aria-label="Wealth accumulation projection curves up to 2055"
                >
                  <defs>
                    <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Y Axis Grid lines */}
                  {[
                    { label: "₹ 3 Cr", y: 35 },
                    { label: "₹ 2 Cr", y: 105 },
                    { label: "₹ 1 Cr", y: 175 },
                    { label: "₹ 0", y: 245 },
                  ].map((grid, i) => (
                    <g key={i}>
                      <line
                        x1="55"
                        y1={grid.y}
                        x2="660"
                        y2={grid.y}
                        stroke="#E8E1D6"
                        strokeDasharray="4 4"
                      />
                      <text
                        x="48"
                        y={grid.y + 4}
                        textAnchor="end"
                        fill="#747B88"
                        className="text-[11px]"
                      >
                        {grid.label}
                      </text>
                    </g>
                  ))}

                  {/* X Axis Labels */}
                  {[
                    { label: "2024", x: 60 },
                    { label: "2030", x: 155 },
                    { label: "2035", x: 250 },
                    { label: "2040", x: 345 },
                    { label: "2045", x: 440 },
                    { label: "2050", x: 535 },
                    { label: "2055", x: 630 },
                  ].map((pt, i) => (
                    <text
                      key={i}
                      x={pt.x}
                      y="268"
                      textAnchor="middle"
                      fill="#747B88"
                      className="text-[11px]"
                    >
                      {pt.label}
                    </text>
                  ))}

                  {/* Optimistic Area & Curve (Green) */}
                  <path
                    d="M 60,240 C 155,235 250,200 345,150 C 440,105 535,60 630,30 L 630,245 L 60,245 Z"
                    fill="url(#optGrad)"
                  />
                  <path
                    d="M 60,240 C 155,235 250,200 345,150 C 440,105 535,60 630,30"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                  />
                  {/* Base Case Curve (Blue) */}
                  <path
                    d="M 60,240 C 155,238 250,215 345,180 C 440,145 535,110 630,85 L 630,245 L 60,245 Z"
                    fill="url(#baseGrad)"
                  />
                  <path
                    d="M 60,240 C 155,238 250,215 345,180 C 440,145 535,110 630,85"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                  />
                  {/* Conservative Curve (Purple) */}
                  <path
                    d="M 60,240 C 155,240 250,230 345,205 C 440,180 535,160 630,140"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="3"
                  />

                  {/* Data Dots on 2055 */}
                  <circle cx="630" cy="30" r="5" fill="#10B981" stroke="#FFFCF8" strokeWidth="2" />
                  <circle cx="630" cy="85" r="5" fill="#3B82F6" stroke="#FFFCF8" strokeWidth="2" />
                  <circle cx="630" cy="140" r="5" fill="#8B5CF6" stroke="#FFFCF8" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Right Potential Net Worth Card */}
            <div className="lg:col-span-4 relative rounded-2xl border border-[#CBD5E1] bg-gradient-to-b from-[#F0F5FF] to-[#FAF6EF] p-6 shadow-xs overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div>
                  <span className="text-xs font-semibold text-[#475467]">
                    Potential net worth
                  </span>
                  <p className="text-xs text-[#475467]">at 2055 (age 60)</p>
                  <p className="mt-2 text-3xl sm:text-4xl font-serif font-bold text-[#1F2A44] tabular-nums">
                    ₹ 2.4 Cr
                  </p>
                </div>

                <div className="border-t border-[#CBD5E1]/70 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#475467] flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#3B82F6]" /> Base case
                    </span>
                    <span className="font-semibold text-[#1F2A44] tabular-nums">
                      ₹ 2.4 Cr
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#475467] flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#10B981]" /> Optimistic
                    </span>
                    <span className="font-semibold text-[#1F2A44] tabular-nums">
                      ₹ 3.1 Cr
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#475467] flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#8B5CF6]" /> Conservative
                    </span>
                    <span className="font-semibold text-[#1F2A44] tabular-nums">
                      ₹ 1.6 Cr
                    </span>
                  </div>
                </div>
              </div>

              {/* Botanical leaves decoration */}
              <div className="absolute -bottom-6 -right-6 w-28 h-28 opacity-30 pointer-events-none">
                <Image
                  src="/Assets/Botanical/asset_026.png"
                  alt=""
                  width={112}
                  height={112}
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Accessible Table Fallback */}
          <details className="mt-6 border-t border-[#E8E1D6]/70 pt-3 text-xs text-[#475467]">
            <summary className="min-h-11 cursor-pointer font-semibold text-[#1F2A44] flex items-center">
              View projection data (accessible table)
            </summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Projected wealth milestones in INR</caption>
                <thead>
                  <tr className="border-b border-[#E8E1D6]">
                    <th scope="col" className="p-2">Year</th>
                    <th scope="col" className="p-2">Conservative</th>
                    <th scope="col" className="p-2">Base Case</th>
                    <th scope="col" className="p-2">Optimistic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E1D6]">
                  <tr>
                    <th scope="row" className="p-2 font-normal">2024 (Age 30)</th>
                    <td className="p-2 tabular-nums">₹ 28,40,000</td>
                    <td className="p-2 tabular-nums">₹ 28,40,000</td>
                    <td className="p-2 tabular-nums">₹ 28,40,000</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-2 font-normal">2035 (Age 40)</th>
                    <td className="p-2 tabular-nums">₹ 55,00,000</td>
                    <td className="p-2 tabular-nums">₹ 72,00,000</td>
                    <td className="p-2 tabular-nums">₹ 95,00,000</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-2 font-normal">2045 (Age 50)</th>
                    <td className="p-2 tabular-nums">₹ 98,00,000</td>
                    <td className="p-2 tabular-nums">₹ 1.45 Cr</td>
                    <td className="p-2 tabular-nums">₹ 1.90 Cr</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-2 font-normal">2055 (Age 60)</th>
                    <td className="p-2 tabular-nums font-semibold">₹ 1.6 Cr</td>
                    <td className="p-2 tabular-nums font-semibold text-[#3B82F6]">₹ 2.4 Cr</td>
                    <td className="p-2 tabular-nums font-semibold text-[#10B981]">₹ 3.1 Cr</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 04 ASSUMPTIONS & RISKS (Board 08 Panel 04) */}
      {/* ========================================================================= */}
      <section aria-labelledby="assumptions-heading" className="space-y-6 pt-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-[#5E55C9]">
            04 Assumptions & Risks
          </span>
          <h2
            id="assumptions-heading"
            className="text-2xl md:text-3xl font-serif text-[#1F2A44]"
          >
            Key assumptions behind your plan
          </h2>
          <p className="mt-1 text-sm md:text-base text-[#475467]">
            Understand what drives your projections and the risks to consider.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 items-start">
          {/* Left Card: Key Assumptions */}
          <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E1D6]/70 pb-3">
              <h3 className="font-serif font-semibold text-lg text-[#1F2A44]">
                Key Assumptions
              </h3>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5E55C9] hover:underline"
                onClick={() => setIsEditingAssumptions(!isEditingAssumptions)}
              >
                <Pencil className="size-3.5" />
                {isEditingAssumptions ? "Done" : "Edit"}
              </button>
            </div>

            <dl className="divide-y divide-[#E8E1D6]/60 text-sm">
              <div className="py-2.5 flex justify-between items-center">
                <dt className="text-[#475467]">Current age</dt>
                {isEditingAssumptions ? (
                  <input
                    type="number"
                    value={currentAge}
                    onChange={(e) => setCurrentAge(e.target.value)}
                    className="w-16 rounded-md border border-[#E8E1D6] px-2 py-1 text-right text-xs"
                  />
                ) : (
                  <dd className="font-semibold text-[#1F2A44]">{currentAge}</dd>
                )}
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <dt className="text-[#475467]">Retirement age</dt>
                {isEditingAssumptions ? (
                  <input
                    type="number"
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(e.target.value)}
                    className="w-16 rounded-md border border-[#E8E1D6] px-2 py-1 text-right text-xs"
                  />
                ) : (
                  <dd className="font-semibold text-[#1F2A44]">{retirementAge}</dd>
                )}
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <dt className="text-[#475467]">Life expectancy</dt>
                {isEditingAssumptions ? (
                  <input
                    type="number"
                    value={lifeExpectancy}
                    onChange={(e) => setLifeExpectancy(e.target.value)}
                    className="w-16 rounded-md border border-[#E8E1D6] px-2 py-1 text-right text-xs"
                  />
                ) : (
                  <dd className="font-semibold text-[#1F2A44]">{lifeExpectancy}</dd>
                )}
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <dt className="text-[#475467]">Expected annual return</dt>
                {isEditingAssumptions ? (
                  <input
                    type="text"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(e.target.value)}
                    className="w-20 rounded-md border border-[#E8E1D6] px-2 py-1 text-right text-xs"
                  />
                ) : (
                  <dd className="font-semibold text-[#1F2A44] tabular-nums">
                    {expectedReturn}%
                  </dd>
                )}
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <dt className="text-[#475467]">Inflation rate</dt>
                {isEditingAssumptions ? (
                  <input
                    type="text"
                    value={inflationRate}
                    onChange={(e) => setInflationRate(e.target.value)}
                    className="w-20 rounded-md border border-[#E8E1D6] px-2 py-1 text-right text-xs"
                  />
                ) : (
                  <dd className="font-semibold text-[#1F2A44] tabular-nums">
                    {inflationRate}%
                  </dd>
                )}
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <dt className="text-[#475467]">Monthly savings</dt>
                {isEditingAssumptions ? (
                  <input
                    type="text"
                    value={monthlySavingsInput}
                    onChange={(e) => setMonthlySavingsInput(e.target.value)}
                    className="w-28 rounded-md border border-[#E8E1D6] px-2 py-1 text-right text-xs"
                  />
                ) : (
                  <dd className="font-semibold text-[#1F2A44] tabular-nums">
                    ₹ {monthlySavingsInput}
                  </dd>
                )}
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <dt className="text-[#475467]">Current net worth</dt>
                <dd className="font-semibold text-[#1F2A44] tabular-nums">
                  ₹ 28,40,000
                </dd>
              </div>
            </dl>
          </div>

          {/* Right Card: Risks to Consider */}
          <div className="relative rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 shadow-xs space-y-4 overflow-hidden">
            <div className="border-b border-[#E8E1D6]/70 pb-3">
              <h3 className="font-serif font-semibold text-lg text-[#1F2A44]">
                Risks to Consider
              </h3>
            </div>

            <div className="space-y-4">
              {/* Risk 1: Market volatility */}
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                  <BarChart3 className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#1F2A44]">Market volatility</h4>
                  <p className="text-xs text-[#475467]">
                    Investment returns can fluctuate.
                  </p>
                </div>
              </div>

              {/* Risk 2: Inflation risk */}
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-lg bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
                  <Coins className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#1F2A44]">Inflation risk</h4>
                  <p className="text-xs text-[#475467]">
                    Higher inflation can reduce purchasing power.
                  </p>
                </div>
              </div>

              {/* Risk 3: Life events */}
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                  <Shield className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#1F2A44]">Life events</h4>
                  <p className="text-xs text-[#475467]">
                    Job changes, health issues or family needs may impact your plan.
                  </p>
                </div>
              </div>

              {/* Risk 4: Policy and tax changes */}
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#1F2A44]">Policy and tax changes</h4>
                  <p className="text-xs text-[#475467]">
                    Future regulations may affect outcomes.
                  </p>
                </div>
              </div>
            </div>

            {/* Botanical corner decor */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 opacity-25 pointer-events-none">
              <Image
                src="/Assets/Botanical/asset_027.png"
                alt=""
                width={96}
                height={96}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Additional Engine Details / Completeness */}
      {current && (
        <section className="grid gap-6 md:grid-cols-2">
          {/* Emergency Savings */}
          <Panel title="Emergency savings">
            <dl className="space-y-4">
              <div className="rounded-xl border border-[#E8E1D6] bg-[#FFF9F0]/30 p-4">
                <dt className="text-xs font-medium text-[#475467]">Current reserve</dt>
                <dd className="mt-1 text-2xl font-serif tabular-nums text-[#1F2A44]">
                  {money(output?.emergencyFund?.currentReserves)}
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E1D6]/60 pb-2 text-sm">
                <dt className="text-[#475467]">Coverage</dt>
                <dd className="font-medium text-[#1F2A44]">
                  {output?.emergencyFund?.runwayMonths
                    ? `${output.emergencyFund.runwayMonths} months`
                    : "Not available"}
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E1D6]/60 pb-2 text-sm">
                <dt className="text-[#475467]">Funding shortfall</dt>
                <dd className="font-semibold tabular-nums text-[#1F2A44]">
                  {money(output?.emergencyFund?.shortfall)}
                </dd>
              </div>
            </dl>
          </Panel>

          {/* Completeness & Assumptions */}
          <Panel title="Completeness and estimates">
            <div className="mb-3 flex items-center gap-2">
              <Badge
                tone={current.snapshot.completeness.status === "complete" ? "sage" : "gold"}
                dot
              >
                {current.snapshot.completeness.status === "complete"
                  ? "Required inputs complete"
                  : "Some inputs missing"}
              </Badge>
            </div>
            <p className="text-sm text-[#344054]">
              {current.snapshot.completeness.status === "complete"
                ? "The engine has the required inputs for the calculated sections."
                : "Some inputs are missing. Available sections are shown with their assumptions."}
            </p>
            {Boolean(planning.data?.estimates.length) && (
              <p className="mt-3 text-xs text-[#7D5200] font-medium">
                Estimated inputs: {planning.data?.estimates.join(", ")}
              </p>
            )}
            <div className="mt-4 pt-3 border-t border-[#E8E1D6]/60 flex justify-between text-xs text-[#475467]">
              <span>Policy version: {current.snapshot.policyVersion}</span>
              <span>Inputs as of {date(current.snapshot.asOf)}</span>
            </div>
          </Panel>
        </section>
      )}
    </div>
  );
}

