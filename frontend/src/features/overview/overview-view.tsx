"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { DataStateNotice } from "@/components/finance/data-state-notice";
import { PlanVersionHeader } from "@/components/finance/plan-version-header";
import { useOverviewData } from "./hooks/use-overview-data";
import { OverviewNextAction } from "./components/overview-next-action";
import { MonthlyRealityCard } from "./components/monthly-reality-card";
import { GoalsRoadmapCard } from "./components/goals-roadmap-card";
import { RecordedVsPlannedCard } from "./components/recorded-vs-planned-card";
import { DataFreshnessCard } from "./components/data-freshness-card";
import { RecentTransactionsCard } from "./components/recent-transactions-card";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(displayName?: string | null) {
  const value = displayName?.trim();
  if (!value) return null;
  return value.split(/\s+/)[0] || null;
}

export function Overview() {
  const {
    me,
    currentPlan,
    planning,
    goals,
    feasibility,
    accounts,
    recordedCashFlow,
    recentTransactions,
    stale,
    isLoading,
  } = useOverviewData();

  const plan = currentPlan.data;
  const output = plan?.snapshot.calculatedOutput;
  const name = firstName(me.data?.displayName);
  const criticalError = currentPlan.error ?? planning.error ?? goals.error ?? accounts.error;

  async function retryCoreData() {
    await Promise.allSettled([
      currentPlan.refetch(),
      planning.refetch(),
      goals.refetch(),
      feasibility.refetch(),
      accounts.refetch(),
      recordedCashFlow.refetch(),
      recentTransactions.refetch(),
      me.refetch(),
    ]);
  }

  if (isLoading && !plan && !planning.data) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-4 pb-12" aria-label="Loading financial command center">
        <div className="h-24 animate-pulse rounded-2xl bg-surface-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-surface-muted" />
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-80 animate-pulse rounded-2xl bg-surface-muted" />
          <div className="h-80 animate-pulse rounded-2xl bg-surface-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted-ink">Financial command center</p>
          <h1 className="mt-1 font-serif text-3xl leading-tight text-navy sm:text-4xl">
            {greeting()}{name ? `, ${name}` : ""}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-ink sm:text-base">
            See the saved plan, the money that actually moved, and the one thing worth reviewing next.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void retryCoreData()}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-[10px] border bg-card px-3.5 text-sm font-semibold text-navy transition-colors hover:bg-surface-muted sm:self-auto"
        >
          <RefreshCw className="size-4 text-purple" aria-hidden="true" />
          Refresh
        </button>
      </header>

      {criticalError ? (
        <DataStateNotice
          tone="danger"
          title="Some core financial data could not be loaded"
          description="No demo values were substituted. Retry the real data request before making a planning decision from this screen."
          action={
            <button
              type="button"
              onClick={() => void retryCoreData()}
              className="inline-flex min-h-11 items-center rounded-[10px] bg-navy px-4 text-sm font-semibold text-white"
            >
              Retry core data
            </button>
          }
        />
      ) : null}

      {plan ? (
        <PlanVersionHeader
          versionNumber={plan.currentVersion.versionNumber}
          generatedAt={plan.currentVersion.createdAt}
          asOf={plan.snapshot.asOf}
          stale={stale}
          completeness={plan.snapshot.completeness.status}
          actions={
            <>
              <Link href="/dashboard/plan" className="inline-flex min-h-11 items-center rounded-[10px] border bg-card px-3.5 text-sm font-semibold text-navy hover:bg-surface-muted">
                Open plan
              </Link>
              {stale ? (
                <Link href="/onboarding" className="inline-flex min-h-11 items-center rounded-[10px] bg-purple px-3.5 text-sm font-semibold text-white hover:bg-purple/90">
                  Review inputs
                </Link>
              ) : null}
            </>
          }
        />
      ) : null}

      <OverviewNextAction
        hasPlan={Boolean(plan)}
        stale={stale}
        overAllocated={feasibility.data?.overAllocated}
      />

      {plan ? (
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <MonthlyRealityCard
            cashFlow={output?.cashFlow}
            emergencyFund={output?.emergencyFund}
          />
          <GoalsRoadmapCard goals={goals.data ?? []} />
        </div>
      ) : (
        <section className="rounded-2xl border border-dashed bg-card p-6 sm:p-8">
          <h2 className="font-serif text-2xl text-navy">No active plan yet</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-ink">
            Your recorded accounts and goals can exist before the first plan. Generate a plan when you are ready to create the baseline that future scenarios will compare against.
          </p>
          <Link href="/onboarding" className="mt-5 inline-flex min-h-11 items-center rounded-[10px] bg-navy px-4 text-sm font-semibold text-white">
            Build my first plan
          </Link>
        </section>
      )}

      <RecordedVsPlannedCard
        planned={output?.cashFlow}
        recorded={recordedCashFlow.data}
        recordedError={Boolean(recordedCashFlow.error)}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DataFreshnessCard
          planVersion={plan?.currentVersion.versionNumber}
          planAsOf={plan?.snapshot.asOf}
          engineVersion={plan?.snapshot.engineVersion}
          policyVersion={plan?.snapshot.policyVersion}
          completenessStatus={plan?.snapshot.completeness.status}
          missingCount={plan?.snapshot.completeness.missing?.length ?? 0}
          accountCount={accounts.data?.length ?? 0}
          planningUpdatedAt={planning.data?.updatedAt}
          stale={stale}
        />
        <RecentTransactionsCard
          transactions={recentTransactions.data ?? []}
          isLoading={recentTransactions.isPending}
          hasError={Boolean(recentTransactions.error)}
        />
      </div>

      <p className="px-1 text-xs leading-relaxed text-muted-ink">
        Plan values come from the saved deterministic snapshot. Recorded cash flow comes from the household ledger for the current period. These sources are intentionally shown separately.
      </p>
    </div>
  );
}
