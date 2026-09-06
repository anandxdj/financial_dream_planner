import React from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export function ExamplePlanCard() {
  return (
    <div
      role="region"
      aria-label="Example financial plan preview"
      className="relative rounded-[16px] border border-[#E8E1D6] bg-[#FFFCF8] p-5 md:p-6 shadow-sm text-left"
    >
      {/* Disclaimer / Label Banner */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E1D6] pb-3">
        <div className="flex items-center gap-2">
          <Badge tone="gold" dot size="sm">
            ILLUSTRATIVE PREVIEW
          </Badge>
          <span className="text-[11px] font-medium tracking-tight text-[#475467]">
            Illustrative Planning Snapshot
          </span>
        </div>
        <Badge tone="sage" size="sm">
          Verified Math
        </Badge>
      </div>

      {/* Plan Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#475467]">
            Primary Goal
          </span>
          <h4 className="font-serif text-xl font-normal text-[#1F2A44]">
            First Home Down Payment
          </h4>
          <p className="text-xs text-[#475467] mt-0.5">
            Target ₹28,00,000 · Horizon: 28 months · 6.0% inflation allowance
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] text-[#475467] block">Status</span>
          <Badge tone="sage" size="sm" className="mt-0.5">
            On Track
          </Badge>
        </div>
      </div>

      {/* Trade-off Matrix Comparison */}
      <div className="mt-4 rounded-[10px] bg-[#FFF9F0] border border-[#E8E1D6] p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-bold text-[#1F2A44] uppercase tracking-wider">
          <span>Decision Impact</span>
          <span>Option A (Buy 2027) vs Option B (Wait 2029)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="rounded-[8px] bg-[#FFFCF8] p-2.5 border border-[#E8E1D6]">
            <div className="text-[#475467] text-[10px] font-medium">Monthly Free Capacity</div>
            <div className="font-serif text-base text-[#1F2A44] font-medium tabular-nums">
              ₹38,500 <span className="text-[10px] font-sans text-[#A13F39]">(-₹24k EMI)</span>
            </div>
            <div className="text-[10px] text-[#7D5200] flex items-center gap-1 mt-0.5">
              <AlertTriangle className="size-3 text-[#7D5200]" /> Buffer tight
            </div>
          </div>

          <div className="rounded-[8px] bg-[#FFFCF8] p-2.5 border border-[#E8E1D6]">
            <div className="text-[#475467] text-[10px] font-medium">Emergency Runway</div>
            <div className="font-serif text-base text-[#1F2A44] font-medium tabular-nums">
              7.8 Months <span className="text-[10px] font-sans text-[#3D5C4A]">(Protected)</span>
            </div>
            <div className="text-[10px] text-[#3D5C4A] flex items-center gap-1 mt-0.5">
              <ShieldCheck className="size-3 text-[#3D5C4A]" /> Preserves 6-month safety net
            </div>
          </div>
        </div>
      </div>

      {/* One Explainable Action */}
      <div className="mt-4 pt-3 border-t border-[#E8E1D6] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#1F2A44]">
          <CheckCircle2 className="size-4 text-[#3D5C4A] shrink-0" />
          <span className="font-medium">
            Next Action: Keep ₹3.5L liquid reserves before loan application
          </span>
        </div>
        <a
          href="#try-plan-automate"
          className="text-xs text-[#5E55C9] hover:text-[#1F2A44] font-semibold inline-flex items-center gap-1 shrink-0 min-h-[44px] py-2 focus-visible:ring-2 focus-visible:ring-[#5E55C9] rounded outline-none"
        >
          Compare in Sandbox <ArrowRight className="size-3" />
        </a>
      </div>
    </div>
  );
}
