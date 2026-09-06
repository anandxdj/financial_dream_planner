"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  TrendingUp,
  BarChart3,
  Landmark,
  ShieldAlert,
  Wallet,
  Plus,
  Trash2,
} from "lucide-react";
import type { InvestmentItem } from "./types";
import { formatCurrency } from "./utils";

interface InvestmentsStepProps {
  investments: InvestmentItem[];
  onUpdateInvestment: (id: string, updates: Partial<InvestmentItem>) => void;
  onAddInvestment: (item: Omit<InvestmentItem, "id">) => void;
  onRemoveInvestment: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const ACCOUNT_ICONS: Record<string, React.ElementType> = {
  savings: Landmark,
  mutual_fund: TrendingUp,
  stocks: BarChart3,
  fd: Building2,
  ppf: ShieldAlert,
  other: Wallet,
};

export function InvestmentsStep({
  investments,
  onUpdateInvestment,
  onAddInvestment,
  onRemoveInvestment,
  onNext,
  onBack,
}: InvestmentsStepProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("other");
  const [newValue, setNewValue] = useState("");

  const totalInvestments = investments.reduce(
    (sum, item) => sum + (parseFloat(item.currentValue) || 0),
    0
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newValue) {
      onAddInvestment({
        name: newName.trim(),
        type: newType,
        currentValue: newValue,
      });
      setNewName("");
      setNewValue("");
      setShowAdd(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Left Column: Accounts list */}
      <div className="space-y-6 lg:col-span-7">
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-[#1F2A44] sm:text-3xl">
            Tell us about your investments
          </h2>
          <p className="mt-1.5 text-sm text-[#475467]">
            This helps us understand your current financial position.
          </p>
        </div>

        <div className="space-y-3">
          {investments.map((inv) => {
            const IconComp = ACCOUNT_ICONS[inv.type] || Landmark;

            return (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E1D6] bg-white p-3.5 shadow-xs sm:px-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#3D5C4A]/10 text-[#3D5C4A]">
                    <IconComp className="size-4.5" />
                  </div>
                  <span className="truncate text-sm font-medium text-[#1F2A44]">
                    {inv.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-36 sm:w-44">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-[#475467]">
                      ₹
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inv.currentValue}
                      placeholder="0"
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9]/g, "");
                        onUpdateInvestment(inv.id, { currentValue: clean });
                      }}
                      className="w-full rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] py-1.5 pr-3 pl-7 text-right text-sm font-semibold tabular-nums text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveInvestment(inv.id)}
                    className="text-[#9CA3AF] hover:text-[#A13F39]"
                    aria-label="Remove account"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add Account Modal / Form */}
          {showAdd ? (
            <form
              onSubmit={handleAdd}
              className="rounded-2xl border border-dashed border-[#5E55C9] bg-white p-4"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Account Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] px-3 py-1.5 text-sm focus:border-[#5E55C9] focus:outline-none"
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] px-3 py-1.5 text-sm focus:border-[#5E55C9] focus:outline-none"
                >
                  <option value="mutual_fund">Mutual Fund</option>
                  <option value="stocks">Stocks / Demat</option>
                  <option value="savings">Savings / Cash</option>
                  <option value="fd">Fixed Deposit</option>
                  <option value="ppf">PPF / EPF</option>
                  <option value="other">Other Asset</option>
                </select>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-[#475467]">
                    ₹
                  </span>
                  <input
                    type="text"
                    placeholder="Current Value"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] py-1.5 pr-3 pl-7 text-sm font-semibold tabular-nums focus:border-[#5E55C9] focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-lg border border-[#E8E1D6] px-3 py-1.5 text-xs font-medium text-[#475467]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#5E55C9] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#4E45B8]"
                >
                  Add Account
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 pt-1 text-sm font-medium text-[#5E55C9] hover:underline"
            >
              <Plus className="size-4" />
              <span>Add another account</span>
            </button>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between border-t border-[#E8E1D6] pt-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E8E1D6] bg-white px-5 py-2 text-sm font-medium text-[#344054] hover:bg-[#FFF9F0]"
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#5E55C9] px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#4E45B8] active:scale-[0.99]"
          >
            <span>Next</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Right Column: Total Investments Card */}
      <div className="lg:col-span-5">
        <div className="sticky top-6 flex flex-col items-center rounded-3xl border border-[#E8E1D6] bg-white p-7 text-center shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
            Total Investments
          </span>
          <div className="mt-2 font-serif text-3xl font-medium tracking-tight text-[#1F2A44] sm:text-4xl">
            {formatCurrency(totalInvestments)}
          </div>

          <div className="relative my-6 size-44 drop-shadow-sm">
            <Image
              src="/Assets/Objects/potted_plant.png"
              alt="Growing investments potted plant"
              fill
              className="object-contain"
              sizes="176px"
            />
          </div>

          <p className="font-serif text-sm italic text-[#3D5C4A]">
            &ldquo;Your money has a story. Let&apos;s make it a brighter one.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
