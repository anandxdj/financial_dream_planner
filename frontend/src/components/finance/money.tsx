import React from "react";
import { cn } from "@/lib/utils";

export interface MoneyProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: string | number | null | undefined;
  currency?: string;
  fallback?: string;
  compact?: boolean;
}

/**
 * Formats a numeric string or number into Indian Currency (INR).
 * Enforces "Unknown is Not Zero" principle: null/undefined/"" values
 * always render explicit fallback text (e.g. "Not provided"), never ₹0.
 * Pure presentation wrapper; all financial calculations remain backend-owned.
 */
export function formatMoney(
  value: string | number | null | undefined,
  options?: {
    currency?: string;
    fallback?: string;
    compact?: boolean;
    maximumFractionDigits?: number;
  }
): string {
  if (value === null || value === undefined || value === "") {
    return options?.fallback ?? "Not provided";
  }

  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) {
    return options?.fallback ?? "Unknown";
  }

  const currency = options?.currency ?? "INR";

  if (options?.compact) {
    const abs = Math.abs(num);
    const sign = num < 0 ? "-" : "";
    if (abs >= 10000000) {
      return `${sign}₹${(abs / 10000000).toFixed(2).replace(/\.?0+$/, "")} Cr`;
    }
    if (abs >= 100000) {
      return `${sign}₹${(abs / 100000).toFixed(2).replace(/\.?0+$/, "")} L`;
    }
    if (abs >= 1000) {
      return `${sign}₹${(abs / 1000).toFixed(1).replace(/\.?0+$/, "")}k`;
    }
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(num);
}

export function Money({
  value,
  currency = "INR",
  fallback = "Not provided",
  compact = false,
  className,
  ...rest
}: MoneyProps) {
  const formatted = formatMoney(value, { currency, fallback, compact });
  const isUnknown = value === null || value === undefined || value === "" || Number.isNaN(Number(value));

  return (
    <span
      className={cn(
        "tabular-nums tracking-tight font-medium",
        isUnknown && "text-muted-foreground font-normal text-sm",
        className
      )}
      {...rest}
    >
      {formatted}
    </span>
  );
}
