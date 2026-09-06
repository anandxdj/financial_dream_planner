"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import type { ProposalViewModel } from "../adapters/proposal-view-model";

export function ProposalPreviewCard({
  proposal,
  onReview,
  onDismiss,
}: {
  proposal: ProposalViewModel;
  onReview: () => void;
  onDismiss: () => void;
}) {
  const primarySource = proposal.sources[0] ?? "Current plan";
  const allSourcesTooltip = proposal.sources.join(" • ");

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-xs transition-all hover:border-[#5E55C9]/40 hover:shadow-sm">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border bg-[#5E55C9]/10 text-[#5E55C9] border-[#5E55C9]/20">
            <Sparkles className="size-3" />
            <span>{proposal.badge}</span>
          </span>
          <span
            className="rounded-full bg-[#FAF8F5] border border-[#EAE5DE] px-2.5 py-0.5 text-[10px] font-medium text-[#667085] cursor-default"
            title={allSourcesTooltip}
          >
            {primarySource}
          </span>
        </div>

        <h4 className="mt-3.5 font-serif text-base font-normal text-[#1A2238] tracking-tight leading-snug" title={proposal.title}>
          {proposal.title}
        </h4>
        <p className="mt-1.5 text-xs text-[#667085] leading-relaxed line-clamp-2 min-h-[36px]">
          {proposal.summary}
        </p>

        {proposal.metrics.length > 0 && (
          <div className="mt-4 rounded-xl bg-[#FAF8F5]/80 border border-[#E8E1D6]/70 p-3" title={proposal.impactHighlight}>
            <div className="grid grid-cols-2 gap-3 divide-x divide-[#E8E1D6]/60">
              {proposal.metrics.slice(0, 2).map((metric, index) => (
                <div key={metric.label} className={index > 0 ? "pl-3 space-y-1" : "space-y-1"}>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#8C877D] block truncate">
                    {metric.label}
                  </span>
                  <div className="text-sm sm:text-[15px] font-bold text-[#1A2238] tabular-nums leading-tight truncate">
                    {metric.proposed}
                  </div>
                  {metric.delta && (
                    <span className="inline-flex items-center text-[10px] font-semibold text-[#1E7E34] bg-[#EBF7EE] px-1.5 py-0.5 rounded leading-tight">
                      {metric.delta}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-[#E8E1D6]/70">
        <button
          type="button"
          onClick={onReview}
          className="flex-1 inline-flex min-h-9 items-center justify-center rounded-xl bg-[#1A2238] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2A3755] active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
        >
          Review & Stage
          <ChevronRight className="ml-1 size-3" />
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex min-h-9 items-center justify-center rounded-xl border border-[#E8E1D6] bg-white px-3 py-1.5 text-xs font-medium text-[#667085] hover:text-[#1A2238] hover:bg-[#FAF8F5] active:scale-[0.98] transition-all cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
