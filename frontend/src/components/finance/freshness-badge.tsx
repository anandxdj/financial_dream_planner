import React from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";

export type DataFreshness = "fresh" | "stale" | "needs_review";

export interface FreshnessBadgeProps {
  status: DataFreshness;
  lastUpdated?: string;
  className?: string;
}

const FRESHNESS_CONFIG: Record<DataFreshness, { label: string; tone: BadgeTone; dot: boolean }> = {
  fresh: {
    label: "Up to date",
    tone: "sage",
    dot: true,
  },
  stale: {
    label: "Needs updating",
    tone: "gold",
    dot: true,
  },
  needs_review: {
    label: "Review needed",
    tone: "warning",
    dot: true,
  },
};

export function FreshnessBadge({ status, lastUpdated, className }: FreshnessBadgeProps) {
  const config = FRESHNESS_CONFIG[status] ?? FRESHNESS_CONFIG.fresh;
  return (
    <Badge tone={config.tone} dot={config.dot} size="sm" className={className}>
      {config.label}
      {lastUpdated && <span className="text-[10px] text-muted-foreground ml-1">· {lastUpdated}</span>}
    </Badge>
  );
}
