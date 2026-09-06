"use client";

import Image from "next/image";
import { ArrowRight, CreditCard, Clock, ShieldCheck, Sparkles } from "lucide-react";

interface GoalCtaFooterProps {
  onAddGoal?: () => void;
  canAddGoal?: boolean;
}

export function GoalCtaFooter({ onAddGoal, canAddGoal = true }: GoalCtaFooterProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#E8E1D6] bg-gradient-to-r from-[#FFFDF9] via-[#FFF9F0] to-[#F5EFE6] p-6 sm:p-10 shadow-xs">
      {/* Background Mountain landscape overlay */}
      <div className="absolute inset-0 opacity-15 pointer-events-none -z-0">
        <Image
          src="/Assets/Nature Elements/mountain_landscape.png"
          alt="Mountains"
          fill
          className="object-cover object-bottom"
        />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left: Illustrated Character */}
        <div className="relative size-32 sm:size-40 shrink-0 rounded-2xl overflow-hidden bg-white/70 border border-[#E8E1D6] shadow-xs flex items-center justify-center">
          <Image
            src="/Assets/Characters/woman_with_laptop.png"
            alt="Dream planning"
            fill
            className="object-contain p-2"
            sizes="160px"
          />
        </div>

        {/* Center: Headline and Trust Badges */}
        <div className="flex-1 text-center lg:text-left space-y-3">
          <span className="font-serif italic text-xs text-[#7D5200]">
            &ldquo;A brighter tomorrow is a plan away.&rdquo;
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#1F2A44] leading-tight">
            Ready to turn your goals into reality?
          </h3>
          <p className="text-xs sm:text-sm text-[#475467] max-w-xl mx-auto lg:mx-0">
            Join thousands of families building confidence and compounding freedom, one goal at a time.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-[#475467]">
            <div className="flex items-center gap-1.5">
              <CreditCard className="size-3.5 text-[#5E55C9]" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-[#5E55C9]" />
              <span>Set up in minutes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-[#3D5C4A]" />
              <span>Bank-grade privacy</span>
            </div>
          </div>
        </div>

        {/* Right: Action & Decorative Mini-cards */}
        <div className="shrink-0 flex flex-col items-center gap-3">
          {canAddGoal ? (
            <button
              type="button"
              onClick={onAddGoal}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#5E55C9] text-white text-xs sm:text-sm font-semibold hover:bg-[#4d45b5] transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Sparkles className="size-4" />
              Add a new goal
              <ArrowRight className="size-4" />
            </button>
          ) : (
            <span className="text-xs text-[#7D5200] font-medium bg-[#FFF9F0] px-4 py-2 rounded-xl border border-[#E8E1D6]">
              All 3 goal slots actively working
            </span>
          )}

          <div className="text-center">
            <span className="font-serif italic text-[11px] text-[#7D5200]">
              Dream · Plan · Do · Repeat
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
