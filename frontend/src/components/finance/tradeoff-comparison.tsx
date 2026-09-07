import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TradeoffColumn {
  title: string;
  eyebrow?: string;
  body?: ReactNode;
  metrics?: Array<{ label: string; value: ReactNode }>;
  tone?: "neutral" | "info" | "positive" | "warning";
}

export interface TradeoffComparisonProps {
  left: TradeoffColumn;
  right: TradeoffColumn;
  className?: string;
}

const TONE = {
  neutral: "border-border-warm bg-card",
  info: "border-blue/25 bg-blue/5",
  positive: "border-sage/25 bg-sage/5",
  warning: "border-gold/25 bg-gold/5",
} as const;

function Column({ column }: { column: TradeoffColumn }) {
  return (
    <section className={cn("rounded-xl border p-4", TONE[column.tone ?? "neutral"])}>
      {column.eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-ink">{column.eyebrow}</p>
      ) : null}
      <h3 className="mt-1 text-base font-semibold text-navy">{column.title}</h3>
      {column.body ? <div className="mt-2 text-sm leading-relaxed text-muted-ink">{column.body}</div> : null}
      {column.metrics?.length ? (
        <dl className="mt-4 space-y-2 border-t pt-3">
          {column.metrics.map((metric) => (
            <div key={metric.label} className="flex items-start justify-between gap-4 text-sm">
              <dt className="text-muted-ink">{metric.label}</dt>
              <dd className="text-right font-semibold tabular-nums text-navy">{metric.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

export function TradeoffComparison({ left, right, className }: TradeoffComparisonProps) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      <Column column={left} />
      <Column column={right} />
    </div>
  );
}
