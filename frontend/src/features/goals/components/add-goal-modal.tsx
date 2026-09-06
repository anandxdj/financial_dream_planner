"use client";

import { useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Sparkles,
  TrendingUp,
  Target,
} from "lucide-react";
import { sdk } from "@/lib/sdk";
import { unwrap } from "@/features/planner/queries";
import { money, date } from "@/features/planner/ui";
import { demoStore } from "@/lib/demo-store";
import { cn } from "@/lib/utils";
import type { Goal } from "@/features/planner/planning-queries";
import { CATEGORY_IMAGES } from "./goal-card";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: Goal["category"];
  initialName?: string;
}

const PRESET_GOALS: Array<{
  category: Goal["category"];
  name: string;
  defaultAmount: string;
  defaultMonthly: string;
  image: string;
  tagline: string;
}> = [
  {
    category: "home",
    name: "Buy a Home",
    defaultAmount: "6000000",
    defaultMonthly: "30000",
    image: "/Assets/Houses/cozy_first_home.png",
    tagline: "A place to call your own.",
  },
  {
    category: "car",
    name: "Buy a Car",
    defaultAmount: "800000",
    defaultMonthly: "15000",
    image: "/Assets/Characters/purple_car_front.png",
    tagline: "Drive toward convenience.",
  },
  {
    category: "travel",
    name: "Travel the World",
    defaultAmount: "500000",
    defaultMonthly: "12000",
    image: "/Assets/Objects/beach_chair_sea.png",
    tagline: "Explore destinations with ease.",
  },
  {
    category: "education",
    name: "Child's Education",
    defaultAmount: "1500000",
    defaultMonthly: "10000",
    image: "/Assets/Piggy Banks/graduate_piggy_bank.png",
    tagline: "Invest in their bright tomorrow.",
  },
  {
    category: "savings",
    name: "Emergency Fund",
    defaultAmount: "300000",
    defaultMonthly: "10000",
    image: "/Assets/Jars And Coins/coins_in_jar.png",
    tagline: "Stay prepared for life’s surprises.",
  },
];

export function AddGoalModal({
  isOpen,
  onClose,
  initialCategory,
  initialName,
}: AddGoalModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [category, setCategory] = useState<Goal["category"]>(
    initialCategory || "home"
  );
  const [name, setName] = useState(initialName || "Buy a Home");
  const [targetAmount, setTargetAmount] = useState("6000000");
  const [targetDate, setTargetDate] = useState("2030-12-31");
  const [currentSavings, setCurrentSavings] = useState("0");
  const [monthlyContribution, setMonthlyContribution] = useState("20000");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: (typeof PRESET_GOALS)[number]) => {
    setCategory(preset.category);
    setName(preset.name);
    setTargetAmount(preset.defaultAmount);
    setMonthlyContribution(preset.defaultMonthly);
    setStep(2);
  };

  const handleSelectCustom = () => {
    setCategory("custom");
    setName("My Custom Goal");
    setTargetAmount("500000");
    setMonthlyContribution("10000");
    setStep(2);
  };

  const handleSaveGoal = async () => {
    setPending(true);
    setError(null);
    const body = {
      name: name.trim(),
      category,
      targetAmount: targetAmount.trim(),
      targetDate,
      currentSavings: currentSavings.trim() || "0",
      monthlyContribution: monthlyContribution.trim() || "0",
    };

    try {
      if (demoStore.isDemoMode()) {
        demoStore.addGoal(body);
        try {
          await sdk.POST("/api/v1/goals", { body });
        } catch {
          // Best-effort sync in demo mode
        }
      } else {
        const res = await sdk.POST("/api/v1/goals", { body });
        unwrap(res);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["goals"] }),
        queryClient.invalidateQueries({ queryKey: ["goals", "feasibility"] }),
        queryClient.invalidateQueries({ queryKey: ["planning"] }),
      ]);
      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save goal. You may have reached the 3-goal limit.";
      setError(msg);
    } finally {
      setPending(false);
    }
  };

  // Projections preview calculations
  const targetNum = Number(targetAmount) || 0;
  const savedNum = Number(currentSavings) || 0;
  const targetYear = new Date(targetDate).getFullYear() || 2030;
  const years = Math.max(1, targetYear - 2026);
  // Estimate future inflated cost (assumed 6% inflation)
  const futureCost = targetNum * Math.pow(1 + 0.06, years);
  const initialFunding = targetNum > 0 ? (savedNum / targetNum) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] shadow-2xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E8E1D6]/70 px-6 py-5 bg-[#FFF9F0]/60">
          <div>
            <h2 className="font-serif text-2xl font-normal text-[#1F2A44]">
              {step === 4 ? "You're All Set!" : "Add a new goal"}
            </h2>
            <p className="text-xs text-[#475467] mt-0.5">
              {step === 1 && "Choose a goal type or create a custom one"}
              {step === 2 && "Add target amount, timeline, and your monthly contribution"}
              {step === 3 && "Review your plan assumptions and future projections"}
              {step === 4 && "Start saving and track your compounding progress"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#475467] hover:bg-[#E8E1D6]/40 hover:text-[#1F2A44] transition-colors"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Board 03 Stepper Progress Bar */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between text-xs font-medium text-[#475467]">
            <span className={cn(step >= 1 ? "text-[#5E55C9] font-semibold" : "")}>
              1. Choose Goal
            </span>
            <span className={cn(step >= 2 ? "text-[#5E55C9] font-semibold" : "")}>
              2. Set Details
            </span>
            <span className={cn(step >= 3 ? "text-[#5E55C9] font-semibold" : "")}>
              3. Review
            </span>
            <span className={cn(step === 4 ? "text-[#3D5C4A] font-semibold" : "")}>
              4. You&apos;re All Set
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E8E1D6]/60">
            <div
              className={cn(
                "h-full transition-all duration-300",
                step === 4 ? "bg-[#3D5C4A]" : "bg-[#5E55C9]"
              )}
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="max-h-[68vh] overflow-y-auto px-6 py-4">
          {/* STEP 1: Choose Goal (Board 03 Grid) */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {PRESET_GOALS.map((preset) => {
                  const isSelected = category === preset.category;
                  return (
                    <button
                      key={preset.category}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={cn(
                        "group flex flex-col items-center justify-between rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5",
                        isSelected
                          ? "border-[#5E55C9] bg-[#5E55C9]/5 shadow-xs"
                          : "border-[#E8E1D6] bg-white hover:border-[#5E55C9]/40 hover:bg-[#FFFDF9]"
                      )}
                    >
                      <div className="relative size-20 drop-shadow-xs mb-2 transition-transform duration-200 group-hover:scale-105">
                        <Image
                          src={preset.image}
                          alt={preset.name}
                          fill
                          className="object-contain p-1"
                          sizes="80px"
                        />
                      </div>
                      <span className="font-serif text-sm font-medium text-[#1F2A44]">
                        {preset.name}
                      </span>
                      <span className="text-[11px] text-[#475467] mt-1 line-clamp-1">
                        {preset.tagline}
                      </span>
                    </button>
                  );
                })}

                {/* Custom Goal Card */}
                <button
                  type="button"
                  onClick={handleSelectCustom}
                  className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#5E55C9]/50 bg-[#5E55C9]/5 p-4 text-center transition-all hover:bg-[#5E55C9]/10"
                >
                  <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-white text-[#5E55C9] shadow-xs">
                    <Plus className="size-6" />
                  </div>
                  <span className="font-serif text-sm font-medium text-[#5E55C9]">
                    + Custom Goal
                  </span>
                  <span className="text-[11px] text-[#475467] mt-1">
                    Design your own dream
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Set Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFF9F0] border border-[#E8E1D6]/70">
                <div className="relative size-14 shrink-0 rounded-xl overflow-hidden bg-white border border-[#E8E1D6]">
                  <Image
                    src={CATEGORY_IMAGES[category] || CATEGORY_IMAGES.custom}
                    alt={name}
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-semibold tracking-wider text-[#7D5200] uppercase">
                    Selected Goal
                  </span>
                  <h3 className="font-serif text-lg font-medium text-[#1F2A44] leading-tight">
                    {name}
                  </h3>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label
                    htmlFor="goal-name-input"
                    className="block text-xs font-semibold text-[#1F2A44] mb-1"
                  >
                    Goal Name
                  </label>
                  <input
                    id="goal-name-input"
                    type="text"
                    required
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-[#E8E1D6] bg-white px-3.5 py-2.5 text-sm text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
                    placeholder="e.g. Dream Apartment Down Payment"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="goal-target-amount"
                      className="block text-xs font-semibold text-[#1F2A44] mb-1"
                    >
                      Target Amount Today (INR)
                    </label>
                    <input
                      id="goal-target-amount"
                      type="number"
                      required
                      min="1000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="w-full rounded-xl border border-[#E8E1D6] bg-white px-3.5 py-2.5 text-sm tabular-nums text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
                      placeholder="6000000"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="goal-target-date"
                      className="block text-xs font-semibold text-[#1F2A44] mb-1"
                    >
                      Target Date
                    </label>
                    <input
                      id="goal-target-date"
                      type="date"
                      required
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full rounded-xl border border-[#E8E1D6] bg-white px-3.5 py-2.5 text-sm text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="goal-current-savings"
                      className="block text-xs font-semibold text-[#1F2A44] mb-1"
                    >
                      Already Saved (INR)
                    </label>
                    <input
                      id="goal-current-savings"
                      type="number"
                      min="0"
                      value={currentSavings}
                      onChange={(e) => setCurrentSavings(e.target.value)}
                      className="w-full rounded-xl border border-[#E8E1D6] bg-white px-3.5 py-2.5 text-sm tabular-nums text-[#1F2A44] focus:border-[#5E55C9] focus:outline-none"
                      placeholder="0"
                    />
                    <span className="text-[11px] text-[#475467] mt-0.5 block">
                      Enter 0 if starting fresh
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="goal-monthly-sip"
                      className="block text-xs font-semibold text-[#1F2A44] mb-1"
                    >
                      Your Monthly Contribution (INR)
                    </label>
                    <input
                      id="goal-monthly-sip"
                      type="number"
                      min="100"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(e.target.value)}
                      className="w-full rounded-xl border border-[#E8E1D6] bg-white px-3.5 py-2.5 text-sm tabular-nums text-[#5E55C9] font-semibold focus:border-[#5E55C9] focus:outline-none"
                      placeholder="15000"
                    />
                    <span className="text-[11px] text-[#475467] mt-0.5 block">
                      Amount you can commit monthly
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Review Projections */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#E8E1D6] bg-gradient-to-br from-[#FFF9F0] to-[#F5EFE6] p-4 text-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8E1D6]/70 pb-2">
                  <div className="flex items-center gap-2">
                    <Target className="size-4 text-[#5E55C9]" />
                    <span className="font-semibold text-[#1F2A44]">{name}</span>
                  </div>
                  <span className="text-xs text-[#7D5200] font-medium capitalize">
                    {category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#475467]">Today’s Target:</span>
                    <p className="font-semibold tabular-nums text-[#1F2A44] text-base">
                      {money(targetAmount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#475467]">Target Date:</span>
                    <p className="font-semibold text-[#1F2A44] text-base">
                      {date(targetDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#475467]">Already Saved:</span>
                    <p className="font-semibold tabular-nums text-[#1F2A44]">
                      {money(currentSavings || "0")} ({initialFunding.toFixed(0)}%)
                    </p>
                  </div>
                  <div>
                    <span className="text-[#475467]">Monthly Commitment:</span>
                    <p className="font-semibold tabular-nums text-[#5E55C9]">
                      {money(monthlyContribution)} / month
                    </p>
                  </div>
                </div>
              </div>

              {/* Inflation preview card */}
              <div className="rounded-2xl border border-[#E8E1D6] bg-white p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-[#7D5200] font-medium">
                  <TrendingUp className="size-4" />
                  <span>Planning Engine Outlook</span>
                </div>
                <p className="text-[#475467]">
                  Over {years.toFixed(1)} years, compounding with inflation (~6% p.a.) brings estimated future cost to{" "}
                  <strong className="text-[#1F2A44] tabular-nums">
                    {money(futureCost.toFixed(2))}
                  </strong>
                  .
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#3D5C4A] bg-[#3D5C4A]/5 p-2 rounded-lg border border-[#3D5C4A]/20">
                  <Sparkles className="size-3.5 shrink-0" />
                  <span>
                    Your chosen ₹{Number(monthlyContribution).toLocaleString("en-IN")}/mo SIP builds the disciplined compound habit needed to reach it!
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-[#FFF9F0] border border-[#A13F39] text-xs text-[#A13F39]">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: You're All Set */}
          {step === 4 && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#3D5C4A]/10 text-[#3D5C4A] border-2 border-[#3D5C4A]/30">
                <Check className="size-10 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-medium text-[#1F2A44]">
                  Goal created successfully!
                </h3>
                <p className="text-xs text-[#475467] max-w-md mx-auto">
                  &ldquo;A journey of a thousand miles begins with a single step.&rdquo; Your goal &ldquo;{name}&rdquo; is now tracked on your dashboard.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFF9F0] p-4 max-w-sm mx-auto text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#475467]">Target:</span>
                  <span className="font-semibold text-[#1F2A44] tabular-nums">
                    {money(targetAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#475467]">By:</span>
                  <span className="font-semibold text-[#1F2A44]">
                    {date(targetDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#475467]">Committed SIP:</span>
                  <span className="font-semibold text-[#5E55C9] tabular-nums">
                    {money(monthlyContribution)} / month
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-[#E8E1D6]/70 px-6 py-4 bg-[#FFF9F0]/60">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#475467] hover:text-[#1F2A44]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5E55C9] text-white text-xs font-semibold hover:bg-[#4d45b5] transition-colors"
              >
                Continue <ArrowRight className="size-3.5" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#475467] hover:text-[#1F2A44]"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
              <button
                type="button"
                disabled={!name.trim() || Number(targetAmount) <= 0}
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5E55C9] text-white text-xs font-semibold hover:bg-[#4d45b5] disabled:opacity-50 transition-colors"
              >
                Review Plan <ArrowRight className="size-3.5" />
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#475467] hover:text-[#1F2A44]"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleSaveGoal}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5E55C9] text-white text-xs font-semibold hover:bg-[#4d45b5] shadow-xs disabled:opacity-50 transition-colors"
              >
                {pending ? "Saving Goal…" : "Confirm & Save Goal"}
                <Check className="size-3.5" />
              </button>
            </>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-[#5E55C9] text-white text-xs font-semibold hover:bg-[#4d45b5] transition-colors"
            >
              Start saving &amp; view dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
