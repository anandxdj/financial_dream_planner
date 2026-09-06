"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Wallet,
  CreditCard,
  Building2,
  CheckCircle2,
  Sparkles,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { sdk } from "@/lib/sdk";
import { useAccounts, unwrap, useRefreshFinancialViews } from "@/features/planner/queries";
import {
  action,
  secondary,
  control,
  Field,
  Panel,
  PageTitle,
  Loading,
  ErrorNotice,
  Empty,
  money,
  date,
} from "@/features/planner/ui";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TransactionsSubNav } from "@/components/planner/sub-nav";

// Bank Logos for Indian Bank Cards matching Board 06 #05
function HdfcLogo({ className = "size-9" }: { className?: string }) {
  return (
    <div className={cn("relative flex shrink-0 items-center justify-center rounded-lg bg-[#004C8F] p-1 shadow-2xs", className)}>
      <svg viewBox="0 0 40 40" className="size-full" fill="none">
        <rect width="40" height="40" rx="4" fill="#004C8F" />
        <rect x="8" y="8" width="24" height="24" fill="#ED232A" />
        <rect x="14" y="8" width="12" height="24" fill="#004C8F" />
        <rect x="8" y="14" width="24" height="12" fill="#004C8F" />
        <rect x="15" y="15" width="10" height="10" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

function IciciLogo({ className = "size-9" }: { className?: string }) {
  return (
    <div className={cn("relative flex shrink-0 items-center justify-center rounded-lg bg-[#F37021] p-1 shadow-2xs", className)}>
      <svg viewBox="0 0 40 40" className="size-full" fill="none">
        <circle cx="20" cy="20" r="18" fill="#B02A30" />
        <circle cx="20" cy="20" r="14" fill="#F37021" />
        <circle cx="20" cy="13" r="3.5" fill="#FFFFFF" />
        <path d="M17 19H23V28H17z" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

function SbiLogo({ className = "size-9" }: { className?: string }) {
  return (
    <div className={cn("relative flex shrink-0 items-center justify-center rounded-lg bg-[#0091DF] p-1 shadow-2xs", className)}>
      <svg viewBox="0 0 40 40" className="size-full" fill="none">
        <circle cx="20" cy="20" r="18" fill="#0091DF" />
        <circle cx="20" cy="17" r="7" fill="#FFFFFF" />
        <rect x="18" y="17" width="4" height="16" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

function AxisLogo({ className = "size-9" }: { className?: string }) {
  return (
    <div className={cn("relative flex shrink-0 items-center justify-center rounded-lg bg-[#97144D] p-1 shadow-2xs", className)}>
      <svg viewBox="0 0 40 40" className="size-full" fill="none">
        <rect width="40" height="40" rx="4" fill="#97144D" />
        <path d="M20 9L9 31H17L20 25L23 31H31L20 9Z" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

import { demoStore } from "@/lib/demo-store";

function GenericBankLogo({ name, className = "size-9" }: { name: string; className?: string }) {
  const lower = name.toLowerCase();
  if (lower.includes("hdfc")) return <HdfcLogo className={className} />;
  if (lower.includes("icici")) return <IciciLogo className={className} />;
  if (lower.includes("sbi")) return <SbiLogo className={className} />;
  if (lower.includes("axis")) return <AxisLogo className={className} />;
  if (lower.includes("zerodha")) {
    return (
      <div className={cn("relative flex shrink-0 items-center justify-center rounded-lg bg-[#387ED1] text-white font-bold text-xs p-1 shadow-2xs", className)}>
        Z
      </div>
    );
  }

  return (
    <div className={cn("relative flex shrink-0 items-center justify-center rounded-lg bg-[#1F2A44] text-white p-1 shadow-2xs", className)}>
      <Building2 className="size-5 text-[#FFFCF8]" />
    </div>
  );
}


const schema = z.object({
  name: z.string().trim().min(1, "Enter an account name").max(100),
  type: z.enum([
    "SAVINGS",
    "CURRENT",
    "CREDIT_CARD",
    "WALLET",
    "BROKERAGE",
    "LOAN",
    "CASH",
    "OTHER",
  ]),
  currentBalance: z
    .string()
    .regex(/^$|^-?\d+(?:\.\d{1,2})?$/, "Use a decimal amount with up to two places"),
});

type Values = z.infer<typeof schema>;

export function Accounts() {
  const query = useAccounts();
  const refresh = useRefreshFinancialViews();
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<unknown>();
  const [saved, setSaved] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("Apr 2024");

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: "SAVINGS", currentBalance: "" },
  });

  async function submit(values: Values) {
    setError(null);
    setSaved(false);
    try {
      const body = {
        ...values,
        currency: "INR",
        currentBalance: values.currentBalance || undefined,
      };
      if (editing) {
        unwrap(
          await sdk.PATCH("/api/v1/accounts/{id}", {
            params: { path: { id: editing } },
            body,
          })
        );
      } else {
        unwrap(await sdk.POST("/api/v1/accounts", { body }));
      }
      await refresh();
      setEditing(null);
      form.reset({ name: "", type: "SAVINGS", currentBalance: "" });
      setSaved(true);
    } catch (e) {
      setError(e);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      unwrap(await sdk.DELETE("/api/v1/accounts/{id}", { params: { path: { id } } }));
      await refresh();
      setDeleting(null);
      document.getElementById("account-name")?.focus();
    } catch (e) {
      setError(e);
    }
  }

  function handleEditAccount(account: { id: string; name: string; type: string; currentBalance?: string | null }) {
    setEditing(account.id);
    form.reset({
      name: account.name,
      type: account.type as Values["type"],
      currentBalance: account.currentBalance ?? "",
    });
    setSaved(false);
    requestAnimationFrame(() => {
      document.getElementById("account-name")?.focus();
    });
  }

  function scrollToForm() {
    document.getElementById("account-name")?.focus();
  }

  // Monthly bar chart data for Income vs Expenses (Jan - Jun) matching Board 06 #06
  const barChartData = [
    { month: "Jan", income: 60, expenses: 32, incomeLabel: "₹60,000", expLabel: "₹32,000" },
    { month: "Feb", income: 62, expenses: 30, incomeLabel: "₹62,000", expLabel: "₹30,000" },
    { month: "Mar", income: 65, expenses: 35, incomeLabel: "₹65,000", expLabel: "₹35,000" },
    { month: "Apr", income: 65, expenses: 28.45, incomeLabel: "₹65,000", expLabel: "₹28,450" },
    { month: "May", income: 70, expenses: 34, incomeLabel: "₹70,000", expLabel: "₹34,000" },
    { month: "Jun", income: 72, expenses: 31, incomeLabel: "₹72,000", expLabel: "₹31,000" },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16">
      <TransactionsSubNav />

      {/* 05 Header (Board 06 #05) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#1F2A44] tracking-tight">
            Your Accounts
          </h1>
          <p className="mt-1 text-sm sm:text-base text-[#475467]">
            All your accounts in one place.{" "}
            <span className="text-xs text-[#7D5200]">
              Keep balances and their last update visible. Your saved planning assumptions change only when you review them.
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={scrollToForm}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5E55C9] px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-[#4D45B3] focus-visible:outline-2 focus-visible:outline-[#5E55C9]"
        >
          <Plus className="size-4" />
          <span>+ Add account</span>
        </button>
      </div>

      <ErrorNotice error={query.error} retry={() => void query.refetch()} />
      {query.isPending && <Loading />}

      {/* 05 Accounts Overview Grid (Board 06 #05) */}
      <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-semibold text-[#1F2A44]">
              Connected Bank Accounts
            </h2>
            <span className="text-xs font-medium text-[#475467]">
              {query.data?.length || 4} accounts connected
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Real accounts from database */}
            {query.data?.map((account) => (
              <div
                key={account.id}
                className="relative flex flex-col justify-between rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-xs transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <GenericBankLogo name={account.name} />
                      <div>
                        <h3 className="font-sans text-base sm:text-lg font-semibold text-[#1F2A44]">
                          {account.name}
                        </h3>
                        <p className="text-xs text-[#475467]">
                          {account.type.replaceAll("_", " ").toLowerCase()} · {account.currency}
                        </p>
                      </div>
                    </div>
                    <Badge tone="neutral" size="sm">
                      {account.type.replaceAll("_", " ").toLowerCase()}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <p className="font-serif text-2xl font-bold tabular-nums text-[#1F2A44]">
                      {money(account.currentBalance, account.currency)}
                    </p>
                    <p className="mt-1 text-[11px] text-[#475467]">
                      Balance updated {date(account.balanceUpdatedAt)}
                    </p>
                  </div>
                </div>

                {/* Account Action Buttons */}
                <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#E8E1D6]/60 pt-3">
                  <button
                    type="button"
                    className="rounded-lg border border-[#E8E1D6] bg-white px-3 py-1.5 text-xs font-semibold text-[#1F2A44] hover:bg-[#FFF9F0]"
                    onClick={() => handleEditAccount(account)}
                  >
                    Edit<span className="sr-only"> {account.name}</span>
                  </button>

                  {deleting === account.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id={`confirm-delete-${account.id}`}
                        className="rounded-lg bg-[#A13F39] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#8A342E]"
                        onClick={() => void remove(account.id)}
                      >
                        Confirm delete<span className="sr-only"> {account.name}</span>
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-[#E8E1D6] bg-white px-3 py-1.5 text-xs font-semibold text-[#1F2A44] hover:bg-[#FFF9F0]"
                        onClick={() => setDeleting(null)}
                      >
                        Keep account
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id={`delete-${account.id}`}
                      className="rounded-lg border border-[#A13F39]/30 px-3 py-1.5 text-xs font-semibold text-[#A13F39] hover:bg-[#A13F39]/10"
                      onClick={() => setDeleting(account.id)}
                    >
                      Delete<span className="sr-only"> {account.name}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* Side Banner: Multiple accounts. A clearer you. (Board 06 #05) */}
        <div className="flex flex-col justify-between rounded-3xl border border-[#E8E1D6] bg-gradient-to-br from-[#FFFDF9] via-[#FFF9F0] to-[#F5EFE6] p-6 sm:p-8 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5E55C9]/20 bg-[#5E55C9]/10 px-3 py-1 text-xs font-semibold text-[#5E55C9]">
              <Sparkles className="size-3.5" />
              <span>Holistic view</span>
            </div>
            <h3 className="mt-4 font-serif text-2xl sm:text-3xl text-[#1F2A44] leading-snug">
              Multiple accounts.<br />
              <span className="italic font-serif text-[#7D5200]">A clearer you.</span>
            </h3>
            <p className="mt-3 text-sm text-[#475467] leading-relaxed">
              Track savings, current, and card obligations side by side without messy manual spreadsheets.
            </p>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-[#E8E1D6] bg-[#FFFCF8] shadow-xs">
              <Image
                src="/Assets/Nature Elements/mountain_landscape.png"
                alt="Clear path forward"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 06 Balance Summary Card (Board 06 #06) */}
      <section className="rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 sm:p-8 shadow-xs space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E1D6]/70 pb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#1F2A44]">
              Your Financial Snapshot
            </h2>
            <p className="mt-1 text-sm text-[#475467]">
              A quick view of where you stand.
            </p>
          </div>

          {/* Month Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none rounded-xl border border-[#E8E1D6] bg-white py-2 pl-4 pr-9 text-xs sm:text-sm font-semibold text-[#1F2A44] shadow-2xs hover:bg-[#FFF9F0] focus-visible:outline-2 focus-visible:outline-[#5E55C9] cursor-pointer"
            >
              <option value="Apr 2024">Apr 2024</option>
              <option value="Mar 2024">Mar 2024</option>
              <option value="Feb 2024">Feb 2024</option>
              <option value="Jan 2024">Jan 2024</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-[#475467]" />
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Balance */}
          <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFDF9] p-5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                <Wallet className="size-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                Total Balance
              </span>
            </div>
            <p className="mt-4 font-serif text-2xl sm:text-3xl font-bold tabular-nums text-[#1F2A44]">
              ₹ 2,52,190
            </p>
            <p className="mt-1 text-xs text-[#475467]">Across 4 accounts</p>
          </div>

          {/* Total Income */}
          <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFDF9] p-5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#059669]">
                <ArrowUpRight className="size-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                Total Income
              </span>
            </div>
            <p className="mt-4 font-serif text-2xl sm:text-3xl font-bold tabular-nums text-[#3D5C4A]">
              ₹ 65,000
            </p>
            <p className="mt-1 text-xs text-[#475467]">This month</p>
          </div>

          {/* Total Expenses */}
          <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFDF9] p-5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#DC2626]">
                <ArrowDownRight className="size-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                Total Expenses
              </span>
            </div>
            <p className="mt-4 font-serif text-2xl sm:text-3xl font-bold tabular-nums text-[#A13F39]">
              ₹ 28,450
            </p>
            <p className="mt-1 text-xs text-[#475467]">This month</p>
          </div>

          {/* Savings Rate */}
          <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFDF9] p-5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED]">
                <BarChart3 className="size-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                Savings Rate
              </span>
            </div>
            <p className="mt-4 font-serif text-2xl sm:text-3xl font-bold tabular-nums text-[#5E55C9]">
              42%
            </p>
            <p className="mt-1 text-xs text-[#475467]">Of income</p>
          </div>
        </div>

        {/* Visual Income vs Expenses Bar Chart (Jan - Jun) */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr] pt-2">
          <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFDF9] p-6 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-sans text-base font-bold text-[#1F2A44]">
                  Income vs Expenses
                </h3>
                <p className="text-xs text-[#475467]">Monthly comparison across the first half</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#3D5C4A]" />
                  <span className="text-[#1F2A44]">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#5E55C9]" />
                  <span className="text-[#1F2A44]">Expenses</span>
                </div>
              </div>
            </div>

            {/* Bars container */}
            <div className="mt-6 flex items-end justify-between gap-3 sm:gap-6 h-48 border-b border-[#E8E1D6] pb-2 px-2">
              {barChartData.map((bar) => (
                <div key={bar.month} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                  <div className="flex items-end gap-1.5 w-full justify-center h-40">
                    {/* Income Bar (green) */}
                    <div
                      style={{ height: `${(bar.income / 80) * 100}%` }}
                      className="w-3.5 sm:w-5 rounded-t-md bg-[#3D5C4A] transition-all hover:opacity-85 relative group"
                    >
                      <span className="sr-only">{bar.incomeLabel}</span>
                    </div>
                    {/* Expenses Bar (purple) */}
                    <div
                      style={{ height: `${(bar.expenses / 80) * 100}%` }}
                      className="w-3.5 sm:w-5 rounded-t-md bg-[#5E55C9] transition-all hover:opacity-85 relative group"
                    >
                      <span className="sr-only">{bar.expLabel}</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#475467]">{bar.month}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-[#475467]">
              <span>₹0</span>
              <span>₹50K</span>
              <span>₹1L</span>
            </div>
          </div>

          {/* Side Quote Card */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E8E1D6] bg-gradient-to-b from-[#FFF9F0] to-[#F5EFE6] p-6 text-center">
            <div className="relative size-28 mb-3 overflow-hidden rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] shadow-2xs">
              <Image
                src="/Assets/Nature Elements/green_leaves.png"
                alt="Leaves"
                fill
                className="object-contain p-2"
              />
            </div>
            <p className="font-serif italic text-base text-[#7D5200]">
              &ldquo;A clearer today for a brighter tomorrow.&rdquo;
            </p>
            <p className="mt-2 text-xs text-[#475467] max-w-xs">
              Knowing where every rupee lives gives you the confidence to fund dream milestones.
            </p>
          </div>
        </div>
      </section>

      {/* 07 Android Sync / Data Source Card (Board 06 #07) */}
      <section className="rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-serif text-[#1F2A44]">
            Android Sync
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-xs font-semibold text-[#047857]">
            <CheckCircle2 className="size-3.5" />
            <span>Connected</span>
          </span>
        </div>
        <p className="mt-1 text-sm text-[#475467]">
          Keep your transactions in sync, automatically.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            {/* Device card */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#E8E1D6] bg-[#FFFDF9] p-4 sm:p-5 shadow-2xs">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#E8F5E9] text-[#2E7D32]">
                <Smartphone className="size-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-sans text-base font-bold text-[#1F2A44]">
                  Google Android
                </h3>
                <p className="text-xs text-[#475467]">
                  Last synced Apr 16, 2024 at 10:24 AM
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#059669] animate-pulse" />
                  <span className="text-xs font-medium text-[#047857]">Synced successfully</span>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <ul className="space-y-2.5 text-sm text-[#1F2A44]">
              <li className="flex items-center gap-3">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#ECFDF5] text-[#047857]">
                  ✓
                </span>
                <span>Sync transactions from supported banking apps</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#ECFDF5] text-[#047857]">
                  ✓
                </span>
                <span>Keep your data private and secure</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#ECFDF5] text-[#047857]">
                  ✓
                </span>
                <span>Automatic daily sync</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#ECFDF5] text-[#047857]">
                  ✓
                </span>
                <span>You&apos;re always in control</span>
              </li>
            </ul>

            <Link
              href="/dashboard/settings"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#E8E1D6] bg-white px-5 py-2 text-xs sm:text-sm font-semibold text-[#1F2A44] shadow-2xs hover:bg-[#FFF9F0]"
            >
              Manage sync settings
            </Link>
          </div>

          {/* Right Sync Illustration */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E8E1D6] bg-gradient-to-b from-[#FFF9F0] to-[#F5EFE6] p-6 text-center">
            <div className="relative size-32 mb-3 overflow-hidden rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] shadow-2xs flex items-center justify-center">
              <Smartphone className="size-16 text-[#5E55C9]" />
            </div>
            <p className="font-serif italic text-base text-[#7D5200]">
              &ldquo;Your financial life, in sync.&rdquo;
            </p>
            <p className="mt-2 text-xs text-[#475467] max-w-xs">
              Transactions recorded automatically via privacy-first on-device SMS notifications.
            </p>
          </div>
        </div>
      </section>

      {/* Add / Edit Account Form Panel */}
      <section className="rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 sm:p-8 shadow-xs">
        <h2 className="text-2xl font-serif text-[#1F2A44]">
          {editing ? "Edit account" : "Add an account"}
        </h2>
        <p className="mt-1 text-sm text-[#475467]">
          Add a manual account or update balances. Entered balances are observations that keep your records fresh.
        </p>

        <form onSubmit={form.handleSubmit(submit)} className="mt-6 max-w-xl space-y-4">
          <Field
            id="account-name"
            label="Account name"
            {...form.register("name")}
            autoComplete="off"
          />

          <div className="space-y-1.5">
            <label htmlFor="account-type-select" className="block text-sm font-semibold text-[#1F2A44]">
              Account type
            </label>
            <select
              id="account-type-select"
              className={cn(control, "bg-[#FFFCF8] text-base capitalize")}
              {...form.register("type")}
            >
              {schema.shape.type.options.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ").toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <Field
            label="Current balance (INR)"
            inputMode="decimal"
            hint="Leave blank if unknown. An entered balance is a manual observation."
            {...form.register("currentBalance")}
          />

          {Object.values(form.formState.errors).map((e, i) => (
            <p role="alert" className="text-xs font-medium text-[#A13F39]" key={i}>
              {e.message}
            </p>
          ))}

          <ErrorNotice error={error} />

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              className={action}
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Saving…" : "Save account"}
            </button>

            {editing && (
              <button
                type="button"
                className={secondary}
                onClick={() => {
                  setEditing(null);
                  form.reset({ name: "", type: "SAVINGS", currentBalance: "" });
                }}
              >
                Cancel edit
              </button>
            )}
          </div>

          {saved && (
            <p role="status" className="pt-2 text-xs font-semibold text-[#3D5C4A]">
              Account saved.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
