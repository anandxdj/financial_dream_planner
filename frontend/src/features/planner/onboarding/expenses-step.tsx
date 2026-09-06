"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  Film,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { ExpenseItem } from "./types";
import { EXPENSE_COLORS } from "./constants";
import { formatCurrency } from "./utils";

interface ExpensesStepProps {
  expenses: ExpenseItem[];
  onUpdateExpense: (id: string, amount: string) => void;
  onAddCustomExpense: (label: string, amount: string) => void;
  onRemoveExpense: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  housing: Home,
  food: Utensils,
  transport: Car,
  utilities: Zap,
  shopping: ShoppingBag,
  entertainment: Film,
  others: MoreHorizontal,
};

export function ExpensesStep({
  expenses,
  onUpdateExpense,
  onAddCustomExpense,
  onRemoveExpense,
  onNext,
  onBack,
}: ExpensesStepProps) {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customAmount, setCustomAmount] = useState("");

  const totalExpenses = expenses.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  // Prepare chart data with percentages
  const chartData = expenses
    .map((item) => {
      const val = parseFloat(item.amount) || 0;
      return {
        name: item.label,
        value: val,
        percentage: totalExpenses > 0 ? Math.round((val / totalExpenses) * 100) : 0,
      };
    })
    .filter((d) => d.value > 0);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customLabel.trim() && customAmount) {
      onAddCustomExpense(customLabel.trim(), customAmount);
      setCustomLabel("");
      setCustomAmount("");
      setShowAddCustom(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Left Column: Form Fields */}
      <div className="space-y-6 lg:col-span-7">
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-[#1F2A44] sm:text-3xl">
            What are your monthly expenses?
          </h2>
          <p className="mt-1.5 text-sm text-[#475467]">
            Add your average monthly spending. This helps us create a realistic plan.
          </p>
        </div>

        <div className="space-y-3">
          {expenses.map((expense) => {
            const IconComponent = CATEGORY_ICONS[expense.category] || MoreHorizontal;

            return (
              <div
                key={expense.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E1D6] bg-white p-3.5 shadow-xs sm:px-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#5E55C9]/10 text-[#5E55C9]">
                    <IconComponent className="size-4.5" />
                  </div>
                  <span className="truncate text-sm font-medium text-[#1F2A44]">
                    {expense.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-32 sm:w-40">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-[#475467]">
                      ₹
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={expense.amount}
                      placeholder="0"
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9]/g, "");
                        onUpdateExpense(expense.id, clean);
                      }}
                      className="w-full rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] py-1.5 pr-3 pl-7 text-right text-sm font-semibold tabular-nums text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
                    />
                  </div>

                  {!["housing", "food", "transport", "utilities"].includes(expense.category) && (
                    <button
                      type="button"
                      onClick={() => onRemoveExpense(expense.id)}
                      className="text-[#9CA3AF] hover:text-[#A13F39]"
                      aria-label="Remove category"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add custom category form/button */}
          {showAddCustom ? (
            <form
              onSubmit={handleAddCustom}
              className="rounded-2xl border border-dashed border-[#5E55C9] bg-white p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Category Name (e.g. Subscriptions)"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] px-3 py-2 text-sm focus:border-[#5E55C9] focus:outline-none"
                />
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-[#475467]">
                    ₹
                  </span>
                  <input
                    type="text"
                    placeholder="Amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] py-2 pr-3 pl-7 text-sm font-semibold tabular-nums focus:border-[#5E55C9] focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustom(false)}
                  className="rounded-lg border border-[#E8E1D6] px-3 py-1.5 text-xs font-medium text-[#475467]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#5E55C9] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#4E45B8]"
                >
                  Save Category
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddCustom(true)}
              className="flex items-center gap-2 pt-1 text-sm font-medium text-[#5E55C9] hover:underline"
            >
              <Plus className="size-4" />
              <span>Add custom category</span>
            </button>
          )}
        </div>

        {/* Bottom decorative quote with books illustration */}
        <div className="flex items-center gap-4 rounded-2xl border border-[#E8E1D6]/60 bg-[#FFF9F0]/50 p-4">
          <div className="relative size-14 shrink-0">
            <Image
              src="/Assets/Objects/stacked_books.png"
              alt="Stacked books with small plant"
              fill
              className="object-contain"
              sizes="56px"
            />
          </div>
          <p className="font-serif text-sm italic text-[#3D5C4A]">
            &ldquo;Awareness today, freedom tomorrow.&rdquo;
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

      {/* Right Column: Donut Chart Card */}
      <div className="lg:col-span-5">
        <div className="sticky top-6 flex flex-col items-center rounded-3xl border border-[#E8E1D6] bg-white p-6 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
            Total Monthly Expenses
          </span>
          <div className="mt-2 font-serif text-3xl font-medium tracking-tight text-[#1F2A44] sm:text-4xl">
            {formatCurrency(totalExpenses)}
          </div>

          {/* Donut Chart */}
          <div className="relative mt-4 size-52">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => formatCurrency(Number(val))}
                    contentStyle={{
                      backgroundColor: "#FFFCF8",
                      borderColor: "#E8E1D6",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-[#9CA3AF]">
                Enter expenses to see breakdown
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 grid w-full grid-cols-2 gap-2 text-xs">
            {chartData.slice(0, 6).map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: EXPENSE_COLORS[idx % EXPENSE_COLORS.length] }}
                />
                <span className="truncate text-[#475467]">{item.name}</span>
                <span className="ml-auto font-semibold tabular-nums text-[#1F2A44]">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
