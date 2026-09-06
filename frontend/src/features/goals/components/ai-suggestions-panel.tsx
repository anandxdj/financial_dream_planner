"use client";

import Link from "next/link";
import { Sparkles, Plus, Plane, GraduationCap, ShieldAlert, ArrowRight, Lightbulb } from "lucide-react";
import type { Goal } from "@/features/planner/planning-queries";

interface AiSuggestionsPanelProps {
  onAddSuggested: (category: Goal["category"], name: string) => void;
  canAddGoal: boolean;
}

const SUGGESTIONS: Array<{
  category: Goal["category"];
  name: string;
  description: string;
  icon: typeof Plane;
  iconBg: string;
  iconColor: string;
}> = [
  {
    category: "travel",
    name: "Plan an International Trip",
    description: "Many users like you plan this next.",
    icon: Plane,
    iconBg: "bg-[#7D5200]/10",
    iconColor: "text-[#7D5200]",
  },
  {
    category: "education",
    name: "Start a Child's Education Fund",
    description: "It's never too early to start compounding.",
    icon: GraduationCap,
    iconBg: "bg-[#5E55C9]/10",
    iconColor: "text-[#5E55C9]",
  },
  {
    category: "savings",
    name: "Build an Emergency Fund",
    description: "Stay prepared with 3–6 months of reserves.",
    icon: ShieldAlert,
    iconBg: "bg-[#3D5C4A]/10",
    iconColor: "text-[#3D5C4A]",
  },
];

export function AiSuggestionsPanel({
  onAddSuggested,
  canAddGoal,
}: AiSuggestionsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#5E55C9]/10 text-[#5E55C9] text-[11px] font-semibold mb-1">
            <Sparkles className="size-3" />
            <span>AI Copilot Suggestions</span>
          </div>
          <h3 className="font-serif text-2xl font-normal text-[#1F2A44]">
            Smarter suggestions for your bigger tomorrow
          </h3>
          <p className="text-xs text-[#475467] mt-0.5">
            Get personalized insights and goal ideas powered by AI.
          </p>
        </div>
        <span className="font-serif italic text-xs text-[#7D5200] hidden sm:block">
          &ldquo;Better insights. Brighter possibilities.&rdquo;
        </span>
      </div>

      {/* Dual Column Grid: Left AI Insight, Right Suggested Goals */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Left Card: AI Insight */}
        <div className="flex flex-col justify-between rounded-3xl border border-[#E8E1D6] bg-gradient-to-br from-[#FFF9F0] via-[#FFFDF9] to-[#F5EFE6] p-6 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#5E55C9]">
              <Sparkles className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                AI Insight
              </span>
            </div>

            <h4 className="font-serif text-xl font-medium text-[#1F2A44]">
              You&apos;re on track!
            </h4>
            <p className="text-xs text-[#475467] leading-relaxed">
              Based on your current contributions, you can comfortably reach your primary goals before their target dates with regular monthly SIPs.
            </p>

            {/* Tip Callout */}
            <div className="rounded-2xl border border-[#7D5200]/20 bg-[#FFF9F0] p-3.5 text-xs text-[#1F2A44] flex items-start gap-2.5 shadow-xs">
              <Lightbulb className="size-4 text-[#7D5200] shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong className="text-[#7D5200]">Tip:</strong> Increasing your monthly contribution by ₹5,000 could help you reach your goals up to <strong>8 months earlier</strong>.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E8E1D6]/70 flex items-center justify-between">
            <span className="text-[11px] text-[#475467]">
              Engine verified against inflation
            </span>
            <Link
              href="/dashboard/plan"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5E55C9] text-white text-xs font-semibold hover:bg-[#4d45b5] transition-colors shadow-xs"
            >
              Update plan <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Card: Suggested Goals for You */}
        <div className="flex flex-col justify-between rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-serif text-lg font-medium text-[#1F2A44]">
                Suggested goals for you
              </h4>
              <span className="text-[10px] text-[#7D5200] bg-[#FFF9F0] px-2 py-0.5 rounded-full border border-[#E8E1D6]">
                Smart Match
              </span>
            </div>
            <p className="text-xs text-[#475467] mb-4">
              Based on your financial stage and spending habits.
            </p>

            <div className="space-y-2.5">
              {SUGGESTIONS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-[#E8E1D6] bg-[#FFF9F0]/40 transition-colors hover:bg-[#FFF9F0]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg} ${item.iconColor}`}
                      >
                        <IconComponent className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#1F2A44]">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-[#475467]">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canAddGoal}
                      onClick={() => onAddSuggested(item.category, item.name)}
                      className="size-8 rounded-xl border border-[#5E55C9]/40 bg-white text-[#5E55C9] flex items-center justify-center hover:bg-[#5E55C9] hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#5E55C9] shrink-0"
                      title={
                        canAddGoal
                          ? "Add this goal"
                          : "Maximum 3 active goals reached"
                      }
                      aria-label={`Add ${item.name}`}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8E1D6]/60 text-[11px] text-[#475467] flex items-center justify-between">
            <span>{canAddGoal ? "Click + to customize and add" : "Goal limit reached (max 3 active)"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
