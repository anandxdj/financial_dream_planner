"use client";

import Image from "next/image";

interface StepData {
  number: number;
  title: string;
  description: string;
  illustration: "connect" | "picture" | "goals" | "action";
}

const STEPS: StepData[] = [
  {
    number: 1,
    title: "Connect Your Data",
    description:
      "Link your bank accounts securely, or add manually. It only takes a few minutes.",
    illustration: "connect",
  },
  {
    number: 2,
    title: "Get a Clear Picture",
    description:
      "We analyse your income, spending and financial situation — no jargon.",
    illustration: "picture",
  },
  {
    number: 3,
    title: "Set Your Goals",
    description:
      "Tell us what you're dreaming about — and explore what's possible.",
    illustration: "goals",
  },
  {
    number: 4,
    title: "Make It Happen",
    description:
      "Get a personalised plan, track your progress, and adjust as life changes.",
    illustration: "action",
  },
];

function StepCircle({ type }: { type: StepData["illustration"] }) {
  return (
    <div className="relative size-36 sm:size-40 lg:size-44 rounded-full border border-[#E8E1D6] bg-gradient-to-b from-[#FAF7F2] to-[#F1ECF8] shadow-xs flex items-center justify-center p-4 overflow-hidden group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
      {/* Step 1: Connect your data (laptop + document link + foliage) */}
      {type === "connect" && (
        <div className="relative size-full flex items-center justify-center">
          <Image
            src="/Assets/Characters/woman_typing_laptop.png"
            alt="Connect data securely"
            width={160}
            height={160}
            className="size-28 sm:size-32 object-contain"
          />
          <div className="absolute top-1 right-2 size-8 rounded-full bg-white/90 border border-[#E8E1D6] shadow-xs flex items-center justify-center text-[#5855D6]">
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
        </div>
      )}

      {/* Step 2: Get a clear picture (portfolio / charts & insights) */}
      {type === "picture" && (
        <div className="relative size-full flex items-center justify-center">
          <Image
            src="/Assets/Assets/portfolio_allocation.png"
            alt="Clear financial analytics picture"
            width={160}
            height={160}
            className="size-28 sm:size-32 object-contain rounded-full"
          />
        </div>
      )}

      {/* Step 3: Set your goals (mountain summit with milestone flag) */}
      {type === "goals" && (
        <div className="relative size-full flex items-center justify-center">
          <div className="absolute inset-0 rounded-full overflow-hidden opacity-40">
            <Image
              src="/Assets/Nature%20Elements/mountain_landscape.png"
              alt=""
              fill
              className="object-cover"
              aria-hidden="true"
            />
          </div>
          <Image
            src="/Assets/Assets/milestone_flag.png"
            alt="Summit milestone goals"
            width={160}
            height={160}
            className="relative z-10 size-28 sm:size-32 object-contain drop-shadow-xs"
          />
        </div>
      )}

      {/* Step 4: Make it happen (checklist / agreement clipboard) */}
      {type === "action" && (
        <div className="relative size-full flex items-center justify-center">
          <Image
            src="/Assets/Assets/loan_agreement_clipboard.png"
            alt="Personalized action plan clipboard"
            width={160}
            height={160}
            className="size-28 sm:size-32 object-contain drop-shadow-xs"
          />
        </div>
      )}
    </div>
  );
}

function DashedArrow() {
  return (
    <div className="hidden lg:flex items-center justify-center self-center px-1 mb-20 pointer-events-none">
      <svg
        className="w-16 h-6 text-[#5855D6]/70"
        viewBox="0 0 64 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <line
          x1="2"
          y1="12"
          x2="52"
          y2="12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        <path
          d="M46 6L54 12L46 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="pt-16 md:pt-24 pb-0 border-b border-[#E8E1D6] bg-gradient-to-b from-[#FFFDF9] via-[#FAF7F2] to-[#FFFDF9] relative overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1F2A44] tracking-tight">
            A simple path to your financial dreams
          </h2>
          <p className="text-base sm:text-lg text-[#475467] max-w-2xl mx-auto">
            From where you are today to the life you imagine — in just a few steps.
          </p>
        </div>

        {/* 4 Circular Vignettes with Dashed Arrows */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-2 mb-16">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="contents">
              <div className="flex flex-col items-center text-center max-w-[240px] group">
                {/* Large Circular Vignette */}
                <StepCircle type={step.illustration} />

                {/* Number Badge + Step Title */}
                <div className="mt-5 flex items-center justify-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#5855D6] text-xs font-bold text-white shadow-xs">
                    {step.number}
                  </span>
                  <h3 className="font-serif text-lg font-medium text-[#1F2A44]">
                    {step.title}
                  </h3>
                </div>

                {/* Step Subtitle */}
                <p className="mt-2 text-xs sm:text-sm text-[#475467] leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Dashed Connecting Arrow (between items) */}
              {idx < STEPS.length - 1 && <DashedArrow />}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Panoramic Mountain Landscape Banner */}
      <div className="relative w-full mt-8 pt-4">
        {/* Quote Annotation placed gracefully above landscape on the right */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-end pb-3">
          <div className="inline-block text-right">
            <span className="font-script text-2xl sm:text-3xl text-[#3D5C4A] tracking-wide block">
              Small steps towards a bigger tomorrow.
            </span>
          </div>
        </div>

        {/* Panoramic Watercolor Landscape Image */}
        <div className="relative h-44 sm:h-56 md:h-64 w-full overflow-hidden">
          {/* Subtle gradient overlay at top to smoothly blend into canvas */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#FFFDF9] to-transparent z-10 pointer-events-none" />

          <Image
            src="/Assets/Nature%20Elements/mountain_landscape.png"
            alt="Scenic mountain landscape with pine trees and wildflowers"
            fill
            className="object-cover object-bottom"
            priority={false}
          />
        </div>
      </div>
    </section>
  );
}
