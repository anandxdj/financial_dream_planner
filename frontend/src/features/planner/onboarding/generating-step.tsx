"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Loader2 } from "lucide-react";

interface GeneratingStepProps {
  onComplete: () => void;
  apiSuccess?: boolean;
}

const STAGES = [
  "Understanding your profile",
  "Building financial scenarios",
  "Creating recommendations",
  "Almost there...",
];

export function GeneratingStep({ onComplete }: GeneratingStepProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setCurrentStageIndex(1);
      setProgressPercent(45);
    }, 600);

    const t2 = setTimeout(() => {
      setCurrentStageIndex(2);
      setProgressPercent(75);
    }, 1200);

    const t3 = setTimeout(() => {
      setCurrentStageIndex(3);
      setProgressPercent(95);
    }, 1800);

    const t4 = setTimeout(() => {
      setProgressPercent(100);
      setTimeout(() => {
        onCompleteRef.current();
      }, 300);
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div className="mx-auto max-w-xl py-6 text-center">
      {/* Title & subtitle */}
      <h2 className="font-serif text-2xl font-medium tracking-tight text-[#1F2A44] sm:text-3xl">
        Creating your personalized plan
      </h2>
      <p className="mt-2 text-sm text-[#475467]">
        We&apos;re analyzing your information and building insights tailored to your goals. This usually takes a few seconds.
      </p>

      {/* Progress Bar Container */}
      <div className="mt-8 space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8E1D6]/70">
          <div
            className="h-full rounded-full bg-[#5E55C9] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-right text-xs font-semibold tabular-nums text-[#5E55C9]">
          {progressPercent}%
        </div>
      </div>

      {/* Live status label */}
      <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#5E55C9]">
        {currentStageIndex < 3 ? "Analyzing your goals…" : "Finalizing insights…"}
      </div>

      {/* Checklist items */}
      <div className="mx-auto mt-6 max-w-sm space-y-3 text-left">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentStageIndex || (idx === 3 && progressPercent === 100);
          const isCurrent = idx === currentStageIndex && progressPercent < 100;

          return (
            <div key={stage} className="flex items-center gap-3">
              <div
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isDone
                    ? "bg-[#3D5C4A] text-white"
                    : isCurrent
                      ? "bg-[#5E55C9]/15 text-[#5E55C9]"
                      : "border border-[#D0D5DD] bg-white text-[#9CA3AF]"
                }`}
              >
                {isDone ? (
                  <Check className="size-3.5 stroke-[3]" />
                ) : isCurrent ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <span className="size-1.5 rounded-full bg-[#D0D5DD]" />
                )}
              </div>
              <span
                className={`text-sm ${
                  isDone
                    ? "font-medium text-[#1F2A44]"
                    : isCurrent
                      ? "font-semibold text-[#5E55C9]"
                      : "text-[#9CA3AF]"
                }`}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mountain landscape watercolor illustration matching reference */}
      <div className="mt-10 flex flex-col items-center">
        <div className="relative h-36 w-full max-w-[320px]">
          <Image
            src="/Assets/Objects/mountain_landscape.png"
            alt="Mountain landscape illustration"
            fill
            className="object-contain"
            sizes="320px"
          />
        </div>
        <p className="mt-3 font-serif text-sm italic text-[#3D5C4A]">
          &ldquo;Good things take a little time.&rdquo;
        </p>
      </div>
    </div>
  );
}
