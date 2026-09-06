"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Check } from "lucide-react";
import { sdk } from "@/lib/sdk";
import { money } from "@/features/planner/ui";
import { demoStore } from "@/lib/demo-store";
import type { Goal } from "@/features/planner/planning-queries";

interface AddContributionModalProps {
  goal: Goal;
  isOpen: boolean;
  onClose: () => void;
}

export function AddContributionModal({
  goal,
  isOpen,
  onClose,
}: AddContributionModalProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(goal.monthlyContribution || "15000");
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<"sip" | "adhoc">("sip");
  const [note, setNote] = useState("Regular Monthly SIP");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSavingsNum = Number(goal.currentSavings || 0);
  const addAmountNum = Number(amount || 0);
  const nextSavings = (currentSavingsNum + addAmountNum).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addAmountNum <= 0) return;

    setPending(true);
    setError(null);

    try {
      // 1. Record contribution in demoStore
      demoStore.addGoalContribution({
        goalId: goal.id,
        amount: addAmountNum.toFixed(2),
        date: dateStr,
        note: note.trim() || (type === "sip" ? "Monthly SIP" : "Direct Contribution"),
        type,
      });

      // 2. Persist updated savings via SDK if possible
      try {
        await sdk.PATCH("/api/v1/goals/{id}", {
          params: { path: { id: goal.id } },
          body: {
            currentSavings: nextSavings,
            expectedRevision: goal.revision,
          },
        });
      } catch {
        // Fallback handled in demoStore
      }

      // 3. Invalidate caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["goals"] }),
        queryClient.invalidateQueries({ queryKey: ["goals", goal.id, "contributions"] }),
        queryClient.invalidateQueries({ queryKey: ["planning"] }),
      ]);

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record contribution";
      setError(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E1D6]/70 px-6 py-5 bg-[#FFF9F0]/60">
          <div>
            <h3 className="font-serif text-xl font-normal text-[#1F2A44]">
              Add Contribution
            </h3>
            <p className="text-xs text-[#475467] mt-0.5">{goal.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#475467] hover:bg-[#E8E1D6]/40 hover:text-[#1F2A44]"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick preset chips */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2A44] mb-2">
              Contribution Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType("sip");
                  setNote("Regular Monthly SIP");
                  setAmount(goal.monthlyContribution || "15000");
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  type === "sip"
                    ? "border-[#5E55C9] bg-[#5E55C9]/10 text-[#5E55C9]"
                    : "border-[#E8E1D6] bg-white text-[#475467]"
                }`}
              >
                Monthly SIP
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("adhoc");
                  setNote("Bonus / Ad-hoc Savings");
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  type === "adhoc"
                    ? "border-[#5E55C9] bg-[#5E55C9]/10 text-[#5E55C9]"
                    : "border-[#E8E1D6] bg-white text-[#475467]"
                }`}
              >
                Ad-hoc Deposit
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="contribution-amount"
              className="block text-xs font-semibold text-[#1F2A44] mb-1"
            >
              Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-serif text-sm text-[#475467]">
                ₹
              </span>
              <input
                id="contribution-amount"
                type="number"
                required
                min="100"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-[#E8E1D6] bg-white pl-8 pr-3 py-2.5 text-base font-semibold tabular-nums text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="contribution-date"
                className="block text-xs font-semibold text-[#1F2A44] mb-1"
              >
                Date
              </label>
              <input
                id="contribution-date"
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full rounded-xl border border-[#E8E1D6] bg-white px-3 py-2 text-xs text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="contribution-note"
                className="block text-xs font-semibold text-[#1F2A44] mb-1"
              >
                Note (optional)
              </label>
              <input
                id="contribution-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. August SIP"
                className="w-full rounded-xl border border-[#E8E1D6] bg-white px-3 py-2 text-xs text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
              />
            </div>
          </div>

          {/* Impact preview */}
          <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFF9F0] p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-[#475467]">
              <span>Current saved:</span>
              <span className="font-semibold text-[#1F2A44] tabular-nums">
                {money(goal.currentSavings)}
              </span>
            </div>
            <div className="flex justify-between text-[#5E55C9]">
              <span>Adding today:</span>
              <span className="font-semibold tabular-nums">
                +{money(amount || "0")}
              </span>
            </div>
            <div className="pt-1.5 border-t border-[#E8E1D6]/70 flex justify-between font-semibold text-[#1F2A44]">
              <span>New total saved:</span>
              <span className="tabular-nums text-[#3D5C4A]">
                {money(nextSavings)}
              </span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-[#A13F39] bg-[#FFF9F0] p-2.5 rounded-xl border border-[#A13F39]">
              {error}
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#475467] hover:text-[#1F2A44]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || addAmountNum <= 0}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5E55C9] text-white text-xs font-semibold hover:bg-[#4d45b5] transition-colors disabled:opacity-50 shadow-xs"
            >
              <Check className="size-3.5" />
              {pending ? "Recording…" : "Record Contribution"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
