"use client";

import { useState, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { InteractiveTradeoffDemo } from "@/components/planner/interactive-tradeoff-demo";

type CategoryType = "home" | "car" | "trip" | "custom";

interface CategoryConfig {
  label: string;
  defaultPrice: number;
  defaultDownPayment: number;
  defaultTenureYears: number;
  defaultInterestRate: number;
  imageSrc: string;
  imageAlt: string;
}

const CATEGORIES: Record<CategoryType, CategoryConfig> = {
  home: {
    label: "A Home",
    defaultPrice: 8000000,
    defaultDownPayment: 2000000,
    defaultTenureYears: 20,
    defaultInterestRate: 8.5,
    imageSrc: "/Assets/Houses/cozy_first_home.png",
    imageAlt: "Cozy home goal illustration",
  },
  car: {
    label: "A Car",
    defaultPrice: 1500000,
    defaultDownPayment: 300000,
    defaultTenureYears: 5,
    defaultInterestRate: 9.25,
    imageSrc: "/Assets/Characters/purple_car_front.png",
    imageAlt: "Car purchase illustration",
  },
  trip: {
    label: "A Trip",
    defaultPrice: 350000,
    defaultDownPayment: 350000,
    defaultTenureYears: 1,
    defaultInterestRate: 0,
    imageSrc: "/Assets/UI/europe_trip_progress.png",
    imageAlt: "Vacation travel illustration",
  },
  custom: {
    label: "Custom",
    defaultPrice: 1000000,
    defaultDownPayment: 200000,
    defaultTenureYears: 3,
    defaultInterestRate: 10.5,
    imageSrc: "/Assets/UI/goal_progress_widget.png",
    imageAlt: "Custom financial goal illustration",
  },
};

function formatIndianRupee(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

function calculateEMI(principal: number, annualRate: number, tenureYears: number): number {
  if (principal <= 0) return 0;
  if (annualRate <= 0 || tenureYears <= 0) {
    return tenureYears > 0 ? principal / (tenureYears * 12) : 0;
  }
  const monthlyRate = annualRate / (12 * 100);
  const totalMonths = tenureYears * 12;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function CalculatorPreviewSection() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("home");
  const config = CATEGORIES[selectedCategory];

  const [price, setPrice] = useState<number>(config.defaultPrice);
  const [downPayment, setDownPayment] = useState<number>(config.defaultDownPayment);
  const [tenure, setTenure] = useState<number>(config.defaultTenureYears);
  const [interestRate, setInterestRate] = useState<number>(config.defaultInterestRate);

  const priceId = useId();
  const downPaymentId = useId();
  const tenureId = useId();
  const interestRateId = useId();

  const handleCategoryChange = (cat: CategoryType) => {
    setSelectedCategory(cat);
    const newConf = CATEGORIES[cat];
    setPrice(newConf.defaultPrice);
    setDownPayment(newConf.defaultDownPayment);
    setTenure(newConf.defaultTenureYears);
    setInterestRate(newConf.defaultInterestRate);
  };

  const loanAmount = Math.max(0, price - downPayment);
  const emi = calculateEMI(loanAmount, interestRate, tenure);

  // Assumed household monthly income benchmark for illustration
  const benchmarkIncome = 150000;
  const emiPercent = benchmarkIncome > 0 ? Math.min(100, Math.round((emi / benchmarkIncome) * 100)) : 0;
  const isAffordable = emiPercent <= 40;

  return (
    <section id="calculator-preview" className="py-16 md:py-24 border-b border-[#E8E1D6] bg-[#FFFDF9] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#5855D6]/10 px-3.5 py-1 text-xs font-semibold text-[#5855D6]">
            <Sparkles className="size-3.5" />
            <span>Interactive Affordability Engine</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1F2A44] tracking-tight">
            Can I afford this?
          </h2>
          <p className="text-base sm:text-lg text-[#475467] max-w-xl mx-auto">
            Get an instant estimate without signing up. We calculate realistic EMIs and income ratios before you commit.
          </p>
        </div>

        {/* 2-Column Calculator Board (Matching Screen 07) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
          {/* Left Column: Category Tabs & Input Form (7 cols) */}
          <div className="lg:col-span-7 rounded-[24px] border border-[#E8E1D6] bg-[#FFFCF8] p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            <div className="space-y-6">
              {/* Category selector chips */}
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CATEGORIES) as CategoryType[]).map((catKey) => {
                  const isSelected = selectedCategory === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => handleCategoryChange(catKey)}
                      className={`min-h-[40px] rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                        isSelected
                          ? "bg-[#5855D6] text-white shadow-xs"
                          : "bg-[#FAF7F2] text-[#475467] border border-[#E8E1D6] hover:text-[#1F2A44] hover:bg-[#F5EFE6]"
                      }`}
                    >
                      {CATEGORIES[catKey].label}
                    </button>
                  );
                })}
              </div>

              {/* Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                {/* Total Price */}
                <div>
                  <label htmlFor={priceId} className="block text-xs font-semibold text-[#1F2A44] mb-1.5">
                    Target Price
                  </label>
                  <div className="relative">
                    <input
                      id={priceId}
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value) || 0)}
                      className="min-h-[44px] w-full rounded-[12px] border border-[#E8E1D6] bg-[#FFFDF9] px-3.5 py-2 text-sm font-semibold text-[#1F2A44] outline-none focus:border-[#5855D6] focus:ring-1 focus:ring-[#5855D6]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#475467] font-medium pointer-events-none">
                      {formatIndianRupee(price)}
                    </span>
                  </div>
                </div>

                {/* Loan Tenure */}
                <div>
                  <label htmlFor={tenureId} className="block text-xs font-semibold text-[#1F2A44] mb-1.5">
                    Tenure (Years)
                  </label>
                  <div className="relative">
                    <input
                      id={tenureId}
                      type="number"
                      min={1}
                      max={30}
                      value={tenure}
                      onChange={(e) => setTenure(Math.max(1, Number(e.target.value) || 1))}
                      className="min-h-[44px] w-full rounded-[12px] border border-[#E8E1D6] bg-[#FFFDF9] px-3.5 py-2 text-sm font-semibold text-[#1F2A44] outline-none focus:border-[#5855D6] focus:ring-1 focus:ring-[#5855D6]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#475467] font-medium pointer-events-none">
                      {tenure} Yrs
                    </span>
                  </div>
                </div>

                {/* Down Payment */}
                <div>
                  <label htmlFor={downPaymentId} className="block text-xs font-semibold text-[#1F2A44] mb-1.5">
                    Down Payment
                  </label>
                  <div className="relative">
                    <input
                      id={downPaymentId}
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(Math.min(price, Number(e.target.value) || 0))}
                      className="min-h-[44px] w-full rounded-[12px] border border-[#E8E1D6] bg-[#FFFDF9] px-3.5 py-2 text-sm font-semibold text-[#1F2A44] outline-none focus:border-[#5855D6] focus:ring-1 focus:ring-[#5855D6]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#475467] font-medium pointer-events-none">
                      {price > 0 ? `${Math.round((downPayment / price) * 100)}%` : "0%"}
                    </span>
                  </div>
                </div>

                {/* Interest Rate */}
                <div>
                  <label htmlFor={interestRateId} className="block text-xs font-semibold text-[#1F2A44] mb-1.5">
                    Interest Rate (% p.a.)
                  </label>
                  <div className="relative">
                    <input
                      id={interestRateId}
                      type="number"
                      step={0.1}
                      min={0}
                      max={30}
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                      className="min-h-[44px] w-full rounded-[12px] border border-[#E8E1D6] bg-[#FFFDF9] px-3.5 py-2 text-sm font-semibold text-[#1F2A44] outline-none focus:border-[#5855D6] focus:ring-1 focus:ring-[#5855D6]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#475467] font-medium pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E8E1D6] flex items-center justify-between">
              <span className="text-xs text-[#475467]">
                Loan Principal: <strong className="text-[#1F2A44]">{formatIndianRupee(loanAmount)}</strong>
              </span>
              <Link
                href="/can-i-afford-this"
                className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-[#5855D6] hover:text-[#4D4AB8] transition-colors"
              >
                <span>Advanced Affordability Tool</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Result Outcome Card (5 cols) */}
          <div className="lg:col-span-5 rounded-[24px] border border-[#E8E1D6] bg-[#FFF9F0] p-6 sm:p-8 shadow-xs flex flex-col justify-between text-left">
            <div className="space-y-5">
              {/* Verdict Header */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF6EE] border border-[#CCE4D0] px-3 py-1 text-xs font-semibold text-[#3D5C4A]">
                  <CheckCircle2 className="size-3.5 text-[#3D5C4A]" />
                  <span>{isAffordable ? "You can afford it!" : "Tight cash flow"}</span>
                </div>
                <span className="text-xs text-[#475467]">{config.label} Scenario</span>
              </div>

              {/* Illustration Thumbnail */}
              <div className="mx-auto flex h-36 w-full items-center justify-center rounded-[18px] bg-[#FFFCF8] border border-[#E8E1D6] p-3">
                <Image
                  src={config.imageSrc}
                  alt={config.imageAlt}
                  width={160}
                  height={120}
                  className="max-h-28 w-auto object-contain"
                />
              </div>

              {/* Calculated EMI Details */}
              <div>
                <span className="text-xs font-medium text-[#475467] block">Estimated EMI</span>
                <div className="font-serif text-3xl sm:text-4xl font-normal text-[#1F2A44] mt-0.5">
                  {formatIndianRupee(emi)} <span className="text-sm font-sans text-[#475467]">/ month</span>
                </div>
                <p className="text-xs text-[#475467] mt-1.5 leading-relaxed">
                  That&apos;s approximately <strong className="text-[#1F2A44]">{emiPercent}%</strong> of a typical ₹1,50,000 monthly household income.
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-6 border-t border-[#E8E1D6]">
              <Link
                href={`/can-i-afford-this?amount=${price}&downpayment=${downPayment}&tenure=${tenure}`}
                className="w-full inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[12px] bg-[#5855D6] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4D4AB8] transition-all"
              >
                <span>Create a full plan</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Interactive Tradeoff Sandbox */}
        <div className="pt-6">
          <InteractiveTradeoffDemo />
        </div>
      </div>
    </section>
  );
}
