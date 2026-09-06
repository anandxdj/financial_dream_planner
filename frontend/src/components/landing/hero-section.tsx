"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, Star, CheckCircle2 } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-[#E8E1D6] bg-gradient-to-b from-[#FFFDF9] via-[#FAF7F2] to-[#FFFDF9]">
      {/* Subtle decorative background watermarks */}
      <div className="pointer-events-none absolute -top-16 -left-16 size-80 rounded-full bg-[#5855D6]/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-20 size-96 rounded-full bg-[#E6B46A]/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Left Column: Headline, Subhead, CTAs, Stats (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Tagline / Script highlight */}
            <div className="inline-flex items-center gap-2">
              <span className="font-script text-xl sm:text-2xl text-[#3D5C4A] tracking-wide">
                Plan today, Prosper tomorrow.
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.12] text-[#1F2A44] tracking-tight">
              Where <span className="text-[#5855D6] font-medium">clarity</span> meets{" "}
              <span className="block sm:inline text-[#1F2A44]">financial confidence.</span>
            </h1>

            {/* Subhead */}
            <p className="text-base sm:text-lg text-[#475467] max-w-2xl leading-relaxed font-normal">
              Track spending, build savings, and make smarter money decisions with calm,
              guided planning. See how every life choice connects to your real cash flow
              before you commit.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/onboarding"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[12px] bg-[#5855D6] px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4D4AB8] active:scale-[0.98] transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6]"
              >
                <span>Start planning</span>
                <ArrowRight className="size-4" />
              </Link>

              <a
                href="#calculator-preview"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[12px] border border-[#E8E1D6] bg-[#FFFCF8] px-6 py-3.5 text-sm font-semibold text-[#1F2A44] shadow-xs hover:bg-[#F5EFE6]/70 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6]"
              >
                <div className="flex size-6 items-center justify-center rounded-full bg-[#5855D6]/10 text-[#5855D6]">
                  <Play className="size-3 fill-current ml-0.5" />
                </div>
                <span>Try Interactive Calculator</span>
              </a>
            </div>

            {/* Trust & Social Proof Metrics */}
            <div className="pt-8 border-t border-[#E8E1D6]/80 grid grid-cols-3 gap-4 text-left">
              <div>
                <div className="font-serif text-2xl sm:text-3xl font-medium text-[#1F2A44]">
                  100K+
                </div>
                <div className="text-xs sm:text-sm text-[#475467] mt-0.5">
                  People planning
                </div>
              </div>

              <div>
                <div className="font-serif text-2xl sm:text-3xl font-medium text-[#1F2A44] flex items-center gap-1">
                  <span>4.8</span>
                  <Star className="size-5 text-[#E6B46A] fill-[#E6B46A]" />
                </div>
                <div className="text-xs sm:text-sm text-[#475467] mt-0.5">
                  Average rating
                </div>
              </div>

              <div>
                <div className="font-serif text-2xl sm:text-3xl font-medium text-[#1F2A44]">
                  ₹1.2Cr+
                </div>
                <div className="text-xs sm:text-sm text-[#475467] mt-0.5">
                  Goals planned
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Watercolor Character Artwork & Quote (5 cols) */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Outer Decorative Wrapper with Botanical Leaves */}
            <div className="relative w-full max-w-[460px]">
              {/* Botanical Leaf Overlay Top Right */}
              <div className="absolute -top-6 -right-6 z-20 size-24 pointer-events-none opacity-90 hidden sm:block">
                <Image
                  src="/Assets/Nature%20Elements/lavender_branch.png"
                  alt=""
                  width={96}
                  height={96}
                  className="object-contain"
                  aria-hidden="true"
                />
              </div>

              {/* Botanical Leaf Overlay Bottom Left */}
              <div className="absolute -bottom-8 -left-8 z-20 size-28 pointer-events-none opacity-90 hidden sm:block">
                <Image
                  src="/Assets/Nature%20Elements/green_leaves.png"
                  alt=""
                  width={112}
                  height={112}
                  className="object-contain"
                  aria-hidden="true"
                />
              </div>

              {/* Card Container */}
              <div className="relative rounded-[24px] border border-[#E8E1D6] bg-[#FFFCF8] p-4 sm:p-5 shadow-sm overflow-hidden">
                {/* Image Window */}
                <div className="relative rounded-[18px] overflow-hidden bg-[#FAF7F2] aspect-[4/4.2] flex items-center justify-center">
                  <Image
                    src="/Assets/Characters/woman_by_window.png"
                    alt="Woman peacefully reviewing financial roadmap by sunlit scenic window"
                    width={440}
                    height={480}
                    priority
                    className="w-full h-full object-contain rounded-[16px]"
                  />
                </div>

                {/* Floating Quote Card */}
                <div className="mt-4 rounded-[16px] bg-[#FFF9F0] border border-[#E8E1D6] p-4 text-center sm:text-left relative shadow-xs">
                  <p className="font-script text-lg sm:text-xl text-[#1F2A44] leading-relaxed">
                    &ldquo;A better financial future is a series of small, better decisions.&rdquo;
                  </p>
                  <div className="mt-1 flex items-center justify-center sm:justify-end gap-1 text-[11px] font-semibold text-[#3D5C4A] uppercase tracking-wider">
                    <CheckCircle2 className="size-3" />
                    <span>Calm, guided clarity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
