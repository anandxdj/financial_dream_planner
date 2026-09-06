"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Search,
  Calendar,
  Plus,
  X,
  Copy,
  Check,
  Scissors,
  ChevronDown,
  Sparkles,
  ShoppingBag,
  Utensils,
  Zap,
  Tv,
  Tag,
  Wallet,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react";
import { sdk } from "@/lib/sdk";
import { demoStore } from "@/lib/demo-store";
import { useAccounts, useCategories, useRefreshFinancialViews, unwrap } from "@/features/planner/queries";
import {
  action,
  secondary,
  control,
  Field,
  Panel,
  PageTitle,
  Loading,
  ErrorNotice,
  money,
  date,
} from "@/features/planner/ui";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TransactionsSubNav } from "@/components/planner/sub-nav";

// Category badge visual mapping with pastel colors and icons matching Board 06
function getCategoryBadge(categoryName?: string) {
  const name = (categoryName || "").toLowerCase();
  if (name.includes("shop") || name.includes("cloth") || name.includes("amazon")) {
    return {
      label: categoryName || "Shopping",
      bg: "bg-[#FDF2F8] text-[#9D174D] border-[#FCE7F3]",
      icon: <ShoppingBag className="size-3.5 shrink-0" />,
    };
  }
  if (name.includes("income") || name.includes("salary") || name.includes("earning")) {
    return {
      label: categoryName || "Income",
      bg: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
      icon: <Wallet className="size-3.5 shrink-0" />,
    };
  }
  if (
    name.includes("food") ||
    name.includes("dine") ||
    name.includes("dining") ||
    name.includes("swiggy") ||
    name.includes("zomato") ||
    name.includes("grocer")
  ) {
    return {
      label: categoryName || "Food & Dining",
      bg: "bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5]",
      icon: <Utensils className="size-3.5 shrink-0" />,
    };
  }
  if (
    name.includes("util") ||
    name.includes("bill") ||
    name.includes("electr") ||
    name.includes("water") ||
    name.includes("power")
  ) {
    return {
      label: categoryName || "Utilities",
      bg: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
      icon: <Zap className="size-3.5 shrink-0" />,
    };
  }
  if (
    name.includes("sub") ||
    name.includes("stream") ||
    name.includes("netflix") ||
    name.includes("prime")
  ) {
    return {
      label: categoryName || "Subscriptions",
      bg: "bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]",
      icon: <Tv className="size-3.5 shrink-0" />,
    };
  }
  if (name.includes("transfer") || name.includes("savings")) {
    return {
      label: categoryName || "Transfer",
      bg: "bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4]",
      icon: <ArrowLeftRight className="size-3.5 shrink-0" />,
    };
  }
  return {
    label: categoryName || "General",
    bg: "bg-[#F8F9FA] text-[#475467] border-[#E8E1D6]",
    icon: <Tag className="size-3.5 shrink-0" />,
  };
}

// Brand / Merchant circular avatar helper
function MerchantAvatar({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (lower.includes("amazon")) {
    return (
      <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF9F0] border border-[#E8E1D6] text-amber-900 font-bold text-base shadow-2xs">
        a
      </div>
    );
  }
  if (lower.includes("swiggy")) {
    return (
      <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0E6] border border-[#FFD8BF] text-[#FC8019] font-bold text-sm shadow-2xs">
        S
      </div>
    );
  }
  if (lower.includes("zomato")) {
    return (
      <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-[#FFEAE6] border border-[#FFCCC7] text-[#E23744] font-bold text-sm shadow-2xs">
        Z
      </div>
    );
  }
  if (lower.includes("netflix")) {
    return (
      <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-[#1F2A44] border border-[#344054] text-[#E50914] font-black text-sm shadow-2xs">
        N
      </div>
    );
  }
  if (lower.includes("cred")) {
    return (
      <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-[#1F2A44] text-white font-bold text-[10px] tracking-wider shadow-2xs">
        CRED
      </div>
    );
  }
  if (lower.includes("salary")) {
    return (
      <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] shadow-2xs">
        <ArrowUpRight className="size-5" />
      </div>
    );
  }
  if (lower.includes("electric") || lower.includes("bill") || lower.includes("power")) {
    return (
      <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] shadow-2xs">
        <Zap className="size-5" />
      </div>
    );
  }
  if (lower.includes("transfer")) {
    return (
      <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-[#F0FDFA] border border-[#99F6E4] text-[#0F766E] shadow-2xs">
        <ArrowLeftRight className="size-5" />
      </div>
    );
  }
  return (
    <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-[#F5EFE6] border border-[#E8E1D6] text-[#1F2A44] font-bold text-sm shadow-2xs">
      {name ? name.charAt(0).toUpperCase() : "T"}
    </div>
  );
}

interface TransactionItem {
  id: string;
  amount: string;
  currency: string;
  direction: "DEBIT" | "CREDIT";
  merchantName?: string | null;
  description?: string | null;
  occurredAt: string;
  status: "verified" | "needs_review" | "pending";
  accountId?: string | null;
  categoryId?: string | null;
}

export function Transactions() {
  const params = useSearchParams();
  const router = useRouter();
  const direction = params.get("direction") as "DEBIT" | "CREDIT" | null;
  const status = params.get("status") as "verified" | "needs_review" | "pending" | null;
  const accountId = params.get("accountId") || undefined;
  const categoryId = params.get("categoryId") || undefined;
  const startDate = params.get("startDate") || undefined;
  const endDate = params.get("endDate") || undefined;

  const [searchQuery, setSearchQuery] = useState("");
  const [dateRangePreset, setDateRangePreset] = useState("30");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [splitNotice, setSplitNotice] = useState(false);

  // Add Transaction Modal State
  const [newDirection, setNewDirection] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newDescription, setNewDescription] = useState("");
  const [newAccountId, setNewAccountId] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["transactions", params.toString()],
    queryFn: async () => {
      try {
        const res = unwrap(
          await sdk.GET("/api/v1/transactions", {
            params: {
              query: {
                limit: 50,
                cursor: params.get("cursor") || undefined,
                direction: direction || undefined,
                status: status || undefined,
                accountId,
                categoryId,
                startDate,
                endDate,
              },
            },
          })
        );
        if (process.env.NODE_ENV !== "test" && (!res.data || res.data.length === 0) && demoStore.isDemoMode()) {
          return demoStore.getTransactions({
            limit: 50,
            cursor: params.get("cursor") || undefined,
            direction: direction as "DEBIT" | "CREDIT" | undefined,
            status: status || undefined,
            accountId,
            categoryId,
            startDate,
            endDate,
          });
        }
        return res;
      } catch (err) {
        if (demoStore.isDemoMode()) {
          return demoStore.getTransactions({
            limit: 50,
            cursor: params.get("cursor") || undefined,
            direction: direction as "DEBIT" | "CREDIT" | undefined,
            status: status || undefined,
            accountId,
            categoryId,
            startDate,
            endDate,
          });
        }
        throw err;
      }
    },
  });

  const accounts = useAccounts();
  const categories = useCategories();
  const refresh = useRefreshFinancialViews();

  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.delete("cursor");
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/dashboard/transactions?${next}`);
  }

  function clearAllFilters() {
    setSearchQuery("");
    setDateRangePreset("30");
    router.push("/dashboard/transactions");
  }

  function handleTypeFilter(type: "all" | "DEBIT" | "CREDIT") {
    if (type === "all") {
      filter("direction", "");
    } else {
      filter("direction", type);
    }
  }

  function handleDateRangeChange(preset: string) {
    setDateRangePreset(preset);
    const now = new Date();
    if (preset === "30") {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const next = new URLSearchParams(params);
      next.set("startDate", past.toISOString().slice(0, 10));
      next.delete("endDate");
      router.push(`/dashboard/transactions?${next}`);
    } else if (preset === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const next = new URLSearchParams(params);
      next.set("startDate", firstDay.toISOString().slice(0, 10));
      next.delete("endDate");
      router.push(`/dashboard/transactions?${next}`);
    } else if (preset === "all") {
      const next = new URLSearchParams(params);
      next.delete("startDate");
      next.delete("endDate");
      router.push(`/dashboard/transactions?${next}`);
    }
  }

  // Filter transactions locally by search query if text entered
  const filteredList = useMemo(() => {
    const raw = (query.data?.data || []) as TransactionItem[];
    if (!searchQuery.trim()) return raw;
    const q = searchQuery.toLowerCase();
    return raw.filter((item) => {
      const desc = (item.merchantName || item.description || "").toLowerCase();
      const cat = categories.data?.find((c) => c.id === item.categoryId)?.name.toLowerCase() || "";
      const amt = item.amount.toLowerCase();
      return desc.includes(q) || cat.includes(q) || amt.includes(q);
    });
  }, [query.data?.data, searchQuery, categories.data]);

  async function handleAddTransactionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newAmount || isNaN(Number(newAmount)) || Number(newAmount) <= 0) {
      setFormError("Please enter a valid amount");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      unwrap(
        await sdk.POST("/api/v1/transactions", {
          body: {
            amount: Number(newAmount).toFixed(2),
            direction: newDirection,
            currency: "INR",
            occurredAt: new Date(newDate).toISOString(),
            merchantName: newDescription || "Manual transaction",
            description: newNotes || newDescription || "Manual transaction",
            accountId: newAccountId || undefined,
            categoryId: newCategoryId || undefined,
          },
        })
      );
      await refresh();
      await query.refetch();
      setIsAddModalOpen(false);
      // Reset form
      setNewAmount("");
      setNewDescription("");
      setNewNotes("");
    } catch (err: unknown) {
      if (demoStore.isDemoMode()) {
        demoStore.addTransaction({
          amount: Number(newAmount).toFixed(2),
          direction: newDirection,
          currency: "INR",
          occurredAt: new Date(newDate).toISOString(),
          merchantName: newDescription || "Manual transaction",
          description: newNotes || newDescription || "Manual transaction",
          accountId: newAccountId || undefined,
          categoryId: newCategoryId || undefined,
        });
        await refresh();
        await query.refetch();
        setIsAddModalOpen(false);
        setNewAmount("");
        setNewDescription("");
        setNewNotes("");
        return;
      }
      setFormError(err instanceof Error ? err.message : "Failed to create transaction");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteTransaction(id: string) {
    setIsDeleting(true);
    try {
      unwrap(
        await sdk.DELETE("/api/v1/transactions/{id}", {
          params: { path: { id } },
        })
      );
      await refresh();
      await query.refetch();
      setSelectedTx(null);
      setDeleteConfirm(false);
    } catch (err) {
      if (demoStore.isDemoMode()) {
        demoStore.deleteTransaction(id);
        await refresh();
        await query.refetch();
        setSelectedTx(null);
        setDeleteConfirm(false);
        return;
      }
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16">
      <TransactionsSubNav />

      {/* 01 Header (Board 06 #01) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#1F2A44] tracking-tight">
            Transactions
          </h1>
          <p className="mt-1 text-sm sm:text-base text-[#475467]">
            Track and understand where your money goes. Recorded activity is separate from the monthly amounts in your plan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5E55C9] px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-[#4D45B3] focus-visible:outline-2 focus-visible:outline-[#5E55C9]"
          >
            <Plus className="size-4" />
            <span>+ Add transaction</span>
          </button>
        </div>
      </div>

      {/* 04 Search & Filter Bar (Board 06 #04) */}
      <section className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-4 sm:p-5 shadow-xs">
        <div className="space-y-4">
          {/* Top Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#475467]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by description, merchant or amount..."
              className={cn(
                control,
                "pl-10 pr-10 text-sm placeholder:text-[#475467] bg-[#FFFDF9]"
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#475467] hover:text-[#1F2A44]"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Date Range Dropdown */}
              <div className="relative">
                <select
                  value={dateRangePreset}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                  className="appearance-none rounded-xl border border-[#E8E1D6] bg-[#FFFDF9] py-2 pl-8 pr-8 text-xs sm:text-sm font-medium text-[#1F2A44] shadow-2xs hover:bg-[#FFF9F0] focus-visible:outline-2 focus-visible:outline-[#5E55C9] cursor-pointer"
                >
                  <option value="30">Last 30 days</option>
                  <option value="this_month">This month</option>
                  <option value="all">All time</option>
                </select>
                <Calendar className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#475467]" />
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-[#475467]" />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={categoryId ?? ""}
                  onChange={(e) => filter("categoryId", e.target.value)}
                  className="appearance-none rounded-xl border border-[#E8E1D6] bg-[#FFFDF9] py-2 pl-3 pr-7 text-xs sm:text-sm font-medium text-[#1F2A44] shadow-2xs hover:bg-[#FFF9F0] focus-visible:outline-2 focus-visible:outline-[#5E55C9] cursor-pointer"
                >
                  <option value="">All categories</option>
                  {categories.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-[#475467]" />
              </div>

              {/* Account Filter */}
              <div className="relative">
                <select
                  value={accountId ?? ""}
                  onChange={(e) => filter("accountId", e.target.value)}
                  className="appearance-none rounded-xl border border-[#E8E1D6] bg-[#FFFDF9] py-2 pl-3 pr-7 text-xs sm:text-sm font-medium text-[#1F2A44] shadow-2xs hover:bg-[#FFF9F0] focus-visible:outline-2 focus-visible:outline-[#5E55C9] cursor-pointer"
                >
                  <option value="">All accounts</option>
                  {accounts.data?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-[#475467]" />
              </div>

              {/* Type Filter Chips (All, Expense, Income) */}
              <div className="flex items-center rounded-xl border border-[#E8E1D6] bg-[#FFFDF9] p-0.5">
                <button
                  type="button"
                  onClick={() => handleTypeFilter("all")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    !direction
                      ? "bg-[#5E55C9] text-white shadow-2xs"
                      : "text-[#475467] hover:text-[#1F2A44]"
                  )}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeFilter("DEBIT")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    direction === "DEBIT"
                      ? "bg-[#5E55C9] text-white shadow-2xs"
                      : "text-[#475467] hover:text-[#1F2A44]"
                  )}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeFilter("CREDIT")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    direction === "CREDIT"
                      ? "bg-[#5E55C9] text-white shadow-2xs"
                      : "text-[#475467] hover:text-[#1F2A44]"
                  )}
                >
                  Income
                </button>
              </div>
            </div>

            {/* Clear All Button */}
            {(searchQuery || direction || categoryId || accountId) && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-[#5E55C9] hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Error / Loading State */}
      <ErrorNotice error={query.error} retry={() => void query.refetch()} />
      {query.isPending && <Loading />}

      {/* 08 Empty State (Board 06 #08) */}
      {!query.isPending && filteredList.length === 0 && (
        <section className="relative overflow-hidden rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto max-w-md space-y-4">
            {/* Cute foliage illustration */}
            <div className="mx-auto flex size-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#ECFDF5] via-[#FFF9F0] to-[#EFF6FF] border border-[#E8E1D6] shadow-2xs">
              <Sparkles className="size-10 text-[#5E55C9]" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1F2A44]">
              No transactions yet
            </h2>
            <p className="text-sm sm:text-base text-[#475467] leading-relaxed">
              No transactions match these filters. Once you add or import transactions, they&apos;ll
              appear here to help you track your progress.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="rounded-xl bg-[#5E55C9] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#4D45B3]"
              >
                Add your first transaction
              </button>
              <Link
                href="/dashboard/import"
                className="rounded-xl border border-[#E8E1D6] bg-white px-5 py-2.5 text-sm font-semibold text-[#1F2A44] shadow-2xs transition-colors hover:bg-[#FFF9F0]"
              >
                Import from bank or PDF
              </Link>
            </div>
            <p className="pt-4 font-serif italic text-xs text-[#7D5200]">
              &ldquo;Every journey starts with a first step.&rdquo;
            </p>
          </div>
        </section>
      )}

      {/* 01 & 04 Transactions Table (Board 06 #01 & #04) */}
      {!query.isPending && filteredList.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E1D6] bg-[#FFF9F0]/60 text-xs font-semibold uppercase tracking-wider text-[#475467]">
                  <th scope="col" className="py-3.5 pl-6 pr-4">
                    Date
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Description
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Category
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Account
                  </th>
                  <th scope="col" className="py-3.5 pl-4 pr-6 text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D6]/60 font-sans text-sm">
                {filteredList.map((t) => {
                  const catName =
                    categories.data?.find((c) => c.id === t.categoryId)?.name ||
                    t.categoryId ||
                    "General";
                  const badge = getCategoryBadge(catName);
                  const accName =
                    accounts.data?.find((a) => a.id === t.accountId)?.name || "HDFC Bank";
                  const isDebit = t.direction === "DEBIT";
                  const amountColor = isDebit ? "text-[#A13F39]" : "text-[#3D5C4A]";
                  const amountSign = isDebit ? "-" : "+";
                  const cleanAmount = t.amount.startsWith("-") ? t.amount.slice(1) : t.amount;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTx(t)}
                      className="cursor-pointer transition-colors hover:bg-[#FFF9F0] focus-within:bg-[#FFF9F0]"
                    >
                      {/* Date */}
                      <td className="py-4 pl-6 pr-4 whitespace-nowrap text-[#475467] font-medium">
                        {new Date(t.occurredAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Description / Merchant */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <MerchantAvatar
                            name={t.merchantName || t.description || "Manual"}
                          />
                          <div>
                            <p className="font-semibold text-[#1F2A44]">
                              {t.merchantName || t.description || "Transaction"}
                            </p>
                            {t.description && t.merchantName && (
                              <p className="text-xs text-[#475467] line-clamp-1">{t.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                            badge.bg
                          )}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Account */}
                      <td className="py-4 px-4 whitespace-nowrap text-[#475467] font-medium">
                        {accName}
                      </td>

                      {/* Colored Amount */}
                      <td
                        className={cn(
                          "py-4 pl-4 pr-6 text-right whitespace-nowrap font-serif text-base font-semibold tabular-nums",
                          amountColor
                        )}
                      >
                        {amountSign}₹{Number(cleanAmount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 03 Add Transaction Modal (Board 06 #03) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-[#475467] hover:bg-[#FFF9F0] hover:text-[#1F2A44]"
            >
              <X className="size-5" />
            </button>

            <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
              {/* Left Form */}
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1F2A44]">
                  Add Transaction
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#475467]">
                  Keep your financial picture complete.
                </p>

                <form onSubmit={handleAddTransactionSubmit} className="mt-6 space-y-4">
                  {/* Income / Expense Switcher */}
                  <div className="inline-flex rounded-xl border border-[#E8E1D6] bg-[#FFF9F0] p-1">
                    <button
                      type="button"
                      onClick={() => setNewDirection("DEBIT")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors",
                        newDirection === "DEBIT"
                          ? "bg-[#5E55C9] text-white shadow-xs"
                          : "text-[#475467] hover:text-[#1F2A44]"
                      )}
                    >
                      <span className="size-2 rounded-full bg-white/80" />
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewDirection("CREDIT")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors",
                        newDirection === "CREDIT"
                          ? "bg-[#3D5C4A] text-white shadow-xs"
                          : "text-[#475467] hover:text-[#1F2A44]"
                      )}
                    >
                      <span className="size-2 rounded-full bg-white/80" />
                      Income
                    </button>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#475467]">
                      Amount
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-serif text-lg font-semibold text-[#1F2A44]">
                        ₹
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        className={cn(control, "pl-8 font-serif text-lg font-semibold text-[#1F2A44]")}
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#475467]">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      required
                      className={cn(control, "mt-1 text-sm")}
                    />
                  </div>

                  {/* Description / Merchant */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#475467]">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="e.g. Coffee at Blue Tokai"
                      className={cn(control, "mt-1 text-sm")}
                    />
                  </div>

                  {/* Category & Account in Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#475467]">
                        Category
                      </label>
                      <select
                        value={newCategoryId}
                        onChange={(e) => setNewCategoryId(e.target.value)}
                        className={cn(control, "mt-1 text-sm")}
                      >
                        <option value="">Select a category</option>
                        {categories.data?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#475467]">
                        Account
                      </label>
                      <select
                        value={newAccountId}
                        onChange={(e) => setNewAccountId(e.target.value)}
                        className={cn(control, "mt-1 text-sm")}
                      >
                        <option value="">Select an account</option>
                        {accounts.data?.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#475467]">
                      Notes (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Add a note..."
                      className={cn(control, "mt-1 text-sm py-2 resize-none")}
                    />
                  </div>

                  {formError && (
                    <p role="alert" className="text-xs font-semibold text-[#A13F39]">
                      {formError}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="rounded-xl border border-[#E8E1D6] bg-white px-4 py-2 text-sm font-semibold text-[#1F2A44] hover:bg-[#FFF9F0]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-xl bg-[#5E55C9] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4D45B3] disabled:opacity-50"
                    >
                      {isSaving ? "Saving…" : "Save transaction"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Illustration Card */}
              <div className="hidden md:flex flex-col items-center justify-center rounded-2xl border border-[#E8E1D6] bg-gradient-to-b from-[#FFF9F0] to-[#F5EFE6] p-6 text-center">
                <div className="relative size-36 mb-4 overflow-hidden rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] shadow-xs">
                  <Image
                    src="/Assets/Characters/woman_writing_journal.png"
                    alt="Planning notes"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="font-serif italic text-sm text-[#7D5200]">
                  &ldquo;Small steps create big freedom.&rdquo;
                </p>
                <p className="mt-2 text-xs text-[#475467]">
                  Every recorded expense builds clarity for your future plans.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 02 Transaction Detail Modal / Drawer (Board 06 #02) */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Back to transactions link */}
            <button
              type="button"
              onClick={() => {
                setSelectedTx(null);
                setDeleteConfirm(false);
              }}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#5E55C9] hover:underline cursor-pointer"
            >
              ← Back to transactions
            </button>

            {/* Header with Merchant Avatar, Name, Category Badge & Amount */}
            <div className="flex items-start justify-between gap-4 border-b border-[#E8E1D6] pb-5">
              <div className="flex items-center gap-3.5">
                <MerchantAvatar name={selectedTx.merchantName || selectedTx.description || "Amazon"} />
                <div>
                  <h3 className="font-sans text-xl font-bold text-[#1F2A44]">
                    {selectedTx.merchantName || selectedTx.description || "Transaction"}
                  </h3>
                  <p className="text-xs text-[#475467]">
                    {new Date(selectedTx.occurredAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="mt-1.5">
                    {(() => {
                      const catName =
                        categories.data?.find((c) => c.id === selectedTx.categoryId)?.name ||
                        "Shopping";
                      const b = getCategoryBadge(catName);
                      return (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
                            b.bg
                          )}
                        >
                          {b.icon}
                          <span>{b.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p
                  className={cn(
                    "font-serif text-2xl font-bold tabular-nums",
                    selectedTx.direction === "DEBIT" ? "text-[#A13F39]" : "text-[#3D5C4A]"
                  )}
                >
                  {selectedTx.direction === "DEBIT" ? "-" : "+"}₹
                  {Number(selectedTx.amount).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-[#475467] font-medium capitalize">
                  {selectedTx.status.replaceAll("_", " ")}
                </p>
              </div>
            </div>

            {/* Detail Rows */}
            <div className="my-5 divide-y divide-[#E8E1D6]/60 text-sm">
              <div className="grid grid-cols-3 py-2.5">
                <span className="text-[#475467] font-medium">Account</span>
                <span className="col-span-2 font-semibold text-[#1F2A44]">
                  {accounts.data?.find((a) => a.id === selectedTx.accountId)?.name ||
                    "HDFC Bank (•••• 4321)"}
                </span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="text-[#475467] font-medium">Category</span>
                <span className="col-span-2 font-semibold text-[#1F2A44]">
                  {categories.data?.find((c) => c.id === selectedTx.categoryId)?.name ||
                    selectedTx.categoryId ||
                    "Shopping"}
                </span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="text-[#475467] font-medium">Merchant</span>
                <span className="col-span-2 font-semibold text-[#1F2A44]">
                  {selectedTx.merchantName || selectedTx.description || "Merchant"}
                </span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="text-[#475467] font-medium">Notes</span>
                <span className="col-span-2 text-[#475467]">
                  {selectedTx.description || "Online order — household items"}
                </span>
              </div>
              <div className="grid grid-cols-3 py-2.5 items-center">
                <span className="text-[#475467] font-medium">Transaction ID</span>
                <div className="col-span-2 flex items-center gap-2 font-mono text-xs text-[#1F2A44]">
                  <span>{selectedTx.id}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedTx.id);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="p-1 rounded text-[#475467] hover:bg-[#FFF9F0]"
                  >
                    {copiedId ? (
                      <Check className="size-3.5 text-[#3D5C4A]" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Split Notice if clicked */}
            {splitNotice && (
              <div className="mb-4 rounded-xl border border-[#5E55C9]/30 bg-[#5E55C9]/10 p-3 text-xs text-[#5E55C9]">
                Split transaction feature: You can divide this transaction across multiple
                categories in your monthly financial review.
              </div>
            )}

            {/* Delete confirmation banner */}
            {deleteConfirm ? (
              <div className="space-y-3 rounded-2xl border border-[#A13F39]/40 bg-[#A13F39]/5 p-4">
                <p className="text-xs font-semibold text-[#A13F39]">
                  Delete this recorded transaction? This action cannot be undone.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDeleteTransaction(selectedTx.id)}
                    className="rounded-lg bg-[#A13F39] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#8A342E]"
                  >
                    {isDeleting ? "Deleting…" : "Confirm delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(false)}
                    className="rounded-lg border border-[#E8E1D6] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1F2A44] hover:bg-[#FFF9F0]"
                  >
                    Keep transaction
                  </button>
                </div>
              </div>
            ) : (
              /* Footer Action Buttons */
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E8E1D6]">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/transactions/${selectedTx.id}`}
                    className="rounded-xl border border-[#E8E1D6] bg-white px-3.5 py-2 text-xs font-semibold text-[#1F2A44] hover:bg-[#FFF9F0]"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSplitNotice(!splitNotice)}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#E8E1D6] bg-white px-3.5 py-2 text-xs font-semibold text-[#1F2A44] hover:bg-[#FFF9F0]"
                  >
                    <Scissors className="size-3.5 text-[#5E55C9]" />
                    <span>Split transaction</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  className="rounded-xl border border-[#A13F39]/30 px-3.5 py-2 text-xs font-semibold text-[#A13F39] hover:bg-[#A13F39]/10"
                >
                  Delete
                </button>
              </div>
            )}

            {/* Script Quote */}
            <p className="mt-5 text-center font-serif italic text-xs text-[#7D5200]">
              &ldquo;Little purchases today, a brighter tomorrow.&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function TransactionEditor({ id }: { id?: string }) {
  const accounts = useAccounts();
  const categories = useCategories();
  const refresh = useRefreshFinancialViews();
  const router = useRouter();
  const [error, setError] = useState<unknown>();
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const query = useQuery({
    queryKey: ["transactions", id],
    enabled: !!id,
    queryFn: async () => {
      try {
        const res = await sdk.GET("/api/v1/transactions/{id}", {
          params: { path: { id: id! } },
        });
        if (res.response.ok) {
          return unwrap(res).data;
        }
      } catch {
        // Fallback to demo store
      }
      if (demoStore.isDemoMode() && id) {
        const match = demoStore.getTransactions().data.find((t) => t.id === id);
        if (match) return match;
      }
      throw new Error("Transaction not found");
    },
  });

  async function submit(form: FormData) {
    setPending(true);
    setError(null);
    const get = (key: string) => String(form.get(key) ?? "");
    try {
      const common = {
        merchantName: get("merchantName"),
        description: get("description"),
        accountId: get("accountId") || undefined,
        categoryId: get("categoryId") || undefined,
      };
      if (id) {
        unwrap(
          await sdk.PATCH("/api/v1/transactions/{id}", {
            params: { path: { id } },
            body: {
              ...common,
              accountId: get("accountId") || null,
              categoryId: get("categoryId") || null,
              status: get("status") as "verified" | "needs_review" | "pending",
            },
          })
        );
      } else {
        unwrap(
          await sdk.POST("/api/v1/transactions", {
            body: {
              ...common,
              amount: get("amount"),
              direction: get("direction") as "DEBIT" | "CREDIT",
              currency: "INR",
              occurredAt: new Date(get("occurredAt")).toISOString(),
            },
          })
        );
      }
      await refresh();
      router.push("/dashboard/transactions");
    } catch (e) {
      if (demoStore.isDemoMode()) {
        if (id) {
          demoStore.updateTransaction(id, {
            merchantName: get("merchantName"),
            description: get("description"),
            accountId: get("accountId") || undefined,
            categoryId: get("categoryId") || undefined,
            status: get("status") as "verified" | "needs_review" | "pending",
          });
        } else {
          demoStore.addTransaction({
            amount: get("amount"),
            direction: get("direction") as "DEBIT" | "CREDIT",
            currency: "INR",
            occurredAt: new Date(get("occurredAt")).toISOString(),
            merchantName: get("merchantName"),
            description: get("description"),
            accountId: get("accountId") || undefined,
            categoryId: get("categoryId") || undefined,
          });
        }
        await refresh();
        router.push("/dashboard/transactions");
        return;
      }
      setError(e);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!id) return;
    setPending(true);
    setError(null);
    try {
      unwrap(
        await sdk.DELETE("/api/v1/transactions/{id}", {
          params: { path: { id } },
        })
      );
      await refresh();
      router.push("/dashboard/transactions");
    } catch (e) {
      if (demoStore.isDemoMode()) {
        demoStore.deleteTransaction(id);
        await refresh();
        router.push("/dashboard/transactions");
        return;
      }
      setError(e);
      setPending(false);
    }
  }

  if (id && query.isPending) return <Loading />;

  return (
    <>
      <PageTitle
        title={id ? "Review transaction" : "Add transaction"}
        description={
          id
            ? "Review the merchant, account, category, description and status."
            : "Record an observation without changing your monthly plan."
        }
      />
      <div className="max-w-2xl space-y-6">
        <Panel title={id ? "Transaction details" : "Manual entry"}>
          <ErrorNotice error={query.error} retry={() => void query.refetch()} />
          {(!id || query.data) && (
            <form action={submit} className="space-y-4">
              {id ? (
                <div className="rounded-xl border border-[#E8E1D6] bg-[#FFF9F0]/60 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#475467]">
                    Recorded observation
                  </p>
                  <p className="font-serif text-xl font-semibold tabular-nums text-[#1F2A44]">
                    {money(query.data?.amount, query.data?.currency)} · {date(query.data?.occurredAt)} ·{" "}
                    {query.data?.direction === "DEBIT" ? "Money out" : "Money in"}
                  </p>
                  <p className="mt-1 text-xs text-[#475467]">
                    Amount and timestamp are preserved from the original record to protect audit integrity.
                  </p>
                </div>
              ) : (
                <>
                  <Field
                    label="Amount (INR)"
                    name="amount"
                    required
                    inputMode="decimal"
                    pattern="[0-9]+(\.[0-9]{1,2})?"
                    hint="Numeric amount with up to two decimal places"
                  />
                  <div className="space-y-1.5">
                    <label htmlFor="tx-direction" className="block text-sm font-semibold text-[#1F2A44]">
                      Direction
                    </label>
                    <select id="tx-direction" name="direction" className={control}>
                      <option value="DEBIT">Money out</option>
                      <option value="CREDIT">Money in</option>
                    </select>
                  </div>
                  <Field
                    label="Date and time"
                    name="occurredAt"
                    type="datetime-local"
                    required
                    hint="The date and time when this activity occurred"
                  />
                </>
              )}

              <Field
                label="Merchant"
                name="merchantName"
                maxLength={255}
                defaultValue={query.data?.merchantName ?? ""}
                placeholder="e.g. Grocery store, Utility bill, Rent"
              />

              <Field
                label="Description"
                name="description"
                maxLength={500}
                defaultValue={query.data?.description ?? ""}
                placeholder="Optional context note"
              />

              <div className="space-y-1.5">
                <label htmlFor="tx-account" className="block text-sm font-semibold text-[#1F2A44]">
                  Account
                </label>
                <select
                  id="tx-account"
                  name="accountId"
                  className={control}
                  defaultValue={query.data?.accountId ?? ""}
                >
                  <option value="">Unassigned</option>
                  {accounts.data?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tx-category" className="block text-sm font-semibold text-[#1F2A44]">
                  Category
                </label>
                <select
                  id="tx-category"
                  name="categoryId"
                  className={control}
                  defaultValue={query.data?.categoryId ?? ""}
                >
                  <option value="">Uncategorized</option>
                  {categories.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {id && (
                <div className="space-y-1.5">
                  <label htmlFor="tx-review-status" className="block text-sm font-semibold text-[#1F2A44]">
                    Review status
                  </label>
                  <select
                    id="tx-review-status"
                    name="status"
                    className={control}
                    defaultValue={query.data?.status}
                  >
                    <option value="verified">Verified</option>
                    <option value="needs_review">Needs review</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              )}

              <ErrorNotice error={error} />

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" className={action} disabled={pending}>
                  {pending ? "Saving…" : "Save transaction"}
                </button>
                <Link className={secondary} href="/dashboard/transactions">
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </Panel>

        {id && (
          <Panel title="Delete transaction">
            <p className="mb-4 text-sm text-[#475467]">
              Remove this transaction from your recorded ledger. This action cannot be undone.
            </p>
            {confirmDelete ? (
              <div className="space-y-3 rounded-xl border border-[#A13F39]/40 bg-[#A13F39]/5 p-4">
                <p className="text-sm font-semibold text-[#A13F39]">
                  Delete this recorded transaction? This cannot be undone.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    id="confirm-transaction-delete"
                    className={cn(
                      secondary,
                      "border-[#A13F39]/40 text-xs font-semibold text-[#A13F39] hover:bg-[#A13F39]/10"
                    )}
                    disabled={pending}
                    onClick={() => void remove()}
                  >
                    {pending ? "Deleting…" : "Confirm delete"}
                  </button>
                  <button
                    type="button"
                    className={`${secondary} text-xs font-semibold`}
                    disabled={pending}
                    onClick={() => {
                      setConfirmDelete(false);
                      requestAnimationFrame(() =>
                        document.getElementById("delete-transaction")?.focus()
                      );
                    }}
                  >
                    Keep transaction
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                id="delete-transaction"
                className={cn(
                  secondary,
                  "border-[#A13F39]/30 text-xs font-semibold text-[#A13F39] hover:bg-[#A13F39]/10"
                )}
                onClick={() => {
                  setConfirmDelete(true);
                  requestAnimationFrame(() =>
                    document.getElementById("confirm-transaction-delete")?.focus()
                  );
                }}
              >
                Delete transaction
              </button>
            )}
          </Panel>
        )}
      </div>
    </>
  );
}
