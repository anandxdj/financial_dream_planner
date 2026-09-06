"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-16 md:py-24 border-b border-[#E8E1D6] bg-[#FAF7F2] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-10 space-y-3">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1F2A44] tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-base sm:text-lg text-[#475467] max-w-xl mx-auto">
            Start free. Upgrade when you&apos;re ready.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <div className="inline-flex items-center rounded-full bg-[#EBE5DC] p-1 border border-[#E8E1D6]">
              <button
                type="button"
                onClick={() => setIsYearly(false)}
                className={`min-h-[36px] rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  !isYearly
                    ? "bg-[#5855D6] text-white shadow-xs"
                    : "text-[#475467] hover:text-[#1F2A44]"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setIsYearly(true)}
                className={`min-h-[36px] rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  isYearly
                    ? "bg-[#5855D6] text-white shadow-xs"
                    : "text-[#475467] hover:text-[#1F2A44]"
                }`}
              >
                Yearly
              </button>
            </div>
            <span className="rounded-full bg-[#EDF6EE] border border-[#CCE4D0] px-2.5 py-1 text-xs font-semibold text-[#3D5C4A]">
              Save 20%
            </span>
          </div>
        </div>

        {/* Pricing Grid + Right Quote Banner */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Main 3 Tiers (10 cols on large desktop, or 9 cols) */}
          <div className="md:col-span-12 lg:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Free Tier */}
            <div className="rounded-[20px] border border-[#E8E1D6] bg-[#FFFCF8] p-6 shadow-xs flex flex-col justify-between hover:border-[#5855D6]/30 transition-all">
              <div className="space-y-4">
                <div>
                  <h3 className="font-serif text-xl font-normal text-[#1F2A44]">Free</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-medium text-[#1F2A44]">₹0</span>
                    <span className="text-xs text-[#475467]">/ month</span>
                  </div>
                  <p className="text-xs text-[#3D5C4A] font-medium mt-1">
                    Perfect to get started
                  </p>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-[#E8E1D6] text-xs text-[#344054]">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#3D5C4A] shrink-0" />
                    <span>Expense tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#3D5C4A] shrink-0" />
                    <span>Basic insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#3D5C4A] shrink-0" />
                    <span>Up to 2 goals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#3D5C4A] shrink-0" />
                    <span>AI assistant (limited)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/onboarding?plan=free"
                  className="min-h-[44px] w-full inline-flex items-center justify-center rounded-[12px] border border-[#E8E1D6] bg-[#FAF7F2] px-4 py-2.5 text-xs font-semibold text-[#1F2A44] hover:bg-[#F5EFE6] transition-all"
                >
                  Get started
                </Link>
              </div>
            </div>

            {/* Pro Tier (Featured) */}
            <div className="relative rounded-[20px] border-2 border-[#5855D6] bg-[#FFFCF8] p-6 shadow-md flex flex-col justify-between scale-[1.02] transition-all">
              {/* Popular Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#5855D6] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
                Most Popular
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <h3 className="font-serif text-xl font-normal text-[#1F2A44]">Pro</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-medium text-[#1F2A44]">
                      {isYearly ? "₹119" : "₹149"}
                    </span>
                    <span className="text-xs text-[#475467]">/ month</span>
                  </div>
                  <p className="text-xs text-[#5855D6] font-medium mt-1">
                    For serious planners
                  </p>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-[#E8E1D6] text-xs text-[#344054]">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#5855D6] shrink-0" />
                    <span>Unlimited goals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#5855D6] shrink-0" />
                    <span>Advanced insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#5855D6] shrink-0" />
                    <span>Scenario planning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#5855D6] shrink-0" />
                    <span>AI assistant (full access)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href={`/onboarding?plan=pro&billing=${isYearly ? "yearly" : "monthly"}`}
                  className="min-h-[44px] w-full inline-flex items-center justify-center rounded-[12px] bg-[#5855D6] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#4D4AB8] transition-all"
                >
                  Start Pro
                </Link>
              </div>
            </div>

            {/* Family Tier */}
            <div className="rounded-[20px] border border-[#E8E1D6] bg-[#FFFCF8] p-6 shadow-xs flex flex-col justify-between hover:border-[#5855D6]/30 transition-all">
              <div className="space-y-4">
                <div>
                  <h3 className="font-serif text-xl font-normal text-[#1F2A44]">Family</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-medium text-[#1F2A44]">
                      {isYearly ? "₹239" : "₹299"}
                    </span>
                    <span className="text-xs text-[#475467]">/ month</span>
                  </div>
                  <p className="text-xs text-[#3D5C4A] font-medium mt-1">
                    Plan everywhere / Pro
                  </p>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-[#E8E1D6] text-xs text-[#344054]">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#3D5C4A] shrink-0" />
                    <span>Up to 5 members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#3D5C4A] shrink-0" />
                    <span>Shared household goals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#3D5C4A] shrink-0" />
                    <span>Family insights &amp; runway</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#3D5C4A] shrink-0" />
                    <span>Priority dedicated support</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href={`/onboarding?plan=family&billing=${isYearly ? "yearly" : "monthly"}`}
                  className="min-h-[44px] w-full inline-flex items-center justify-center rounded-[12px] bg-[#1F2A44] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1F2A44]/90 transition-all"
                >
                  Start Family
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Botanical Accent Artwork & Quote Card (3 cols) */}
          <div className="md:col-span-12 lg:col-span-3 flex flex-col justify-center items-center">
            <div className="w-full rounded-[24px] border border-[#E8E1D6] bg-[#FFFCF8] p-6 text-center space-y-4 shadow-xs">
              <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-[#FAF7F2] p-2">
                <Image
                  src="/Assets/Nature%20Elements/lavender_branch.png"
                  alt=""
                  width={72}
                  height={72}
                  className="object-contain"
                  aria-hidden="true"
                />
              </div>
              <p className="font-script text-xl text-[#1F2A44] leading-relaxed">
                &ldquo;Small steps today. A bigger tomorrow.&rdquo;
              </p>
              <p className="text-xs text-[#475467]">
                Clear finances bring peaceful sleep. No hidden commissions, no unexpected price hikes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
