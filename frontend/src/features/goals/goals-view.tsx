"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Target,
  Plus,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useGoals, useFeasibility, type Goal } from "@/features/planner/planning-queries";
import { ErrorNotice, Loading, money } from "@/features/planner/ui";
import { cn } from "@/lib/utils";
import type { GoalFilterTab } from "./types";
import { GoalCard, getGoalCardState } from "./components/goal-card";
import { AddGoalModal } from "./components/add-goal-modal";
import { MilestonesPanel } from "./components/milestones-panel";
import { AiSuggestionsPanel } from "./components/ai-suggestions-panel";
import { GoalCtaFooter } from "./components/goal-cta-footer";
import { GoalDetailWorkspace } from "./components/goal-detail-workspace";

export { GoalForm } from "./components/goal-form";

export function Goals({ onboarding = false }: { onboarding?: boolean }) {
  const query = useGoals();
  const feasibility = useFeasibility();
  const [filter, setFilter] = useState<GoalFilterTab>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [presetCategory, setPresetCategory] = useState<Goal["category"]>("home");
  const [presetName, setPresetName] = useState("Buy a Home");

  const goals = query.data ?? [];
  const canAddGoal = goals.length < 3;

  // Compute card state counts
  const inProgressCount = goals.filter(
    (g) => getGoalCardState(g) === "in_progress"
  ).length;
  const notStartedCount = goals.filter(
    (g) => getGoalCardState(g) === "not_started"
  ).length;
  const completedCount = goals.filter(
    (g) => getGoalCardState(g) === "completed"
  ).length;

  const totalTarget = goals.reduce((acc, g) => acc + (Number(g.targetAmount) || 0), 0);
  const totalSavings = goals.reduce((acc, g) => acc + (Number(g.currentSavings) || 0), 0);
  const overallProgressPct =
    totalTarget > 0 ? Math.min(100, Math.round((totalSavings / totalTarget) * 100)) : 0;
  const totalMonthlyContribution = goals.reduce(
    (acc, g) => acc + (Number(g.monthlyContribution) || 0),
    0
  );

  // Filtered goals
  const filteredGoals = goals.filter((g) => {
    if (filter === "all") return true;
    return getGoalCardState(g) === filter;
  });

  const handleOpenAddModal = (
    category: Goal["category"] = "home",
    name: string = "Buy a Home"
  ) => {
    setPresetCategory(category);
    setPresetName(name);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-9">
      {/* Board 01 #01: Hero Banner */}
      {!onboarding && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-[#FFF9F0] to-[#F5EFE6] border border-[#E8E1D6] p-6 lg:p-8 shadow-xs">
          {/* Decorative botanical corner accent */}
          <div className="pointer-events-none absolute -top-6 -right-6 size-36 sm:size-44 opacity-25 rotate-45 select-none">
            <Image
              src="/Assets/Botanical/asset_026.png"
              alt=""
              fill
              className="object-contain"
              sizes="176px"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 relative z-10">
            {/* Left Content Area (5 cols) */}
            <div className="space-y-4 lg:col-span-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5E55C9]/10 text-[#5E55C9] text-xs font-semibold">
                <Target className="size-3.5" />
                <span>Your financial goals</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl text-[#1F2A44] leading-tight font-normal">
                Dream bigger. <br className="hidden sm:inline" />
                Plan smarter.
              </h1>

              <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">
                Turn your life dreams into funded roadmaps.{" "}
                <span className="italic font-serif text-[#7D5200]">
                  &ldquo;A brighter tomorrow starts with clear goals.&rdquo;
                </span>
              </p>

              {/* Action Buttons */}
              <div className="pt-1 flex flex-wrap items-center gap-3">
                {canAddGoal ? (
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5E55C9] text-white text-xs font-semibold hover:bg-[#4d45b5] transition-colors shadow-xs"
                  >
                    <Plus className="size-4" /> Add a new goal
                  </button>
                ) : (
                  <span className="text-xs text-[#7D5200] bg-white px-3 py-1.5 rounded-xl border border-[#E8E1D6]">
                    3 active goals (maximum capacity)
                  </span>
                )}
                <Link
                  href="/dashboard/plan"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E8E1D6] bg-white text-[#1F2A44] text-xs font-semibold hover:bg-[#FFFDF9] transition-colors shadow-2xs"
                >
                  View Plan Projections <ArrowRight className="size-3.5" />
                </Link>
              </div>

              {/* Live Portfolio Progress Ribbon */}
              {goals.length > 0 && (
                <div className="pt-1.5">
                  <div className="rounded-2xl border border-[#E8E1D6]/90 bg-white/80 p-3.5 shadow-2xs backdrop-blur-xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#475467]">Total Portfolio Funded</span>
                      <span className="font-semibold text-[#1F2A44] tabular-nums">
                        {money(String(totalSavings))} <span className="text-[10px] font-normal text-[#717680]">of {money(String(totalTarget))}</span>
                      </span>
                    </div>

                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#E8E1D6]/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#5E55C9] to-[#3D5C4A] transition-all duration-500"
                        style={{ width: `${overallProgressPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#717680]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-[#3D5C4A]" />
                        <span className="font-medium text-[#3D5C4A]">{overallProgressPct}% Funded</span>
                      </span>
                      <span>
                        <strong className="text-[#1F2A44]">{goals.length}/3</strong> goals active · <span className="font-medium text-[#1F2A44]">{money(String(totalMonthlyContribution))}/mo</span> SIP
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: From Seed to Dream Visual Growth Showcase (7 cols) */}
            <div className="lg:col-span-7">
              <div className="relative rounded-2xl border border-[#E8E1D6] bg-white/85 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
                {/* Header label */}
                <div className="flex items-center justify-between border-b border-[#E8E1D6]/70 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-[#3D5C4A]/10 text-[#3D5C4A]">
                      <Sparkles className="size-3.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-semibold text-[#1F2A44]">
                        The Compounding Journey
                      </h3>
                      <p className="text-[10px] text-[#717680]">
                        From small monthly seeds to life-changing dreams
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#FFF9F0] border border-[#E8E1D6] px-2.5 py-0.5 text-[10px] font-serif italic text-[#7D5200]">
                    Small steps · Big freedom
                  </span>
                </div>

                {/* 3-Step Milestone Progression */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                  {/* Step 1: Plant the Seed */}
                  <div className="group relative rounded-xl border border-[#E8E1D6]/70 bg-gradient-to-b from-[#FFFDF9] to-[#FAF8F5] p-3 text-center transition-all hover:border-[#5E55C9]/40 hover:shadow-xs">
                    <div className="relative mx-auto size-16 sm:size-20 mb-2 flex items-center justify-center">
                      <Image
                        src="/Assets/Jars And Coins/plant_in_jar.png"
                        alt="Start Small"
                        fill
                        className="object-contain transition-transform group-hover:scale-105"
                        sizes="80px"
                      />
                    </div>
                    <span className="inline-block rounded-full bg-[#5E55C9]/10 px-2 py-0.5 text-[9px] font-semibold text-[#5E55C9] mb-1">
                      Stage 1 · Seed
                    </span>
                    <h4 className="text-xs font-semibold text-[#1F2A44]">Plant the Seed</h4>
                    <p className="mt-0.5 text-[10px] text-[#717680]">
                      Small ₹2k–₹10k SIPs & emergency buffer
                    </p>
                  </div>

                  {/* Step 2: Milestone Win */}
                  <div className="group relative rounded-xl border border-[#E8E1D6]/70 bg-gradient-to-b from-[#FFFDF9] to-[#FAF8F5] p-3 text-center transition-all hover:border-[#5E55C9]/40 hover:shadow-xs">
                    <div className="relative mx-auto size-16 sm:size-20 mb-2 flex items-center justify-center">
                      <Image
                        src="/Assets/Characters/car_savings_jar.png"
                        alt="Milestone Win"
                        fill
                        className="object-contain transition-transform group-hover:scale-105"
                        sizes="80px"
                      />
                    </div>
                    <span className="inline-block rounded-full bg-[#3B5B8C]/10 px-2 py-0.5 text-[9px] font-semibold text-[#3B5B8C] mb-1">
                      Stage 2 · Momentum
                    </span>
                    <h4 className="text-xs font-semibold text-[#1F2A44]">Milestone Wins</h4>
                    <p className="mt-0.5 text-[10px] text-[#717680]">
                      Bullet bike, car, travel, & upskilling
                    </p>
                  </div>

                  {/* Step 3: Anchor Dream */}
                  <div className="group relative rounded-xl border border-[#E8E1D6]/70 bg-gradient-to-b from-[#FFFDF9] to-[#FAF8F5] p-3 text-center transition-all hover:border-[#3D5C4A]/40 hover:shadow-xs">
                    <div className="relative mx-auto size-16 sm:size-20 mb-2 flex items-center justify-center">
                      <Image
                        src="/Assets/Houses/savings_jar_home.png"
                        alt="The Anchor Dream"
                        fill
                        className="object-contain transition-transform group-hover:scale-105"
                        sizes="80px"
                      />
                    </div>
                    <span className="inline-block rounded-full bg-[#3D5C4A]/10 px-2 py-0.5 text-[9px] font-semibold text-[#3D5C4A] mb-1">
                      Stage 3 · Freedom
                    </span>
                    <h4 className="text-xs font-semibold text-[#1F2A44]">The Anchor Dream</h4>
                    <p className="mt-0.5 text-[10px] text-[#717680]">
                      First home down payment & retirement
                    </p>
                  </div>
                </div>

                {/* Micro-insight bottom bar */}
                <div className="mt-3 flex items-center justify-between rounded-lg bg-[#FAF8F5] px-3 py-1.5 text-[10px] text-[#475467] border border-[#E8E1D6]/50">
                  <span className="flex items-center gap-1.5 font-medium text-[#1F2A44]">
                    <span className="text-[#3D5C4A] font-bold">✓</span> Consistency beats timing
                  </span>
                  <span className="text-[#717680]">
                    Every monthly contribution grows your tomorrow
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Query Status */}
      <ErrorNotice error={query.error} retry={() => void query.refetch()} />
      {query.isPending && <Loading />}

      {/* Capacity Warning Banner */}
      {feasibility.data?.overAllocated && (
        <div
          role="status"
          className="rounded-2xl border border-[#7D5200] bg-[#FFF9F0] p-5 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-[#7D5200] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#1F2A44]">Capacity Attention</h3>
              <p className="mt-1 text-sm text-[#344054]">
                Your contributions exceed available monthly capacity. Review your goal contributions or monthly cash flow in the planner.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Board 01 & 02: Status Filter Tabs & Header */}
      {!onboarding && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E1D6] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All", count: goals.length },
              { id: "in_progress", label: "In progress", count: inProgressCount },
              { id: "not_started", label: "Not started", count: notStartedCount },
              { id: "completed", label: "Completed", count: completedCount },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id as GoalFilterTab)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all",
                  filter === t.id
                    ? "bg-[#5E55C9] text-white font-semibold shadow-xs"
                    : "bg-[#FFFCF8] text-[#475467] border border-[#E8E1D6] hover:bg-[#FFF9F0] hover:text-[#1F2A44]"
                )}
              >
                <span>{t.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    filter === t.id
                      ? "bg-white/20 text-white"
                      : "bg-[#E8E1D6]/60 text-[#475467]"
                  )}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-[#475467]">
            <span className="font-serif italic text-[#7D5200]">
              &ldquo;Small steps create big freedoms.&rdquo;
            </span>
            {canAddGoal && (
              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#5E55C9] hover:underline"
              >
                <Plus className="size-3.5" /> Add goal
              </button>
            )}
          </div>
        </div>
      )}

      {/* Board 01 & 02: Goal Cards Grid */}
      {filteredGoals.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[#E8E1D6] bg-[#FFFCF8] p-10 text-center space-y-3">
          <p className="font-serif text-lg text-[#1F2A44]">
            {goals.length === 0
              ? "Start with a goal you care about."
              : `No goals found in "${filter.replace("_", " ")}"`}
          </p>
          <p className="text-xs text-[#475467]">
            {goals.length === 0
              ? "Pick a dream like buying a home, planning travel, or an emergency reserve."
              : "Try switching to another filter tab or add a new goal."}
          </p>
          {goals.length === 0 && canAddGoal && (
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5E55C9] text-white text-xs font-semibold hover:bg-[#4d45b5]"
            >
              <Plus className="size-3.5" /> Create your first goal
            </button>
          )}
        </div>
      )}

      {/* 3-Goal Limit Info Banner */}
      {goals.length >= 3 && (
        <div className="p-4 rounded-2xl border border-[#E8E1D6] bg-[#FFF9F0]/60 text-xs text-[#475467] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[#3D5C4A]" />
            <span>
              You have three active goals. Remove one before adding another.
            </span>
          </div>
          <Link
            href="/dashboard/plan"
            className="text-xs font-semibold text-[#5E55C9] hover:underline shrink-0"
          >
            Review Plan Allocations
          </Link>
        </div>
      )}

      {/* Board 08: Milestones keep you motivated */}
      <MilestonesPanel
        currentSavingsTotal={totalSavings}
        targetSavingsTotal={totalTarget}
      />

      {/* Board 06: AI Insights & Goal Suggestions */}
      <AiSuggestionsPanel
        onAddSuggested={(cat, n) => handleOpenAddModal(cat, n)}
        canAddGoal={canAddGoal}
      />

      {/* Board 09: Goal CTA / Footer Helper */}
      <GoalCtaFooter
        onAddGoal={() => handleOpenAddModal()}
        canAddGoal={canAddGoal}
      />

      {/* Board 03: 4-Step Add Goal Modal Wizard */}
      {isAddModalOpen && (
        <AddGoalModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          initialCategory={presetCategory}
          initialName={presetName}
        />
      )}
    </div>
  );
}

export function GoalDetail({ id }: { id: string }) {
  return <GoalDetailWorkspace id={id} />;
}
