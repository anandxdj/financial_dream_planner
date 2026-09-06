"use client";

import React, { useState } from "react";
import { Badge } from "./badge";
import { ShieldCheck, Sparkles } from "lucide-react";

export function InteractiveTradeoffDemo() {
  const [activeScenario, setActiveScenario] = useState<"home" | "rent">("home");

  const scenarios = {
    home: {
      title: "Option A: Buy ₹85L Home in 2027",
      subtitle: "₹22L down payment from mutual funds + ₹63L home loan at 8.6% for 20 years",
      monthlySurplus: "₹18,400",
      surplusDelta: "-₹28,600/mo (EMI ₹55,000)",
      surplusTone: "warning" as const,
      runwayMonths: "6.8 Months",
      runwayDelta: "Down from 14.5 mo (Above 6mo floor)",
      runwayTone: "sage" as const,
      wealthAt50: "₹4.15 Cr",
      wealthDelta: "Real estate equity + remaining SIPs",
      wealthTone: "neutral" as const,
      verdict: "Feasible with disciplined lifestyle budget",
      action: "Maintain minimum ₹4.5L emergency cash reserve before closing.",
    },
    rent: {
      title: "Option B: Rent + High Equity SIP till 2030",
      subtitle: "₹30,000/mo rent + invest difference (₹47,000/mo) in diversified index funds",
      monthlySurplus: "₹47,000",
      surplusDelta: "+₹28,600/mo higher cash buffer",
      surplusTone: "sage" as const,
      runwayMonths: "16.2 Months",
      runwayDelta: "Grows continuously with liquid reserves",
      runwayTone: "sage" as const,
      wealthAt50: "₹5.85 Cr",
      wealthDelta: "+₹1.7 Cr compounded market upside",
      wealthTone: "sage" as const,
      verdict: "Higher liquidity & compound wealth",
      action: "Rebalance equity allocation annually to protect down payment corpus.",
    },
  };

  const current = scenarios[activeScenario];

  return (
    <div className="rounded-[16px] border border-[#E8E1D6] bg-[#FFFCF8] p-6 md:p-8 shadow-[0_4px_24px_rgba(31,42,68,0.05)] text-left">
      {/* Simulation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E1D6] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-[#E6B46A]/20 text-[#8A531D]">
              <Sparkles className="size-3.5" />
            </span>
            <h3 className="font-serif text-xl md:text-2xl font-normal text-[#1F2A44]">
              Side-by-Side Consequence Simulator
            </h3>
          </div>
          <p className="text-xs md:text-sm text-[#475467] mt-1">
            Toggle between two real life paths to see the consequence chain in real time.
          </p>
        </div>

        {/* Toggle Controls */}
        <div
          role="tablist"
          aria-label="Trade-off scenario options"
          className="inline-flex rounded-[10px] border border-[#E8E1D6] bg-[#FFF9F0] p-1 gap-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeScenario === "home"}
            aria-controls="tradeoff-scenario-panel"
            onClick={() => setActiveScenario("home")}
            className={`min-h-[44px] px-4 rounded-[8px] text-xs font-semibold transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] ${
              activeScenario === "home"
                ? "bg-[#1F2A44] text-[#FFFCF8] shadow-xs"
                : "text-[#344054] hover:text-[#1F2A44]"
            }`}
          >
            Option A: Buy Home
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeScenario === "rent"}
            aria-controls="tradeoff-scenario-panel"
            onClick={() => setActiveScenario("rent")}
            className={`min-h-[44px] px-4 rounded-[8px] text-xs font-semibold transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] ${
              activeScenario === "rent"
                ? "bg-[#1F2A44] text-[#FFFCF8] shadow-xs"
                : "text-[#344054] hover:text-[#1F2A44]"
            }`}
          >
            Option B: Rent & Invest
          </button>
        </div>
      </div>

      {/* Selected Scenario Details */}
      <div id="tradeoff-scenario-panel" role="tabpanel" className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="font-serif text-lg font-normal text-[#1F2A44]">
              {current.title}
            </h4>
            <p className="text-xs text-[#475467] mt-0.5">{current.subtitle}</p>
          </div>
          <Badge tone="purple" size="md">
            {current.verdict}
          </Badge>
        </div>

        {/* 3 Metric Dimension Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-[12px] border border-[#E8E1D6] bg-[#FFF9F0]/60 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#475467]">
              Monthly Free Cash Flow
            </span>
            <div className="font-serif text-2xl font-normal text-[#1F2A44] mt-1">
              {current.monthlySurplus}
            </div>
            <p className="text-xs text-[#3D5C4A] font-medium mt-1">
              {current.surplusDelta}
            </p>
          </div>

          <div className="rounded-[12px] border border-[#E8E1D6] bg-[#FFF9F0]/60 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#475467]">
              Emergency Runway
            </span>
            <div className="font-serif text-2xl font-normal text-[#1F2A44] mt-1">
              {current.runwayMonths}
            </div>
            <p className="text-xs text-[#3D5C4A] font-medium mt-1">
              {current.runwayDelta}
            </p>
          </div>

          <div className="rounded-[12px] border border-[#E8E1D6] bg-[#FFF9F0]/60 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#475467]">
              Net Wealth at Age 50
            </span>
            <div className="font-serif text-2xl font-normal text-[#1F2A44] mt-1">
              {current.wealthAt50}
            </div>
            <p className="text-xs text-[#335380] font-medium mt-1">
              {current.wealthDelta}
            </p>
          </div>
        </div>

        {/* Explanatory Consequence Footer */}
        <div className="mt-5 rounded-[10px] bg-[#FFF9F0] border border-[#E8E1D6] p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5 text-[#1F2A44]">
            <ShieldCheck className="size-4 text-[#3D5C4A] shrink-0" />
            <span>
              <strong>Deterministic Recommendation:</strong> {current.action}
            </span>
          </div>
          <span className="text-[11px] text-[#475467] font-mono hidden md:inline shrink-0">
            Engine: Fixed-Point Decimal · Policy Active
          </span>
        </div>
      </div>
    </div>
  );
}
