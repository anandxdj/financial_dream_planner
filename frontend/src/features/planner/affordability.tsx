"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Scale,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { sdk } from "@/lib/sdk";
import { preserveAnonymousDraft } from "@/services/onboarding-draft";
import { unwrap } from "./queries";
import { trackFunnel } from "./analytics";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/components/finance/money";

interface AffordabilityInputs {
  purchaseAmount: string;
  income: string;
  expenses: string;
  liquidSavings?: string;
}

interface AffordabilityResult {
  verdict: "safe" | "tight" | "risky" | "insufficient_data";
  monthlySurplus: string | null;
  bufferImpact: string | null;
  timeToAffordMonths: number | null;
  comparison: {
    buyNow: string;
    waitThreeMonths: string;
  };
  explanation: string;
}

export function Affordability() {
  const [draftError, setDraftError] = useState<unknown>();
  const [draftBusy, setDraftBusy] = useState(false);
  const [draft, setDraft] = useState<string>();

  const calculation = useMutation({
    mutationFn: async (body: AffordabilityInputs) => {
      const response = await sdk.POST("/api/v1/affordability", { body });
      const unwrapped = unwrap(response);
      return {
        result: unwrapped.data as AffordabilityResult,
        inputs: body,
      };
    },
    onSuccess: () => {
      trackFunnel("affordability_completed");
      setDraft(undefined);
      requestAnimationFrame(() => {
        document.getElementById("affordability-result")?.focus();
      });
    },
  });

  async function carryInputs() {
    if (!calculation.data) return;
    setDraftBusy(true);
    setDraftError(null);
    try {
      const values = calculation.data.inputs;
      const response = await sdk.POST("/api/v1/planning/drafts", {
        body: {
          inputs: {
            cashFlow: {
              income: values.income,
              essentialExpenses: values.expenses,
            },
            emergencyFund: {
              currentReserves: values.liquidSavings,
            },
          },
          completedStep: 0,
          estimates: [],
        },
      });
      const result = unwrap(response);
      preserveAnonymousDraft(result.data.draftToken);
      setDraft(result.data.draftToken);
    } catch (e) {
      setDraftError(e);
    } finally {
      setDraftBusy(false);
    }
  }

  const result = calculation.data?.result;

  const verdictConfig: Record<
    "safe" | "tight" | "risky" | "insufficient_data",
    { label: string; tone: BadgeTone; icon: React.ComponentType<{ className?: string }> }
  > = {
    safe: {
      label: "Looks manageable",
      tone: "sage",
      icon: ShieldCheck,
    },
    tight: {
      label: "Your buffer would be tight",
      tone: "gold",
      icon: AlertTriangle,
    },
    risky: {
      label: "This would stretch your finances",
      tone: "danger",
      icon: AlertTriangle,
    },
    insufficient_data: {
      label: "More information is needed",
      tone: "blue",
      icon: Info,
    },
  };

  return (
    <div className="min-h-screen bg-[#FFF9F0] text-[#344054] flex flex-col font-sans">
      {/* Top Editorial Bar */}
      <header className="border-b border-[#E8E1D6] bg-[#FFFCF8]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex min-h-[44px] items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] rounded-md"
          >
            <div className="flex size-8 items-center justify-center rounded-[8px] bg-[#1F2A44] text-[#E6B46A]">
              <Sparkles className="size-4" />
            </div>
            <div>
              <span className="font-serif text-base font-medium tracking-tight text-[#1F2A44] block">
                Financial Dream Planner
              </span>
            </div>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 flex-1">
        {/* Title Header */}
        <div className="mb-8 max-w-2xl text-left">
          <div className="flex items-center gap-2 mb-2">
            <Badge tone="purple" dot size="sm">
              DECISION CHECK
            </Badge>
            <span className="text-xs text-[#475467]">Zero account needed</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#1F2A44]">
            Can I afford this?
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#475467] leading-relaxed">
            See what a purchase could mean for your monthly money and emergency buffer. No account needed.
          </p>
        </div>

        {/* Two-Column 50/50 Layout */}
        <div className="grid items-start gap-8 lg:grid-cols-2">
          {/* Left Column: Form Card */}
          <Card className="rounded-2xl border-[#E8E1D6] bg-[#FFFCF8] shadow-xs">
            <CardHeader className="border-b border-[#E8E1D6] pb-4">
              <div className="flex items-center gap-2">
                <Scale className="size-5 text-[#5E55C9]" />
                <CardTitle className="font-serif text-xl font-normal text-[#1F2A44]">
                  A few details
                </CardTitle>
              </div>
              <p className="text-xs text-[#475467] mt-0.5">
                We evaluate your cash flow and 3-month emergency safety net using deterministic math.
              </p>
            </CardHeader>

            <CardContent className="pt-6">
              <form
                className="space-y-5 text-left"
                action={(form: FormData) => {
                  calculation.mutate({
                    purchaseAmount: String(form.get("purchaseAmount") ?? "").trim(),
                    income: String(form.get("income") ?? "").trim(),
                    expenses: String(form.get("expenses") ?? "").trim(),
                    liquidSavings:
                      String(form.get("liquidSavings") ?? "").trim() || undefined,
                  });
                }}
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="purchaseAmount"
                    className="block text-sm font-semibold text-[#1F2A44]"
                  >
                    Purchase amount (INR)
                  </label>
                  <input
                    id="purchaseAmount"
                    name="purchaseAmount"
                    type="text"
                    inputMode="decimal"
                    required
                    pattern="[0-9]+(\.[0-9]{1,2})?"
                    placeholder="e.g. 50000"
                    className="min-h-11 w-full rounded-[10px] border border-[#E8E1D6] bg-[#FFFCF8] px-3.5 py-2 text-base text-[#1F2A44] placeholder:text-[#475467]/60 outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:border-[#5E55C9] sm:text-sm"
                  />
                  <p className="text-xs text-[#475467]">
                    The total cost of the vehicle, trip, laptop, or planned purchase.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="income"
                    className="block text-sm font-semibold text-[#1F2A44]"
                  >
                    Monthly take-home income (INR)
                  </label>
                  <input
                    id="income"
                    name="income"
                    type="text"
                    inputMode="decimal"
                    required
                    pattern="[0-9]+(\.[0-9]{1,2})?"
                    placeholder="e.g. 80000"
                    className="min-h-11 w-full rounded-[10px] border border-[#E8E1D6] bg-[#FFFCF8] px-3.5 py-2 text-base text-[#1F2A44] placeholder:text-[#475467]/60 outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:border-[#5E55C9] sm:text-sm"
                  />
                  <p className="text-xs text-[#475467]">
                    Your net monthly household salary or dependable earnings.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="expenses"
                    className="block text-sm font-semibold text-[#1F2A44]"
                  >
                    Total monthly expenses (INR)
                  </label>
                  <input
                    id="expenses"
                    name="expenses"
                    type="text"
                    inputMode="decimal"
                    required
                    pattern="[0-9]+(\.[0-9]{1,2})?"
                    placeholder="e.g. 40000"
                    aria-describedby="expenses-hint"
                    className="min-h-11 w-full rounded-[10px] border border-[#E8E1D6] bg-[#FFFCF8] px-3.5 py-2 text-base text-[#1F2A44] placeholder:text-[#475467]/60 outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:border-[#5E55C9] sm:text-sm"
                  />
                  <p id="expenses-hint" className="text-xs text-[#475467]">
                    Include loan payments and other recurring obligations.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="liquidSavings"
                    className="block text-sm font-semibold text-[#1F2A44]"
                  >
                    Liquid savings (INR)
                  </label>
                  <input
                    id="liquidSavings"
                    name="liquidSavings"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]+(\.[0-9]{1,2})?"
                    placeholder="e.g. 100000 (optional)"
                    aria-describedby="liquidSavings-hint"
                    className="min-h-11 w-full rounded-[10px] border border-[#E8E1D6] bg-[#FFFCF8] px-3.5 py-2 text-base text-[#1F2A44] placeholder:text-[#475467]/60 outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:border-[#5E55C9] sm:text-sm"
                  />
                  <p id="liquidSavings-hint" className="text-xs text-[#475467]">
                    Leave blank if unknown. This check uses a three-month expense buffer.
                  </p>
                </div>

                {calculation.error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-[#A13F39]/40 bg-[#A13F39]/10 p-4 text-xs text-[#A13F39]"
                  >
                    {calculation.error instanceof Error
                      ? calculation.error.message
                      : "Please check your inputs and try again."}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={calculation.isPending}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-[10px] bg-[#1F2A44] px-5 py-2.5 text-sm font-semibold text-[#FFFCF8] shadow-sm hover:bg-[#1F2A44]/90 transition-colors disabled:opacity-50 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9]"
                >
                  {calculation.isPending ? "Checking…" : "Check affordability"}
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Right Column: Results & Trade-Offs Card */}
          <Card className="rounded-2xl border-[#E8E1D6] bg-[#FFFCF8] shadow-xs">
            <CardHeader className="border-b border-[#E8E1D6] pb-4">
              <CardTitle className="font-serif text-xl font-normal text-[#1F2A44]">
                Your trade-offs
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6 text-left">
              {!result ? (
                <div className="py-8 text-center sm:py-12">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#FFF9F0] border border-[#E8E1D6] text-[#475467] mb-3">
                    <Clock className="size-6" />
                  </div>
                  <p className="text-sm text-[#475467] max-w-sm mx-auto leading-relaxed">
                    Enter the details to see a result here. Your chosen purchase will be evaluated
                    by the planning engine.
                  </p>
                </div>
              ) : (
                <div
                  id="affordability-result"
                  tabIndex={-1}
                  className="space-y-6 outline-none"
                >
                  {/* Verdict Banner */}
                  <div className="rounded-xl border border-[#E8E1D6] bg-[#FFF9F0] p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge tone={verdictConfig[result.verdict].tone} dot size="md">
                        {result.verdict.toUpperCase().replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="font-serif text-2xl sm:text-3xl font-normal text-[#1F2A44]">
                      {verdictConfig[result.verdict].label}
                    </p>
                    <p className="text-sm text-[#344054] leading-relaxed">
                      {result.explanation}
                    </p>
                  </div>



                  {/* Key Metrics Grid */}
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[12px] border border-[#E8E1D6] bg-[#FFF9F0]/60 p-3.5">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                        Monthly surplus
                      </dt>
                      <dd className="mt-1 font-serif text-2xl font-normal text-[#1F2A44] tabular-nums">
                        {formatMoney(result.monthlySurplus)}
                      </dd>
                    </div>

                    <div className="rounded-[12px] border border-[#E8E1D6] bg-[#FFF9F0]/60 p-3.5">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                        Emergency-buffer impact
                      </dt>
                      <dd className="mt-1 font-serif text-2xl font-normal text-[#1F2A44] tabular-nums">
                        {formatMoney(result.bufferImpact)}
                      </dd>
                    </div>

                    <div className="sm:col-span-2 rounded-[12px] border border-[#E8E1D6] bg-[#FFF9F0]/60 p-3.5">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                        Time to afford
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-[#1F2A44]">
                        {result.timeToAffordMonths === null
                          ? "Not available with these inputs"
                          : `${result.timeToAffordMonths} months`}
                      </dd>
                    </div>
                  </dl>

                  {/* Side-by-Side Buy Now vs Wait Comparison */}
                  <div className="rounded-xl border border-[#E8E1D6] bg-[#FFF9F0] p-4 space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#1F2A44]">
                      Decision Comparison
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[10px] bg-[#FFFCF8] p-3 border border-[#E8E1D6]">
                        <p className="text-xs font-semibold text-[#1F2A44]">Buy now</p>
                        <p className="font-serif text-xl font-normal text-[#1F2A44] tabular-nums mt-1">
                          {formatMoney(result.comparison.buyNow)}
                        </p>
                        <p className="text-[11px] text-[#475467] mt-0.5">Liquid savings left</p>
                      </div>

                      <div className="rounded-[10px] bg-[#FFFCF8] p-3 border border-[#E8E1D6]">
                        <p className="text-xs font-semibold text-[#1F2A44]">Wait three months</p>
                        <p className="font-serif text-xl font-normal text-[#3D5C4A] tabular-nums mt-1">
                          {formatMoney(result.comparison.waitThreeMonths)}
                        </p>
                        <p className="text-[11px] text-[#475467] mt-0.5">With 3 months surplus added</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#475467] leading-relaxed">
                      Comparison shows liquid savings after the purchase. It assumes the same income
                      and expenses for the next three months.
                    </p>
                  </div>

                  {draftError ? (
                    <div
                      role="alert"
                      className="rounded-xl border border-[#A13F39]/40 bg-[#A13F39]/10 p-3 text-xs text-[#A13F39]"
                    >
                      {draftError instanceof Error
                        ? draftError.message
                        : "Failed to preserve draft inputs. Please try again."}
                    </div>
                  ) : null}

                  {/* Carry-Forward Action */}
                  {draft ? (
                    <div className="rounded-xl border border-[#3D5C4A]/30 bg-[#3D5C4A]/10 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#3D5C4A]">
                        <CheckCircle2 className="size-4 shrink-0" />
                        <p role="status">Your inputs are ready to carry into your plan.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <Link
                          href="/register?next=%2Fonboarding"
                          className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#1F2A44] px-5 py-2 text-xs font-semibold text-[#FFFCF8] shadow-sm hover:bg-[#1F2A44]/90 outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9]"
                        >
                          Create account and continue
                        </Link>
                        <Link
                          href="/login?next=%2Fonboarding"
                          className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#E8E1D6] bg-[#FFFCF8] px-4 py-2 text-xs font-semibold text-[#1F2A44] hover:bg-[#FFF9F0] outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9]"
                        >
                          Sign in
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={draftBusy}
                      onClick={() => void carryInputs()}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#1F2A44] px-5 py-2.5 text-sm font-semibold text-[#FFFCF8] shadow-sm hover:bg-[#1F2A44]/90 transition-colors disabled:opacity-50 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9]"
                    >
                      <span>
                        {draftBusy
                          ? "Preserving your inputs…"
                          : "Build my plan with these inputs"}
                      </span>
                      <ArrowRight className="size-4" />
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E1D6] bg-[#FFFCF8] py-8 text-xs text-[#475467]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Financial Dream Planner · Anonymous Affordability</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-[#1F2A44] min-h-[44px] min-w-[44px] inline-flex items-center justify-center">
              Home
            </Link>
            <Link href="/onboarding" className="hover:text-[#1F2A44] min-h-[44px] inline-flex items-center">
              Onboarding
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
