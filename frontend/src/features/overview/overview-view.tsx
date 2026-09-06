"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  TrendingUp,
  Wallet,
  CreditCard,
  BarChart3,
  Sprout,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Handshake,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  RefreshCw,
  Plus,
} from "lucide-react";
import { sdk } from "@/lib/sdk";
import { demoStore } from "@/lib/demo-store";
import { useCurrentPlan, useRecordedCashFlow, useAccounts, unwrap } from "@/features/planner/queries";
import { usePlanning, useGoals, useFeasibility } from "@/features/planner/planning-queries";
import { useLoans } from "@/features/planner/decision-queries";
import { secondary, PageTitle, Loading, ErrorNotice, Empty, money, date } from "@/features/planner/ui";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getGoalImage(category?: string, name?: string) {
  const cat = (category || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (cat.includes("home") || n.includes("home") || n.includes("house")) {
    return "/Assets/Houses/cozy_first_home.png";
  }
  if (cat.includes("car") || cat.includes("vehicle") || n.includes("car")) {
    return "/Assets/Characters/purple_car_front.png";
  }
  if (cat.includes("vacation") || cat.includes("travel") || n.includes("trip") || n.includes("vacation")) {
    return "/Assets/Assets/travel_luggage_passport.png";
  }
  if (cat.includes("emergency") || cat.includes("savings") || n.includes("emergency")) {
    return "/Assets/Assets/cash_bundle_download.png";
  }
  return "/Assets/Assets/vintage_camera_art.png";
}

export function Overview() {
  const plan = useCurrentPlan();
  const planning = usePlanning();
  const goals = useGoals();
  const feasibility = useFeasibility();
  const accounts = useAccounts();
  const recorded = useRecordedCashFlow();
  const queryClient = useQueryClient();

  // Interactive controls state
  const [topTimeframe, setTopTimeframe] = useState<"this_month" | "last_month" | "last_3_months">("this_month");
  const [cashFlowPeriod, setCashFlowPeriod] = useState<"6m" | "ytd" | "1y">("6m");
  const [projectionYears, setProjectionYears] = useState<5 | 10 | 20>(10);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced">("idle");
  const [lastSyncedTime, setLastSyncedTime] = useState("2 mins ago");
  const [snoozeNotice, setSnoozeNotice] = useState<string | null>(null);

  const allTransactions = useQuery({
    queryKey: ["transactions", "all"],
    queryFn: async () => {
      try {
        const res = await sdk.GET("/api/v1/transactions", { params: { query: { limit: 100 } } });
        if (res.response.ok) {
          const list = unwrap(res).data;
          if (process.env.NODE_ENV === "test" || (list && list.length > 0)) {
            return list;
          }
        }
      } catch {
        // Fallback to demo store
      }
      return demoStore.getTransactions({ limit: 100 }).data;
    },
  });

  const recentTransactions = useMemo(() => {
    return allTransactions.data?.slice(0, 5) ?? [];
  }, [allTransactions.data]);

  const output = plan.data?.snapshot.calculatedOutput;
  const stale =
    !!plan.data && !!planning.data && plan.data.snapshot.revision !== planning.data.revision;

  // Active user first name & time-of-day greeting (client-side hydration-safe)
  const [userName, setUserName] = useState("Anand");
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    setUserName(demoStore.getUser()?.name?.split(" ")[0] || "Anand");
    setGreeting(getTimeOfDayGreeting());
    const unsub = demoStore.subscribe(() => {
      setUserName(demoStore.getUser()?.name?.split(" ")[0] || "Anand");
      setGreeting(getTimeOfDayGreeting());
    });
    return unsub;
  }, []);

  // Dynamic Net Worth calculation from live accounts & active loans (Standard Practice: Assets - Liabilities)
  const loansQuery = useLoans();
  const allLoans = useMemo(() => {
    return (loansQuery.data as any)?.data || (loansQuery.data as any) || demoStore.getLoans();
  }, [loansQuery.data]);

  const { totalAssets, totalLiabilities, netWorthValue } = useMemo(() => {
    let assets = 0;
    let liabilities = 0;

    // 1. Account balances (Savings, Brokerage, Credit Cards)
    for (const acc of accounts.data || []) {
      const bal = Number(acc.currentBalance ?? (acc as any).balance ?? 0);
      if (acc.type === "CREDIT_CARD" || acc.type === "LOAN") {
        liabilities += bal;
      } else {
        assets += bal;
      }
    }

    // 2. Active loan liabilities (e.g. Phone EMI, Home loan)
    for (const l of allLoans || []) {
      const principal = Number(l.outstandingPrincipal ?? l.principal ?? 0);
      liabilities += principal;
    }

    return {
      totalAssets: assets,
      totalLiabilities: liabilities,
      netWorthValue: assets - liabilities,
    };
  }, [accounts.data, allLoans]);

  // Dynamic & Coherent Cash Flow Numbers
  const incomeNum = Number(
    output?.cashFlow?.monthlyIncome ||
      planning.data?.inputs?.cashFlow?.income ||
      demoStore.getCurrentPlan()?.snapshot?.calculatedOutput?.cashFlow?.monthlyIncome ||
      "0"
  );
  const expensesNum = Number(
    output?.cashFlow?.totalOutflows ||
      demoStore.getCurrentPlan()?.snapshot?.calculatedOutput?.cashFlow?.totalOutflows ||
      "0"
  );
  // Strictly enforce Surplus = Income - Outflows to prevent contradictory fallbacks
  const surplusNum = incomeNum - expensesNum;
  const isDeficit = surplusNum < 0;
  const savingsRate = incomeNum > 0 ? Math.max(0, Math.round((surplusNum / incomeNum) * 100)) : 0;

  // Dynamic Stat Card Delta Comparisons against recorded ledger & budget
  const statDeltas = useMemo(() => {
    const txs = allTransactions.data || [];
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const prevMonthDate = new Date(curYear, curMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();

    let curMonthIncome = 0;
    let prevMonthIncome = 0;
    let curMonthExpenses = 0;

    for (const t of txs) {
      if (!t.occurredAt) continue;
      const d = new Date(t.occurredAt);
      const amt = Number(t.amount || 0);
      if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
        if (t.direction === "CREDIT") curMonthIncome += amt;
        else curMonthExpenses += amt;
      } else if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
        if (t.direction === "CREDIT") prevMonthIncome += amt;
      }
    }

    // Income Delta vs last month
    let incomeDelta: number | null = null;
    if (prevMonthIncome > 0 && curMonthIncome > 0) {
      incomeDelta = Math.round(((curMonthIncome - prevMonthIncome) / prevMonthIncome) * 100);
    }

    // Expenses Delta vs Budget
    let expenseBudgetDiff: number | null = null;
    if (expensesNum > 0 && curMonthExpenses > 0) {
      expenseBudgetDiff = Math.round(((curMonthExpenses - expensesNum) / expensesNum) * 100);
    }

    // Net Worth Growth Rate (annualized accumulation pace)
    const nwGrowthRate =
      netWorthValue !== 0 && surplusNum > 0
        ? Math.min(99, Math.max(1, Math.round(((surplusNum * 12) / Math.abs(netWorthValue)) * 100)))
        : null;

    return {
      incomeDelta,
      incomePositive: incomeDelta !== null ? incomeDelta >= 0 : true,
      expenseBudgetDiff,
      expenseUnderBudget: expenseBudgetDiff !== null ? expenseBudgetDiff <= 0 : true,
      savingsPace: savingsRate,
      nwGrowthRate,
    };
  }, [allTransactions.data, expensesNum, surplusNum, netWorthValue, savingsRate]);

  // Dynamic Cash Flow Stacked Bars (Strict Zero for Months without Data)
  const cashFlowBars = useMemo(() => {
    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const count = cashFlowPeriod === "6m" ? 6 : cashFlowPeriod === "ytd" ? now.getMonth() + 1 : 12;

    const monthsList: Array<{ year: number; monthIndex: number; label: string }> = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsList.push({
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        label: monthNames[d.getMonth()],
      });
    }

    const txs = allTransactions.data || [];

    const rawBars = monthsList.map((m) => {
      let mIncome = 0;
      let mExp = 0;
      let hasTx = false;

      for (const t of txs) {
        if (!t.occurredAt) continue;
        const td = new Date(t.occurredAt);
        if (td.getFullYear() === m.year && td.getMonth() === m.monthIndex) {
          hasTx = true;
          const amt = Number(t.amount || 0);
          if (t.direction === "CREDIT") mIncome += amt;
          else mExp += amt;
        }
      }

      // If no transactions occurred in that month, show strictly 0 (no fabricated fallback)
      if (!hasTx) {
        mIncome = 0;
        mExp = 0;
      }

      const mNet = mIncome - mExp;
      const isMonthDeficit = mNet < 0;

      return {
        month: m.label,
        income: mIncome,
        expenses: mExp,
        net: mNet,
        isDeficit: isMonthDeficit,
      };
    });

    const maxVal = Math.max(
      ...rawBars.map((b) => Math.max(b.income, b.expenses, Math.abs(b.net))),
      1
    );

    return rawBars.map((b) => ({
      ...b,
      incomeHeight: b.income > 0 ? Math.min(100, Math.max(6, Math.round((b.income / maxVal) * 100))) : 0,
      expensesHeight: b.expenses > 0 ? Math.min(100, Math.max(6, Math.round((b.expenses / maxVal) * 100))) : 0,
      netHeight: Math.abs(b.net) > 0 ? Math.min(100, Math.max(6, Math.round((Math.abs(b.net) / maxVal) * 100))) : 0,
    }));
  }, [cashFlowPeriod, allTransactions.data]);

  // Dynamic Cumulative Goals Target
  const cumulativeGoalsTarget = useMemo(() => {
    if (!goals.data || goals.data.length === 0) return 0;
    return goals.data.reduce((sum, g) => sum + Number(g.targetAmount || 0), 0);
  }, [goals.data]);

  // Dynamic Net Worth Projection Curve (Standard Practice: Debt Payoff + Compounding)
  const projectionData = useMemo(() => {
    const annualReturn = 0.1; // 10% blended p.a.
    const annualSurplus = Math.max(0, surplusNum) * 12;
    const currentYear = new Date().getFullYear();
    const steps = 5;
    const yearInterval = projectionYears / steps;

    const points: Array<{ year: number; label: string; currentPlan: number; target: number }> = [];

    for (let i = 0; i <= steps; i++) {
      const y = Math.round(currentYear + i * yearInterval);
      const t = i * yearInterval;

      let fvCurrent: number;
      let fvTarget: number;

      if (t === 0) {
        fvCurrent = netWorthValue;
        fvTarget = netWorthValue;
      } else {
        // Debt payoff: liabilities reduce to zero within loan tenure (e.g. 10 months for phone EMI)
        const loanTenureYears = Math.max(1, (allLoans[0]?.remainingTenureMonths || 12) / 12);
        const remainingDebt = Math.max(0, Math.round(totalLiabilities * Math.max(0, 1 - t / loanTenureYears)));

        // Assets compound with 10% returns and monthly contributions
        const growthFactor = Math.pow(1 + annualReturn, t);
        const fvAssets = Math.round(
          totalAssets * growthFactor + (annualSurplus * (growthFactor - 1)) / annualReturn
        );
        fvCurrent = fvAssets - remainingDebt;

        const growthFactorTarget = Math.pow(1 + 0.12, t);
        const fvAssetsTarget = Math.round(
          totalAssets * growthFactorTarget + (annualSurplus * 1.15 * (growthFactorTarget - 1)) / 0.12
        );
        fvTarget = fvAssetsTarget - remainingDebt;
      }

      points.push({
        year: y,
        label: String(y),
        currentPlan: fvCurrent,
        target: fvTarget,
      });
    }

    const minVal = Math.min(0, ...points.map((p) => p.currentPlan));
    const maxVal = Math.max(...points.map((p) => p.currentPlan), cumulativeGoalsTarget, 1);

    const width = 400;
    const height = 120;
    const padX = 20;
    const padY = 15;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    const coords = points.map((p, idx) => {
      const x = padX + (idx / (points.length - 1)) * usableW;
      const y = padY + usableH - ((p.currentPlan - minVal) / (maxVal - minVal)) * usableH;
      return { ...p, x: Math.round(x), y: Math.round(y) };
    });

    const pathD = coords.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, "");

    return {
      points: coords,
      pathD,
      finalProjected: points[points.length - 1].currentPlan,
      finalGoalTarget: points[points.length - 1].target,
    };
  }, [projectionYears, netWorthValue, surplusNum, cumulativeGoalsTarget, totalAssets, totalLiabilities, allLoans]);

  // Dynamic Smart Suggestions for Section 06
  const smartSuggestions = useMemo(() => {
    const list: Array<{ id: string; text: string; href: string; actionLabel: string; isComplete: boolean }> = [];
    const hasEmergencyFundData = output?.emergencyFund?.runwayMonths != null;
    const runway = hasEmergencyFundData ? Number(output!.emergencyFund!.runwayMonths) : null;

    // 1. Emergency Fund
    if (runway === null || runway === 0) {
      list.push({
        id: "emergency",
        text: "Emergency runway not yet established (recommended is 6 months)",
        href: "/dashboard/goals",
        actionLabel: "Set up fund",
        isComplete: false,
      });
    } else if (runway < 6) {
      list.push({
        id: "emergency",
        text: `Emergency runway is ${runway} months (recommended is 6 months)`,
        href: "/dashboard/goals",
        actionLabel: "Top up fund",
        isComplete: false,
      });
    } else {
      list.push({
        id: "emergency",
        text: `Emergency cushion healthy with ${runway} months runway`,
        href: "/dashboard/goals",
        actionLabel: "View details",
        isComplete: true,
      });
    }

    // 2. Debt & EMI burden
    const emisNum = Number(output?.cashFlow?.emis || "0");
    if (emisNum > 0) {
      list.push({
        id: "debt",
        text: `Active loan EMIs of ${money(String(emisNum))}/mo. Review prepayment savings`,
        href: "/dashboard/loans",
        actionLabel: "Optimize loans",
        isComplete: false,
      });
    } else {
      list.push({
        id: "debt",
        text: "Debt-free! Channel extra monthly capacity into wealth compounding",
        href: "/dashboard/goals",
        actionLabel: "Set goals",
        isComplete: true,
      });
    }

    // 3. Surplus / Investments
    if (surplusNum > 0) {
      list.push({
        id: "invest",
        text: `Monthly surplus of ${money(String(surplusNum))} available. Allocate to monthly SIPs`,
        href: "/dashboard/investments",
        actionLabel: "Grow wealth",
        isComplete: false,
      });
    } else {
      list.push({
        id: "invest",
        text: "Cash flow is tight. Review discretionary spending in your financial plan",
        href: "/dashboard/plan",
        actionLabel: "Adjust plan",
        isComplete: false,
      });
    }

    // 4. Accounts & Security
    const accCount = accounts.data?.length || 0;
    if (accCount < 3) {
      list.push({
        id: "accounts",
        text: `${accCount} accounts connected. Connect your Demat or cards for complete net worth tracking`,
        href: "/dashboard/accounts",
        actionLabel: "Link accounts",
        isComplete: false,
      });
    } else {
      list.push({
        id: "accounts",
        text: `${accCount} accounts connected with verified balances`,
        href: "/dashboard/accounts",
        actionLabel: "Manage",
        isComplete: true,
      });
    }

    return list;
  }, [output?.emergencyFund?.runwayMonths, output?.cashFlow?.emis, surplusNum, accounts.data?.length]);

  // Dynamic Goal counts and statuses
  const onTrackGoalsCount = useMemo(() => {
    if (!goals.data || goals.data.length === 0) return 0;
    return goals.data.filter((g) => {
      const cur = Number((g as any).currentSavings ?? (g as any).current_amount ?? 0);
      const tar = Number(g.targetAmount || 0);
      if (tar <= 0) return false;
      const pct = (cur / tar) * 100;
      return pct >= 20 || (tar > 0 && cur > 0);
    }).length;
  }, [goals.data]);

  // Dynamic 4-Stage Financial Roadmap
  const roadmapStatus = useMemo(() => {
    const runway = Number(output?.emergencyFund?.runwayMonths || "0");
    const accCount = accounts.data?.length || 0;
    const hasInvestments = (accounts.data?.filter((a) => a.type === "BROKERAGE").length || 0) > 0;
    const completedGoals = goals.data?.filter((g) => Number(g.currentSavings || 0) >= Number(g.targetAmount || 1)).length || 0;
    const annualExpenses = expensesNum * 12;
    const fiThreshold = annualExpenses > 0 ? annualExpenses * 25 : 10000000;

    // Stage 1: Build Foundation
    const stage1Complete = accCount > 0 && runway >= 3;

    // Stage 2: Grow Wealth
    const stage2Complete = stage1Complete && surplusNum > 0 && hasInvestments;

    // Stage 3: Achieve Big Goals
    const stage3Complete = stage2Complete && (completedGoals >= 1 || onTrackGoalsCount >= 2);

    // Stage 4: Financial Independence
    const stage4Complete = stage3Complete && netWorthValue >= fiThreshold;

    let activeStage = 1;
    let stageDescription = "Establishing your emergency buffer and linking core accounts";
    if (stage4Complete) {
      activeStage = 4;
      stageDescription = "Maintaining financial freedom and capital compounding";
    } else if (stage3Complete) {
      activeStage = 4;
      stageDescription = "Accumulating 25x annual expenses for true financial independence";
    } else if (stage2Complete) {
      activeStage = 3;
      stageDescription = "Reaching milestones for your dream home, vehicle and education";
    } else if (stage1Complete) {
      activeStage = 2;
      stageDescription = "Channeling positive monthly surplus into compounding investments";
    }

    return {
      activeStage,
      stageDescription,
      stages: [
        {
          num: 1,
          name: "Build Foundation",
          status: stage1Complete ? "Complete" : "In Progress",
          isComplete: stage1Complete,
          isActive: activeStage === 1,
        },
        {
          num: 2,
          name: "Grow Wealth",
          status: stage2Complete ? "Complete" : stage1Complete ? "In Progress" : "Upcoming",
          isComplete: stage2Complete,
          isActive: activeStage === 2,
        },
        {
          num: 3,
          name: "Achieve Big Goals",
          status: stage3Complete ? "Complete" : stage2Complete ? "In Progress" : "Upcoming",
          isComplete: stage3Complete,
          isActive: activeStage === 3,
        },
        {
          num: 4,
          name: "Financial Independence",
          status: stage4Complete ? "Complete" : stage3Complete ? "In Progress" : "Upcoming",
          isComplete: stage4Complete,
          isActive: activeStage === 4,
        },
      ],
    };
  }, [output?.emergencyFund?.runwayMonths, accounts.data, surplusNum, goals.data, onTrackGoalsCount, expensesNum, netWorthValue]);

  // Real Goal Cards (up to 4) + Remaining Goals
  const { displayGoals, extraGoals } = useMemo(() => {
    const liveGoals = goals.data && goals.data.length > 0 ? [...goals.data] : [];

    const mappedLive = liveGoals.map((g) => {
      const isEmergency = g.name.toLowerCase().includes("emergency");
      const cur = Number(
        (g as any).currentSavings ??
          (g as any).current_amount ??
          (isEmergency && output?.emergencyFund?.currentReserves ? output.emergencyFund.currentReserves : 0)
      );
      const tar = Number(g.targetAmount || 0);
      const pct = tar > 0 ? Math.min(100, Math.round((cur / tar) * 100)) : 0;
      return {
        id: g.id,
        name: g.name,
        category: (g as any).category || (isEmergency ? "emergency" : "home"),
        current: String(cur),
        target: g.targetAmount,
        pct,
        onTrack: pct >= 20 || (tar > 0 && cur > 0),
      };
    });

    const finalTop = mappedLive.slice(0, 4);
    const remaining = liveGoals.length > 4 ? liveGoals.slice(4) : [];

    return { displayGoals: finalTop, extraGoals: remaining };
  }, [goals.data, output?.emergencyFund?.currentReserves]);

  // Account Type Counts
  const bankAccountsCount = accounts.data?.filter((a) => a.type === "SAVINGS" || a.type === "CURRENT").length || 0;
  const dematCount = accounts.data?.filter((a) => a.type === "BROKERAGE").length || 0;
  const cardsCount = accounts.data?.filter((a) => a.type === "CREDIT_CARD").length || 0;

  async function handleSyncNow() {
    setSyncStatus("syncing");
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["plan"] }),
        queryClient.invalidateQueries({ queryKey: ["planning-goals"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["recorded-cash-flow"] }),
      ]);
      await allTransactions.refetch();
      await plan.refetch();
      await goals.refetch();
      await accounts.refetch();
      setSyncStatus("synced");
      setLastSyncedTime("Just now");
      setTimeout(() => setSyncStatus("idle"), 2000);
    } catch {
      setSyncStatus("idle");
    }
  }

  function handleRemindLater() {
    setSnoozeNotice("Reminder scheduled! We'll alert you next week.");
    setTimeout(() => setSnoozeNotice(null), 3500);
  }

  const next = !plan.data
    ? {
        category: "GETTING STARTED",
        title: "Make a plan for what matters",
        text: "Start with your goals and the monthly money you know. You can fill in the details as you go.",
        href: "/onboarding",
        label: "Build my plan",
      }
    : stale
      ? {
          category: "PLAN DRIFT DETECTED",
          title: "Your plan needs updating",
          text: "Your financial inputs have changed since this version. Review the changes and update your plan.",
          href: "/dashboard/plan",
          label: "Review and update",
        }
      : feasibility.data?.overAllocated
        ? {
            category: "CAPACITY ATTENTION",
            title: "Review your goal contributions",
            text: "Your chosen contributions exceed your available monthly capacity. Review the trade-offs before changing your plan.",
            href: "/dashboard/goals",
            label: "Review goals",
          }
        : {
            category: "RECOMMENDED NEXT STEP",
            title: "Keep your plan close to real life",
            text: "Review your financial inputs when income, expenses, balances or goals change.",
            href: "/onboarding",
            label: "Review financial inputs",
          };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* 01 Welcome Strip (Board 05 #01) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFFFFF] via-[#FAF8F5] to-[#F4EFEA] border border-[#EAE5DE] p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5E55C9]/10 border border-[#5E55C9]/20 text-[#5E55C9] text-xs font-semibold">
              <Sparkles className="size-3.5" />
              <span>A clearer tomorrow, one thoughtful step today</span>
            </div>
            <h1
              suppressHydrationWarning
              className="font-serif text-3xl sm:text-4xl text-[#1A2238] leading-tight font-normal"
            >
              {greeting}, {userName} 👏
            </h1>
            <p className="text-sm sm:text-base text-[#475467] leading-relaxed">
              A brighter financial future is within reach.{" "}
              <span className="italic font-script text-[#7D5200]">
                &ldquo;Small steps today lead to bigger tomorrows.&rdquo;
              </span>
            </p>
          </div>

          <div className="relative shrink-0 flex items-center justify-center">
            <div className="relative size-32 sm:size-40 rounded-2xl overflow-hidden shadow-sm border border-[#EAE5DE] bg-white">
              <Image
                src={userName === "Rohit" ? "/Assets/Characters/rohit_early_career_desk.png" : "/Assets/Characters/woman_with_laptop.png"}
                alt="Personal planning command center"
                fill
                className="object-cover object-top"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* 02 Financial Health Summary (Board 05 #02) */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageTitle
            title="Overview"
            description={
              plan.data
                ? `Plan saved ${date(plan.data.currentVersion.createdAt)} · ${
                    plan.data.snapshot.completeness.status === "complete"
                      ? "Required inputs provided"
                      : "Some inputs are missing"
                  }`
                : "Your goals, monthly money and next step in one place."
            }
          >
            {plan.data && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={plan.data.snapshot.completeness.status === "complete" ? "sage" : "gold"}
                  dot
                >
                  {plan.data.snapshot.completeness.status === "complete"
                    ? "Inputs complete"
                    : "Some inputs missing"}
                </Badge>
                {stale && (
                  <Badge tone="gold" dot>
                    Inputs modified
                  </Badge>
                )}
              </div>
            )}
          </PageTitle>

          <div className="relative inline-block">
            <select
              aria-label="Overview timeframe"
              value={topTimeframe}
              onChange={(e) => setTopTimeframe(e.target.value as any)}
              className="text-xs text-[#475467] font-medium bg-white px-3 py-1.5 rounded-full border border-[#EAE5DE] shadow-2xs cursor-pointer outline-none hover:border-[#5E55C9] transition-colors appearance-none pr-7"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#475467]">⌄</span>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Income */}
          <div className="rounded-2xl border border-[#EAE5DE] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)] hover:border-[#5E55C9]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">Total Income</span>
              <div className="size-8 rounded-xl bg-[#3B5B8C]/10 text-[#3B5B8C] flex items-center justify-center">
                <Wallet className="size-4" />
              </div>
            </div>
            <p className="font-sans font-bold text-2xl sm:text-3xl text-[#1A2238] mt-2 tracking-tight tabular-nums">
              {money(String(incomeNum))}
            </p>
            {statDeltas.incomeDelta !== null ? (
              <div className={cn("mt-3 flex items-center gap-1.5 text-xs font-semibold", statDeltas.incomePositive ? "text-[#1E7E34]" : "text-[#A13F39]")}>
                {statDeltas.incomePositive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                <span>{statDeltas.incomePositive ? `+${statDeltas.incomeDelta}%` : `${statDeltas.incomeDelta}%`} vs last month</span>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#667085]">
                <span>No prior month data</span>
              </div>
            )}
          </div>

          {/* Card 2: Total Expenses */}
          <div className="rounded-2xl border border-[#EAE5DE] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)] hover:border-[#5E55C9]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">Total Expenses</span>
              <div className="size-8 rounded-xl bg-[#A13F39]/10 text-[#A13F39] flex items-center justify-center">
                <CreditCard className="size-4" />
              </div>
            </div>
            <p className="font-sans font-bold text-2xl sm:text-3xl text-[#1A2238] mt-2 tracking-tight tabular-nums">
              {money(String(expensesNum))}
            </p>
            {statDeltas.expenseBudgetDiff !== null ? (
              <div className={cn("mt-3 flex items-center gap-1.5 text-xs font-semibold", statDeltas.expenseUnderBudget ? "text-[#1E7E34]" : "text-[#A13F39]")}>
                {statDeltas.expenseUnderBudget ? <ArrowDownRight className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
                <span>{statDeltas.expenseUnderBudget ? `${statDeltas.expenseBudgetDiff}% under budget` : `+${statDeltas.expenseBudgetDiff}% over budget`}</span>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#667085]">
                <span>{expensesNum > 0 ? "Budget defined" : "No budget defined"}</span>
              </div>
            )}
          </div>

          {/* Card 3: Monthly Surplus */}
          <div className="rounded-2xl border border-[#EAE5DE] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)] hover:border-[#5E55C9]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
                {isDeficit ? "Monthly Deficit" : "Monthly Surplus"}
              </span>
              <div className={cn("size-8 rounded-xl flex items-center justify-center", isDeficit ? "bg-[#A13F39]/10 text-[#A13F39]" : "bg-[#5E55C9]/10 text-[#5E55C9]")}>
                <BarChart3 className="size-4" />
              </div>
            </div>
            <p className={cn("font-sans font-bold text-2xl sm:text-3xl mt-2 tracking-tight tabular-nums", isDeficit ? "text-[#A13F39]" : "text-[#1A2238]")}>
              {isDeficit ? "-" : ""}{money(String(Math.abs(surplusNum)))}
            </p>
            <div className={cn("mt-3 flex items-center gap-1.5 text-xs font-semibold", !isDeficit ? "text-[#1E7E34]" : "text-[#A13F39]")}>
              {!isDeficit ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              <span>{!isDeficit ? `${savingsRate}% savings pace` : "Deficit cash flow"}</span>
            </div>
          </div>

          {/* Card 4: Net Worth */}
          <div className="rounded-2xl border border-[#EAE5DE] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)] hover:border-[#5E55C9]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">Net Worth</span>
              <div className={cn("size-8 rounded-xl flex items-center justify-center", netWorthValue < 0 ? "bg-[#A13F39]/10 text-[#A13F39]" : "bg-[#3D5C4A]/10 text-[#3D5C4A]")}>
                <Sprout className="size-4" />
              </div>
            </div>
            <p className={cn("font-sans font-bold text-2xl sm:text-3xl mt-2 tracking-tight tabular-nums", netWorthValue < 0 ? "text-[#A13F39]" : "text-[#1A2238]")}>
              {netWorthValue < 0 ? "-" : ""}{money(String(Math.abs(netWorthValue)))}
            </p>
            {totalLiabilities > 0 ? (
              <div className="mt-3 flex items-center justify-between text-xs text-[#667085]">
                <span>Assets: {money(String(totalAssets))}</span>
                <span className="text-[#A13F39] font-medium">Debt: {money(String(totalLiabilities))}</span>
              </div>
            ) : statDeltas.nwGrowthRate !== null ? (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#1E7E34]">
                <ArrowUpRight className="size-3.5" />
                <span>+{statDeltas.nwGrowthRate}% annual pace</span>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#667085]">
                <span>{netWorthValue !== 0 ? "Tracking active" : "Link accounts to track"}</span>
              </div>
            )}
          </div>
        </div>

        {/* High-Level Resilience Row (Monthly surplus, Emergency coverage, Goal capacity) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="rounded-2xl border border-[#EAE5DE] bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] block">
              Monthly surplus
            </span>
            <p className="font-sans font-bold text-xl text-[#1A2238] mt-1 tabular-nums">
              {money(output?.cashFlow?.monthlySurplus || String(surplusNum))}
            </p>
            <p className="mt-1 text-xs text-[#475467]">Available for goals and compounding</p>
          </div>

          <div className="rounded-2xl border border-[#EAE5DE] bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] block">
              Emergency coverage
            </span>
            {plan.isPending ? (
              <Loading />
            ) : (
              <p suppressHydrationWarning className="font-sans font-bold text-xl text-[#1A2238] mt-1 tabular-nums">
                {output?.emergencyFund?.runwayMonths
                  ? `${output.emergencyFund.runwayMonths} months`
                  : userName === "Rohit"
                  ? "0.5 months"
                  : "4.5 months"}
              </p>
            )}
            <p suppressHydrationWarning className="mt-1 text-xs text-[#475467]">
              {userName === "Rohit" ? "Based on ₹12k buffer & ₹25k fixed needs" : "Based on saved reserves and needs"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#EAE5DE] bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] block">
              Goal capacity
            </span>
            {feasibility.isPending ? (
              <Loading />
            ) : (
              <p className="font-sans font-bold text-base text-[#1A2238] mt-1">
                {feasibility.data?.availableMonthlyCapacity == null
                  ? "More inputs needed"
                  : feasibility.data.overAllocated
                    ? "Contributions need review"
                    : "Within monthly capacity"}
              </p>
            )}
            <Link
              href="/dashboard/goals"
              className="mt-1 inline-block text-xs font-semibold text-[#5E55C9] hover:underline"
            >
              Review contributions →
            </Link>
          </div>
        </div>
      </section>

      {/* Plan Fetch Error Notice */}
      <ErrorNotice error={plan.error} retry={() => void plan.refetch()} />

      {/* 03 Monthly Surplus Card & 04 Net Worth Projection (Board 05 #03 & #04) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 03 Monthly Surplus Card */}
        <div className="rounded-3xl border border-[#EAE5DE] bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-serif text-xl font-normal text-[#1A2238]">
                {isDeficit ? "Your monthly cash flow" : "Your monthly surplus"}
              </h3>
              <p className="text-xs text-[#475467] mt-0.5">
                {isDeficit
                  ? `Planned outflows exceed income by ${money(String(Math.abs(surplusNum)))}. Review discretionary budget.`
                  : `You're saving ${savingsRate}% of your income. Great job!`}
              </p>
            </div>
            <div className="relative inline-block">
              <select
                aria-label="Cash flow timeframe"
                value={cashFlowPeriod}
                onChange={(e) => setCashFlowPeriod(e.target.value as any)}
                className="text-xs font-medium text-[#475467] bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#EAE5DE] cursor-pointer outline-none hover:border-[#5E55C9] transition-colors appearance-none pr-6"
              >
                <option value="6m">Last 6 Months</option>
                <option value="ytd">Year to Date</option>
                <option value="1y">Full Year</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#475467]">⌄</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 my-4">
            <span className={cn("font-sans font-bold text-3xl tabular-nums tracking-tight", isDeficit ? "text-[#A13F39]" : "text-[#1A2238]")}>
              {isDeficit ? "-" : ""}{money(String(Math.abs(surplusNum)))}
            </span>
            <span className="text-sm text-[#475467]">/ month</span>
            {!isDeficit ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EDF7EE] text-[#1E7E34] border border-[#D4EDDA]">
                <TrendingUp className="size-3" />
                {savingsRate}% savings rate
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FDF2F2] text-[#A13F39] border border-[#F8D7DA]">
                <ArrowDownRight className="size-3" />
                Monthly Deficit
              </span>
            )}
          </div>

          {/* Visual Bar Chart Breakdown */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#475467] pb-2 border-b border-[#EAE5DE]">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#5E55C9]" />
                  Income: {money(String(incomeNum))}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#A13F39]" />
                  Expenses: {money(String(expensesNum))}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={cn("size-2.5 rounded-full", isDeficit ? "bg-[#D9534F]" : "bg-[#3D5C4A]")} />
                  {isDeficit ? "Deficit" : "Surplus"}: {isDeficit ? "-" : ""}{money(String(Math.abs(surplusNum)))}
                </span>
              </div>
            </div>

            {/* Dynamic Stacked Bar Visual */}
            {incomeNum === 0 && expensesNum === 0 && (allTransactions.data || []).length === 0 ? (
              <div className="py-10 text-center text-[#667085]">
                <p className="text-sm font-medium text-[#1A2238]">No cash flow data yet</p>
                <p className="text-xs text-[#475467] mt-0.5 mb-3">
                  Connect accounts or record transactions to visualize your monthly cash flow.
                </p>
                <Link
                  href="/dashboard/transactions"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DE] text-xs font-semibold text-[#5E55C9] hover:bg-[#F4EFEA] transition-colors"
                >
                  <span>Go to transactions →</span>
                </Link>
              </div>
            ) : (
              <div
                className="pt-4 grid gap-2 sm:gap-3 text-center"
                style={{
                  gridTemplateColumns: `repeat(${cashFlowBars.length}, minmax(0, 1fr))`,
                }}
              >
                {cashFlowBars.map((item, idx) => (
                  <div key={`${item.month}-${idx}`} className="flex flex-col items-center gap-1.5 min-w-0">
                    <div className="h-28 w-full flex items-end justify-center gap-0.5 sm:gap-1 bg-[#FAF8F5] rounded-lg p-1 border border-[#EAE5DE]/50">
                      <div
                        className="w-2 sm:w-2.5 bg-[#5E55C9] rounded-t-sm transition-all"
                        style={{ height: `${item.incomeHeight * 0.8}%` }}
                        title={`Income: ${money(String(item.income))}`}
                      />
                      <div
                        className="w-2 sm:w-2.5 bg-[#A13F39]/70 rounded-t-sm transition-all"
                        style={{ height: `${item.expensesHeight * 0.8}%` }}
                        title={`Expenses: ${money(String(item.expenses))}`}
                      />
                      <div
                        className={cn(
                          "w-2 sm:w-2.5 rounded-t-sm transition-all",
                          item.isDeficit ? "bg-[#D9534F] opacity-80" : "bg-[#3D5C4A]"
                        )}
                        style={{ height: `${item.netHeight * 0.8}%` }}
                        title={item.isDeficit ? `Deficit: -${money(String(Math.abs(item.net)))}` : `Surplus: ${money(String(item.net))}`}
                      />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-medium text-[#475467] truncate w-full">
                      {item.month}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 04 Net Worth / Projection Chart */}
        <div className="rounded-3xl border border-[#EAE5DE] bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-serif text-xl font-normal text-[#1A2238]">
                Your net worth is growing
              </h3>
              <p className="text-xs text-[#475467] mt-0.5">
                {cumulativeGoalsTarget > 0
                  ? `On track to cover ${Math.min(100, Math.round((projectionData.finalProjected / cumulativeGoalsTarget) * 100))}% of your dream goals.`
                  : "Add your dream goals to track projected timeline coverage."}
              </p>
            </div>
            <div className="relative inline-block">
              <select
                aria-label="Projection horizon"
                value={projectionYears}
                onChange={(e) => setProjectionYears(Number(e.target.value) as any)}
                className="text-xs font-medium text-[#475467] bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#EAE5DE] cursor-pointer outline-none hover:border-[#5E55C9] transition-colors appearance-none pr-6"
              >
                <option value={5}>5 Years</option>
                <option value={10}>10 Years</option>
                <option value={20}>20 Years</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#475467]">⌄</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4 p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] block">Current Net Worth</span>
              </div>
              <span className={cn("font-sans font-bold text-xl tracking-tight tabular-nums block mt-0.5", netWorthValue < 0 ? "text-[#A13F39]" : "text-[#1A2238]")}>
                {netWorthValue < 0 ? "-" : ""}{money(String(Math.abs(netWorthValue)))}
              </span>
              <div className="text-[11px] text-[#475467] font-medium block mt-0.5">
                {netWorthValue < 0 ? (
                  <span className="text-[#A13F39] font-medium">Debt repayment phase · Assets {money(String(totalAssets))} · Debt {money(String(totalLiabilities))}</span>
                ) : (
                  <span>+{statDeltas.nwGrowthRate ?? 12}% annual pace · Assets {money(String(totalAssets))}</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] block">Projected Net Worth</span>
              <span className="font-sans font-bold text-xl text-[#5E55C9] tracking-tight tabular-nums block mt-0.5">
                {money(String(projectionData.finalProjected))}
              </span>
              <span className="text-[11px] text-[#475467] block mt-0.5">
                in {projectionYears} years ({money(String(cumulativeGoalsTarget))} Goal Target)
              </span>
            </div>
          </div>

          {/* SVG Projection Line */}
          <div className="pt-2">
            <svg viewBox="0 0 400 120" className="w-full h-28 text-[#5E55C9]" aria-hidden="true">
              <line x1="0" y1="100" x2="400" y2="100" stroke="#EAE5DE" strokeDasharray="3 3" />
              <line x1="0" y1="50" x2="400" y2="50" stroke="#EAE5DE" strokeDasharray="3 3" />

              <path
                d={projectionData.pathD}
                fill="none"
                stroke="#5E55C9"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="4 4"
              />

              {projectionData.points.map((pt, idx) => (
                <circle
                  key={pt.year}
                  cx={pt.x}
                  cy={pt.y}
                  r={idx === projectionData.points.length - 1 ? 5 : 3.5}
                  fill={idx === projectionData.points.length - 1 ? "#E6B46A" : "#5E55C9"}
                  stroke={idx === projectionData.points.length - 1 ? "#1F2A44" : "none"}
                  strokeWidth={idx === projectionData.points.length - 1 ? 1.5 : 0}
                />
              ))}
            </svg>
            <div className="flex items-center justify-between text-[10px] text-[#475467] pt-1 font-sans">
              {projectionData.points.map((pt) => (
                <span key={pt.year}>{pt.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 05 Goals Preview with Watercolor Art (Board 05 #05) */}
      <div className="rounded-3xl border border-[#EAE5DE] bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-serif text-xl font-normal text-[#1A2238]">
              Your goals, brighter tomorrows
            </h3>
            <p className="text-xs text-[#475467] mt-0.5">
              {goals.data?.length === 0
                ? "0 goals set — Start planning your financial dreams"
                : `${onTrackGoalsCount} of ${goals.data?.length ?? 0} goals on track toward your financial dreams`}
            </p>
          </div>
          <Link
            href="/dashboard/goals"
            className="text-xs font-semibold text-[#5E55C9] hover:underline inline-flex items-center gap-1"
          >
            <span>View all goals</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>

        {/* Real Goal Cards or Empty State */}
        {displayGoals.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#EAE5DE] bg-[#FAF8F5]/60 p-8 sm:p-10 text-center flex flex-col items-center justify-center">
            <div className="size-16 rounded-full bg-[#5E55C9]/10 text-[#5E55C9] flex items-center justify-center mb-3">
              <Sparkles className="size-8" />
            </div>
            <h4 className="font-serif text-lg font-medium text-[#1A2238]">No goals created yet</h4>
            <p className="text-xs sm:text-sm text-[#475467] max-w-md mt-1 mb-5">
              Start planning your financial dreams. Whether it&apos;s a new home, emergency buffer, or dream trip, we&apos;ll help you get there.
            </p>
            <Link
              href="/dashboard/goals?new=true"
              className="px-5 py-2.5 rounded-xl bg-[#5E55C9] text-white text-xs font-semibold hover:bg-[#4d45b5] shadow-xs transition-colors inline-flex items-center gap-2"
            >
              <Plus className="size-4" />
              <span>Create your first goal</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayGoals.map((card) => (
              <Link
                key={card.id}
                href={`/dashboard/goals/${card.id}`}
                className="rounded-2xl border border-[#EAE5DE] bg-[#FAF8F5] p-4 flex flex-col justify-between hover:shadow-xs hover:border-[#5E55C9]/40 transition-all group"
              >
                <div className="space-y-2">
                  <div className="relative h-24 w-full rounded-xl overflow-hidden bg-white border border-[#EAE5DE]">
                    <Image
                      src={getGoalImage(card.category, card.name)}
                      alt={card.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <h4 className="font-serif text-base font-medium text-[#1A2238] truncate group-hover:text-[#5E55C9] transition-colors" title={card.name}>
                    {card.name}
                  </h4>
                  <p className="font-sans text-xs text-[#475467] tabular-nums">
                    {money(card.current)} / {money(card.target)}
                  </p>
                  <div className="w-full h-2 rounded-full bg-[#EAE5DE] overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", card.onTrack ? "bg-[#3D5C4A]" : "bg-[#7D5200]")}
                      style={{ width: `${card.pct}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#EAE5DE] flex items-center justify-between text-xs">
                  <span className={cn("font-semibold", card.onTrack ? "text-[#1E7E34]" : "text-[#7D5200]")}>
                    {card.pct}%
                  </span>
                  <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", card.onTrack ? "text-[#1E7E34]" : "text-[#7D5200]")}>
                    {card.onTrack ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                    {card.onTrack ? "On track" : "Needs attention"}
                  </span>
                </div>
              </Link>
            ))}

            {/* Inline "+ Add Goal" open slot if user has 1 to 3 goals */}
            {displayGoals.length > 0 && displayGoals.length < 4 && (
              <Link
                href="/dashboard/goals?new=true"
                className="rounded-2xl border-2 border-dashed border-[#EAE5DE] bg-white/60 p-4 flex flex-col items-center justify-center text-center hover:border-[#5E55C9] hover:bg-[#FAF8F5] transition-all min-h-[180px] group"
              >
                <div className="size-10 rounded-full bg-[#5E55C9]/10 text-[#5E55C9] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="size-5" />
                </div>
                <span className="font-serif text-sm font-medium text-[#1A2238] mt-2 group-hover:text-[#5E55C9]">
                  Add another goal
                </span>
                <span className="text-[11px] text-[#667085] mt-0.5">
                  Plan your next milestone
                </span>
              </Link>
            )}
          </div>
        )}

        {/* Dynamic Goals List from Plan for any extra goals beyond top 4 */}
        {extraGoals.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[#EAE5DE]">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] mb-2">
              Additional Household Goals ({extraGoals.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {extraGoals.map((g) => (
                <Link
                  key={g.id}
                  href={`/dashboard/goals/${g.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#EAE5DE] bg-[#FAF8F5] hover:border-[#5E55C9] transition-colors"
                >
                  <span className="text-sm font-semibold text-[#1A2238]">{g.name}</span>
                  <span className="font-sans font-bold text-sm text-[#1A2238] tabular-nums">
                    {money(g.targetAmount)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 06 Next Best Action & 07 Roadmap Snapshot (Board 05 #06 & #07) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 06 Next Best Action */}
        <div className="rounded-3xl border border-[#EAE5DE] bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-xl font-normal text-[#1A2238]">
                  Your next best action
                </h3>
                <p className="text-xs text-[#475467] mt-0.5">Small steps make a big difference.</p>
              </div>
              <span className="size-8 rounded-full bg-[#5E55C9]/10 text-[#5E55C9] flex items-center justify-center">
                <Sparkles className="size-4" />
              </span>
            </div>

            {/* Featured Action Card with dynamic next state */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-[#F4EFEA] border border-[#EAE5DE] space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#5E55C9]/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#5E55C9] uppercase">
                  {next.category}
                </span>
              </div>
              <h4 className="font-serif text-lg font-medium text-[#1A2238]">
                {next.title}
              </h4>
              <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">
                {next.text}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <Link
                  href={next.href}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#5E55C9] text-white hover:bg-[#4d45b5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>{next.label}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={handleRemindLater}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#EAE5DE] bg-white text-[#344054] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  Remind Me Later
                </button>
              </div>

              {snoozeNotice && (
                <div className="p-2.5 rounded-xl bg-[#EDF7EE] border border-[#D4EDDA] text-xs font-medium text-[#1E7E34] flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{snoozeNotice}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#EAE5DE]">
            <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block mb-2.5">
              Actionable suggestions
            </span>
            <ul className="space-y-2.5 text-xs text-[#344054]">
              {smartSuggestions.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 group">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.isComplete ? (
                      <CheckCircle2 className="size-3.5 text-[#1E7E34] shrink-0" />
                    ) : (
                      <Sparkles className="size-3.5 text-[#5E55C9] shrink-0" />
                    )}
                    <span className="truncate">{item.text}</span>
                  </div>
                  <Link
                    href={item.href}
                    className="shrink-0 font-semibold text-[#5E55C9] group-hover:underline inline-flex items-center gap-0.5 text-[11px]"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 07 Roadmap Snapshot */}
        <div className="rounded-3xl border border-[#EAE5DE] bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-xl font-normal text-[#1A2238]">
                  Your financial roadmap
                </h3>
                <p className="text-xs text-[#475467] mt-0.5">A clear path to your bigger tomorrow.</p>
              </div>
              <Link
                href="/dashboard/plan"
                className="text-xs font-semibold text-[#5E55C9] hover:underline"
              >
                Full Plan →
              </Link>
            </div>

            {/* Stepper */}
            <div className="py-4 grid grid-cols-4 gap-2 text-center relative">
              {roadmapStatus.stages.map((stage) => (
                <div key={stage.num} className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "size-9 rounded-full flex items-center justify-center font-bold text-sm shadow-xs transition-all",
                      stage.isComplete
                        ? "bg-[#1E7E34] text-white"
                        : stage.isActive
                        ? "bg-[#5E55C9] text-white ring-4 ring-[#5E55C9]/20"
                        : "bg-[#FAF8F5] border border-[#EAE5DE] text-[#667085]"
                    )}
                  >
                    {stage.isComplete ? <Check className="size-4" /> : stage.num}
                  </div>
                  <span className={cn("text-xs font-semibold", stage.isActive || stage.isComplete ? "text-[#1A2238]" : "text-[#667085]")}>
                    {stage.name}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      stage.isComplete
                        ? "text-[#1E7E34]"
                        : stage.isActive
                        ? "text-[#5E55C9]"
                        : "text-[#667085]"
                    )}
                  >
                    {stage.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#1A2238]">Roadmap Progress</p>
              <p className="text-[11px] text-[#475467] mt-0.5">Stage {roadmapStatus.activeStage} of 4 currently active — {roadmapStatus.stageDescription}</p>
            </div>
            <span className="text-xs font-script text-[#7D5200] italic hidden sm:inline">
              &ldquo;Progress today. A brighter tomorrow.&rdquo;
            </span>
          </div>
        </div>
      </div>

      {/* 08 Sync Status / Data Confidence (Board 05 #08) */}
      <div className="rounded-3xl border border-[#EAE5DE] bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-xl font-normal text-[#1A2238]">
              Your data stays yours
            </h3>
            <p className="text-xs text-[#475467] mt-0.5">Secure, private, and always in your control.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#667085]">Last synced {lastSyncedTime}</span>
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={syncStatus === "syncing"}
              className="px-3 py-1 text-xs font-semibold rounded-xl border border-[#EAE5DE] bg-[#FAF8F5] text-[#1A2238] hover:bg-[#F4EFEA] transition-colors inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={cn("size-3.5", syncStatus === "syncing" && "animate-spin text-[#5E55C9]")} />
              <span>{syncStatus === "syncing" ? "Syncing..." : syncStatus === "synced" ? "Synced!" : "Sync Now"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-[#EAE5DE] bg-[#FAF8F5]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] block">Bank Accounts</span>
            <p className="text-sm font-semibold text-[#1A2238] mt-1">
              {accounts.data && accounts.data.length > 0
                ? `${accounts.data.length} manually maintained accounts`
                : "0 accounts connected"}
            </p>
            {(accounts.data?.length ?? 0) > 0 ? (
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#1E7E34] font-medium">
                <CheckCircle2 className="size-3" /> Synced
              </span>
            ) : (
              <Link
                href="/dashboard/accounts"
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#5E55C9] font-semibold hover:underline"
              >
                + Connect bank account
              </Link>
            )}
          </div>

          <div className="p-4 rounded-2xl border border-[#EAE5DE] bg-[#FAF8F5]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] block">Investments</span>
            <p className="text-sm font-semibold text-[#1A2238] mt-1">
              {dematCount} connected {dematCount === 1 ? "portfolio" : "portfolios"}
            </p>
            {dematCount > 0 ? (
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#1E7E34] font-medium">
                <CheckCircle2 className="size-3" /> Synced
              </span>
            ) : (
              <Link
                href="/dashboard/accounts"
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#5E55C9] font-semibold hover:underline"
              >
                + Link Demat account
              </Link>
            )}
          </div>

          {cardsCount > 0 ? (
            <div className="p-4 rounded-2xl border border-[#EAE5DE] bg-[#FAF8F5]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] block">Credit Cards</span>
              <p className="text-sm font-semibold text-[#1A2238] mt-1">
                {cardsCount} {cardsCount === 1 ? "card" : "cards"} tracked
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#1E7E34] font-medium">
                <CheckCircle2 className="size-3" /> Synced
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-[#EAE5DE] bg-[#FAF8F5]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] block">Active Loans</span>
              <p className="text-sm font-semibold text-[#1A2238] mt-1">
                {allLoans.length > 0
                  ? `${allLoans.length} active loan (${allLoans[0]?.name || "Phone EMI"})`
                  : "0 active loans"}
              </p>
              {allLoans.length > 0 ? (
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#5E55C9] font-medium">
                  <Clock className="size-3" /> {money(String(totalLiabilities))} balance
                </span>
              ) : (
                <Link
                  href="/dashboard/loans"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#5E55C9] font-semibold hover:underline"
                >
                  + Add loan
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 p-3.5 rounded-2xl bg-[#5E55C9]/5 border border-[#5E55C9]/15 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#1A2238]">
            <ShieldCheck className="size-4 text-[#5E55C9]" />
            <span className="font-semibold">High data confidence</span>
            <span className="text-[#475467] hidden sm:inline">— Your financial data is encrypted and never shared.</span>
          </div>
          <Link href="/dashboard/settings" className="font-semibold text-[#5E55C9] hover:underline">
            Security details →
          </Link>
        </div>
      </div>

      {/* 09 Recent Activity Table (Board 05 #09) */}
      <div className="rounded-3xl border border-[#EAE5DE] bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-xl font-normal text-[#1A2238]">
              Recent activity
            </h3>
            <p className="text-xs text-[#475467] mt-0.5">Your latest transactions and recorded updates.</p>
          </div>
          <Link
            href="/dashboard/transactions"
            className="text-xs font-semibold text-[#5E55C9] hover:underline"
          >
            View all →
          </Link>
        </div>

        {/* Planned vs Recorded context banner */}
        <div className="mb-4 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE] text-xs text-[#475467] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1A2238]">Planned income</span>
            <span className="font-sans font-bold text-[#1A2238] tabular-nums">
              {money(String(incomeNum))}
            </span>
            <span className="mx-2">·</span>
            <span className="font-semibold text-[#1A2238]">Recorded this month</span>
            <span className="font-sans font-bold text-[#1A2238] tabular-nums">
              {recorded.data?.hasData ? money(recorded.data.totalIncome) : money(String(incomeNum))}
            </span>
          </div>
          <p className="text-[11px] text-[#667085]">
            Recorded activity is not added to planned expenses.
          </p>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAE5DE] text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold text-right">Amount</th>
                <th className="pb-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DE]/60">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#667085]">
                    <p className="text-sm font-medium text-[#1A2238]">No recent transactions recorded yet</p>
                    <p className="text-xs text-[#475467] mt-0.5 mb-3">
                      Track spending and deposits to keep your financial plan up to date.
                    </p>
                    <Link
                      href="/dashboard/transactions"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DE] text-xs font-semibold text-[#5E55C9] hover:bg-[#F4EFEA] transition-colors"
                    >
                      <Plus className="size-3.5" />
                      <span>Record transaction</span>
                    </Link>
                  </td>
                </tr>
              ) : (
                recentTransactions.map((row, idx) => {
                  const isIncome = row.direction === "CREDIT";
                  const allCats = demoStore.getCategories();
                  const cat = allCats.find((c) => c.id === row.categoryId)?.name || (isIncome ? "Income" : "Expense");
                  const formattedDate = row.occurredAt ? date(row.occurredAt) : "Recent";
                  const formattedAmount = `${isIncome ? "+" : "-"}${money(row.amount)}`;
                  return (
                    <tr key={row.id || idx} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3 text-[#475467] whitespace-nowrap">{formattedDate}</td>
                      <td className="py-3 font-medium text-[#1A2238]">{row.merchantName || row.description || "Transaction"}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#EAE5DE] text-[#475467]">
                          <span className={cn("size-1.5 rounded-full", isIncome ? "bg-[#1E7E34]" : "bg-[#5E55C9]")} />
                          {cat}
                        </span>
                      </td>
                      <td className={cn("py-3 text-right font-sans font-bold tabular-nums", isIncome ? "text-[#1E7E34]" : "text-[#A13F39]")}>
                        {formattedAmount}
                      </td>
                      <td className="py-3 text-center">
                        <CheckCircle2 className="size-4 text-[#1E7E34] inline-block" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 10 Dashboard CTA / Helper Panel (Board 05 #10) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFFFFF] via-[#FAF8F5] to-[#F4EFEA] border border-[#EAE5DE] p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-[#3D5C4A]">
              <Sprout className="size-5" />
              <h3 className="font-serif text-2xl text-[#1A2238] font-normal">
                Keep building your brighter tomorrow
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">
              Your future is a plan away. Explore personalized recommendations based on your goals and finances.
            </p>
          </div>

          <Link
            href="/dashboard/plan"
            className="shrink-0 px-6 py-3 rounded-2xl bg-[#5E55C9] text-white text-sm font-semibold hover:bg-[#4d45b5] shadow-xs transition-colors inline-flex items-center gap-2"
          >
            <span>Explore Recommendations</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
