"use client";

import Image from "next/image";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, UserCheck, Compass } from "lucide-react";

interface WelcomeStepProps {
  onStart: () => void;
}

export function WelcomeStep({ onStart }: WelcomeStepProps) {
  const valueProps = [
    {
      title: "Simple steps",
      desc: "Clear guidance at every stage",
      icon: Compass,
      color: "text-[#5E55C9] bg-[#5E55C9]/10",
    },
    {
      title: "Personalized",
      desc: "Tailored to your life and goals",
      icon: UserCheck,
      color: "text-[#3B5B8C] bg-[#3B5B8C]/10",
    },
    {
      title: "Secure",
      desc: "Your data stays private",
      icon: ShieldCheck,
      color: "text-[#3D5C4A] bg-[#3D5C4A]/10",
    },
    {
      title: "Confident future",
      desc: "Turn information into freedom",
      icon: Sparkles,
      color: "text-[#7D5200] bg-[#E6B46A]/15",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      {/* 4 Value Badges Ribbon */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        {valueProps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex items-center gap-3 rounded-2xl border border-[#E8E1D6]/80 bg-white/80 p-3.5 shadow-xs backdrop-blur-xs transition-transform hover:-translate-y-0.5"
            >
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                <Icon className="size-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-[#1F2A44] sm:text-sm">{item.title}</h4>
                <p className="truncate text-xs text-[#475467]">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hero 2-Column Split */}
      <div className="overflow-hidden rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] shadow-sm">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Hero Artwork Column */}
          <div className="relative flex flex-col items-center justify-center bg-[#FFF9F0]/60 p-8 sm:p-12 lg:col-span-5 lg:h-full">
            <div className="absolute top-6 left-6 font-serif italic text-lg text-[#3D5C4A]/90">
              Plan today. Prosper Tomorrow.
            </div>

            <div className="relative my-4 aspect-square w-full max-w-[340px] drop-shadow-md">
              <Image
                src="/Assets/Characters/woman_with_laptop.png"
                alt="Woman planning future on laptop with coffee"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 340px"
              />
            </div>

            <div className="text-center font-serif text-sm italic text-[#475467]">
              Quiet clarity for your life decisions.
            </div>
          </div>

          {/* Right Copy & CTA Column */}
          <div className="p-8 sm:p-12 lg:col-span-7">
            <div className="max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5E55C9]">
                01 Welcome / Get Started
              </span>

              <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-[#1F2A44] sm:text-4xl lg:text-5xl">
                Welcome to <br />
                <span className="text-[#5E55C9]">Financial Dream Planner</span>
              </h1>

              <p className="mt-4 text-base leading-relaxed text-[#344054] sm:text-lg">
                Let&apos;s build a plan that fits your life, goals and what matters most. No stress, no jargon—just clarity.
              </p>

              {/* Checklist bullets matching reference */}
              <div className="mt-6 space-y-3">
                {[
                  "Guided, step by step",
                  "Takes just a few minutes",
                  "Personalized to your goals",
                  "Your data stays private & secure",
                ].map((bullet) => (
                  <div key={bullet} className="flex items-center gap-3 text-sm text-[#344054]">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#3D5C4A]/15 text-[#3D5C4A]">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>

              {/* Action Button & Botanical Flourish */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onStart}
                  className="group inline-flex min-h-[50px] items-center justify-center gap-2.5 rounded-xl bg-[#5E55C9] px-7 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-[#4E45B8] active:scale-[0.99]"
                >
                  <span>Get started</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </button>

                <div className="flex items-center gap-2 pl-1 font-serif text-sm italic text-[#3D5C4A]">
                  <Image
                    src="/Assets/Nature Elements/leafy_twig.png"
                    alt="Botanical accent"
                    width={22}
                    height={22}
                    className="opacity-80"
                  />
                  <span>A better tomorrow is a plan away.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
