"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, Plus, Sparkles } from "lucide-react";
import type { GoalCardItem } from "./types";
import { cn } from "@/lib/utils";

interface GoalsStepProps {
  goals: GoalCardItem[];
  onToggleGoal: (id: string) => void;
  onAddCustomGoal: (name: string) => void;
  onNext: () => void;
  onSkip: () => void;
  onStartChat?: () => void;
}

export function GoalsStep({
  goals,
  onToggleGoal,
  onAddCustomGoal,
  onNext,
  onSkip,
  onStartChat,
}: GoalsStepProps) {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState("");

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim()) {
      onAddCustomGoal(customName.trim());
      setCustomName("");
      setShowAddCustom(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div>
        <h2 className="font-serif text-2xl font-medium tracking-tight text-[#1F2A44] sm:text-3xl">
          What are your financial goals?
        </h2>
        <p className="mt-1.5 text-sm text-[#475467]">
          You can select multiple goals. We&apos;ll personalize your plan accordingly.
        </p>
      </div>

      {/* Conversational Fast-track Banner */}
      {onStartChat && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#5E55C9]/25 bg-[#5E55C9]/5 p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="relative size-10 shrink-0 rounded-full border border-[#E8E1D6] bg-white p-1 shadow-2xs overflow-hidden">
              <Image
                src="/Assets/Piggy Banks/piggy_bank_coin.png"
                alt="Buddy"
                fill
                className="object-contain p-0.5"
              />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wide text-[#5E55C9] flex items-center gap-1">
                <Sparkles className="size-3" />
                CONVERSATIONAL FAST-TRACK
              </div>
              <p className="text-xs sm:text-sm text-[#1F2A44] font-medium">
                Prefer a quick chat? Buddy can set up your plan in ~60 seconds.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onStartChat}
            className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#5E55C9] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#4E45B8] active:scale-98 transition-all"
          >
            <span>Chat with Buddy ✨</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const isSelected = goal.selected;

          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => onToggleGoal(goal.id)}
              className={cn(
                "group relative flex flex-col items-center justify-between rounded-2xl border p-5 text-center transition-all focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:outline-none",
                isSelected
                  ? "border-[#5E55C9] bg-[#5E55C9]/5 shadow-xs ring-1 ring-[#5E55C9]"
                  : "border-[#E8E1D6] bg-white hover:border-[#D0D5DD] hover:bg-[#FFF9F0]/40"
              )}
            >
              {/* Checkbox indicator at top-right */}
              <div className="absolute top-3.5 right-3.5">
                <div
                  className={cn(
                    "flex size-5.5 items-center justify-center rounded-full border transition-colors",
                    isSelected
                      ? "border-[#5E55C9] bg-[#5E55C9] text-white"
                      : "border-[#D0D5DD] bg-white group-hover:border-[#9CA3AF]"
                  )}
                >
                  {isSelected && <Check className="size-3.5 stroke-[2.5]" />}
                </div>
              </div>

              {/* Goal Illustration */}
              <div className="relative my-2 size-20 drop-shadow-xs transition-transform group-hover:scale-105">
                <Image
                  src={goal.image}
                  alt={goal.name}
                  fill
                  className="object-contain"
                  sizes="80px"
                />
              </div>

              {/* Goal Name */}
              <div className="mt-2 font-medium text-[#1F2A44]">
                {goal.name}
              </div>
            </button>
          );
        })}

        {/* Add Other Goal Card */}
        {showAddCustom ? (
          <form
            onSubmit={handleAddCustom}
            className="flex flex-col justify-between rounded-2xl border border-dashed border-[#5E55C9] bg-white p-5 text-center"
          >
            <div className="space-y-2">
              <label htmlFor="custom-goal-input" className="block text-xs font-semibold text-[#1F2A44]">
                Goal Name
              </label>
              <input
                id="custom-goal-input"
                type="text"
                autoFocus
                placeholder="e.g. Wedding, Sabbatical"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full rounded-lg border border-[#E8E1D6] bg-[#FFFCF8] px-3 py-2 text-sm text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-[#5E55C9] py-1.5 text-xs font-semibold text-white hover:bg-[#4E45B8]"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddCustom(false)}
                className="rounded-lg border border-[#E8E1D6] px-3 py-1.5 text-xs font-medium text-[#475467] hover:bg-[#FFF9F0]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddCustom(true)}
            className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D0D5DD] bg-[#FFFCF8]/50 p-5 text-center transition-colors hover:border-[#5E55C9] hover:bg-[#5E55C9]/5"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-[#5E55C9]/10 text-[#5E55C9]">
              <Plus className="size-5" />
            </div>
            <span className="mt-2 text-sm font-medium text-[#475467]">Other Goal</span>
          </button>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between border-t border-[#E8E1D6] pt-6">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-semibold text-[#475467] hover:text-[#1F2A44] hover:underline"
        >
          Skip for now
        </button>

        <div className="flex items-center gap-3">
          {onStartChat && (
            <button
              type="button"
              onClick={onStartChat}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-[#5E55C9] bg-[#5E55C9]/10 px-5 py-2.5 text-sm font-semibold text-[#5E55C9] shadow-xs transition-all hover:bg-[#5E55C9]/20 active:scale-98"
            >
              <Sparkles className="size-4" />
              <span>Chat with Buddy ✨</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#5E55C9] px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#4E45B8] active:scale-[0.99]"
          >
            <span>Next</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
