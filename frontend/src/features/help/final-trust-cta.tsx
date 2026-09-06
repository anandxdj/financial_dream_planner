"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Users, CheckCircle2 } from "lucide-react";

export function FinalTrustCta() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 bg-[#FFF9F0] border-t border-[#E8E1D6]/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Heading, Subtitle, CTA Button, Trust Indicators */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            <div className="space-y-3">
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1F2A44] tracking-tight">
                Ready for a brighter tomorrow?
              </h2>
              <p className="text-base sm:text-lg text-[#475467] max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Join thousands who are taking control of their financial future with confidence.
              </p>
            </div>

            <div>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5E55C9] hover:bg-[#4D4AB8] active:scale-[0.98] text-white px-7 py-3.5 text-base font-semibold transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <span>Get started for free</span>
                <ArrowRight className="size-5" />
              </Link>
            </div>

            {/* 3 Trust Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-2 text-xs sm:text-sm text-[#475467]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4.5 text-[#5E55C9]" />
                <span>Secure & private</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-4.5 text-[#3B5B8C]" />
                <span>Trusted by 100K+ users</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4.5 text-[#3D5C4A]" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Right Column: Mountain Landscape Artwork + Script Quote */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative max-w-sm">
              <div className="text-right mb-2 pr-4 transform rotate-1">
                <span className="font-script text-2xl sm:text-3xl text-[#3B5B8C] drop-shadow-xs italic">
                  Better plans. Brighter tomorrows.
                </span>
              </div>
              <div className="relative overflow-hidden rounded-2xl p-2 bg-gradient-to-tr from-white/70 to-transparent">
                <Image
                  src="/Assets/Nature Elements/mountain_landscape.png"
                  alt="Scenic mountain landscape illustration"
                  width={340}
                  height={260}
                  className="rounded-xl object-cover drop-shadow-sm transition-transform hover:scale-[1.01]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
