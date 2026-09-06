"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Coins,
  Target,
  Pencil,
  Check,
  Plus,
  Sparkles,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { sdk } from "@/lib/sdk";
import { unwrap } from "@/features/planner/queries";
import { money, date } from "@/features/planner/ui";
import {
  useGoals,
  useFeasibility,
  useGoalContributions,
} from "@/features/planner/planning-queries";
import { demoStore } from "@/lib/demo-store";
import { cn } from "@/lib/utils";
import { CATEGORY_IMAGES, getGoalCardState } from "./goal-card";
import { AddContributionModal } from "./add-contribution-modal";
import { GoalForm } from "./goal-form";

interface GoalDetailWorkspaceProps {
  id: string;
}

type WorkspaceTab = "overview" | "contributions" | "milestones" | "insights";

export function GoalDetailWorkspace({ id }: GoalDetailWorkspaceProps) {
  // Standard top-level hook call — do not wrap in try/catch (violates Rules of Hooks)
  const router = useRouter();
  const queryClient = useQueryClient();
  const goalsQuery = useGoals();
  const feasibilityQuery = useFeasibility();
  const contributionsQuery = useGoalContributions(id);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Next steps interactive checklist state (Board 07)
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    step_contribution: true,
    step_plan: false,
    step_tax: false,
    step_reminders: false,
  });

  const toggleStep = (stepKey: string) => {
    setCompletedSteps((prev) => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const goal = goalsQuery.data?.find((g) => g.id === id);

  if (goalsQuery.isPending) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-[#5E55C9] border-t-transparent" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-12 text-center space-y-4">
        <h3 className="font-serif text-2xl font-medium text-[#1F2A44]">
          Goal Not Found
        </h3>
        <p className="text-xs text-[#475467]">
          This goal may have been archived or removed.
        </p>
        <Link
          href="/dashboard/goals"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5E55C9] text-white text-xs font-semibold hover:bg-[#4d45b5]"
        >
          <ArrowLeft className="size-3.5" /> Back to goals
        </Link>
      </div>
    );
  }

  const handleDeleteGoal = async () => {
    setDeletePending(true);
    setDeleteError(null);
    try {
      if (demoStore.isDemoMode()) {
        demoStore.deleteGoal(id);
        try {
          await sdk.DELETE("/api/v1/goals/{id}", { params: { path: { id } } });
        } catch {
          // Best-effort in demo mode
        }
      } else {
        unwrap(await sdk.DELETE("/api/v1/goals/{id}", { params: { path: { id } } }));
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["goals"] }),
        queryClient.invalidateQueries({ queryKey: ["goals", "feasibility"] }),
        queryClient.invalidateQueries({ queryKey: ["planning"] }),
      ]);
      router.push("/dashboard/goals");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove goal";
      setDeleteError(msg);
      setDeletePending(false);
    }
  };

  const targetNum = Number(goal.targetAmount) || 0;
  const savedNum = Number(goal.currentSavings) || 0;
  const progressPct =
    targetNum > 0 ? Math.min(100, Math.max(0, (savedNum / targetNum) * 100)) : 0;
  const cardState = getGoalCardState(goal);
  const imageSrc = CATEGORY_IMAGES[goal.category] || CATEGORY_IMAGES.custom;

  // Feasibility engine calculations
  const feasibilityResult = feasibilityQuery.data?.goals.find((g) => g.id === id);
  const requiredSip = feasibilityResult?.result?.requiredSip || goal.monthlyContribution;
  const futureCost = feasibilityResult?.result?.futureGoalCost;
  const inflationUsed = feasibilityResult?.result?.annualInflationUsed || "6.0";

  // Contributions data
  const contributionsList = contributionsQuery.data || [];

  return (
    <div className="space-y-8">
      {/* Top Nav: Back to Goals */}
      <div>
        <Link
          href="/dashboard/goals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5E55C9] hover:underline"
        >
          <ArrowLeft className="size-3.5" /> Back to goals
        </Link>
      </div>

      {/* Board 04: Goal Detail Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[#E8E1D6] bg-gradient-to-br from-[#FFFDF9] via-[#FFF9F0] to-[#F5EFE6] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* 3D Category Illustration */}
            <div className="relative size-24 sm:size-28 shrink-0 rounded-2xl overflow-hidden bg-white/90 border border-[#E8E1D6] shadow-xs flex items-center justify-center p-2">
              <Image
                src={imageSrc}
                alt={goal.name}
                fill
                className="object-contain p-2"
                sizes="112px"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold tracking-wider text-[#7D5200] uppercase bg-[#7D5200]/10 px-2 py-0.5 rounded-full">
                  {goal.category}
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium",
                    cardState === "completed"
                      ? "bg-[#3D5C4A]/10 text-[#3D5C4A]"
                      : cardState === "not_started"
                        ? "bg-[#F0F4F8] text-[#475467]"
                        : "bg-[#5E55C9]/10 text-[#5E55C9]"
                  )}
                >
                  {cardState === "completed"
                    ? "Completed"
                    : cardState === "not_started"
                      ? "Not started"
                      : "In progress"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl sm:text-4xl text-[#1F2A44] leading-tight">
                  {goal.name}
                </h1>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-lg p-1.5 text-[#475467] hover:bg-[#E8E1D6]/50 hover:text-[#1F2A44] transition-colors"
                  title="Edit goal title & details"
                  aria-label="Edit goal details"
                >
                  <Pencil className="size-4" />
                </button>
              </div>

              <p className="font-serif italic text-xs text-[#7D5200]">
                &ldquo;A place to call home. Closer to the life we love.&rdquo;
              </p>

              {/* Progress and dual currency */}
              <div className="pt-2 flex items-baseline gap-2 tabular-nums">
                <span className="text-2xl font-serif font-bold text-[#1F2A44]">
                  {money(goal.currentSavings)}
                </span>
                <span className="text-sm text-[#475467]">/</span>
                <span className="text-sm text-[#475467]">
                  {money(goal.targetAmount)}
                </span>
                <span className="text-xs font-semibold text-[#3D5C4A] ml-2">
                  ({progressPct.toFixed(0)}% funded)
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Quote / Flag */}
          <div className="hidden lg:block text-right">
            <span className="font-serif italic text-xs text-[#7D5200]">
              &ldquo;A home today. A brighter tomorrow.&rdquo;
            </span>
          </div>
        </div>

        {/* Accessible Progress Bar */}
        <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-[#E8E1D6]/60">
          <div
            className="h-full rounded-full bg-[#3D5C4A] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Board 04: Three Stat Badges Underneath */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Badge 1: Target Date */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/80 border border-[#E8E1D6] shadow-xs">
            <div className="size-10 rounded-xl bg-[#5E55C9]/10 text-[#5E55C9] flex items-center justify-center shrink-0">
              <Calendar className="size-5" />
            </div>
            <div>
              <span className="text-[11px] text-[#475467] block">Target date</span>
              <span className="font-serif text-sm font-semibold text-[#1F2A44]">
                {date(goal.targetDate)}
              </span>
            </div>
          </div>

          {/* Badge 2: Monthly Contribution */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/80 border border-[#E8E1D6] shadow-xs">
            <div className="size-10 rounded-xl bg-[#7D5200]/10 text-[#7D5200] flex items-center justify-center shrink-0">
              <Coins className="size-5" />
            </div>
            <div>
              <span className="text-[11px] text-[#475467] block">Monthly contribution</span>
              <span className="font-serif text-sm font-semibold text-[#5E55C9] tabular-nums">
                {money(goal.monthlyContribution)}
              </span>
            </div>
          </div>

          {/* Badge 3: Estimated Monthly (Engine SIP) */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/80 border border-[#E8E1D6] shadow-xs">
            <div className="size-10 rounded-xl bg-[#3D5C4A]/10 text-[#3D5C4A] flex items-center justify-center shrink-0">
              <Target className="size-5" />
            </div>
            <div>
              <span className="text-[11px] text-[#475467] block">Engine required SIP</span>
              <span className="font-serif text-sm font-semibold text-[#1F2A44] tabular-nums">
                {money(requiredSip)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Board 04 Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E1D6]">
        {(
          [
            { id: "overview", label: "Overview" },
            { id: "contributions", label: "Contributions" },
            { id: "milestones", label: "Milestones" },
            { id: "insights", label: "Insights" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-3 text-xs sm:text-sm font-medium transition-all relative",
              activeTab === tab.id
                ? "text-[#5E55C9] font-semibold"
                : "text-[#475467] hover:text-[#1F2A44]"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5E55C9]" />
            )}
          </button>
        ))}
      </div>

      {/* Workspace Body Grid: 65% Main Column / 35% Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1.85fr_1fr]">
        {/* Main Column (65%) */}
        <div className="space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Savings & Contribution Cards */}
              <div className="rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="font-serif text-xl font-medium text-[#1F2A44]">
                    Funding outlook
                  </h3>
                  <span className="text-xs text-[#5E55C9] font-medium tabular-nums">
                    {money(requiredSip)} per month required
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-2xl border border-[#E8E1D6] bg-[#FFF9F0]/40">
                    <span className="text-xs text-[#475467] block">Already saved</span>
                    <p className="mt-1 text-2xl font-serif font-bold text-[#1F2A44] tabular-nums">
                      {money(goal.currentSavings)}
                    </p>
                    <span className="text-[11px] text-[#3D5C4A] mt-1 block">
                      {progressPct.toFixed(1)}% of total goal
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl border border-[#E8E1D6] bg-[#FFF9F0]/40">
                    <span className="text-xs text-[#475467] block">Committed monthly</span>
                    <p className="mt-1 text-2xl font-serif font-bold text-[#5E55C9] tabular-nums">
                      {money(goal.monthlyContribution)}
                    </p>
                    <span className="text-[11px] text-[#475467] mt-1 block">
                      Compounding every month
                    </span>
                  </div>
                </div>

                {/* Inflation Impact Analysis */}
                <div className="p-4 rounded-2xl border border-[#E8E1D6] bg-[#FFF9F0]/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-4 text-[#7D5200]" />
                      <h4 className="text-xs font-semibold text-[#1F2A44]">
                        Inflation Impact Analysis
                      </h4>
                    </div>
                    <span className="text-[10px] text-[#7D5200] bg-white px-2 py-0.5 rounded-full border border-[#E8E1D6]">
                      Assumed {inflationUsed}% p.a.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#475467]">Today’s money:</span>
                      <p className="font-semibold text-[#1F2A44] tabular-nums">
                        {money(goal.targetAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#475467]">Future inflated target:</span>
                      <p className="font-semibold text-[#1F2A44] tabular-nums">
                        {money(futureCost || goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Board 07: Goal Status & Next Steps */}
              <div className="rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-2xl font-normal text-[#1F2A44]">
                      You&apos;re making great progress!
                    </h3>
                    <p className="text-xs text-[#475467]">
                      Here&apos;s what&apos;s next for your goal journey.
                    </p>
                  </div>
                  <span className="font-serif italic text-xs text-[#7D5200]">
                    &ldquo;Progress today. Freedom tomorrow.&rdquo;
                  </span>
                </div>

                <div className="grid gap-6 md:grid-cols-[1fr_1.5fr] items-center">
                  {/* Circular Radial Donut Progress Display (Board 07) */}
                  <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-[#FFFDF9] to-[#F7F2EA] border border-[#E8E1D6] text-center relative overflow-hidden">
                    <div className="relative size-36 flex items-center justify-center">
                      <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          stroke="#E8E1D6"
                          strokeWidth="10"
                          fill="transparent"
                          opacity="0.6"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          stroke="#3D5C4A"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 48}
                          strokeDashoffset={
                            2 * Math.PI * 48 * (1 - progressPct / 100)
                          }
                          strokeLinecap="round"
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="font-serif text-3xl font-bold text-[#1F2A44] tabular-nums">
                          {progressPct.toFixed(0)}%
                        </span>
                        <span className="text-[10px] font-semibold text-[#3D5C4A] uppercase tracking-wider">
                          funded
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="font-serif text-sm font-medium text-[#1F2A44]">
                        {goal.name}
                      </p>
                      <p className="text-xs text-[#475467] tabular-nums">
                        {money(goal.currentSavings)} / {money(goal.targetAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Next Steps Checklist (Board 07) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-[#1F2A44] uppercase tracking-wider">
                      Recommended Next Steps
                    </h4>

                    {[
                      {
                        key: "step_contribution",
                        title: "Make your next contribution",
                        subtitle: `Recommended: ${money(goal.monthlyContribution)}`,
                        action: () => setShowAddContribution(true),
                        actionLabel: "Add now",
                      },
                      {
                        key: "step_plan",
                        title: "Review and adjust your plan",
                        subtitle: "See updated household cash flow projections",
                        href: "/dashboard/plan",
                        actionLabel: "View plan",
                      },
                      {
                        key: "step_tax",
                        title: "Explore tax-saving options",
                        subtitle: "Learn how to optimize Section 80C & NPS for this goal",
                      },
                      {
                        key: "step_reminders",
                        title: "Set up reminders",
                        subtitle: "Stay consistent with monthly SIP deposits",
                      },
                    ].map((step) => {
                      const isDone = completedSteps[step.key];
                      return (
                        <div
                          key={step.key}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-[#E8E1D6] bg-white transition-all hover:bg-[#FFFDF9]"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => toggleStep(step.key)}
                              className={cn(
                                "size-5 rounded-md flex items-center justify-center border transition-colors mt-0.5 shrink-0",
                                isDone
                                  ? "bg-[#3D5C4A] border-[#3D5C4A] text-white"
                                  : "border-[#D0D5DD] bg-white hover:border-[#5E55C9]"
                              )}
                              aria-label={`Mark step ${step.title}`}
                            >
                              {isDone && <Check className="size-3.5 stroke-[3]" />}
                            </button>
                            <div>
                              <p
                                className={cn(
                                  "text-xs font-semibold text-[#1F2A44]",
                                  isDone && "line-through text-[#475467]"
                                )}
                              >
                                {step.title}
                              </p>
                              <p className="text-[11px] text-[#475467]">
                                {step.subtitle}
                              </p>
                            </div>
                          </div>

                          {step.action && !isDone && (
                            <button
                              type="button"
                              onClick={step.action}
                              className="px-2.5 py-1 rounded-lg bg-[#5E55C9] text-white text-[11px] font-medium hover:bg-[#4d45b5] shrink-0"
                            >
                              {step.actionLabel}
                            </button>
                          )}
                          {step.href && !isDone && (
                            <Link
                              href={step.href}
                              className="px-2.5 py-1 rounded-lg border border-[#5E55C9] text-[#5E55C9] text-[11px] font-medium hover:bg-[#5E55C9]/5 shrink-0"
                            >
                              {step.actionLabel}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTRIBUTIONS (Board 05) */}
          {activeTab === "contributions" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-2xl font-normal text-[#1F2A44]">
                      Contribution history
                    </h3>
                    <p className="text-xs text-[#475467] mt-0.5">
                      Every contribution brings you closer to your dream.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-[#475467] bg-[#FFF9F0] px-3 py-1.5 rounded-full border border-[#E8E1D6]">
                      Last 6 months ⌄
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddContribution(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5E55C9] text-white text-xs font-semibold hover:bg-[#4d45b5] shadow-xs"
                    >
                      <Plus className="size-3.5" /> Add contribution
                    </button>
                  </div>
                </div>

                {/* 6-Month Contribution Bar Chart with Labeled Axes (Board 05) */}
                <div className="p-5 rounded-2xl bg-gradient-to-b from-[#FFFDF9] to-[#F7F2EA] border border-[#E8E1D6] space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-[#475467]">
                    <span>Monthly deposits (INR)</span>
                    <span className="text-[#3D5C4A] font-semibold">
                      Disciplined compounding
                    </span>
                  </div>

                  <div className="h-44 w-full flex items-end justify-between gap-3 pt-4 pb-2 border-b border-[#E8E1D6]">
                    {[
                      { month: "Jan", amount: 10000, height: 40 },
                      { month: "Feb", amount: 10000, height: 40 },
                      { month: "Mar", amount: 15000, height: 60 },
                      { month: "Apr", amount: 12000, height: 48 },
                      { month: "May", amount: 15000, height: 60 },
                      { month: "Jun", amount: 18000, height: 72 },
                      { month: "Jul", amount: 20000, height: 80 },
                      { month: "Aug", amount: 25000, height: 100 },
                    ].map((item) => (
                      <div
                        key={item.month}
                        className="flex-1 flex flex-col items-center gap-1.5 group relative"
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1F2A44] text-white text-[10px] px-2 py-0.5 rounded-md pointer-events-none whitespace-nowrap shadow-xs">
                          ₹{item.amount.toLocaleString("en-IN")}
                        </div>

                        <div
                          className="w-full max-w-[36px] bg-[#5E55C9] rounded-t-lg transition-all duration-300 group-hover:bg-[#4d45b5] group-hover:brightness-110"
                          style={{ height: `${item.height}%` }}
                        />
                        <span className="text-[10px] text-[#475467] font-medium">
                          {item.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Contributions List */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold text-[#1F2A44] uppercase tracking-wider">
                    Recent Contributions
                  </h4>

                  {contributionsList.length === 0 ? (
                    <p className="text-xs text-[#475467] py-4 text-center">
                      No manual contributions logged yet. Click &quot;Add contribution&quot; above to log your first deposit!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {contributionsList.slice(0, 8).map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-3 rounded-2xl border border-[#E8E1D6] bg-white text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-[#3D5C4A]/10 text-[#3D5C4A] flex items-center justify-center shrink-0">
                              <Check className="size-4 stroke-[2.5]" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#1F2A44]">
                                {c.note || "SIP Contribution"}
                              </p>
                              <span className="text-[11px] text-[#475467]">
                                {date(c.date)}
                              </span>
                            </div>
                          </div>

                          <span className="font-serif font-bold text-sm text-[#3D5C4A] tabular-nums">
                            +{money(c.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MILESTONES */}
          {activeTab === "milestones" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 shadow-xs space-y-4">
                <h3 className="font-serif text-2xl font-normal text-[#1F2A44]">
                  Goal Milestones
                </h3>
                <p className="text-xs text-[#475467]">
                  Track progress across 25%, 50%, 75%, and 100% funding stages.
                </p>

                <div className="space-y-3 pt-2">
                  {[0.25, 0.5, 0.75, 1.0].map((pct, idx) => {
                    const milestoneAmt = targetNum * pct;
                    const isReached = savedNum >= milestoneAmt;
                    const isNext = !isReached && savedNum >= targetNum * (pct - 0.25);
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border transition-all",
                          isReached
                            ? "border-[#3D5C4A]/30 bg-[#3D5C4A]/5"
                            : isNext
                              ? "border-[#5E55C9] bg-[#5E55C9]/5"
                              : "border-[#E8E1D6] bg-white opacity-70"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "size-8 rounded-full flex items-center justify-center text-xs font-semibold",
                              isReached
                                ? "bg-[#3D5C4A] text-white"
                                : isNext
                                  ? "bg-[#5E55C9] text-white ring-4 ring-[#5E55C9]/20"
                                  : "bg-[#E8E1D6] text-[#475467]"
                            )}
                          >
                            {isReached ? <Check className="size-4 stroke-[3]" /> : idx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#1F2A44]">
                              {(pct * 100).toFixed(0)}% Milestone: {money(milestoneAmt.toFixed(2))}
                            </p>
                            <span className="text-[11px] text-[#475467]">
                              {isReached
                                ? "Milestone Achieved!"
                                : isNext
                                  ? "Current Target"
                                  : "Upcoming Milestone"}
                            </span>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "text-xs font-semibold",
                            isReached
                              ? "text-[#3D5C4A]"
                              : isNext
                                ? "text-[#5E55C9]"
                                : "text-[#475467]"
                          )}
                        >
                          {isReached ? "Completed ✓" : isNext ? "In Progress" : "Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INSIGHTS */}
          {activeTab === "insights" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-[#5E55C9]">
                  <Sparkles className="size-5" />
                  <h3 className="font-serif text-2xl font-normal text-[#1F2A44]">
                    AI Planning Engine Diagnostics
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#E8E1D6] text-xs space-y-2">
                  <p className="font-semibold text-[#1F2A44]">
                    Engine Feasibility:{" "}
                    <span className="capitalize text-[#3D5C4A]">
                      {feasibilityResult?.result?.feasibility || "Feasible"}
                    </span>
                  </p>
                  <p className="text-[#475467]">
                    Calculated using standard compounding principles with regular monthly cash flow allocations. Your monthly capacity is tested across essential expenses and emergency buffers.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl border border-[#E8E1D6] bg-white space-y-1">
                    <span className="text-[#475467]">Expected Return Used:</span>
                    <p className="text-lg font-serif font-semibold text-[#1F2A44]">
                      {feasibilityResult?.result?.expectedReturnUsed || "12.0"}% p.a.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-[#E8E1D6] bg-white space-y-1">
                    <span className="text-[#475467]">Inflation Rate Used:</span>
                    <p className="text-lg font-serif font-semibold text-[#1F2A44]">
                      {inflationUsed}% p.a.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/dashboard/plan"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5E55C9] text-white text-xs font-semibold hover:bg-[#4d45b5] transition-colors"
                  >
                    Launch Full Scenario Simulation →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (35% Column) - Quick Actions, About Goal, and Management */}
        <div className="space-y-6">
          {/* About this goal panel */}
          <div className="rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium text-[#1F2A44]">
                About this goal
              </h3>
              <button
                type="button"
                onClick={() => setEditing(!editing)}
                className="text-xs font-semibold text-[#5E55C9] hover:underline"
              >
                {editing ? "Cancel" : "Edit goal"}
              </button>
            </div>

            {editing ? (
              <div className="pt-2">
                <GoalForm goal={goal} onSaved={() => setEditing(false)} />
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[#475467]">
                <p className="leading-relaxed">
                  Targeting {money(goal.targetAmount)} by {date(goal.targetDate)} to secure our family’s future milestones with disciplined compounding.
                </p>

                <div className="pt-3 border-t border-[#E8E1D6]/70 space-y-2">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-semibold text-[#1F2A44] capitalize">
                      {goal.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly SIP:</span>
                    <span className="font-semibold text-[#5E55C9] tabular-nums">
                      {money(goal.monthlyContribution)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Date:</span>
                    <span className="font-semibold text-[#1F2A44]">
                      {date(goal.targetDate)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions (Board 04) */}
          <div className="rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 shadow-xs space-y-3">
            <h4 className="text-xs font-semibold text-[#1F2A44] uppercase tracking-wider">
              Quick actions
            </h4>

            <button
              type="button"
              onClick={() => setShowAddContribution(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#5E55C9] text-white text-xs font-semibold hover:bg-[#4d45b5] transition-colors shadow-xs"
            >
              <Plus className="size-4" /> Add contribution
            </button>

            <Link
              href="/dashboard/plan"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#E8E1D6] bg-white text-[#1F2A44] hover:bg-[#FFFDF9] text-xs font-semibold transition-colors"
            >
              Adjust plan &amp; assumptions
            </Link>
          </div>

          {/* Manage Goal: Archive / Delete */}
          <div className="rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 shadow-xs space-y-3">
            <h4 className="text-xs font-semibold text-[#1F2A44] uppercase tracking-wider">
              Manage Goal
            </h4>

            {deleteError && (
              <p className="text-xs text-[#A13F39] bg-[#FFF9F0] p-2 rounded-lg border border-[#A13F39]">
                {deleteError}
              </p>
            )}

            {confirmDelete ? (
              <div className="space-y-3 text-xs">
                <p className="text-[#344054]">
                  Remove this active goal? Existing saved plan snapshots will preserve their historical records.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={deletePending}
                    onClick={handleDeleteGoal}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#A13F39] text-white text-xs font-semibold hover:bg-[#8e3732] transition-colors"
                  >
                    {deletePending ? "Removing…" : "Confirm removal"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="py-2 px-3 rounded-xl border border-[#E8E1D6] text-xs font-semibold hover:bg-[#FFFDF9]"
                  >
                    Keep goal
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#A13F39]/30 text-[#A13F39] hover:bg-[#A13F39]/10 text-xs font-semibold transition-colors"
              >
                <Trash2 className="size-3.5" /> Remove goal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Contribution Modal */}
      {showAddContribution && (
        <AddContributionModal
          goal={goal}
          isOpen={showAddContribution}
          onClose={() => setShowAddContribution(false)}
        />
      )}
    </div>
  );
}
