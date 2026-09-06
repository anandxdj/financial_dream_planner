"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

interface HeaderProps {
  stage: string;
  onSaveAndExit?: () => void;
  isSaving?: boolean;
}

export function OnboardingHeader({ stage, onSaveAndExit, isSaving }: HeaderProps) {
  return (
    <header className="w-full border-b border-[#E8E1D6]/80 bg-[#FFFCF8]/95 px-6 py-4 backdrop-blur-sm sm:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#5E55C9] text-white shadow-xs">
            <Sparkles className="size-4.5" />
          </div>
          <span className="text-lg font-serif font-medium tracking-tight text-[#1F2A44]">
            Financial Dream <span className="font-sans font-semibold text-[#5E55C9]">Planner</span>
          </span>
        </Link>

        {/* Right side actions based on stage */}
        <div className="flex items-center gap-4 text-sm">
          {stage === "welcome" ? (
            <Link
              href="/dashboard"
              className="rounded-xl border border-[#E8E1D6] bg-white px-4 py-2 font-medium text-[#1F2A44] shadow-xs transition-colors hover:bg-[#FFF9F0]"
            >
              Go to dashboard
            </Link>
          ) : stage === "complete" ? (
            <Link
              href="/dashboard"
              className="rounded-xl border border-[#E8E1D6] bg-white px-4 py-2 font-medium text-[#1F2A44] shadow-xs transition-colors hover:bg-[#FFF9F0]"
            >
              Go to dashboard
            </Link>
          ) : (
            <button
              type="button"
              onClick={onSaveAndExit}
              disabled={isSaving}
              className="rounded-xl border border-[#E8E1D6] bg-white px-4 py-2 text-xs font-semibold text-[#1F2A44] shadow-xs transition-colors hover:bg-[#FFF9F0] disabled:opacity-50 sm:text-sm"
            >
              {isSaving ? "Saving…" : "Save & exit"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
