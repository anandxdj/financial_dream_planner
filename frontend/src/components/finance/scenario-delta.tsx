import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScenarioDeltaProps {
  label: string;
  baseline: string;
  proposed: string;
  deltaLabel?: string;
  direction?: "up" | "down" | "neutral";
  favorable?: boolean | null;
  className?: string;
}

export function ScenarioDelta({
  label,
  baseline,
  proposed,
  deltaLabel,
  direction = "neutral",
  favorable = null,
  className,
}: ScenarioDeltaProps) {
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : ArrowRight;
  const deltaTone =
    favorable === true
      ? "text-sage"
      : favorable === false
        ? "text-gold"
        : "text-blue";

  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-ink">{label}</p>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <p className="text-[11px] text-muted-ink">Current plan</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-navy">{baseline}</p>
        </div>
        <Icon className={cn("size-4", deltaTone)} aria-hidden="true" />
        <div className="text-right">
          <p className="text-[11px] text-muted-ink">Scenario</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-navy">{proposed}</p>
        </div>
      </div>
      {deltaLabel ? <p className={cn("mt-3 text-xs font-semibold", deltaTone)}>{deltaLabel}</p> : null}
    </div>
  );
}
