import React from "react";
import { cn } from "@/lib/utils";

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "highlight" | "inset" | "subtle";
  as?: React.ElementType;
}

export function Panel({
  title,
  subtitle,
  badge,
  action,
  footer,
  children,
  variant = "default",
  className,
  as: Component = "section",
  ...rest
}: PanelProps) {
  const variantStyles = {
    default: "bg-[#FFFCF8] border-[#E8E1D6] shadow-[0_1px_3px_0_rgba(31,42,68,0.04)]",
    highlight: "bg-[#FFFCF8] border-[#5E55C9]/35 shadow-[0_4px_16px_0_rgba(94,85,201,0.08)]",
    inset: "bg-[#FFF9F0] border-[#E8E1D6] shadow-inner",
    subtle: "bg-transparent border-[#E8E1D6]/70 shadow-none",
  }[variant];

  const hasHeader = Boolean(title || subtitle || badge || action);

  return (
    <Component
      className={cn(
        "rounded-[16px] border transition-all text-[#344054] overflow-hidden",
        variantStyles,
        className
      )}
      {...rest}
    >
      {hasHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E1D6]/80 px-6 py-4 bg-[#FFFCF8]/80">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              {title && (
                <h3 className="font-serif text-lg md:text-xl font-normal tracking-tight text-[#1F2A44] truncate">
                  {title}
                </h3>
              )}
              {badge && <div className="shrink-0">{badge}</div>}
            </div>
            {subtitle && (
              <p className="mt-0.5 text-xs md:text-sm text-[#475467]">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
        </div>
      )}

      <div className="p-5 md:p-6">{children}</div>

      {footer && (
        <div className="border-t border-[#E8E1D6]/80 bg-[#FFF9F0]/60 px-6 py-3.5 text-xs text-[#344054] flex items-center justify-between">
          {footer}
        </div>
      )}
    </Component>
  );
}
