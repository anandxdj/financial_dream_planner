import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock3, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataStateNoticeProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  className?: string;
}

const STYLES = {
  neutral: {
    container: "border-border-warm bg-surface text-body",
    icon: "text-muted-ink",
    Icon: Clock3,
  },
  info: {
    container: "border-blue/25 bg-blue/5 text-body",
    icon: "text-blue",
    Icon: Info,
  },
  success: {
    container: "border-sage/25 bg-sage/5 text-body",
    icon: "text-sage",
    Icon: CheckCircle2,
  },
  warning: {
    container: "border-gold/30 bg-gold/5 text-body",
    icon: "text-gold",
    Icon: TriangleAlert,
  },
  danger: {
    container: "border-destructive/30 bg-destructive/5 text-body",
    icon: "text-destructive",
    Icon: AlertCircle,
  },
} as const;

export function DataStateNotice({
  title,
  description,
  action,
  tone = "neutral",
  className,
}: DataStateNoticeProps) {
  const style = STYLES[tone];
  const Icon = style.Icon;
  return (
    <div className={cn("rounded-lg border p-4", style.container, className)} role={tone === "danger" ? "alert" : "status"}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-4 shrink-0", style.icon)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">{title}</p>
          {description ? <div className="mt-1 text-sm leading-relaxed text-muted-ink">{description}</div> : null}
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
