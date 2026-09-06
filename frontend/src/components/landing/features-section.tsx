"use client";

import Image from "next/image";

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  badge?: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: "track-expenses",
    title: "Track Expenses",
    description: "Auto-track from SMS or enter manually with privacy and precision.",
    imageSrc: "/Assets/Assets/rupee_receipt_slip.png",
    imageAlt: "Rupee receipt slip illustration",
  },
  {
    id: "plan-budgets",
    title: "Plan Budgets",
    description: "Stay in control month after month with realistic spending ceilings.",
    imageSrc: "/Assets/Piggy%20Banks/piggy_bank_stack.png",
    imageAlt: "Piggy bank savings illustration",
  },
  {
    id: "set-goals",
    title: "Set & Achieve Goals",
    description: "From a new laptop to your dream home, connect every milestone.",
    imageSrc: "/Assets/Houses/cozy_first_home.png",
    imageAlt: "Cozy home goal illustration",
  },
  {
    id: "get-insights",
    title: "Get Insights",
    description: "Understand your spending patterns and cash runway with clarity.",
    imageSrc: "/Assets/UI/spending_insights_chart.png",
    imageAlt: "Spending insights chart illustration",
  },
  {
    id: "run-scenarios",
    title: "Run Scenarios",
    description: "See the impact of major decisions before you commit money.",
    imageSrc: "/Assets/Assets/pay_off_faster_comparison.png",
    imageAlt: "Pay off faster comparison card",
  },
  {
    id: "ai-assistant",
    title: "AI Financial Assistant",
    description: "Ask anything about your money and get calm, personalized guidance.",
    imageSrc: "/Assets/Characters/ai_assistant_headphones.png",
    imageAlt: "AI friendly financial assistant robot",
    badge: "AI Powered",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 border-b border-[#E8E1D6] bg-[#FFFCF8]/60 relative">
      {/* Top right botanical accent */}
      <div className="absolute top-4 right-4 pointer-events-none opacity-40 size-24 hidden md:block">
        <Image
          src="/Assets/Nature%20Elements/lavender_branch.png"
          alt=""
          width={96}
          height={96}
          className="object-contain"
          aria-hidden="true"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14 space-y-3">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1F2A44] tracking-tight">
            Everything you need for a brighter financial future
          </h2>
          <p className="text-base sm:text-lg text-[#475467] max-w-xl mx-auto">
            Simple tools. Powerful insights. Built for real life.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.id}
              className="group rounded-[20px] border border-[#E8E1D6] bg-[#FFFCF8] p-6 shadow-xs hover:shadow-md hover:border-[#5855D6]/30 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Visual Thumbnail Area */}
                <div className="relative mb-5 flex h-40 w-full items-center justify-center rounded-[16px] bg-[#FAF7F2] p-4 group-hover:bg-[#F5EFE6]/70 transition-colors">
                  <Image
                    src={feature.imageSrc}
                    alt={feature.imageAlt}
                    width={180}
                    height={140}
                    className="max-h-32 w-auto object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-200"
                  />
                  {feature.badge && (
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-[#5855D6]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#5855D6]">
                      {feature.badge}
                    </span>
                  )}
                </div>

                {/* Content */}
                <h3 className="font-serif text-xl font-normal text-[#1F2A44] mb-2 group-hover:text-[#5855D6] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#475467] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
