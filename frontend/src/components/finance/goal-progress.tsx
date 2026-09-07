import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Money } from "@/components/finance/money";
import { cn } from "@/lib/utils";

export interface GoalProgressProps {
  name: string;
  saved: string | number | null | undefined;
  target: string | number | null | undefined;
  targetDate?: string | null;
  monthlyContribution?: string | number | null;
  status?: string;
  tone?: BadgeTone;
  progressPercent?: number | null;
  className?: string;
}

function clampProgress(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, value));
}

export function GoalProgress({
  name,
  saved,
  target,
  targetDate,
  monthlyContribution,
  status,
  tone = "neutral",
  progressPercent,
  className,
}: GoalProgressProps) {
  const progress = clampProgress(progressPercent);

  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-navy">{name}</h3>
          <p className="mt-1 text-xs text-muted-ink">
            <Money value={saved} compact fallback="Not recorded" /> saved of{" "}
            <Money value={target} compact fallback="Not provided" />
          </p>
        </div>
        {status ? <Badge tone={tone} size="sm" dot>{status}</Badge> : null}
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
        <div
          className="h-full rounded-full bg-purple transition-[width] duration-200"
          style={{ width: `${progress ?? 0}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-ink">
        <span>{progress === null ? "Progress unavailable" : `${Math.round(progress)}% funded`}</span>
        {targetDate ? <span>Target {new Date(`${targetDate}T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span> : null}
      </div>

      {monthlyContribution !== null && monthlyContribution !== undefined ? (
        <div className="mt-3 border-t pt-3 text-xs text-muted-ink">
          Monthly contribution: <Money value={monthlyContribution} compact fallback="Not recorded" />
        </div>
      ) : null}
    </div>
  );
}
