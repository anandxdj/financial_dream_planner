import React from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";

export type DataSource = "manual" | "sms" | "estimated" | "calculated";

export interface SourceBadgeProps {
  source: DataSource;
  className?: string;
}

const SOURCE_CONFIG: Record<DataSource, { label: string; tone: BadgeTone }> = {
  manual: {
    label: "Manual Entry",
    tone: "neutral",
  },
  sms: {
    label: "Android SMS",
    tone: "blue",
  },
  estimated: {
    label: "Estimated",
    tone: "gold",
  },
  calculated: {
    label: "Calculated",
    tone: "sage",
  },
};

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const config = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.manual;
  return (
    <Badge tone={config.tone} size="sm" className={className}>
      {config.label}
    </Badge>
  );
}
