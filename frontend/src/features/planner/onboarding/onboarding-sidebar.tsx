"use client";

import { Check } from "lucide-react";
import { WIZARD_STEPS } from "./constants";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentStep: number; // 1 to 7
  maxCompletedStep: number;
  onSelectStep: (stepNumber: number) => void;
}

export function OnboardingSidebar({
  currentStep,
  maxCompletedStep,
  onSelectStep,
}: SidebarProps) {
  return (
    <aside className="w-full shrink-0 border-b border-[#E8E1D6]/80 p-5 md:w-56 md:border-b-0 md:border-r md:py-8 lg:w-64">
      <nav aria-label="Onboarding Steps" className="space-y-1">
        {WIZARD_STEPS.map((step) => {
          const isCurrent = step.number === currentStep;
          const isCompleted = step.number < currentStep || step.number <= maxCompletedStep;
          const isClickable = true;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable}
              onClick={() => onSelectStep(step.number)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
                isCurrent
                  ? "bg-[#5E55C9]/10 text-[#1F2A44] font-semibold"
                  : isCompleted
                    ? "text-[#344054] hover:bg-[#FFF9F0]"
                    : "text-[#9CA3AF] cursor-not-allowed opacity-60"
              )}
            >
              {/* Step indicator circle */}
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isCurrent
                    ? "bg-[#5E55C9] text-white shadow-xs"
                    : isCompleted
                      ? "bg-[#3D5C4A]/15 text-[#3D5C4A]"
                      : "border border-[#D0D5DD] bg-white text-[#9CA3AF]"
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="size-3.5 stroke-[2.5]" />
                ) : (
                  step.number
                )}
              </div>

              {/* Step Label */}
              <span className="truncate">{step.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
