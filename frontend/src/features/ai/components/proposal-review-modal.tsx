"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { action, secondary } from "@/features/planner/ui";
import type { ProposalViewModel } from "../adapters/proposal-view-model";

export function ProposalReviewModal({
  proposal,
  onClose,
  onConfirm,
  isSubmitting = false,
}: {
  proposal: ProposalViewModel;
  onClose: () => void;
  onConfirm: (options: { name: string }) => void;
  isSubmitting?: boolean;
}) {
  const [scenarioName, setScenarioName] = useState(proposal.title);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="w-full max-w-3xl rounded-3xl border border-[#E8E1D6] bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E8E1D6]">
          <div>
            <span className="inline-block rounded-full bg-[#5E55C9]/15 px-2.5 py-0.5 text-xs font-semibold text-[#5E55C9]">
              {proposal.badge}
            </span>
            <h3 id="proposal-modal-title" className="mt-2 font-serif text-2xl font-normal text-[#1A2238]">
              Review scenario draft
            </h3>
            <p className="text-xs text-[#475467] mt-0.5">
              These values were already evaluated by the backend financial engine. Staging saves a draft; it does not change your live plan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#667085] hover:bg-[#FAF8F5] cursor-pointer"
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="scenario-name-input" className="block text-xs font-semibold text-[#1A2238] mb-1">
                Scenario name
              </label>
              <input
                id="scenario-name-input"
                type="text"
                value={scenarioName}
                onChange={(event) => setScenarioName(event.target.value)}
                maxLength={100}
                className="w-full rounded-xl border border-[#E8E1D6] bg-[#FAF8F5] px-3 py-2 text-sm text-[#1A2238] outline-none focus:ring-2 focus:ring-[#5E55C9]"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              {proposal.metrics.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-[#E8E1D6] bg-[#FAF8F5] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#667085]">{metric.label}</p>
                  <div className="mt-1 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#667085]">Current</span>
                      <p className="font-semibold text-[#1A2238] tabular-nums">{metric.baseline}</p>
                    </div>
                    <div>
                      <span className="text-[#667085]">Draft</span>
                      <p className="font-semibold text-[#1A2238] tabular-nums">{metric.proposed}</p>
                    </div>
                  </div>
                  {metric.delta && <p className="mt-1 text-[11px] font-medium text-[#1E7E34]">Change: {metric.delta}</p>}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[#E8E1D6] bg-[#FAF8F5] p-3 text-xs space-y-1.5">
              <span className="font-semibold text-[#1A2238] block">Grounding & provenance</span>
              <div className="flex flex-wrap gap-1">
                {proposal.sources.map((source) => (
                  <span key={source} className="rounded-md border border-[#8FA9D6]/40 bg-[#8FA9D6]/15 px-2 py-0.5 text-[11px] font-medium text-[#1A2238]">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
              Engine comparison
            </span>
            <p className="mt-1 text-sm text-[#475467]">{proposal.impactHighlight}</p>

            {proposal.projection ? (
              <>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-sans font-bold text-xl text-[#1A2238]">{proposal.projection.proposedTotal}</span>
                  <span className="rounded-full bg-[#EDF7EE] px-2 py-0.5 text-xs font-semibold text-[#1E7E34] border border-[#D4EDDA]">
                    {proposal.projection.delta}
                  </span>
                </div>
                <span className="text-xs text-[#667085]">vs. {proposal.projection.baselineTotal} current plan</span>
                <div className="mt-4 h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={proposal.projection.chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E1D6" vertical={false} />
                      <XAxis dataKey="year" stroke="#667085" fontSize={10} tickLine={false} />
                      <YAxis stroke="#667085" fontSize={10} tickLine={false} tickFormatter={(value) => `₹${value}L`} />
                      <Tooltip
                        formatter={(value) => [`₹ ${String(value ?? 0)} Lakhs`, "Value"]}
                        contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "8px", borderColor: "#E8E1D6", fontSize: "11px" }}
                      />
                      <Line type="monotone" dataKey="proposed" name="Draft" stroke="#5E55C9" strokeWidth={2.5} dot={{ r: 3, fill: "#5E55C9" }} />
                      <Line type="monotone" dataKey="current" name="Current Plan" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-xl border border-[#E8E1D6] bg-white p-4 text-xs text-[#667085]">
                This scenario does not expose a time-series projection. The comparison metrics above are the authoritative engine result.
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#8FA9D6]/40 bg-[#8FA9D6]/10 p-3 text-xs text-[#1A2238]">
          <p className="font-semibold">AI explains the scenario; the financial engine calculates it.</p>
          <p className="mt-0.5 text-[#475467]">
            Staging creates a draft in Scenarios. Applying that draft to your plan remains a separate explicit action.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-[#E8E1D6]">
          <button type="button" onClick={onClose} className={secondary} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ name: scenarioName.trim() || proposal.title })}
            className={action}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Staging…" : "Confirm & Stage in Scenarios"}
          </button>
        </div>
      </div>
    </div>
  );
}
