"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Compass } from "lucide-react";
import { sdk } from "@/lib/sdk";
import { useCurrentPlan, useRecordedCashFlow, useAccounts, unwrap } from "./queries";
import { usePlanning, useGoals, useFeasibility } from "./planning-queries";
import { secondary, Panel, PageTitle, Loading, ErrorNotice, Empty, money, date } from "./ui";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Overview() {
  const plan = useCurrentPlan();
  const planning = usePlanning();
  const goals = useGoals();
  const feasibility = useFeasibility();
  const accounts = useAccounts();
  const recorded = useRecordedCashFlow();

  const transactions = useQuery({
    queryKey: ["transactions", "recent"],
    queryFn: async () =>
      unwrap(await sdk.GET("/api/v1/transactions", { params: { query: { limit: 5 } } })).data,
  });

  const output = plan.data?.snapshot.calculatedOutput;
  const stale =
    !!plan.data && !!planning.data && plan.data.snapshot.revision !== planning.data.revision;

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
    <>
      {/* Header and Status */}
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

      {/* Dominant Next Action Banner */}
      <section className="mb-8 overflow-hidden rounded-2xl bg-[#1F2A44] p-6 text-white shadow-md sm:p-8">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-[#E6B46A]/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#E6B46A] uppercase">
              {next.category}
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white leading-tight">
            {next.title}
          </h2>
          <p className="my-4 text-sm sm:text-base text-white/85 leading-relaxed">
            {next.text}
          </p>
          <Link
            href={next.href}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-[#E6B46A] px-6 py-2.5 text-sm font-semibold text-[#1F2A44] transition-colors hover:bg-[#dca452] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6B46A]"
          >
            <span>{next.label}</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Plan Fetch Error Notice */}
      <ErrorNotice error={plan.error} retry={() => void plan.refetch()} />

      {/* Top 3 High-Level Metrics (Surplus, Emergency Coverage, Goal Capacity) */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Panel title="Monthly surplus">
          {plan.isPending ? (
            <Loading />
          ) : (
            <p className="text-3xl font-serif tabular-nums text-[#1F2A44]">
              {money(output?.cashFlow?.monthlySurplus)}
            </p>
          )}
          <p className="mt-3 text-xs text-[#475467]">
            From your saved monthly plan
          </p>
        </Panel>

        <Panel title="Emergency coverage">
          {plan.isPending ? (
            <Loading />
          ) : (
            <p className="text-3xl font-serif tabular-nums text-[#1F2A44]">
              {output?.emergencyFund?.runwayMonths
                ? `${output.emergencyFund.runwayMonths} months`
                : "Not available"}
            </p>
          )}
          <p className="mt-3 text-xs text-[#475467]">
            Based on saved reserves and needs
          </p>
        </Panel>

        <Panel title="Goal capacity">
          <ErrorNotice error={feasibility.error} retry={() => void feasibility.refetch()} />
          {feasibility.isPending ? (
            <Loading />
          ) : (
            <p className="text-xl font-medium text-[#1F2A44]">
              {feasibility.data?.availableMonthlyCapacity == null
                ? "More inputs needed"
                : feasibility.data.overAllocated
                  ? "Contributions need review"
                  : "Within monthly capacity"}
            </p>
          )}
          <Link
            href="/dashboard/goals"
            className="mt-3 inline-block min-h-[44px] py-2 text-sm font-semibold text-[#5E55C9] hover:underline"
          >
            Review contributions
          </Link>
        </Panel>
      </div>

      {/* Two-Column Structured Panels */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Financial Future / Projection */}
        <Panel title="Your financial future">
          <p className="mb-4 text-sm text-[#475467]">
            Explore the projections and assumptions in your saved plan.
          </p>
          {plan.data ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E8E1D6] bg-[#FFF9F0]/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-[#5E55C9]/10 flex items-center justify-center text-[#5E55C9] shrink-0">
                    <Compass className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1F2A44]">
                      Living Plan Active
                    </h4>
                    <p className="text-xs text-[#475467]">
                      Version {plan.data.currentVersion.versionNumber} · Policy {plan.data.snapshot.policyVersion}
                    </p>
                  </div>
                </div>
              </div>
              <Link className={secondary} href="/dashboard/plan">
                View projection and plan
              </Link>
            </div>
          ) : (
            <Empty href="/onboarding" label="Build your plan">
              Generate a plan to see your financial outlook.
            </Empty>
          )}
        </Panel>

        {/* Monthly Money: Planned vs Recorded Cash Flow */}
        <Panel title="Monthly money">
          <dl className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-sm text-[#475467]">Planned income</dt>
              <dd className="text-base font-semibold tabular-nums text-[#1F2A44]">
                {money(output?.cashFlow?.monthlyIncome)}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-sm text-[#475467]">Planned outflows</dt>
              <dd className="text-base font-semibold tabular-nums text-[#1F2A44]">
                {money(output?.cashFlow?.totalOutflows)}
              </dd>
            </div>
          </dl>

          <hr className="my-4 border-[#E8E1D6]" />

          <div>
            <h3 className="font-sans text-sm font-semibold text-[#1F2A44]">
              Recorded this month
            </h3>
            <ErrorNotice error={recorded.error} retry={() => void recorded.refetch()} />
            {recorded.isPending ? (
              <Loading />
            ) : recorded.data?.hasData ? (
              <p className="mt-2 text-sm text-[#344054]">
                Money in <span className="font-semibold">{money(recorded.data.totalIncome)}</span>; money out{" "}
                <span className="font-semibold">{money(recorded.data.totalExpenses)}</span>.
              </p>
            ) : (
              <p className="mt-2 text-sm text-[#475467]">
                No recorded activity this month.
              </p>
            )}
            <p className="mt-2 text-xs text-[#475467]">
              Recorded activity is not added to planned expenses.
            </p>
          </div>
        </Panel>

        {/* Goals Summary */}
        <Panel title="Your goals">
          <ErrorNotice error={goals.error} retry={() => void goals.refetch()} />
          {goals.isPending && <Loading />}
          {goals.data?.length === 0 && (
            <Empty href="/dashboard/goals" label="Add a goal">
              Give your plan something to work toward.
            </Empty>
          )}
          <ul className="divide-y divide-[#E8E1D6]/60">
            {goals.data?.slice(0, 3).map((g) => (
              <li key={g.id} className="py-3">
                <Link
                  href={`/dashboard/goals/${g.id}`}
                  className="group flex min-h-[44px] flex-wrap items-center justify-between gap-2"
                >
                  <span className="font-semibold text-sm text-[#1F2A44] group-hover:text-[#5E55C9] transition-colors">
                    {g.name}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-[#1F2A44]">
                    {money(g.targetAmount)}
                  </span>
                </Link>
                <p className="text-xs text-[#475467]">
                  By {date(g.targetDate)} · {money(g.monthlyContribution)} monthly
                </p>
              </li>
            ))}
          </ul>
          {goals.data && goals.data.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#E8E1D6]">
              <Link
                href="/dashboard/goals"
                className="text-xs font-semibold text-[#5E55C9] hover:underline min-h-[44px] inline-flex items-center"
              >
                View all goals ({goals.data.length}) →
              </Link>
            </div>
          )}
        </Panel>

        {/* Recurring Obligations */}
        <Panel title="Recurring obligations">
          <dl className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-sm text-[#475467]">Monthly loan payments</dt>
              <dd className="text-base font-semibold tabular-nums text-[#1F2A44]">
                {money(output?.cashFlow?.emis)}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-sm text-[#475467]">Other obligations</dt>
              <dd className="text-base font-semibold tabular-nums text-[#1F2A44]">
                {money(output?.cashFlow?.mandatoryObligations)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-[#475467]">
            These monthly commitments come from your saved inputs. Payment due dates have not been provided.
          </p>
        </Panel>

        {/* Recent Transactions */}
        <Panel title="Recent transactions">
          <ErrorNotice error={transactions.error} retry={() => void transactions.refetch()} />
          {transactions.isPending && <Loading />}
          {transactions.data?.length === 0 && (
            <Empty href="/dashboard/transactions/new" label="Add transaction">
              Start recording activity manually.
            </Empty>
          )}
          <ul className="divide-y divide-[#E8E1D6]/60">
            {transactions.data?.map((t) => (
              <li key={t.id}>
                <Link
                  className="flex min-h-[48px] flex-wrap items-center justify-between gap-2 py-2.5 text-sm hover:bg-[#FFF9F0]/40 -mx-2 px-2 rounded-lg transition-colors"
                  href={`/dashboard/transactions/${t.id}`}
                >
                  <span className="font-medium text-[#1F2A44]">
                    {t.merchantName || "Manual transaction"}
                  </span>
                  <span
                    className={cn(
                      "tabular-nums font-medium text-xs",
                      t.direction === "DEBIT" ? "text-[#344054]" : "text-[#3D5C4A]"
                    )}
                  >
                    {t.direction === "DEBIT" ? "Out" : "In"} {money(t.amount, t.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {transactions.data && transactions.data.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#E8E1D6]">
              <Link
                href="/dashboard/transactions"
                className="text-xs font-semibold text-[#5E55C9] hover:underline min-h-[44px] inline-flex items-center"
              >
                View all transactions →
              </Link>
            </div>
          )}
        </Panel>

        {/* Data Sources and Freshness */}
        <Panel title="Data sources">
          <ErrorNotice error={accounts.error} retry={() => void accounts.refetch()} />
          {accounts.isPending ? (
            <Loading />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge tone="neutral" dot>
                  {accounts.data?.length ?? 0} manual accounts
                </Badge>
                <Badge tone="blue">Android optional</Badge>
              </div>
              <p className="text-sm text-[#344054]">
                {accounts.data?.length ?? 0} manually maintained accounts.
              </p>
            </div>
          )}
          <p className="mt-3 text-xs text-[#475467]">
            Planning inputs are saved separately from recorded transactions and account observations. Android is optional.
          </p>
          <Link href="/dashboard/accounts" className={`${secondary} mt-5 text-xs font-semibold`}>
            Review account balances
          </Link>
        </Panel>
      </div>
    </>
  );
}
