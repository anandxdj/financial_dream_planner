"use client";

import { Check, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MilestoneItem } from "../types";

const DEFAULT_MILESTONES: MilestoneItem[] = [
  { step: 1, amountFormatted: "₹ 1 Lakh", label: "Achieved", date: "Mar 2024", state: "done" },
  { step: 2, amountFormatted: "₹ 3 Lakh", label: "Achieved", date: "Jul 2024", state: "done" },
  { step: 3, amountFormatted: "₹ 5 Lakh", label: "In Progress", date: "Target 2025", state: "current" },
  { step: 4, amountFormatted: "₹ 10 Lakh", label: "Upcoming", date: "Target 2027", state: "upcoming" },
  { step: 5, amountFormatted: "₹ 20 Lakh", label: "Upcoming", date: "Target 2030", state: "upcoming" },
];

interface MilestoneConfig {
  targetAmount: number;
  label: string;
}

function formatIndianCurrency(amount: number): string {
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹ ${cr % 1 === 0 ? cr : cr.toFixed(1)} Crore`;
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return `₹ ${lakh % 1 === 0 ? lakh : lakh.toFixed(1)} Lakh`;
  }
  return `₹ ${amount.toLocaleString("en-IN")}`;
}

function getMilestoneConfigs(targetSavingsTotal: number): MilestoneConfig[] {
  if (targetSavingsTotal > 0 && targetSavingsTotal <= 1500000) {
    // Scaled for moderate targets (e.g. Rohit Verma ~12.5L)
    return [
      { targetAmount: 50000, label: "Starter Pad" },
      { targetAmount: 100000, label: "First 1 Lakh" },
      { targetAmount: 250000, label: "Bike / 2.5L" },
      { targetAmount: 600000, label: "Halfway Point" },
      { targetAmount: 1200000, label: "Home Fund" },
    ];
  }

  if (targetSavingsTotal > 5000000) {
    // Scaled for high targets (e.g. Anand Sharma ~2.05 Cr)
    return [
      { targetAmount: 500000, label: "Kickoff 5L" },
      { targetAmount: 1500000, label: "Solid Foundation" },
      { targetAmount: 2500000, label: "Quarter Way" },
      { targetAmount: 5000000, label: "Half-Crore" },
      { targetAmount: 10000000, label: "1 Crore Milestone" },
    ];
  }

  // Mid target (15L - 50L) or general default
  return [
    { targetAmount: 100000, label: "First 1 Lakh" },
    { targetAmount: 300000, label: "Momentum" },
    { targetAmount: 500000, label: "5 Lakh Club" },
    { targetAmount: 1000000, label: "Double Digits" },
    { targetAmount: 2000000, label: "Major Target" },
  ];
}

function deriveMilestones(
  currentSavings: number,
  targetSavings: number
): { milestones: MilestoneItem[]; currentStepProgress: number } {
  const configs = getMilestoneConfigs(targetSavings);
  let firstUnfinishedFound = false;
  let currentStepProgress = 50;

  const milestones: MilestoneItem[] = configs.map((cfg, idx) => {
    const isDone = currentSavings >= cfg.targetAmount;
    let state: "done" | "current" | "upcoming";
    let statusLabel: string;
    let caption: string;

    if (isDone) {
      state = "done";
      statusLabel = "Achieved";
      caption = "Milestone reached";
    } else if (!firstUnfinishedFound) {
      firstUnfinishedFound = true;
      state = "current";
      statusLabel = "In Progress";
      const pct = Math.min(99, Math.max(1, Math.round((currentSavings / cfg.targetAmount) * 100)));
      currentStepProgress = pct;
      caption = `${pct}% funded`;
    } else {
      state = "upcoming";
      statusLabel = "Upcoming";
      caption = cfg.label;
    }

    return {
      step: idx + 1,
      amountFormatted: formatIndianCurrency(cfg.targetAmount),
      label: statusLabel,
      date: caption,
      state,
    };
  });

  return { milestones, currentStepProgress };
}

export interface MilestonesPanelProps {
  milestones?: MilestoneItem[];
  currentSavingsTotal?: number;
  targetSavingsTotal?: number;
}

export function MilestonesPanel({
  milestones: propMilestones,
  currentSavingsTotal,
  targetSavingsTotal,
}: MilestonesPanelProps) {
  let activeMilestones = propMilestones ?? DEFAULT_MILESTONES;
  let currentStepProgress = 60;

  if (!propMilestones && (currentSavingsTotal !== undefined || targetSavingsTotal !== undefined)) {
    const derived = deriveMilestones(currentSavingsTotal ?? 0, targetSavingsTotal ?? 0);
    activeMilestones = derived.milestones;
    currentStepProgress = derived.currentStepProgress;
  }

  const achievedCount = activeMilestones.filter((m) => m.state === "done").length;
  const hasCurrent = activeMilestones.some((m) => m.state === "current");

  // Calculate stepper track line progression percentage
  let progressTrackPct = 0;
  if (achievedCount >= activeMilestones.length) {
    progressTrackPct = 100;
  } else if (activeMilestones.length > 1) {
    const segmentWidth = 100 / (activeMilestones.length - 1);
    const baseProgress = Math.max(0, achievedCount - 1) * segmentWidth;
    const currentBoost = hasCurrent ? segmentWidth * (currentStepProgress / 100) : 0;
    progressTrackPct = Math.min(
      100,
      Math.max(0, achievedCount === 0 ? (hasCurrent ? segmentWidth * 0.2 : 0) : baseProgress + currentBoost)
    );
  }

  return (
    <div className="rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 sm:p-7 shadow-xs">
      {/* Header & Motivational Quote */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#5E55C9]/10 text-[#5E55C9] text-[11px] font-semibold mb-1">
            <Sparkles className="size-3" />
            <span>Milestone Tracker</span>
          </div>
          <h3 className="font-serif text-2xl font-normal text-[#1F2A44]">
            Milestones keep you motivated
          </h3>
          <p className="text-xs text-[#475467] mt-0.5">
            Celebrate the small wins on your way to bigger dreams.
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="font-serif italic text-xs text-[#7D5200] block">
            &ldquo;A little progress each day adds up to big results.&rdquo;
          </span>
          <span className="text-[11px] font-medium text-[#475467] mt-0.5 block">
            <strong className="text-[#1F2A44] font-semibold">{achievedCount}</strong> of{" "}
            <strong className="text-[#1F2A44] font-semibold">{activeMilestones.length}</strong> milestones achieved
          </span>
        </div>
      </div>

      {/* Stepper Section */}
      <div className="space-y-4">
        {/* Dedicated Stepper Track Row (Desktop only - clean line behind node circles) */}
        <div className="relative hidden sm:block py-2">
          {/* Background connector line */}
          <div className="absolute top-1/2 -translate-y-1/2 left-[10%] right-[10%] h-0.5 bg-[#E8E1D6]">
            {/* Active progress fill */}
            <div
              className="h-full bg-gradient-to-r from-[#3D5C4A] to-[#5E55C9] transition-all duration-500 rounded-full"
              style={{ width: `${progressTrackPct}%` }}
            />
          </div>

          {/* Stepper Nodes Centered in 5 Columns */}
          <div className="grid grid-cols-5 relative z-10">
            {activeMilestones.map((m) => (
              <div key={m.step} className="flex justify-center">
                <div
                  className={cn(
                    "size-8 rounded-full flex items-center justify-center text-xs font-semibold ring-4 ring-[#FFFCF8] transition-all",
                    m.state === "done"
                      ? "bg-[#3D5C4A] text-white shadow-xs"
                      : m.state === "current"
                        ? "bg-[#5E55C9] text-white ring-4 ring-[#5E55C9]/20 shadow-xs"
                        : "bg-[#F2ECE4] text-[#717680]"
                  )}
                >
                  {m.state === "done" ? (
                    <Check className="size-4 stroke-[3]" />
                  ) : (
                    <span>{m.step}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone Cards Row (Clean boxes completely separated from stepper line) */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {activeMilestones.map((m) => (
            <div
              key={m.step}
              className={cn(
                "flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all text-left relative",
                m.state === "current"
                  ? "border-[#5E55C9]/50 bg-gradient-to-b from-[#5E55C9]/[0.06] to-transparent shadow-xs ring-1 ring-[#5E55C9]/20"
                  : m.state === "done"
                    ? "border-[#3D5C4A]/25 bg-gradient-to-b from-[#3D5C4A]/[0.04] to-transparent"
                    : "border-[#E8E1D6] bg-[#FFFDF9]/60 opacity-80"
              )}
            >
              <div>
                {/* Top card header: mobile step circle & status chip */}
                <div className="flex items-center justify-between gap-1.5 mb-2.5">
                  <div
                    className={cn(
                      "sm:hidden size-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      m.state === "done"
                        ? "bg-[#3D5C4A] text-white"
                        : m.state === "current"
                          ? "bg-[#5E55C9] text-white"
                          : "bg-[#E8E1D6] text-[#717680]"
                    )}
                  >
                    {m.state === "done" ? <Check className="size-3 stroke-[3]" /> : m.step}
                  </div>

                  {/* Status chip */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase",
                      m.state === "done"
                        ? "bg-[#3D5C4A]/10 text-[#3D5C4A]"
                        : m.state === "current"
                          ? "bg-[#5E55C9]/10 text-[#5E55C9]"
                          : "bg-[#E8E1D6]/50 text-[#717680]"
                    )}
                  >
                    {m.state === "current" && (
                      <span className="size-1.5 rounded-full bg-[#5E55C9] animate-pulse" />
                    )}
                    {m.label}
                  </span>

                  <span className="hidden sm:inline text-[10px] font-medium text-[#717680]">
                    Step {m.step}
                  </span>
                </div>

                {/* Amount */}
                <div className="space-y-0.5">
                  <p className="font-serif text-base sm:text-lg font-semibold text-[#1F2A44] tabular-nums tracking-tight">
                    {m.amountFormatted}
                  </p>
                  <p className="text-[11px] text-[#717680] leading-snug">
                    {m.date}
                  </p>
                </div>
              </div>

              {/* Bottom State-specific Badges & Indicators */}
              {m.state === "current" && (
                <div className="mt-3 pt-2.5 border-t border-[#5E55C9]/15">
                  <div className="flex items-center justify-between text-[10px] text-[#5E55C9] font-medium mb-1">
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp className="size-3" />
                      <span>Current Focus</span>
                    </span>
                    <span className="tabular-nums font-semibold">{currentStepProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#5E55C9]/15 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#5E55C9] transition-all duration-500"
                      style={{ width: `${currentStepProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {m.state === "done" && (
                <div className="mt-3 pt-2.5 border-t border-[#3D5C4A]/15 flex items-center gap-1 text-[10px] text-[#3D5C4A] font-medium">
                  <Check className="size-3 stroke-[2.5]" />
                  <span>Completed</span>
                </div>
              )}

              {m.state === "upcoming" && (
                <div className="mt-3 pt-2.5 border-t border-[#E8E1D6]/60 text-[10px] text-[#717680]">
                  <span>Next horizon</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
