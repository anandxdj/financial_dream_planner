import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

export interface TradeoffDimension {
  label: string;
  baseline: string | number;
  scenario: string | number;
  deltaText: string;
  tone: "positive" | "negative" | "neutral" | "warning";
  explanation?: string;
}

export interface TradeoffCardProps {
  scenarioTitle: string;
  scenarioSubtitle?: string;
  statusBadge?: string;
  decisionVerdict?: string;
  dimensions: TradeoffDimension[];
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function TradeoffCard({
  scenarioTitle,
  scenarioSubtitle,
  statusBadge = "Scenario Overlay",
  decisionVerdict,
  dimensions,
  selected = false,
  onSelect,
  className,
}: TradeoffCardProps) {
  const isInteractive = Boolean(onSelect);

  return (
    <div
      onClick={onSelect}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-pressed={isInteractive ? selected : undefined}
      className={cn(
        "rounded-[16px] border bg-[#FFFCF8] p-5 md:p-6 transition-all text-left outline-none",
        isInteractive && "focus-visible:ring-2 focus-visible:ring-[#5E55C9] cursor-pointer min-h-[44px]",
        selected
          ? "border-[#5E55C9] shadow-[0_4px_20px_0_rgba(94,85,201,0.12)] ring-1 ring-[#5E55C9]"
          : "border-[#E8E1D6] hover:border-[#1F2A44]/30 shadow-[0_1px_3px_0_rgba(31,42,68,0.04)]",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-serif text-lg md:text-xl font-normal text-[#1F2A44]">
              {scenarioTitle}
            </h4>
            {statusBadge && (
              <Badge tone="blue" size="sm">
                {statusBadge}
              </Badge>
            )}
          </div>
          {scenarioSubtitle && (
            <p className="mt-1 text-xs md:text-sm text-[#475467]">
              {scenarioSubtitle}
            </p>
          )}
        </div>
        {decisionVerdict && (
          <Badge tone="purple" size="md">
            {decisionVerdict}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 divide-y divide-[#E8E1D6]/60">
        {dimensions.map((dim, idx) => {
          const toneBadge = {
            positive: "sage",
            negative: "danger",
            warning: "warning",
            neutral: "neutral",
          }[dim.tone] as "sage" | "danger" | "warning" | "neutral";

          return (
            <div key={idx} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs md:text-sm">
              <span className="font-medium text-[#1F2A44] truncate">{dim.label}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[#475467] text-xs hidden sm:inline">
                  {dim.baseline} → {dim.scenario}
                </span>
                <Badge tone={toneBadge} size="sm">
                  {dim.deltaText}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
