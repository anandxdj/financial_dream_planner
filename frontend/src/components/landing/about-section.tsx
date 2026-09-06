"use client";

import Image from "next/image";
import { Star, Compass, HeartHandshake, History } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="py-16 md:py-24 border-b border-[#E8E1D6] bg-[#FFFDF9] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Character Illustration & Framed Foliage (5 cols) */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-[400px]">
              {/* Botanical Accent Top Left */}
              <div className="absolute -top-6 -left-6 z-10 size-20 pointer-events-none opacity-80 hidden sm:block">
                <Image
                  src="/Assets/Nature%20Elements/lavender_branch.png"
                  alt=""
                  width={80}
                  height={80}
                  className="object-contain"
                  aria-hidden="true"
                />
              </div>

              {/* Character Card */}
              <div className="rounded-[24px] border border-[#E8E1D6] bg-[#FAF7F2] p-6 shadow-xs flex items-center justify-center">
                <Image
                  src="/Assets/Characters/woman_writing_journal.png"
                  alt="Finance Buddy community member planning with clarity"
                  width={360}
                  height={400}
                  className="max-h-[340px] w-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Mission, Values, Story + Stats (7 cols) */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="space-y-3">
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1F2A44] tracking-tight">
                Built for a financially brighter India
              </h2>
              <p className="text-base sm:text-lg text-[#475467] leading-relaxed max-w-2xl">
                Finance Buddy is an India-first personal finance planner, designed to make money
                management simple, human, and empowering.
              </p>
            </div>

            {/* 3 Pillars / Value Cards */}
            <div className="space-y-4">
              <div className="rounded-[16px] border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-xs flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#5855D6]/10 text-[#5855D6]">
                  <Compass className="size-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#1F2A44]">Our Mission</h3>
                  <p className="text-sm text-[#475467] mt-0.5">
                    Help everyone make confident financial decisions with honest mathematics and no sales pressure.
                  </p>
                </div>
              </div>

              <div className="rounded-[16px] border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-xs flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#3D5C4A]/10 text-[#3D5C4A]">
                  <HeartHandshake className="size-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#1F2A44]">Our Values</h3>
                  <p className="text-sm text-[#475467] mt-0.5">
                    Simplicity, Privacy, Empowerment, India-first. We never sell user data or recommend predatory loans.
                  </p>
                </div>
              </div>

              <div className="rounded-[16px] border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-xs flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6B46A]/20 text-[#7D5200]">
                  <History className="size-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#1F2A44]">Our Story</h3>
                  <p className="text-sm text-[#475467] mt-0.5">
                    Built by a dedicated engineering team with a big vision for financial freedom, transparent planning, and math you can trust.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Proof Stats */}
            <div className="pt-4 border-t border-[#E8E1D6] grid grid-cols-3 gap-6">
              <div>
                <div className="font-serif text-2xl sm:text-3xl font-medium text-[#1F2A44]">
                  100K+
                </div>
                <div className="text-xs sm:text-sm text-[#475467]">Users</div>
              </div>

              <div>
                <div className="font-serif text-2xl sm:text-3xl font-medium text-[#1F2A44] flex items-center gap-1">
                  <span>4.8</span>
                  <Star className="size-4.5 text-[#E6B46A] fill-[#E6B46A]" />
                </div>
                <div className="text-xs sm:text-sm text-[#475467]">Rating</div>
              </div>

              <div>
                <div className="font-serif text-2xl sm:text-3xl font-medium text-[#1F2A44]">
                  ₹1.2Cr+
                </div>
                <div className="text-xs sm:text-sm text-[#475467]">Goals planned</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
