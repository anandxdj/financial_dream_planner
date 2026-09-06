import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "purple" | "outline" | "secondary" | "ghost" | "danger";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
}

export const ControlButton = forwardRef<HTMLButtonElement, ControlButtonProps>(
  ({ className, variant = "primary", size = "default", children, ...props }, ref) => {
    const variantClasses = {
      primary:
        "bg-[#1F2A44] text-[#FFFCF8] hover:bg-[#1F2A44]/90 active:bg-[#1F2A44]/95 shadow-sm focus-visible:ring-[#1F2A44]",
      purple:
        "bg-[#5E55C9] text-[#FFFCF8] hover:bg-[#5349be] active:bg-[#483fad] shadow-sm focus-visible:ring-[#5E55C9]",
      outline:
        "border border-[#E8E1D6] bg-[#FFFCF8] text-[#1F2A44] hover:bg-[#FFF9F0] hover:border-[#1F2A44]/20 active:bg-[#F5EFE6] focus-visible:ring-[#5E55C9]",
      secondary:
        "bg-[#FFF9F0] text-[#1F2A44] border border-[#E8E1D6] hover:bg-[#F5EFE6] active:bg-[#E8E1D6] focus-visible:ring-[#5E55C9]",
      ghost:
        "text-[#344054] hover:bg-[#FFF9F0] hover:text-[#1F2A44] active:bg-[#F5EFE6] focus-visible:ring-[#5E55C9]",
      danger:
        "bg-[#A13F39] text-[#FFFCF8] hover:bg-[#8e3732] active:bg-[#7b2f2a] shadow-sm focus-visible:ring-[#A13F39]",
    }[variant];

    const sizeClasses = {
      default: "min-h-[44px] px-5 py-2.5 text-sm",
      sm: "min-h-[44px] min-w-[44px] px-3.5 py-2 text-xs",
      lg: "min-h-[48px] px-7 py-3 text-base font-semibold",
      icon: "min-h-[44px] min-w-[44px] p-2.5",
    }[size];

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[10px] font-sans font-medium transition-all outline-none",
          "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF9F0]",
          "disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          variantClasses,
          sizeClasses,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
ControlButton.displayName = "ControlButton";

export interface ControlInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const ControlInput = forwardRef<HTMLInputElement, ControlInputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const hintId = hint && inputId ? `${inputId}-hint` : undefined;
    const errorId = error && inputId ? `${inputId}-error` : undefined;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#1F2A44]">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId || hintId || undefined}
          className={cn(
            "flex w-full min-h-[44px] rounded-[10px] border border-[#E8E1D6] bg-[#FFFCF8] px-3.5 py-2 text-base sm:text-sm text-[#1F2A44] placeholder:text-[#475467]/75",
            "transition-colors outline-none",
            "focus:border-[#5E55C9] focus:ring-2 focus:ring-[#5E55C9]/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[#A13F39] focus:border-[#A13F39] focus:ring-[#A13F39]/20",
            className
          )}
          {...props}
        />
        {hint && !error && <p id={hintId} className="text-xs text-[#475467]">{hint}</p>}
        {error && <p id={errorId} role="alert" className="text-xs font-medium text-[#A13F39]">{error}</p>}
      </div>
    );
  }
);
ControlInput.displayName = "ControlInput";

export interface ControlSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const ControlSelect = forwardRef<HTMLSelectElement, ControlSelectProps>(
  ({ className, label, error, hint, id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const hintId = hint && selectId ? `${selectId}-hint` : undefined;
    const errorId = error && selectId ? `${selectId}-error` : undefined;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-[#1F2A44]">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId || hintId || undefined}
          className={cn(
            "flex w-full min-h-[44px] rounded-[10px] border border-[#E8E1D6] bg-[#FFFCF8] px-3.5 py-2 text-base sm:text-sm text-[#1F2A44]",
            "transition-colors outline-none cursor-pointer",
            "focus:border-[#5E55C9] focus:ring-2 focus:ring-[#5E55C9]/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[#A13F39] focus:border-[#A13F39] focus:ring-[#A13F39]/20",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {hint && !error && <p id={hintId} className="text-xs text-[#475467]">{hint}</p>}
        {error && <p id={errorId} role="alert" className="text-xs font-medium text-[#A13F39]">{error}</p>}
      </div>
    );
  }
);
ControlSelect.displayName = "ControlSelect";
