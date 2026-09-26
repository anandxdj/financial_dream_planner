"use client";

import { useState } from "react";
import { Sparkles, RotateCcw, Check } from "lucide-react";
import { demoStore } from "@/lib/demo-store";
import { useRefreshFinancialViews } from "@/features/planner/queries";

export function DemoBanner() {
  const [visible, setVisible] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const refresh = useRefreshFinancialViews();

  if (!visible) return null;

  async function handleReset() {
    setResetting(true);
    demoStore.reset();
    await refresh();
    setResetting(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2500);
  }

  return (
    <div
      role="region"
      aria-label="Demo mode status"
      className="relative z-20 border-b border-[#5E55C9]/20 bg-gradient-to-r from-[#5E55C9]/10 via-[#FAF8F5] to-[#ECFDF5] px-4 py-2.5 text-xs text-[#1F2A44] transition-all shadow-2xs"
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5E55C9] px-2.5 py-0.5 font-semibold text-white shadow-2xs">
            <Sparkles className="size-3" />
            <span>Interactive Demo</span>
          </span>

          <span className="text-[#475467]">
            Using your onboarded financial plan data
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E1D6] bg-white px-2.5 py-1 font-semibold text-[#1F2A44] shadow-2xs transition-colors hover:bg-[#FFF9F0] disabled:opacity-50"
            title="Reset to initial onboarded plan data"
          >
            {resetDone ? (
              <>
                <Check className="size-3.5 text-[#047857]" />
                <span className="text-[#047857]">Reset Complete</span>
              </>
            ) : (
              <>
                <RotateCcw className={`size-3.5 text-[#5E55C9] ${resetting ? "animate-spin" : ""}`} />
                <span>Reset Data</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-[11px] font-medium text-[#475467] hover:text-[#1F2A44] px-1"
            title="Dismiss banner"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

