import React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "sage"
  | "blue"
  | "warning"
  | "danger"
  | "destructive"
  | "purple"
  | "accent"
  | "gold"
  | "navy"
  | "primary"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  size?: "sm" | "md";
}

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  size = "md",
  className,
  ...rest
}: BadgeProps) {
  const toneStyles: Record<BadgeTone, { container: string; dot: string }> = {
    sage: {
      container: "bg-[#3D5C4A]/12 text-[#3D5C4A] border-[#3D5C4A]/30",
      dot: "bg-[#3D5C4A]",
    },
    blue: {
      container: "bg-[#3B5B8C]/12 text-[#3B5B8C] border-[#3B5B8C]/30",
      dot: "bg-[#3B5B8C]",
    },
    warning: {
      container: "bg-[#7D5200]/12 text-[#7D5200] border-[#7D5200]/30",
      dot: "bg-[#7D5200]",
    },
    gold: {
      container: "bg-[#7D5200]/12 text-[#7D5200] border-[#7D5200]/30",
      dot: "bg-[#7D5200]",
    },
    danger: {
      container: "bg-[#A13F39]/12 text-[#A13F39] border-[#A13F39]/30",
      dot: "bg-[#A13F39]",
    },
    destructive: {
      container: "bg-[#A13F39]/12 text-[#A13F39] border-[#A13F39]/30",
      dot: "bg-[#A13F39]",
    },
    purple: {
      container: "bg-[#5E55C9]/12 text-[#5E55C9] border-[#5E55C9]/30",
      dot: "bg-[#5E55C9]",
    },
    accent: {
      container: "bg-[#5E55C9]/12 text-[#5E55C9] border-[#5E55C9]/30",
      dot: "bg-[#5E55C9]",
    },
    navy: {
      container: "bg-[#1F2A44]/10 text-[#1F2A44] border-[#1F2A44]/25",
      dot: "bg-[#1F2A44]",
    },
    primary: {
      container: "bg-[#1F2A44]/10 text-[#1F2A44] border-[#1F2A44]/25",
      dot: "bg-[#1F2A44]",
    },
    neutral: {
      container: "bg-[#E8E1D6]/60 text-[#344054] border-[#E8E1D6]",
      dot: "bg-[#344054]",
    },
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 min-h-[22px]",
    md: "text-xs px-2.5 py-1 min-h-[26px]",
  }[size];

  const currentTone = toneStyles[tone] ?? toneStyles.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium font-sans leading-none tracking-tight",
        currentTone.container,
        sizeStyles,
        className
      )}
      {...rest}
    >
      {dot && <span className={cn("size-1.5 rounded-full shrink-0", currentTone.dot)} aria-hidden="true" />}
      {children}
    </span>
  );
}
