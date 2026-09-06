import React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "sage"
  | "blue"
  | "warning"
  | "danger"
  | "purple"
  | "gold"
  | "navy"
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
      container: "bg-[#7CA690]/15 text-[#3D5C4A] border-[#7CA690]/35",
      dot: "bg-[#3D5C4A]",
    },
    blue: {
      container: "bg-[#8FA9D6]/20 text-[#335380] border-[#8FA9D6]/40",
      dot: "bg-[#335380]",
    },
    warning: {
      container: "bg-[#E6B46A]/25 text-[#8A531D] border-[#E6B46A]/40",
      dot: "bg-[#8A531D]",
    },
    danger: {
      container: "bg-[#A13F39]/12 text-[#A13F39] border-[#A13F39]/30",
      dot: "bg-[#A13F39]",
    },
    purple: {
      container: "bg-[#5E55C9]/12 text-[#5448C8] border-[#5E55C9]/30",
      dot: "bg-[#5448C8]",
    },
    gold: {
      container: "bg-[#E6B46A]/30 text-[#8A531D] border-[#E6B46A]/50",
      dot: "bg-[#8A531D]",
    },
    navy: {
      container: "bg-[#1F2A44]/10 text-[#1F2A44] border-[#1F2A44]/25",
      dot: "bg-[#1F2A44]",
    },
    neutral: {
      container: "bg-[#E8E1D6]/50 text-[#344054] border-[#E8E1D6]",
      dot: "bg-[#344054]",
    },
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 min-h-[22px]",
    md: "text-xs px-2.5 py-1 min-h-[26px]",
  }[size];

  const currentTone = toneStyles[tone];

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
      {dot && <span className={cn("size-1.5 rounded-full shrink-0", currentTone.dot)} />}
      {children}
    </span>
  );
}
