"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Target,
  CreditCard,
  Wallet,
  TrendingUp,
  Receipt,
  User,
} from "lucide-react";
import type { GoalCardItem, ExpenseItem, LoanItem, InvestmentItem, IncomeStream } from "./types";
import { formatCurrency } from "./utils";

interface ReviewStepProps {
  goals: GoalCardItem[];
  salary: string;
  otherIncome: IncomeStream[];
  expenses: ExpenseItem[];
  loans: LoanItem[];
  investments: InvestmentItem[];
  userProfile?: { name: string; email: string };
  onNavigateToStep: (stepNumber: number) => void;
  onGeneratePlan: () => void;
  onBack: () => void;
  isGenerating: boolean;
}

export function ReviewStep({
  goals,
  salary,
  otherIncome,
  expenses,
  loans,
  investments,
  userProfile = { name: "Anand Sharma", email: "anand@email.com" },
  onNavigateToStep,
  onGeneratePlan,
  onBack,
  isGenerating,
}: ReviewStepProps) {
  // Compute summary values
  const selectedGoals = goals.filter((g) => g.selected);
  const goalsSummary =
    selectedGoals.length > 0
      ? selectedGoals.map((g) => g.name).join(", ")
      : "No specific goals selected";

  const totalIncome =
    (parseFloat(salary) || 0) +
    otherIncome.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);

  const totalExpenses = expenses.reduce(
    (acc, e) => acc + (parseFloat(e.amount) || 0),
    0
  );

  const totalEmi = loans.reduce((acc, l) => acc + (parseFloat(l.monthlyEmi) || 0), 0);
  const loansSummary =
    loans.length > 0
      ? `${loans.length} loan${loans.length > 1 ? "s" : ""} | ${formatCurrency(totalEmi)} / month`
      : "No active loans";

  const totalInvestments = investments.reduce(
    (acc, i) => acc + (parseFloat(i.currentValue) || 0),
    0
  );

  const reviewCards = [
    {
      title: "Goals",
      value: goalsSummary,
      icon: Target,
      stepNumber: 1,
      color: "text-[#5E55C9] bg-[#5E55C9]/10",
    },
    {
      title: "Loans & EMI",
      value: loansSummary,
      icon: CreditCard,
      stepNumber: 4,
      color: "text-[#A13F39] bg-[#A13F39]/10",
    },
    {
      title: "Income",
      value: `${formatCurrency(totalIncome)} / month`,
      icon: Wallet,
      stepNumber: 2,
      color: "text-[#3D5C4A] bg-[#3D5C4A]/10",
    },
    {
      title: "Investments",
      value: formatCurrency(totalInvestments),
      icon: TrendingUp,
      stepNumber: 5,
      color: "text-[#3B5B8C] bg-[#3B5B8C]/10",
    },
    {
      title: "Expenses",
      value: `${formatCurrency(totalExpenses)} / month`,
      icon: Receipt,
      stepNumber: 3,
      color: "text-[#7D5200] bg-[#E6B46A]/15",
    },
    {
      title: "Personal Details",
      value: `${userProfile.name}\n${userProfile.email}`,
      icon: User,
      stepNumber: 1, // Profile link or step 1
      color: "text-[#1F2A44] bg-[#1F2A44]/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-medium tracking-tight text-[#1F2A44] sm:text-3xl">
          Review your information
        </h2>
        <p className="mt-1.5 text-sm text-[#475467]">
          Make sure everything looks right before we create your plan.
        </p>
      </div>

      {/* 2-Column Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {reviewCards.map((card) => {
          const IconComp = card.icon;

          return (
            <div
              key={card.title}
              className="flex items-start justify-between rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-xs"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
                  <IconComp className="size-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                    {card.title}
                  </span>
                  <div className="mt-1 text-sm font-semibold text-[#1F2A44] whitespace-pre-line truncate">
                    {card.value}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateToStep(card.stepNumber)}
                className="text-xs font-semibold text-[#5E55C9] hover:underline"
              >
                Edit
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom section with house watercolor artwork and CTA */}
      <div className="flex flex-col items-center justify-between gap-6 border-t border-[#E8E1D6] pt-6 sm:flex-row">
        {/* House illustration flourish */}
        <div className="flex items-center gap-3">
          <div className="relative size-14 shrink-0">
            <Image
              src="/Assets/Houses/cozy_first_home.png"
              alt="Watercolor house"
              fill
              className="object-contain"
              sizes="56px"
            />
          </div>
          <div className="font-serif text-sm italic text-[#3D5C4A]">
            Looks good? Let&apos;s create your plan.
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-[#E8E1D6] bg-white px-5 py-2.5 text-sm font-medium text-[#344054] hover:bg-[#FFF9F0]"
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={onGeneratePlan}
            disabled={isGenerating}
            className="inline-flex min-h-[46px] items-center gap-2.5 rounded-xl bg-[#5E55C9] px-7 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#4E45B8] active:scale-[0.99] disabled:opacity-50"
          >
            <span>{isGenerating ? "Generating..." : "Generate My Plan"}</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
