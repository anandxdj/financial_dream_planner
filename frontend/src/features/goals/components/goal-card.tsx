"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import type { Goal } from "@/features/planner/planning-queries";
import { money } from "@/features/planner/ui";
import { cn } from "@/lib/utils";
import type { GoalCardState } from "../types";

export const CATEGORY_IMAGES: Record<string, string> = {
  home: "/Assets/Houses/cozy_first_home.png",
  car: "/Assets/Characters/purple_car_front.png",
  travel: "/Assets/Objects/beach_chair_sea.png",
  education: "/Assets/Piggy Banks/graduate_piggy_bank.png",
  savings: "/Assets/Jars And Coins/coins_in_jar.png",
  medical: "/Assets/Assets/cash_bundle_download.png",
  retirement: "/Assets/Houses/premium_home.png",
  custom: "/Assets/Cards/ai_insight_card.png",
};

export function getGoalCardState(goal: Goal): GoalCardState {
  const target = Number(goal.targetAmount) || 0;
  const saved = Number(goal.currentSavings) || 0;
  if (saved <= 0) return "not_started";
  if (target > 0 && saved >= target) return "completed";
  return "in_progress";
}

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const targetNum = Number(goal.targetAmount) || 0;
  const savedNum = Number(goal.currentSavings) || 0;
  const progressPct =
    targetNum > 0 ? Math.min(100, Math.max(0, (savedNum / targetNum) * 100)) : 0;
  const state = getGoalCardState(goal);
  const imageSrc = CATEGORY_IMAGES[goal.category] || CATEGORY_IMAGES.custom;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-3xl border bg-[#FFFCF8] p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        state === "completed"
          ? "border-[#3D5C4A]/30 bg-gradient-to-b from-[#FFFCF8] to-[#F4F8F5]"
          : "border-[#E8E1D6]"
      )}
    >
      <div>
        {/* Top Header: State Pill Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {state === "not_started" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F0F4F8] text-[#475467] border border-[#D0D5DD]/80">
              Not started
            </span>
          )}
          {state === "in_progress" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#5E55C9]/10 text-[#5E55C9] border border-[#5E55C9]/20">
              <span className="size-1.5 rounded-full bg-[#5E55C9] animate-pulse" />
              In progress
            </span>
          )}
          {state === "completed" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#3D5C4A]/10 text-[#3D5C4A] border border-[#3D5C4A]/30">
              <Check className="size-3 stroke-[2.5]" />
              Completed
            </span>
          )}

          <span className="text-[11px] font-medium text-[#7D5200] capitalize">
            {goal.category}
          </span>
        </div>

        {/* 3D Illustration preview */}
        <div className="relative mb-4 h-36 w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#FFFDF9] to-[#F7F2EA] border border-[#E8E1D6]/60 flex items-center justify-center p-3">
          <Image
            src={imageSrc}
            alt={goal.name}
            fill
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>

        {/* Goal Title */}
        <h3 className="font-serif text-lg font-medium text-[#1F2A44] leading-snug line-clamp-1">
          {goal.name}
        </h3>

        {/* Dual Money Display: ₹ saved / ₹ target */}
        <div className="mt-2 flex items-baseline gap-1 text-sm tabular-nums">
          <span className="font-semibold text-[#1F2A44]">
            {money(goal.currentSavings)}
          </span>
          <span className="text-[#475467]">/</span>
          <span className="text-xs text-[#475467]">
            {money(goal.targetAmount)}
          </span>
        </div>

        {/* Progress Bar */}
        <div
          className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-[#E8E1D6]/60"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${goal.name} funding progress`}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              state === "completed"
                ? "bg-[#3D5C4A]"
                : state === "not_started"
                  ? "bg-[#D0D5DD]"
                  : "bg-[#5E55C9]"
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Progress percentage & Link indicator */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <span
            className={cn(
              "font-semibold tabular-nums",
              state === "completed"
                ? "text-[#3D5C4A]"
                : state === "not_started"
                  ? "text-[#475467]"
                  : "text-[#5E55C9]"
            )}
          >
            {progressPct.toFixed(0)}%
          </span>
          <Link
            href={`/dashboard/goals/${goal.id}`}
            aria-label={`Review goal: ${goal.name}`}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5E55C9] hover:underline"
          >
            Review goal <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Bottom Action Button Based on Card State (Board 02) */}
      <div className="mt-5 pt-3 border-t border-[#E8E1D6]/60">
        {state === "not_started" && (
          <Link
            href={`/dashboard/goals/${goal.id}`}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#5E55C9] text-[#5E55C9] bg-white hover:bg-[#5E55C9]/5 text-xs font-semibold transition-colors"
          >
            <Sparkles className="size-3.5" />
            Start planning
          </Link>
        )}

        {state === "in_progress" && (
          <Link
            href={`/dashboard/goals/${goal.id}`}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#5E55C9] text-white hover:bg-[#4d45b5] text-xs font-semibold transition-colors shadow-xs"
          >
            View goal
            <ArrowRight className="size-3.5" />
          </Link>
        )}

        {state === "completed" && (
          <Link
            href={`/dashboard/goals/${goal.id}`}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#3D5C4A] text-[#3D5C4A] bg-[#3D5C4A]/5 hover:bg-[#3D5C4A]/10 text-xs font-semibold transition-colors"
          >
            <Check className="size-3.5" />
            View memories
          </Link>
        )}
      </div>
    </div>
  );
}
