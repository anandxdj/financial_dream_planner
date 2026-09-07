import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PlanVersionHeaderProps {
  versionNumber?: number | null;
  generatedAt?: string | Date | null;
  asOf?: string | Date | null;
  stale?: boolean;
  completeness?: string | null;
  actions?: ReactNode;
  className?: string;
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PlanVersionHeader({
  versionNumber,
  generatedAt,
  asOf,
  stale = false,
  completeness,
  actions,
  className,
}: PlanVersionHeaderProps) {
  const generated = formatDate(generatedAt);
  const snapshotAsOf = formatDate(asOf);

  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-serif text-2xl text-navy sm:text-3xl">
            {versionNumber ? `Plan version ${versionNumber}` : "Financial plan"}
          </h1>
          <Badge tone={stale ? "gold" : "sage"} size="sm" dot>
            {stale ? "Needs update" : "Active"}
          </Badge>
          {completeness ? (
            <Badge tone={completeness === "complete" ? "sage" : "warning"} size="sm">
              {completeness === "complete" ? "Inputs complete" : "Inputs incomplete"}
            </Badge>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-ink">
          {generated ? <span>Generated {generated}</span> : null}
          {snapshotAsOf ? <span>Snapshot as of {snapshotAsOf}</span> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
