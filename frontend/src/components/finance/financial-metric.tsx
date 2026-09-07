import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FinancialMetricProps {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "positive" | "warning" | "danger" | "info";
  className?: string;
}

const TONE_STYLES = {
  neutral: "text-navy",
  positive: "text-sage",
  warning: "text-gold",
  danger: "text-destructive",
  info: "text-blue",
} as const;

export function FinancialMetric({
  label,
  value,
  helper,
  icon,
  tone = "neutral",
  className,
}: FinancialMetricProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-ink">{label}</p>
        {icon ? <span className="shrink-0 text-muted-ink" aria-hidden="true">{icon}</span> : null}
      </div>
      <div className={cn("mt-2 text-2xl font-bold tabular-nums tracking-tight", TONE_STYLES[tone])}>
        {value}
      </div>
      {helper ? <div className="mt-2 text-xs leading-relaxed text-muted-ink">{helper}</div> : null}
    </div>
  );
}
