import React from "react";
import { cn } from "@/lib/utils";
import { Badge, type BadgeTone } from "./badge";

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  secondaryValue?: React.ReactNode;
  hint?: string;
  badgeText?: string;
  badgeTone?: BadgeTone;
  icon?: React.ReactNode;
  trend?: {
    direction: "up" | "down" | "neutral";
    label: string;
    tone?: "positive" | "negative" | "neutral";
  };
  provenance?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  secondaryValue,
  hint,
  badgeText,
  badgeTone = "neutral",
  icon,
  trend,
  provenance,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-[0_1px_3px_0_rgba(31,42,68,0.04)] text-left flex flex-col justify-between gap-3",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
          {label}
        </span>
        {icon && <div className="text-[#1F2A44]">{icon}</div>}
        {badgeText && !icon && (
          <Badge tone={badgeTone} size="sm">
            {badgeText}
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <div className="font-serif text-2xl md:text-3xl font-normal tracking-tight text-[#1F2A44]">
          {value}
        </div>
        {secondaryValue && (
          <div className="text-xs md:text-sm font-medium text-[#344054]">
            {secondaryValue}
          </div>
        )}
      </div>

      {(hint || trend || provenance) && (
        <div className="pt-2 border-t border-[#E8E1D6]/60 flex flex-wrap items-center justify-between gap-2 text-xs text-[#475467]">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                trend.tone === "positive" && "text-[#3D5C4A]",
                trend.tone === "negative" && "text-[#A13F39]",
                trend.tone === "neutral" && "text-[#3B5B8C]"
              )}
            >
              {trend.direction === "up" && "↑"}
              {trend.direction === "down" && "↓"}
              {trend.label}
            </span>
          )}
          {hint && <span>{hint}</span>}
          {provenance && (
            <span className="text-[11px] text-[#475467] italic ml-auto">
              {provenance}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
