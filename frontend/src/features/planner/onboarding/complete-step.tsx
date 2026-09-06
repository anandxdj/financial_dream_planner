"use client";

import Image from "next/image";
import { ArrowRight, CheckCircle2, LayoutDashboard } from "lucide-react";

interface CompleteStepProps {
  onViewPlan: () => void;
  onGoToDashboard: () => void;
}

export function CompleteStep({ onViewPlan, onGoToDashboard }: CompleteStepProps) {
  const deliverables = [
    "Personalized insights and recommendations",
    "Actionable next steps",
    "Track your progress anytime",
    "Adjust as life changes",
  ];

  return (
    <div className="mx-auto max-w-4xl py-6 sm:py-10">
      <div className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
        {/* Left Side: Celebration character artwork */}
        <div className="flex flex-col items-center justify-center md:col-span-5">
          <div className="relative aspect-3/4 w-full max-w-[280px] drop-shadow-md">
            <Image
              src="/Assets/Characters/woman_celebrating_clean.png"
              alt="Woman celebrating plan readiness"
              fill
              priority
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 280px"
            />
          </div>
          <div className="mt-4 font-serif text-sm italic text-[#3D5C4A]">
            ✨ &ldquo;Here&apos;s to a brighter you.&rdquo;
          </div>
        </div>

        {/* Right Side: Headline, benefits & action buttons */}
        <div className="space-y-6 md:col-span-7">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#3D5C4A]">
              09 Onboarding Complete / First Plan
            </span>
            <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-[#1F2A44] sm:text-4xl">
              Your financial plan is ready! 🎉
            </h1>
            <p className="mt-3 text-base leading-relaxed text-[#475467]">
              We&apos;ve created a personalized plan based on your goals, income, expenses and investments.
            </p>
          </div>

          {/* Checklist */}
          <div className="space-y-3 rounded-2xl border border-[#E8E1D6]/80 bg-white p-5 shadow-xs">
            {deliverables.map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-[#344054]">
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#3D5C4A]/15 text-[#3D5C4A]">
                  <CheckCircle2 className="size-4" />
                </div>
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onViewPlan}
              className="group inline-flex min-h-[50px] items-center justify-center gap-2.5 rounded-xl bg-[#5E55C9] px-7 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-[#4E45B8] active:scale-[0.99]"
            >
              <span>View My Plan</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={onGoToDashboard}
              className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl border border-[#E8E1D6] bg-white px-6 py-3 text-base font-semibold text-[#1F2A44] shadow-xs transition-colors hover:bg-[#FFF9F0]"
            >
              <LayoutDashboard className="size-4 text-[#475467]" />
              <span>Explore Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
