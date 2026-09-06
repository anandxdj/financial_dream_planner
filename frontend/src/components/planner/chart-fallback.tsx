"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface ChartDataRow {
  label: string | number;
  value: string | number;
  secondary?: string | number;
  annotation?: string;
}

export interface ChartFallbackProps {
  title: string;
  summary?: string;
  caption?: string;
  labelHeader?: string;
  valueHeader?: string;
  secondaryHeader?: string;
  rows: ChartDataRow[];
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Accessible Chart & Table Fallback component.
 * Provides structured tabular data alternatives for charts and graphs,
 * adhering to WCAG 2.1 AA data table guidelines (caption, scope headers, tabular-nums),
 * 44px touch targets on toggle summaries, and full horizontal scroll containment.
 */
export function ChartFallback({
  title,
  summary,
  caption = "Detailed data table representation of chart metrics",
  labelHeader = "Period",
  valueHeader = "Value",
  secondaryHeader,
  rows,
  defaultOpen = false,
  className,
}: ChartFallbackProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("w-full rounded-[12px] border border-[#E8E1D6] bg-[#FFFCF8] p-4 text-left", className)}>
      <details
        className="group"
        open={isOpen}
        onToggle={(e) => setIsOpen(e.currentTarget.open)}
      >
        <summary className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 text-xs md:text-sm font-semibold text-[#1F2A44] transition-colors hover:text-[#5E55C9] outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] rounded-[8px] px-1 py-2">
          <span>
            {title} <span className="text-[11px] font-normal text-[#475467]">({rows.length} records)</span>
          </span>
          <span className="text-xs text-[#5448C8] font-medium group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>

        {summary && (
          <p className="mt-2 text-xs text-[#475467] leading-relaxed">
            {summary}
          </p>
        )}

        {/* Scrollable table container with horizontal overflow prevention */}
        <div className="mt-3 max-h-72 overflow-x-auto overflow-y-auto rounded-[8px] border border-[#E8E1D6] bg-[#FFF9F0]/60">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">{caption}</caption>
            <thead className="sticky top-0 bg-[#FFFCF8] border-b border-[#E8E1D6] text-[#1F2A44] font-semibold">
              <tr>
                <th scope="col" className="px-3.5 py-2.5 whitespace-nowrap">
                  {labelHeader}
                </th>
                <th scope="col" className="px-3.5 py-2.5 text-right whitespace-nowrap">
                  {valueHeader}
                </th>
                {secondaryHeader && (
                  <th scope="col" className="px-3.5 py-2.5 text-right whitespace-nowrap">
                    {secondaryHeader}
                  </th>
                )}
                {rows.some((r) => r.annotation) && (
                  <th scope="col" className="px-3.5 py-2.5 whitespace-nowrap">
                    Notes
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E1D6]/70 text-[#344054]">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#FFFCF8]/80 transition-colors">
                  <th scope="row" className="px-3.5 py-2.5 font-medium text-[#1F2A44] whitespace-nowrap">
                    {row.label}
                  </th>
                  <td className="px-3.5 py-2.5 text-right tabular-nums whitespace-nowrap font-medium text-[#1F2A44]">
                    {row.value}
                  </td>
                  {secondaryHeader && (
                    <td className="px-3.5 py-2.5 text-right tabular-nums whitespace-nowrap text-[#475467]">
                      {row.secondary ?? "—"}
                    </td>
                  )}
                  {rows.some((r) => r.annotation) && (
                    <td className="px-3.5 py-2.5 text-[#475467]">
                      {row.annotation ?? ""}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
