"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import type { IncomeStream } from "./types";
import { formatCurrency } from "./utils";

interface IncomeStepProps {
  salary: string;
  onSalaryChange: (val: string) => void;
  otherStreams: IncomeStream[];
  onAddStream: () => void;
  onUpdateStream: (id: string, updates: Partial<IncomeStream>) => void;
  onRemoveStream: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function IncomeStep({
  salary,
  onSalaryChange,
  otherStreams,
  onAddStream,
  onUpdateStream,
  onRemoveStream,
  onNext,
  onBack,
}: IncomeStepProps) {
  const salaryNum = parseFloat(salary) || 0;
  const otherTotal = otherStreams.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);
  const totalIncome = salaryNum + otherTotal;

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Left Form Column */}
      <div className="space-y-6 lg:col-span-7">
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-[#1F2A44] sm:text-3xl">
            Tell us about your income
          </h2>
          <p className="mt-1.5 text-sm text-[#475467]">
            This helps us understand your financial capacity.
          </p>
        </div>

        <div className="space-y-4">
          {/* Monthly Take-Home Salary */}
          <div className="rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-xs">
            <label htmlFor="salary-input" className="block text-sm font-semibold text-[#1F2A44]">
              Monthly take-home salary
            </label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 font-medium text-[#475467]">
                ₹
              </span>
              <input
                id="salary-input"
                type="text"
                inputMode="decimal"
                value={salary}
                placeholder="0"
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  onSalaryChange(v);
                }}
                className="w-full rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] py-2.5 pr-4 pl-8 text-base font-semibold tabular-nums text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-[#475467]">After tax and regular deductions.</p>
          </div>

          {/* Other Incomes List */}
          {otherStreams.map((stream, idx) => (
            <div
              key={stream.id}
              className="relative rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                  {idx === 0 ? "Other income (optional)" : `Additional income #${idx + 1}`}
                </label>
                <button
                  type="button"
                  onClick={() => onRemoveStream(stream.id)}
                  className="text-[#9CA3AF] hover:text-[#A13F39]"
                  aria-label="Remove income stream"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-medium text-[#475467]">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={stream.amount}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, "");
                      onUpdateStream(stream.id, { amount: v });
                    }}
                    className="w-full rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] py-2 pr-3 pl-8 text-sm font-semibold tabular-nums text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
                  />
                </div>

                <select
                  value={stream.type}
                  onChange={(e) => onUpdateStream(stream.id, { type: e.target.value })}
                  aria-label="Income Type"
                  className="w-full rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] px-3 py-2 text-sm text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
                >
                  <option value="Freelance">Freelance</option>
                  <option value="Rental">Rental</option>
                  <option value="Investments">Investments / Dividends</option>
                  <option value="Business">Business / Side Project</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          ))}

          {/* Add Another Income Button */}
          <button
            type="button"
            onClick={onAddStream}
            className="flex items-center gap-2 text-sm font-medium text-[#5E55C9] hover:underline"
          >
            <Plus className="size-4" />
            <span>Add another income source</span>
          </button>
        </div>

        {/* Bottom Actions */}
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

      {/* Right Column Context Card */}
      <div className="lg:col-span-5">
        <div className="sticky top-6 flex flex-col items-center rounded-3xl border border-[#E8E1D6] bg-white p-7 text-center shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
            Total Monthly Income
          </span>
          <div className="mt-2 font-serif text-3xl font-medium tracking-tight text-[#1F2A44] sm:text-4xl">
            {formatCurrency(totalIncome)}
          </div>

          <div className="relative my-6 size-44 drop-shadow-sm">
            <Image
              src="/Assets/Objects/potted_plant.png"
              alt="Growing plant watercolor illustration"
              fill
              className="object-contain"
              sizes="176px"
            />
          </div>

          <p className="font-serif text-sm italic text-[#3D5C4A]">
            &ldquo;Every step forward brings your dreams closer.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
