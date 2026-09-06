"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useCurrentPlan } from "@/features/planner/queries";
import { usePlanning, useGoals } from "@/features/planner/planning-queries";
import {
  useInvestmentProjection,
  useInvestmentSummary,
  type InvestmentRequestBody,
} from "@/features/planner/decision-queries";
import {
  action,
  secondary,
  Field,
  Panel,
  PageTitle,
  ErrorNotice,
  Loading,
  Empty,
  money,
  date,
} from "@/features/planner/ui";
import { Badge } from "@/components/planner/badge";
import { PlanningSubNav } from "@/components/planner/sub-nav";

export function InvestmentsView() {
  const planQuery = useCurrentPlan();
  const planningQuery = usePlanning();
  const goalsQuery = useGoals();
  const summaryQuery = useInvestmentSummary();

  const savedInvestment = summaryQuery.data?.inputs ?? planningQuery.data?.inputs.investment;

  const [initialLumpSum, setInitialLumpSum] = useState(
    savedInvestment?.initialLumpSum ?? ""
  );
  const [monthlySip, setMonthlySip] = useState(
    savedInvestment?.monthlySip ?? ""
  );
  const [annualStepUp, setAnnualStepUp] = useState(
    savedInvestment?.annualStepUp ?? ""
  );
  const [horizonYears, setHorizonYears] = useState(
    savedInvestment?.horizonMonths ? String(Math.round(savedInvestment.horizonMonths / 12)) : ""
  );
  const [formValidation, setFormValidation] = useState<string | null>(null);

  const [activeRequest, setActiveRequest] = useState<InvestmentRequestBody | null>(() => {
    if (savedInvestment?.monthlySip) {
      return {
        initialLumpSum: savedInvestment.initialLumpSum || undefined,
        monthlySip: savedInvestment.monthlySip,
        annualStepUp: savedInvestment.annualStepUp || undefined,
        horizonMonths: savedInvestment.horizonMonths ?? 120,
      };
    }
    return null;
  });

  const projectionQuery = useInvestmentProjection(activeRequest);

  const currentPlan = planQuery.data;
  const netWorthOutput = currentPlan?.snapshot.calculatedOutput.netWorth;
  const goals = goalsQuery.data ?? [];

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setFormValidation(null);

    if (!monthlySip || Number(monthlySip) <= 0) {
      setFormValidation("Please enter a valid monthly SIP contribution amount.");
      return;
    }
    const years = Number(horizonYears);
    if (!horizonYears || isNaN(years) || years <= 0) {
      setFormValidation("Please enter a valid investment horizon in years.");
      return;
    }

    const months = Math.round(years * 12);
    setActiveRequest({
      initialLumpSum: initialLumpSum || undefined,
      monthlySip,
      annualStepUp: annualStepUp || undefined,
      horizonMonths: months,
    });
  }

  const result = projectionQuery.data ?? (summaryQuery.data?.projection?.scenarios?.expected ? summaryQuery.data.projection : undefined);
  const scenarios = result?.scenarios ?? {};
  const conservative = scenarios["conservative"];
  const expected = scenarios["expected"];
  const optimistic = scenarios["optimistic"];
  const hasProjections = Boolean(expected && expected.milestones && expected.milestones.length > 0);

  // Build chart dataset aligned by year
  const chartData = (expected?.milestones ?? []).map((m, idx) => {
    const consMilestone = conservative?.milestones[idx];
    const optMilestone = optimistic?.milestones[idx];
    return {
      year: m.year,
      month: m.month,
      invested: Number(m.totalInvested),
      conservative: consMilestone ? Number(consMilestone.futureValue) : 0,
      expected: Number(m.futureValue),
      optimistic: optMilestone ? Number(optMilestone.futureValue) : 0,
    };
  });

  return (
    <div className="space-y-8 pb-16">
      <PlanningSubNav />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-[#5E55C9]">
            Wealth Growth & Projections
          </span>
          <PageTitle
            title="Investment projections"
            description="Long-term compounding projections across return scenarios linked to your goals. No execution or speculative trading."
          />
        </div>
        <div className="hidden sm:block text-right">
          <span className="font-serif italic text-[#5E55C9] text-sm block">
            Consistent contributions today unlock exponential freedom tomorrow.
          </span>
          <Link className={`${secondary} mt-2 text-xs`} href="/dashboard/plan">
            View saved plan
          </Link>
        </div>
      </div>

      {/* Mandatory Regulatory & Scope Disclosure */}
      <div
        role="note"
        aria-label="Investment disclosure"
        className="rounded-2xl border border-[#8FA9D6]/40 bg-[#8FA9D6]/10 p-5 text-sm text-[#1F2A44]"
      >
        <div className="flex items-start gap-3">
          <Badge tone="blue" size="sm">
            Planning Only
          </Badge>
          <div className="space-y-1">
            <p className="font-semibold">Educational planning simulation — No broker execution</p>
            <p className="text-xs text-[#475467] leading-relaxed">
              These projections illustrate hypothetical compound growth across broad asset return assumptions. They are not guaranteed returns, order placements, or trading advice. This platform does not execute trades, offer brokerage services, or inventory individual speculative securities.
            </p>
          </div>
        </div>
      </div>

      <ErrorNotice error={projectionQuery.error} retry={() => void projectionQuery.refetch()} />
      <ErrorNotice error={planQuery.error} retry={() => void planQuery.refetch()} />
      <ErrorNotice error={goalsQuery.error} retry={() => void goalsQuery.refetch()} />
      <ErrorNotice error={summaryQuery.error} retry={() => void summaryQuery.refetch()} />

      {summaryQuery.data?.unavailableValues && summaryQuery.data.unavailableValues.length > 0 && (
        <div
          role="note"
          aria-label="Planning inputs status"
          className="mb-6 rounded-2xl border border-[#D97706]/40 bg-[#FEF3C7]/40 p-4 text-xs text-[#92400E] space-y-1.5"
        >
          <p className="font-semibold text-sm">Planning inputs status</p>
          <ul className="list-disc list-inside space-y-0.5 text-[#78350F]">
            {summaryQuery.data.unavailableValues.map((u, i) => (
              <li key={i}>{u.reason}</li>
            ))}
          </ul>
        </div>
      )}

      {formValidation && (
        <div role="alert" className="mb-4 rounded-xl border border-[#A13F39] p-4 text-sm text-[#A13F39]">
          {formValidation}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Form Controls */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={handleCalculate} className="space-y-6">
            <Panel title="Projection parameters">
              <div className="space-y-4">
                <Field
                  label="Initial lump sum (INR)"
                  name="initialLumpSum"
                  inputMode="decimal"
                  pattern="[0-9]+(\.[0-9]{1,2})?"
                  value={initialLumpSum}
                  onChange={(e) => setInitialLumpSum(e.target.value)}
                  placeholder="Enter initial lump sum (optional)"
                  hint="Existing funds invested at day one."
                />
                <Field
                  label="Monthly SIP contribution (INR)"
                  name="monthlySip"
                  required
                  inputMode="decimal"
                  pattern="[0-9]+(\.[0-9]{1,2})?"
                  value={monthlySip}
                  onChange={(e) => setMonthlySip(e.target.value)}
                  placeholder="Enter monthly SIP contribution"
                  hint="Systematic monthly investment from cash flow."
                />
                <Field
                  label="Annual SIP step-up (%)"
                  name="annualStepUp"
                  required
                  inputMode="decimal"
                  pattern="[0-9]+(\.[0-9]{1,2})?"
                  value={annualStepUp}
                  onChange={(e) => setAnnualStepUp(e.target.value)}
                  placeholder="Enter annual step-up percentage"
                  hint="Annual increase in SIP as your income grows (e.g. 10%)."
                />
                <Field
                  label="Time horizon (years)"
                  name="horizonYears"
                  required
                  type="number"
                  min={1}
                  max={40}
                  value={horizonYears}
                  onChange={(e) => setHorizonYears(e.target.value)}
                  placeholder="Enter horizon in years"
                  hint={horizonYears && Number(horizonYears) > 0 ? `${Math.round(Number(horizonYears) * 12)} months` : "Investment duration"}
                />
                <button
                  type="submit"
                  className={`${action} w-full mt-2`}
                  disabled={projectionQuery.isPending}
                >
                  {projectionQuery.isPending ? "Calculating…" : "Calculate projections"}
                </button>
              </div>
            </Panel>

            <Panel title="Assumed return ranges">
              <dl className="space-y-2.5 text-xs text-[#344054]">
                <div className="flex justify-between border-b border-border pb-1.5">
                  <dt className="text-[#475467]">Conservative (Debt / Bonds)</dt>
                  <dd className="font-semibold text-[#1F2A44]">{conservative?.annualRate ?? "6.0"}% p.a.</dd>
                </div>
                <div className="flex justify-between border-b border-border pb-1.5">
                  <dt className="text-[#475467]">Expected (Balanced Index)</dt>
                  <dd className="font-semibold text-[#1F2A44]">{expected?.annualRate ?? "10.0"}% p.a.</dd>
                </div>
                <div className="flex justify-between pb-1">
                  <dt className="text-[#475467]">Optimistic (Growth Equity)</dt>
                  <dd className="font-semibold text-[#1F2A44]">{optimistic?.annualRate ?? "14.0"}% p.a.</dd>
                </div>
              </dl>
              <p className="mt-3 text-[11px] text-[#475467]">
                Rates derived from policy version {result?.policyVersion ?? "v1"}. Compounding assumes reinvestment of all dividends and interest.
              </p>
            </Panel>
          </form>
        </div>

        {/* Projections View */}
        <div className="lg:col-span-8 space-y-6">
          {projectionQuery.isPending && <Loading />}

          {hasProjections ? (
            <>
              {/* Scenario Comparison Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-[#FFFCF8] p-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#475467]">Conservative</span>
                    <Badge tone="blue" size="sm">{conservative?.annualRate}% p.a.</Badge>
                  </div>
                  <p className="mt-2 text-2xl md:text-3xl font-serif tabular-nums text-[#1F2A44]">
                    {money(conservative?.futureValue)}
                  </p>
                  <p className="text-xs text-[#475467]">
                    Total invested: {money(conservative?.totalInvested)}
                  </p>
                  <p className="text-xs font-medium text-[#3D5C4A]">
                    Gains: {money(conservative?.totalGains)}
                  </p>
                </div>

                <div className="rounded-2xl border-2 border-[#5E55C9] bg-[#FFFCF8] p-5 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#5E55C9]">Expected</span>
                    <Badge tone="purple" size="sm">{expected?.annualRate}% p.a.</Badge>
                  </div>
                  <p className="mt-2 text-2xl md:text-3xl font-serif tabular-nums text-[#1F2A44]">
                    {money(expected?.futureValue)}
                  </p>
                  <p className="text-xs text-[#475467]">
                    Total invested: {money(expected?.totalInvested)}
                  </p>
                  <p className="text-xs font-semibold text-[#3D5C4A]">
                    Gains: {money(expected?.totalGains)}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-[#FFFCF8] p-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#475467]">Optimistic</span>
                    <Badge tone="sage" size="sm">{optimistic?.annualRate}% p.a.</Badge>
                  </div>
                  <p className="mt-2 text-2xl md:text-3xl font-serif tabular-nums text-[#1F2A44]">
                    {money(optimistic?.futureValue)}
                  </p>
                  <p className="text-xs text-[#475467]">
                    Total invested: {money(optimistic?.totalInvested)}
                  </p>
                  <p className="text-xs font-medium text-[#3D5C4A]">
                    Gains: {money(optimistic?.totalGains)}
                  </p>
                </div>
              </div>

              {/* Compounding Chart */}
              <Panel title="Compounding trajectory over time">
                <figure className="space-y-4">
                  <figcaption className="text-xs text-[#475467]">
                    Compounding comparison over {horizonYears} years showing total invested capital versus projected future values.
                  </figcaption>
                  <div className="h-72 w-full min-w-0" aria-label="Investment compounding chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                        <XAxis
                          dataKey="year"
                          tickFormatter={(y) => `Yr ${y}`}
                          minTickGap={24}
                          stroke="#747B88"
                          fontSize={12}
                        />
                        <YAxis
                          width={68}
                          tickFormatter={(v) => new Intl.NumberFormat("en-IN", { notation: "compact" }).format(v)}
                          stroke="#747B88"
                          fontSize={12}
                        />
                        <Tooltip
                          formatter={(val) => money(String(val))}
                          labelFormatter={(label) => `Year ${label}`}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                        <Line
                          type="monotone"
                          dataKey="invested"
                          name="Total Invested"
                          stroke="#747B88"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="conservative"
                          name={`Conservative (${conservative?.annualRate}%)`}
                          stroke="#8FA9D6"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="expected"
                          name={`Expected (${expected?.annualRate}%)`}
                          stroke="#5E55C9"
                          strokeWidth={3}
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="optimistic"
                          name={`Optimistic (${optimistic?.annualRate}%)`}
                          stroke="#7CA690"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Non-Visual Accessible Milestone Table */}
                  <details className="mt-4 border-t border-border pt-2">
                    <summary className="min-h-11 cursor-pointer py-2 font-semibold text-sm text-[#1F2A44]">
                      View milestone data (accessible table)
                    </summary>
                    <div className="max-h-72 overflow-y-auto mt-2">
                      <table className="w-full text-left text-xs">
                        <caption className="sr-only">Annual milestone projections in INR</caption>
                        <thead className="bg-[#FFF9F0] sticky top-0 border-b border-border">
                          <tr>
                            <th scope="col" className="p-2">Year</th>
                            <th scope="col" className="p-2">Total Invested</th>
                            <th scope="col" className="p-2">Conservative</th>
                            <th scope="col" className="p-2">Expected</th>
                            <th scope="col" className="p-2">Optimistic</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {chartData.map((row) => (
                            <tr key={row.year} className="hover:bg-[#FFF9F0]/40">
                              <th scope="row" className="p-2 font-normal text-[#475467]">
                                Year {row.year}
                              </th>
                              <td className="p-2 tabular-nums">{money(String(row.invested))}</td>
                              <td className="p-2 tabular-nums text-[#335380]">{money(String(row.conservative))}</td>
                              <td className="p-2 tabular-nums font-semibold text-[#5448C8]">{money(String(row.expected))}</td>
                              <td className="p-2 tabular-nums text-[#3D5C4A]">{money(String(row.optimistic))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </figure>
              </Panel>
            </>
          ) : (
            !projectionQuery.isPending && (
              <Empty>
                No investment projection calculated yet. Enter your monthly SIP contribution and time horizon to simulate long-term wealth compounding across market scenarios.
              </Empty>
            )
          )}

          {/* Broad Asset Allocation Breakdown */}
          <Panel title="Broad asset allocation in your plan">
            <p className="mb-4 text-xs text-[#475467]">
              Asset allocations are grouped into macro asset classes to reflect diversification without promoting individual stock picks.
            </p>
            {netWorthOutput?.assetAllocations && netWorthOutput.assetAllocations.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {netWorthOutput.assetAllocations.map((alloc, idx) => (
                  <div key={idx} className="rounded-xl border border-border p-3.5 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#1F2A44] capitalize">{alloc.category}</span>
                      <span className="tabular-nums font-medium text-[#5E55C9]">{alloc.percentage}%</span>
                    </div>
                    <p className="text-lg font-serif tabular-nums text-[#1F2A44]">{money(alloc.totalValue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No asset allocation breakdown recorded in current baseline snapshot. Add savings, deposits, and funds in your financial inputs.
              </p>
            )}
          </Panel>

          {/* Goal Linkage Section */}
          <Panel title="Goal linkage">
            <p className="mb-4 text-xs text-[#475467]">
              How your planned investment contributions support your active goals.
            </p>
            {goals.length === 0 ? (
              <Empty href="/dashboard/goals" label="Add a goal">
                No active goals linked yet. Link investment contributions to specific targets like Retirement, Home, or Education.
              </Empty>
            ) : (
              <div className="divide-y divide-border">
                {goals.map((g) => (
                  <div key={g.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-semibold text-sm text-[#1F2A44]">{g.name}</p>
                      <p className="text-[#475467]">
                        Target: {money(g.targetAmount)} by {date(g.targetDate)} · Saved: {money(g.currentSavings)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold tabular-nums text-[#1F2A44] block">
                        {money(g.monthlyContribution)} / mo
                      </span>
                      <Link className="inline-flex min-h-11 items-center text-[#5E55C9] underline" href={`/dashboard/goals/${g.id}`}>
                        View goal
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
