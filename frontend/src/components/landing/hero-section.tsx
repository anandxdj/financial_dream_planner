"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calculator, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-canvas via-surface-muted/40 to-canvas pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="pointer-events-none absolute -left-16 -top-16 size-80 rounded-full bg-purple/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/2 size-96 rounded-full bg-gold/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="space-y-6 text-left lg:col-span-7">
            <p className="font-script text-xl tracking-wide text-sage sm:text-2xl">
              Plan today, understand tomorrow.
            </p>

            <h1 className="max-w-4xl font-serif text-4xl font-normal leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-6xl">
              See the trade-offs <span className="text-purple">before</span> a money decision changes your future.
            </h1>

            <p className="max-w-2xl text-base font-normal leading-relaxed text-muted-ink sm:text-lg">
              Build one living financial plan for your income, goals, loans and savings—then test a car, home, trip or contribution change against the saved baseline before you commit.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/onboarding"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-purple px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple/90"
              >
                Build my financial plan
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>

              <Link
                href="/can-i-afford-this"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border bg-card px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-surface-muted"
              >
                <Calculator className="size-4 text-purple" aria-hidden="true" />
                Try “Can I afford this?”
              </Link>
            </div>

            <div className="grid gap-3 border-t pt-6 sm:grid-cols-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-navy">Engine-backed math</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-ink">Financial calculations run on the backend engine, not in AI text.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-blue" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-navy">Review before apply</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-ink">Scenarios and AI proposals never silently replace your active plan.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <LockKeyhole className="mt-0.5 size-4 shrink-0 text-purple" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-navy">No bank credentials required</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-ink">Start manually; supported Android data sync remains an optional freshness layer.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center lg:col-span-5">
            <div className="relative w-full max-w-[460px]">
              <div className="pointer-events-none absolute -right-6 -top-6 z-20 hidden size-24 opacity-90 sm:block">
                <Image
                  src="/Assets/Nature%20Elements/lavender_branch.png"
                  alt=""
                  width={96}
                  height={96}
                  className="object-contain"
                  aria-hidden="true"
                />
              </div>

              <div className="pointer-events-none absolute -bottom-8 -left-8 z-20 hidden size-28 opacity-90 sm:block">
                <Image
                  src="/Assets/Nature%20Elements/green_leaves.png"
                  alt=""
                  width={112}
                  height={112}
                  className="object-contain"
                  aria-hidden="true"
                />
              </div>

              <div className="relative overflow-hidden rounded-[24px] border bg-card p-4 shadow-sm sm:p-5">
                <div className="relative flex aspect-[4/4.2] items-center justify-center overflow-hidden rounded-[20px] bg-surface-muted/55">
                  <Image
                    src="/Assets/Characters/woman_by_window.png"
                    alt="Person calmly reviewing a financial roadmap"
                    width={440}
                    height={480}
                    priority
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="mt-4 rounded-2xl border bg-canvas p-4 text-center sm:text-left">
                  <p className="font-script text-lg leading-relaxed text-navy sm:text-xl">
                    “A better financial future is a series of smaller, clearer decisions.”
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-sage sm:justify-end">
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    Calm, guided clarity
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
