"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Home, Car, CreditCard, Plus, X, Landmark } from "lucide-react";
import type { LoanItem } from "./types";
import { formatCurrency } from "./utils";

interface LoansStepProps {
  loans: LoanItem[];
  onAddLoan: (loan: Omit<LoanItem, "id">) => void;
  onUpdateLoan: (id: string, updates: Partial<LoanItem>) => void;
  onRemoveLoan: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const LOAN_ICONS: Record<string, React.ElementType> = {
  home: Home,
  car: Car,
  personal: CreditCard,
  other: Landmark,
};

export function LoansStep({
  loans,
  onAddLoan,
  onUpdateLoan,
  onRemoveLoan,
  onNext,
  onBack,
}: LoansStepProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLoanName, setNewLoanName] = useState("");
  const [newLoanType, setNewLoanType] = useState("personal");
  const [newOutstanding, setNewOutstanding] = useState("");
  const [newEmi, setNewEmi] = useState("");

  const totalOutstanding = loans.reduce(
    (sum, l) => sum + (parseFloat(l.outstandingAmount) || 0),
    0
  );
  const totalEmi = loans.reduce((sum, l) => sum + (parseFloat(l.monthlyEmi) || 0), 0);

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLoanName.trim() && newOutstanding) {
      onAddLoan({
        name: newLoanName.trim(),
        type: newLoanType,
        outstandingAmount: newOutstanding,
        monthlyEmi: newEmi || "0",
      });
      setNewLoanName("");
      setNewOutstanding("");
      setNewEmi("");
      setShowAddModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-medium tracking-tight text-[#1F2A44] sm:text-3xl">
          Do you have any loans or EMIs?
        </h2>
        <p className="mt-1.5 text-sm text-[#475467]">
          This helps us factor in your existing commitments.
        </p>
      </div>

      {/* Loan List */}
      <div className="space-y-3.5">
        {loans.map((loan) => {
          const IconComp = LOAN_ICONS[loan.type] || Landmark;

          return (
            <div
              key={loan.id}
              className="relative flex flex-col justify-between gap-4 rounded-2xl border border-[#E8E1D6] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:p-5"
            >
              {/* Left icon + name */}
              <div className="flex items-center gap-3.5 sm:w-1/3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#5E55C9]/10 text-[#5E55C9]">
                  <IconComp className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1F2A44]">{loan.name}</h4>
                  <span className="text-xs text-[#475467] capitalize">{loan.type} Loan</span>
                </div>
              </div>

              {/* Middle: Outstanding Amount Input */}
              <div className="space-y-1 sm:w-1/3">
                <label className="block text-xs font-semibold text-[#475467]">
                  Outstanding amount
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-[#475467]">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={loan.outstandingAmount}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, "");
                      onUpdateLoan(loan.id, { outstandingAmount: v });
                    }}
                    placeholder="0"
                    className="w-full rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] py-1.5 pr-3 pl-7 text-sm font-semibold tabular-nums text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
                  />
                </div>
              </div>

              {/* Right: Monthly EMI Input & Remove */}
              <div className="flex items-end gap-2 sm:w-1/3">
                <div className="w-full space-y-1">
                  <label className="block text-xs font-semibold text-[#475467]">
                    Monthly EMI
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-[#475467]">
                      ₹
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={loan.monthlyEmi}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        onUpdateLoan(loan.id, { monthlyEmi: v });
                      }}
                      placeholder="0"
                      className="w-full rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] py-1.5 pr-3 pl-7 text-sm font-semibold tabular-nums text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveLoan(loan.id)}
                  className="mb-1 rounded-lg p-1.5 text-[#9CA3AF] transition-colors hover:bg-red-50 hover:text-[#A13F39]"
                  aria-label="Remove loan"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Loan Form / Trigger */}
        {showAddModal ? (
          <form
            onSubmit={handleAddLoan}
            className="rounded-2xl border border-dashed border-[#5E55C9] bg-white p-5"
          >
            <h4 className="text-sm font-semibold text-[#1F2A44]">Add New Loan or EMI</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-xs text-[#475467]">Loan Name</label>
                <input
                  type="text"
                  placeholder="e.g. Education Loan"
                  value={newLoanName}
                  onChange={(e) => setNewLoanName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] px-3 py-1.5 text-sm focus:border-[#5E55C9] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#475467]">Loan Type</label>
                <select
                  value={newLoanType}
                  onChange={(e) => setNewLoanType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] px-3 py-1.5 text-sm focus:border-[#5E55C9] focus:outline-none"
                >
                  <option value="personal">Personal</option>
                  <option value="home">Home</option>
                  <option value="car">Car</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#475467]">Outstanding Amount</label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-[#475467]">
                    ₹
                  </span>
                  <input
                    type="text"
                    placeholder="0"
                    value={newOutstanding}
                    onChange={(e) => setNewOutstanding(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] py-1.5 pr-3 pl-7 text-sm font-semibold tabular-nums focus:border-[#5E55C9] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#475467]">Monthly EMI</label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-[#475467]">
                    ₹
                  </span>
                  <input
                    type="text"
                    placeholder="0"
                    value={newEmi}
                    onChange={(e) => setNewEmi(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] py-1.5 pr-3 pl-7 text-sm font-semibold tabular-nums focus:border-[#5E55C9] focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-[#E8E1D6] px-3 py-1.5 text-xs font-medium text-[#475467]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#5E55C9] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#4E45B8]"
              >
                Add Loan
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-sm font-medium text-[#5E55C9] hover:underline"
          >
            <Plus className="size-4" />
            <span>Add another loan</span>
          </button>
        )}
      </div>

      {/* Summary totals banner if loans exist */}
      {loans.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E8E1D6] bg-[#FFF9F0]/60 p-4 text-sm">
          <span className="text-[#475467]">
            Total Outstanding:{" "}
            <strong className="text-[#1F2A44]">{formatCurrency(totalOutstanding)}</strong>
          </span>
          <span className="text-[#475467]">
            Total Monthly Commitment:{" "}
            <strong className="text-[#5E55C9]">{formatCurrency(totalEmi)} / month</strong>
          </span>
        </div>
      )}

      {/* Botanical quote artwork matching reference */}
      <div className="flex items-center justify-center gap-3 pt-2 text-center">
        <Image
          src="/Assets/Elements/leaf_branch_four.png"
          alt="Leafy twig"
          width={28}
          height={28}
          className="opacity-75"
        />
        <p className="font-serif text-sm italic text-[#3D5C4A]">
          &ldquo;Small steps today. A stronger tomorrow.&rdquo;
        </p>
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
  );
}
