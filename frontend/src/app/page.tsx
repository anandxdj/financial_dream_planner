import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Scale,
  ChevronRight,
} from "lucide-react";
import {
  Panel,
  Badge,
  ExamplePlanCard,
  AssetImage,
  InteractiveTradeoffDemo,
} from "@/components/planner";
import {
  ASSET_WOMAN_WITH_LAPTOP,
  ASSET_SAVINGS_JAR_HOME,
  ASSET_EUROPE_TRIP,
  ASSET_DEBT_PAYOFF,
} from "@/lib/assets";
import { ROUTES } from "@/constants/api";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FFF9F0] text-[#344054] flex flex-col font-sans selection:bg-[#E6B46A]/30">
      {/* Editorial Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-[#E8E1D6] bg-[#FFFCF8]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-h-[44px] items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] rounded-md"
          >
            <div className="flex size-9 items-center justify-center rounded-[10px] bg-[#1F2A44] text-[#E6B46A]">
              <Sparkles className="size-4.5" />
            </div>
            <div>
              <span className="font-serif text-lg font-medium tracking-tight text-[#1F2A44] block">
                Financial Dream Planner
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#3D5C4A] block">
                Living Financial Plan
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#344054]">
            <a
              href="#try-plan-automate"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center py-2 px-2 hover:text-[#1F2A44] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] rounded"
            >
              Try Plan Automate
            </a>
            <a
              href="#goals"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center py-2 px-2 hover:text-[#1F2A44] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] rounded"
            >
              Goals
            </a>
            <a
              href="#trust"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center py-2 px-2 hover:text-[#1F2A44] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] rounded"
            >
              Trust & Determinism
            </a>
            <a
              href="#android"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center py-2 px-2 hover:text-[#1F2A44] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] rounded"
            >
              Optional Android SMS
            </a>
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.login}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[10px] px-4 py-2 text-xs font-semibold text-[#1F2A44] hover:bg-[#FFF9F0] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9]"
            >
              Sign in
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-[10px] bg-[#1F2A44] px-4 py-2 text-xs font-semibold text-[#FFFCF8] shadow-xs hover:bg-[#1F2A44]/90 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9]"
            >
              <span>Get Started</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section: 60/40 Editorial Layout */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 border-b border-[#E8E1D6]">
        {/* Subtle decorative background glow */}
        <div className="absolute top-1/4 -right-20 -z-10 size-96 rounded-full bg-[#E6B46A]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/4 -z-10 size-96 rounded-full bg-[#7090C8]/10 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* 60% Left Column: Editorial Headline & Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="purple" dot size="md">
                  INDIA-FIRST LIVING FINANCIAL PLAN
                </Badge>
                <Badge tone="sage" size="md">
                  Canonical Ledger State
                </Badge>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.14] text-[#1F2A44] tracking-tight">
                See the trade-offs before you decide
              </h1>

              <p className="text-base sm:text-lg text-[#344054] max-w-2xl leading-relaxed">
                Most finance apps answer <em>“what happened?”</em>. Financial Dream Planner simulates your future.
                Compare mathematical consequences before taking a home loan, rebalancing mutual funds, or adjusting SIPs —
                grounded in canonical ledger truth, deterministic calculations, and living plan drift.
              </p>

              {/* Call to Actions (min-h-[44px], rounded-[10px]) */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/onboarding"
                  className="inline-flex w-full sm:w-auto min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-[10px] bg-[#1F2A44] px-6 py-3 text-sm font-semibold text-[#FFFCF8] shadow-md hover:bg-[#1F2A44]/90 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9]"
                >
                  <span>Start your living plan</span>
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href="/affordability"
                  className="inline-flex w-full sm:w-auto min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-[10px] border border-[#E8E1D6] bg-[#FFFCF8] px-6 py-3 text-sm font-semibold text-[#1F2A44] shadow-xs hover:bg-[#FFF9F0] hover:border-[#1F2A44]/30 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9]"
                >
                  <Scale className="size-4 text-[#5448C8]" />
                  <span>Explore Affordability</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-[#E8E1D6]/70 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#475467]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#3D5C4A] shrink-0" />
                  <span className="font-medium text-[#1F2A44]">100% Deterministic Math</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#3D5C4A] shrink-0" />
                  <span className="font-medium text-[#1F2A44]">Zero Fake Health Scores</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#3D5C4A] shrink-0" />
                  <span className="font-medium text-[#1F2A44]">Private On-Device SMS</span>
                </div>
              </div>
            </div>

            {/* 40% Right Column: woman_with_laptop.png + Explicitly Labeled Example HTML Plan */}
            <div className="lg:col-span-5 relative flex flex-col items-center">
              <div className="relative w-full max-w-md">
                {/* Character Illustration */}
                <div className="relative mx-auto flex justify-center mb-4">
                  <div className="relative rounded-[20px] bg-gradient-to-b from-[#FFF9F0] to-[#FFFCF8] p-3 border border-[#E8E1D6]">
                    <AssetImage
                      src={ASSET_WOMAN_WITH_LAPTOP}
                      alt="Woman planning her household financial future with laptop"
                      width={440}
                      height={440}
                      priority
                      className="rounded-[16px] drop-shadow-sm max-h-[340px] w-auto object-contain mx-auto"
                    />
                  </div>
                </div>

                {/* Explicitly Labeled Example HTML Plan */}
                <div className="w-full">
                  <ExamplePlanCard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Try Plan Automate */}
      <section id="try-plan-automate" className="py-16 md:py-24 border-b border-[#E8E1D6] bg-[#FFFCF8]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left mb-12">
            <Badge tone="gold" dot size="md">
              THE LIVING ENGINE
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1F2A44] tracking-tight mt-2">
              Try. Plan. Automate.
            </h2>
            <p className="mt-3 text-base text-[#344054] leading-relaxed">
              Three connected disciplines working as one system. Explore without fear, plan with rigorous mathematics,
              and stay synchronized when actual spending deviates.
            </p>
          </div>

          {/* 3 Discipline Cards (16px panel, 10px control) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Panel
              title="1. Try"
              badge={<Badge tone="blue" size="sm">What-If Scenarios</Badge>}
              subtitle="Overlay options without touching your records"
              className="h-full flex flex-col justify-between"
            >
              <div className="space-y-3 text-xs md:text-sm text-[#475467] text-left">
                <p>
                  Run deterministic scenario drafts: test buying a home in 2027 vs 2029, taking a sabbatical, or prepaying a loan.
                </p>
                <p>
                  Scenarios overlay an immutable baseline. Running a simulation causes zero ledger side-effects; applying one requires an explicit confirmation.
                </p>
                <div className="pt-2">
                  <Badge tone="neutral" size="sm">
                    Side-by-side comparison
                  </Badge>
                </div>
              </div>
            </Panel>

            <Panel
              title="2. Plan"
              badge={<Badge tone="sage" size="sm">Deterministic Engine</Badge>}
              subtitle="Inflation, cash flow, debt and funding"
              className="h-full flex flex-col justify-between"
            >
              <div className="space-y-3 text-xs md:text-sm text-[#475467] text-left">
                <p>
                  Goals are not isolated progress bars. The engine calculates future inflation-adjusted cost, required monthly contribution, and competing priorities.
                </p>
                <p>
                  Calculations use fixed-point decimal mathematics and explicit policy versions. Historical plans never silently inherit newer assumptions.
                </p>
                <div className="pt-2">
                  <Badge tone="neutral" size="sm">
                    No hallucinated math
                  </Badge>
                </div>
              </div>
            </Panel>

            <Panel
              title="3. Automate"
              badge={<Badge tone="warning" size="sm">Living Plan Drift</Badge>}
              subtitle="Notices drift — you retain total control"
              className="h-full flex flex-col justify-between"
            >
              <div className="space-y-3 text-xs md:text-sm text-[#475467] text-left">
                <p>
                  The backend continuously compares accepted plans against observed ledger reality. When material deviations happen, it flags a drift event.
                </p>
                <p>
                  Detection alone never rewrites your plan. You review the consequence chain and explicitly choose whether to <strong>Accept</strong> or <strong>Keep</strong>.
                </p>
                <div className="pt-2">
                  <Badge tone="neutral" size="sm">
                    Explicit consent boundary
                  </Badge>
                </div>
              </div>
            </Panel>
          </div>

          {/* Interactive Scenario Sandbox Preview */}
          <div className="mt-12">
            <InteractiveTradeoffDemo />
          </div>
        </div>
      </section>

      {/* Section: Goals */}
      <section id="goals" className="py-16 md:py-24 border-b border-[#E8E1D6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left mb-12">
            <Badge tone="purple" dot size="md">
              GOALS ARCHITECTURE
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1F2A44] tracking-tight mt-2">
              Every goal connected to cash flow
            </h2>
            <p className="mt-3 text-base text-[#344054] leading-relaxed">
              In traditional apps, goals are static meters. Here, saving for a home down payment directly interacts with your emergency runway, tax-saving ELSS investments, and monthly surplus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Goal 1: First Home */}
            <div className="rounded-[16px] border border-[#E8E1D6] bg-[#FFFCF8] p-6 text-left shadow-xs flex flex-col justify-between">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <Badge tone="sage" size="sm">Housing Goal</Badge>
                  <span className="text-xs text-[#475467]">Target: Dec 2027</span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <AssetImage
                    src={ASSET_SAVINGS_JAR_HOME}
                    alt="Home savings jar"
                    width={80}
                    height={80}
                    className="size-16 object-contain"
                  />
                  <div>
                    <h3 className="font-serif text-xl text-[#1F2A44]">First Home Down Payment</h3>
                    <p className="text-xs text-[#475467]">Target ₹28,00,000</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-[#344054]">
                  <div className="flex justify-between py-1 border-b border-[#E8E1D6]/60">
                    <span>Inflation Allowance</span>
                    <span className="font-semibold text-[#1F2A44]">6.0% p.a.</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E8E1D6]/60">
                    <span>Required Monthly SIP</span>
                    <span className="font-semibold text-[#1F2A44]">₹45,500</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Down payment ratio</span>
                    <span className="font-semibold text-[#3D5C4A]">25% Target</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E8E1D6]">
                <Link
                  href="/affordability"
                  className="min-h-[44px] inline-flex items-center gap-1 text-xs font-semibold text-[#5448C8] hover:text-[#1F2A44] hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] rounded"
                >
                  <span>Test EMI affordability</span>
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            </div>

            {/* Goal 2: Europe Trip */}
            <div className="rounded-[16px] border border-[#E8E1D6] bg-[#FFFCF8] p-6 text-left shadow-xs flex flex-col justify-between">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <Badge tone="blue" size="sm">Lifestyle Goal</Badge>
                  <span className="text-xs text-[#475467]">Target: May 2026</span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <AssetImage
                    src={ASSET_EUROPE_TRIP}
                    alt="Europe trip goal badge"
                    width={80}
                    height={80}
                    className="size-16 object-contain"
                  />
                  <div>
                    <h3 className="font-serif text-xl text-[#1F2A44]">Family Europe Trip</h3>
                    <p className="text-xs text-[#475467]">Target ₹4,50,000</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-[#344054]">
                  <div className="flex justify-between py-1 border-b border-[#E8E1D6]/60">
                    <span>Duration</span>
                    <span className="font-semibold text-[#1F2A44]">12 Months</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E8E1D6]/60">
                    <span>Required Monthly SIP</span>
                    <span className="font-semibold text-[#1F2A44]">₹32,000</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Impact on Home Goal</span>
                    <span className="font-semibold text-[#8A531D]">Delays home by 2 mo</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E8E1D6]">
                <span className="text-xs text-[#475467]">
                  Trade-off evaluated dynamically
                </span>
              </div>
            </div>

            {/* Goal 3: Debt Payoff */}
            <div className="rounded-[16px] border border-[#E8E1D6] bg-[#FFFCF8] p-6 text-left shadow-xs flex flex-col justify-between">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <Badge tone="sage" size="sm">Liability Prepayment</Badge>
                  <span className="text-xs text-[#475467]">High Priority</span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <AssetImage
                    src={ASSET_DEBT_PAYOFF}
                    alt="Debt payoff badge"
                    width={80}
                    height={80}
                    className="size-16 object-contain"
                  />
                  <div>
                    <h3 className="font-serif text-xl text-[#1F2A44]">Car Loan Prepayment</h3>
                    <p className="text-xs text-[#475467]">Remaining ₹3,80,000</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-[#344054]">
                  <div className="flex justify-between py-1 border-b border-[#E8E1D6]/60">
                    <span>Current Interest</span>
                    <span className="font-semibold text-[#1F2A44]">9.25% p.a.</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E8E1D6]/60">
                    <span>Interest Saved via ₹1L Prepay</span>
                    <span className="font-semibold text-[#3D5C4A]">₹42,800</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Tenure reduction</span>
                    <span className="font-semibold text-[#3D5C4A]">9 Months earlier</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E8E1D6]">
                <span className="text-xs text-[#3D5C4A] font-medium">
                  Guaranteed risk-free savings
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Trust & Determinism */}
      <section id="trust" className="py-16 md:py-24 border-b border-[#E8E1D6] bg-[#FFFCF8]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5 text-left">
              <Badge tone="sage" dot size="md">
                DETERMINISTIC TRUST & PRIVACY
              </Badge>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1F2A44] tracking-tight">
                No invented health scores. No hallucinated math.
              </h2>
              <p className="text-sm sm:text-base text-[#475467] leading-relaxed">
                Many fintech apps slap an arbitrary “82/100 Financial Health” badge on your dashboard to sell credit cards.
                We believe your money deserves deterministic arithmetic and total privacy.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3 text-xs sm:text-sm">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#3D5C4A]/15 text-[#3D5C4A] mt-0.5">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <div>
                    <strong className="text-[#1F2A44]">Deterministic Calculations:</strong> Loan amortization, cash flow, SIP compounding, and runway calculations are written in strict TypeScript and Python domain logic, not LLM prompts.
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs sm:text-sm">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#3D5C4A]/15 text-[#3D5C4A] mt-0.5">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <div>
                    <strong className="text-[#1F2A44]">Guarded AI with Cited Sources:</strong> When AI offers insights, it operates inside bounded LangGraph pipelines with closed tools and dual Risk and Critic validators that verify source freshness.
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs sm:text-sm">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#3D5C4A]/15 text-[#3D5C4A] mt-0.5">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <div>
                    <strong className="text-[#1F2A44]">Household Isolation & Privacy:</strong> Multi-tenant database isolation, full durable export, and irreversible two-step deletion. Your money data is never sold or brokered.
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Comparison Panel */}
            <div className="lg:col-span-6">
              <div className="rounded-[16px] border border-[#E8E1D6] bg-[#FFFCF8] p-6 text-left shadow-sm">
                <h3 className="font-serif text-lg text-[#1F2A44] mb-4 pb-3 border-b border-[#E8E1D6]">
                  How We Protect Your Financial State
                </h3>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="rounded-[10px] bg-[#FFF9F0] p-3.5 border border-[#E8E1D6]">
                    <span className="font-bold text-[#1F2A44] block mb-1">
                      Authoritative Math vs Advisory AI
                    </span>
                    <p className="text-[#475467] text-xs">
                      The backend owns financial truth. The client presents it. The deterministic engine performs calculations. AI orchestrates and explains; it never invents numbers.
                    </p>
                  </div>

                  <div className="rounded-[10px] bg-[#FFF9F0] p-3.5 border border-[#E8E1D6]">
                    <span className="font-bold text-[#1F2A44] block mb-1">
                      Stale-Baseline & Concurrency Protection
                    </span>
                    <p className="text-[#475467] text-xs">
                      Every plan version has an immutable snapshot revision. Applying a scenario or accepting drift validates that the underlying baseline has not changed in the interim.
                    </p>
                  </div>

                  <div className="rounded-[10px] bg-[#FFF9F0] p-3.5 border border-[#E8E1D6]">
                    <span className="font-bold text-[#1F2A44] block mb-1">
                      Dual-Phase Verification Gate
                    </span>
                    <p className="text-[#475467] text-xs">
                      Financial research queries must pass a deterministic Risk Validator (preventing hallucinations) and an independent Critic that enforces citation authenticity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Optional Android Companion */}
      <section id="android" className="py-16 md:py-24 border-b border-[#E8E1D6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[20px] border border-[#E8E1D6] bg-[#FFFCF8] p-8 md:p-12 shadow-sm text-left">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <Badge tone="blue" dot size="md">
                  OPTIONAL ANDROID COMPANION
                </Badge>
                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1F2A44] tracking-tight">
                  Private SMS → Canonical Ledger
                </h2>
                <p className="text-sm sm:text-base text-[#475467] leading-relaxed">
                  In India, transactional SMS from banks (HDFC, SBI, ICICI, Axis) and UPI apps (GPay, PhonePe, Paytm) are the fastest way to track spending. Our Android companion processes them entirely on-device.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 text-xs text-[#475467]">
                  <div className="rounded-[10px] bg-[#FFF9F0] p-3 border border-[#E8E1D6]">
                    <strong className="text-[#1F2A44] block mb-0.5">On-Device Parsing Only</strong>
                    Only normalized transaction records leave your phone. Your personal SMS inbox is never uploaded.
                  </div>
                  <div className="rounded-[10px] bg-[#FFF9F0] p-3 border border-[#E8E1D6]">
                    <strong className="text-[#1F2A44] block mb-0.5">Exact UTR & Fingerprint Dedupe</strong>
                    Never double-count. Bank reference IDs and fuzzy timestamps reconcile into a single canonical transaction.
                  </div>
                  <div className="rounded-[10px] bg-[#FFF9F0] p-3 border border-[#E8E1D6]">
                    <strong className="text-[#1F2A44] block mb-0.5">100% Optional</strong>
                    Don&apos;t have Android? Use our desktop web app with manual entry, CSV import, and direct bank statements.
                  </div>
                  <div className="rounded-[10px] bg-[#FFF9F0] p-3 border border-[#E8E1D6]">
                    <strong className="text-[#1F2A44] block mb-0.5">Observation vs Plan</strong>
                    Incoming transactions update your ledger balance, but never quietly alter your long-term plan without consent.
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-[16px] bg-[#FFF9F0] border border-[#E8E1D6]">
                <Smartphone className="size-16 text-[#5E55C9] mb-3" />
                <h3 className="font-serif text-xl text-[#1F2A44] text-center">Android Client</h3>
                <p className="text-xs text-[#475467] text-center mt-1 max-w-xs">
                  Native React Native/Expo architecture specified with SQLite offline queue and background worker synchronization.
                </p>
                <div className="mt-4">
                  <Badge tone="purple" size="sm">
                    Offline First Ingestion
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Editorial Call to Action */}
      <section className="py-16 md:py-20 bg-[#FFF9F0] text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          <Badge tone="gold" dot size="md">
            GET STARTED TODAY
          </Badge>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#1F2A44] tracking-tight">
            See your financial life before you live it
          </h2>
          <p className="text-base text-[#475467] leading-relaxed">
            Create your account in minutes. Define your goals, test your trade-offs, and establish a living plan that adapts when life happens.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/onboarding"
              className="inline-flex w-full sm:w-auto min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-[#1F2A44] px-8 py-3 text-sm font-semibold text-[#FFFCF8] shadow-md hover:bg-[#1F2A44]/90 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:outline-none"
            >
              <span>Begin Onboarding</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/affordability"
              className="inline-flex w-full sm:w-auto min-h-[44px] items-center justify-center gap-2 rounded-[10px] border border-[#E8E1D6] bg-[#FFFCF8] px-6 py-3 text-sm font-semibold text-[#1F2A44] shadow-xs hover:bg-[#FFF9F0] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:outline-none"
            >
              <span>Explore Affordability</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="border-t border-[#E8E1D6] bg-[#FFFCF8] py-12 text-xs text-[#475467]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex size-7 items-center justify-center rounded-[8px] bg-[#1F2A44] text-[#E6B46A]">
              <Sparkles className="size-3.5" />
            </div>
            <div>
              <span className="font-serif text-base text-[#1F2A44] font-medium block">
                Financial Dream Planner
              </span>
              <span className="text-[11px] text-[#475467]">
                India-first canonical living financial plan
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/dashboard" className="min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center text-[#475467] hover:text-[#1F2A44] transition-colors focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:outline-none rounded">
              App Shell
            </Link>
            <Link href="/affordability" className="min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center text-[#475467] hover:text-[#1F2A44] transition-colors focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:outline-none rounded">
              Affordability
            </Link>
            <Link href="/onboarding" className="min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center text-[#475467] hover:text-[#1F2A44] transition-colors focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:outline-none rounded">
              Onboarding
            </Link>
            <Link href={ROUTES.login} className="min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center text-[#475467] hover:text-[#1F2A44] transition-colors focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:outline-none rounded">
              Sign In
            </Link>
            <Link href={ROUTES.register} className="min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center text-[#475467] hover:text-[#1F2A44] transition-colors focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:outline-none rounded">
              Register
            </Link>
          </div>

          <div className="text-center md:text-right text-[11px] text-[#475467]">
            <span>Deterministic Math · Zero Invented Scores</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
