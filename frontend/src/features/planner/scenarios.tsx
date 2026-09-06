"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/sdk";
import { useCurrentPlan, unwrap } from "./queries";
import {
  useScenarios,
  useScenario,
  useRunScenario,
  useCompareScenarios,
  type CreateScenarioBody,
} from "./decision-queries";
import {
  action,
  secondary,
  control,
  Field,
  Panel,
  PageTitle,
  ErrorNotice,
  Loading,
  Empty,
  money,
  date,
} from "./ui";
import { Badge } from "@/components/planner/badge";

export function ScenariosList() {
  const scenariosQuery = useScenarios();
  const currentPlanQuery = useCurrentPlan();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);

  const scenarios = scenariosQuery.data ?? [];
  const compareQuery = useCompareScenarios(selectedIds, comparing);
  const baselineOutput = currentPlanQuery.data?.snapshot.calculatedOutput;

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 10 ? [...prev, id] : prev
    );
  }

  return (
    <>
      <PageTitle
        title="Decision scenarios"
        description="Model what-if decisions side-by-side without mutating your active baseline. Applying a scenario requires explicit confirmation."
      >
        <Link className={action} href="/dashboard/scenarios/new">
          + Create scenario
        </Link>
      </PageTitle>

      <ErrorNotice error={scenariosQuery.error} retry={() => void scenariosQuery.refetch()} />
      <ErrorNotice error={currentPlanQuery.error} retry={() => void currentPlanQuery.refetch()} />
      <ErrorNotice error={compareQuery.error} retry={() => void compareQuery.refetch()} />

      {scenariosQuery.isPending && <Loading />}

      <div className="mb-6 rounded-2xl border border-border bg-[#FFFCF8] p-5">
        <p className="text-sm text-[#344054]">
          <strong className="text-[#1F2A44]">Baseline preservation:</strong> Saved scenarios are bounded simulations. Comparing scenarios evaluates differences relative to your live plan, but never changes it until you confirm application.
        </p>
      </div>

      {scenarios.length > 1 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-[#FFF9F0]/60 p-4">
          <div className="text-sm text-[#344054]">
            Select 2 to 10 scenarios to compare side-by-side with your active baseline. ({selectedIds.length} selected)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={action}
              disabled={selectedIds.length < 2 || compareQuery.isPending}
              onClick={() => setComparing(true)}
            >
              {compareQuery.isPending ? "Comparing…" : `Compare (${selectedIds.length})`}
            </button>
            {comparing && (
              <button
                type="button"
                className={secondary}
                onClick={() => setComparing(false)}
              >
                Reset comparison
              </button>
            )}
          </div>
        </div>
      )}

      {comparing && compareQuery.data && (
        <section
          aria-label="Side-by-side scenario comparison"
          className="mb-8 rounded-2xl border-2 border-[#5E55C9] bg-[#FFFCF8] p-5 sm:p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h2 className="text-xl font-medium text-[#1F2A44]">
                Side-by-side scenario comparison
              </h2>
              <p className="text-xs text-[#475467]">
                Compared against active baseline · No financial data mutated
              </p>
            </div>
            <button
              type="button"
              className={secondary}
              onClick={() => setComparing(false)}
            >
              Close
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">
                Comparison of selected scenarios against active baseline
              </caption>
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-[#475467]">
                  <th scope="col" className="p-3">Financial Metric</th>
                  <th scope="col" className="p-3">Active Baseline</th>
                  {compareQuery.data.scenarios.map((s, idx) => (
                    <th key={idx} scope="col" className="p-3">
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                <tr>
                  <th scope="row" className="p-3 font-medium">Monthly Income</th>
                  <td className="p-3 tabular-nums">{money(baselineOutput?.cashFlow?.monthlyIncome)}</td>
                  {compareQuery.data.scenarios.map((s, idx) => (
                    <td key={idx} className="p-3 tabular-nums font-semibold">
                      {money(s.scenario.cashFlow?.monthlyIncome)}
                      {s.deltas.cashFlow?.monthlyIncomeDelta && (
                        <span className="block text-xs font-normal text-[#475467]">
                          Delta: {formatDeltaStr(s.deltas.cashFlow.monthlyIncomeDelta)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-medium">Monthly Outflows</th>
                  <td className="p-3 tabular-nums">{money(baselineOutput?.cashFlow?.totalOutflows)}</td>
                  {compareQuery.data.scenarios.map((s, idx) => (
                    <td key={idx} className="p-3 tabular-nums font-semibold">
                      {money(s.scenario.cashFlow?.totalOutflows)}
                      {s.deltas.cashFlow?.totalExpensesDelta && (
                        <span className="block text-xs font-normal text-[#475467]">
                          Delta: {formatDeltaStr(s.deltas.cashFlow.totalExpensesDelta)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-medium">Monthly Surplus</th>
                  <td className="p-3 tabular-nums">{money(baselineOutput?.cashFlow?.monthlySurplus)}</td>
                  {compareQuery.data.scenarios.map((s, idx) => (
                    <td key={idx} className="p-3 tabular-nums font-semibold">
                      {money(s.scenario.cashFlow?.monthlySurplus)}
                      {s.deltas.cashFlow?.monthlySurplusDelta && (
                        <span className="block text-xs font-normal text-[#475467]">
                          Delta: {formatDeltaStr(s.deltas.cashFlow.monthlySurplusDelta)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-medium">Emergency Runway</th>
                  <td className="p-3">
                    {baselineOutput?.emergencyFund?.runwayMonths
                      ? `${baselineOutput.emergencyFund.runwayMonths} mo`
                      : "N/A"}
                  </td>
                  {compareQuery.data.scenarios.map((s, idx) => (
                    <td key={idx} className="p-3">
                      {s.scenario.emergencyFund?.runwayMonths
                        ? `${s.scenario.emergencyFund.runwayMonths} mo`
                        : "N/A"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-medium">Investable Capacity</th>
                  <td className="p-3 tabular-nums">{money(baselineOutput?.cashFlow?.investableCapacity)}</td>
                  {compareQuery.data.scenarios.map((s, idx) => (
                    <td key={idx} className="p-3 tabular-nums">
                      {money(s.scenario.cashFlow?.investableCapacity)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {scenarios.length === 0 && !scenariosQuery.isPending && (
        <Empty href="/dashboard/scenarios/new" label="Create a scenario">
          No scenarios saved yet. Explore hypothetical decisions like salary growth, taking a loan, or changing expenses.
        </Empty>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => {
          const isSelected = selectedIds.includes(scenario.id);
          return (
            <Panel key={scenario.id} title={scenario.name}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Badge tone={scenario.status === "applied" ? "sage" : "neutral"} size="sm">
                  {scenario.status === "applied" ? "Applied to live plan" : "Draft simulation"}
                </Badge>
                <label className="inline-flex min-h-11 items-center gap-1.5 text-xs text-[#475467] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(scenario.id)}
                    className="size-4 rounded accent-[#5E55C9]"
                  />
                  Select
                </label>
              </div>

              {scenario.description && (
                <p className="mb-4 text-xs text-[#475467] line-clamp-2">
                  {scenario.description}
                </p>
              )}

              <dl className="mb-4 space-y-1.5 text-xs text-[#344054]">
                <div className="flex justify-between">
                  <dt className="text-[#475467]">Created</dt>
                  <dd>{date(scenario.createdAt)}</dd>
                </div>
                {scenario.appliedAt && (
                  <div className="flex justify-between">
                    <dt className="text-[#475467]">Applied at</dt>
                    <dd>{date(scenario.appliedAt)}</dd>
                  </div>
                )}
              </dl>

              <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                <Link className={secondary} href={`/dashboard/scenarios/${scenario.id}`}>
                  Evaluate & Review
                </Link>
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}

export function ScenarioCreate() {
  const router = useRouter();
  const client = useQueryClient();
  const currentPlanQuery = useCurrentPlan();
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  const baselineCashFlow = currentPlanQuery.data?.snapshot.calculatedOutput.cashFlow;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const get = (k: string) => (formData.get(k) as string)?.trim() ?? "";

    const name = get("name");
    const description = get("description");

    const cashFlow: Record<string, string> = {};
    if (get("income")) cashFlow.income = get("income");
    if (get("essentialExpenses")) cashFlow.essentialExpenses = get("essentialExpenses");
    if (get("discretionaryExpenses")) cashFlow.discretionaryExpenses = get("discretionaryExpenses");
    if (get("emis")) cashFlow.emis = get("emis");

    const emergencyFund: Record<string, unknown> = {};
    if (get("currentReserves")) emergencyFund.currentReserves = get("currentReserves");
    if (get("targetReserveMonths")) emergencyFund.customReserveMonths = Number(get("targetReserveMonths"));

    const investment: Record<string, unknown> = {};
    if (get("monthlySip")) investment.monthlySip = get("monthlySip");
    if (get("initialLumpSum")) investment.initialLumpSum = get("initialLumpSum");
    if (get("horizonMonths")) investment.horizonMonths = Number(get("horizonMonths"));

    const loan: Record<string, unknown> = {};
    if (get("loanPrincipal")) loan.principal = get("loanPrincipal");
    if (get("loanRate")) loan.annualRate = get("loanRate");
    if (get("loanTenure")) loan.tenureMonths = Number(get("loanTenure"));

    const overlay: CreateScenarioBody["overlay"] = {};
    if (Object.keys(cashFlow).length > 0) overlay.cashFlow = cashFlow;
    if (Object.keys(emergencyFund).length > 0) overlay.emergencyFund = emergencyFund;
    if (Object.keys(investment).length > 0) overlay.investment = investment;
    if (Object.keys(loan).length > 0) overlay.loan = loan;

    try {
      const res = unwrap(
        await sdk.POST("/api/v1/scenarios", {
          body: {
            name,
            description: description || undefined,
            overlay,
          },
        })
      );
      await client.invalidateQueries({ queryKey: ["scenarios"] });
      router.push(`/dashboard/scenarios/${res.data.id}`);
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageTitle
        title="Create decision scenario"
        description="Define bounded changes relative to your current plan. Your live baseline is preserved."
      >
        <Link className={secondary} href="/dashboard/scenarios">
          Cancel
        </Link>
      </PageTitle>

      <ErrorNotice error={error} />

      <form onSubmit={submit} className="space-y-6 max-w-3xl">
        <Panel title="Scenario metadata">
          <div className="space-y-4">
            <Field
              label="Scenario name"
              name="name"
              required
              maxLength={100}
              placeholder="e.g. Salary raise with car loan, Sabbatical year"
            />
            <div className="space-y-1.5">
              <label htmlFor="description" className="block font-semibold text-[#1F2A44]">
                Description (optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={500}
                className={control}
                placeholder="Briefly describe the context or purpose of this what-if scenario…"
              />
            </div>
          </div>
        </Panel>

        <Panel title="Cash flow adjustments">
          <p className="mb-4 text-xs text-[#475467]">
            Leave fields blank to inherit current baseline values (Current income: {money(baselineCashFlow?.monthlyIncome)}).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Hypothetical monthly take-home (INR)"
              name="income"
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,2})?"
              placeholder="e.g. 150000"
            />
            <Field
              label="Essential monthly expenses (INR)"
              name="essentialExpenses"
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,2})?"
              placeholder="e.g. 45000"
            />
            <Field
              label="Discretionary monthly spending (INR)"
              name="discretionaryExpenses"
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,2})?"
              placeholder="e.g. 20000"
            />
            <Field
              label="Monthly EMI commitments (INR)"
              name="emis"
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,2})?"
              placeholder="e.g. 25000"
            />
          </div>
        </Panel>

        <Panel title="Emergency fund & savings adjustments">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Liquid reserves available (INR)"
              name="currentReserves"
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,2})?"
              placeholder="e.g. 300000"
            />
            <Field
              label="Target reserve coverage (months)"
              name="targetReserveMonths"
              type="number"
              min={1}
              max={36}
              placeholder="e.g. 6"
            />
          </div>
        </Panel>

        <Panel title="Investment adjustments">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Monthly SIP (INR)"
              name="monthlySip"
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,2})?"
              placeholder="e.g. 30000"
            />
            <Field
              label="One-time lump sum (INR)"
              name="initialLumpSum"
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,2})?"
              placeholder="e.g. 100000"
            />
            <Field
              label="Time horizon (months)"
              name="horizonMonths"
              type="number"
              min={1}
              max={600}
              placeholder="e.g. 120"
            />
          </div>
        </Panel>

        <Panel title="Loan adjustments (optional)">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Loan principal (INR)"
              name="loanPrincipal"
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,2})?"
              placeholder="e.g. 2000000"
            />
            <Field
              label="Interest rate (% p.a.)"
              name="loanRate"
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,2})?"
              placeholder="e.g. 8.75"
            />
            <Field
              label="Tenure (months)"
              name="loanTenure"
              type="number"
              min={1}
              max={360}
              placeholder="e.g. 60"
            />
          </div>
        </Panel>

        <div className="flex items-center gap-3">
          <button type="submit" className={action} disabled={pending}>
            {pending ? "Saving scenario…" : "Save and evaluate scenario"}
          </button>
          <Link className={secondary} href="/dashboard/scenarios">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}

export function ScenarioDetail({ id }: { id: string }) {
  const client = useQueryClient();
  const scenarioQuery = useScenario(id);
  const runQuery = useRunScenario(id);
  const currentPlanQuery = useCurrentPlan();

  const [confirmApply, setConfirmApply] = useState(false);
  const [applyPending, setApplyPending] = useState(false);
  const [applyError, setApplyError] = useState<unknown>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [baselineConflict, setBaselineConflict] = useState(false);

  const scenario = scenarioQuery.data;
  const evaluation = runQuery.data;
  const currentPlan = currentPlanQuery.data;

  async function handleApply() {
    setApplyPending(true);
    setApplyError(null);
    setBaselineConflict(false);
    try {
      const res = unwrap(
        await sdk.POST("/api/v1/scenarios/{id}/apply", {
          params: { path: { id } },
          headers: { "Idempotency-Key": `scenario-apply-${id}-${Date.now()}` },
        })
      );
      client.setQueryData(["plan"], {
        plan: res.data.plan,
        currentVersion: res.data.version,
        snapshot: res.data.snapshot,
      });
      await Promise.all([
        client.invalidateQueries({ queryKey: ["plan"] }),
        client.invalidateQueries({ queryKey: ["scenarios"] }),
        client.invalidateQueries({ queryKey: ["scenarios", id] }),
      ]);
      setApplySuccess(
        `Scenario applied! New Plan Version ${res.data.version.versionNumber} created and activated.`
      );
      setConfirmApply(false);
    } catch (err: unknown) {
      setApplyError(err);
      const isConflict =
        (err as { code?: string; status?: number })?.code === "SCENARIO_BASELINE_STALE" ||
        (err as { code?: string; status?: number })?.status === 409 ||
        (err instanceof Error &&
          (err.message.includes("SCENARIO_BASELINE_STALE") ||
            err.message.includes("no longer the current plan version")));
      if (isConflict) {
        setBaselineConflict(true);
      }
    } finally {
      setApplyPending(false);
    }
  }

  if (scenarioQuery.isPending || runQuery.isPending) return <Loading />;

  if (!scenario) {
    return (
      <>
        <PageTitle title="Scenario evaluation" />
        <ErrorNotice error={scenarioQuery.error} retry={() => void scenarioQuery.refetch()} />
        <Empty href="/dashboard/scenarios" label="View scenarios">
          Scenario not found or could not be loaded.
        </Empty>
      </>
    );
  }

  const isApplied = scenario.status === "applied";
  const isBaselineStaleBeforeApply = Boolean(
    currentPlan && scenario.baselineVersionId && currentPlan.currentVersion.id !== scenario.baselineVersionId
  );
  const baseline = evaluation?.baseline;
  const sim = evaluation?.scenario;
  const deltas = evaluation?.deltas;

  return (
    <>
      <PageTitle
        title={scenario.name}
        description={scenario.description || `Created ${date(scenario.createdAt)} · Baseline Version ${scenario.baselineVersionId.slice(0, 8)}…`}
      >
        <div className="flex gap-2">
          <Link className={secondary} href="/dashboard/scenarios">
            Back to scenarios
          </Link>
        </div>
      </PageTitle>

      <ErrorNotice error={runQuery.error} retry={() => void runQuery.refetch()} />

      {baselineConflict ? (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 rounded-2xl border-2 border-[#D97706] bg-[#FEF3C7]/50 p-5 text-[#92400E] shadow-sm space-y-3"
        >
          <div className="flex items-start gap-3">
            <Badge tone="warning" size="sm">
              Conflict (409)
            </Badge>
            <div className="space-y-1">
              <p className="font-semibold text-[#92400E]">
                Baseline Conflict: Plan has evolved
              </p>
              <p className="text-xs text-[#78350F] leading-relaxed">
                The active financial plan baseline has moved forward to a newer version since this scenario was created. Scenarios cannot be directly applied to outdated baselines to prevent overwriting intermediate changes.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#FCD34D]">
            <Link href="/dashboard/plan" className={action}>
              Review active plan
            </Link>
            <Link href="/dashboard/scenarios/new" className={secondary}>
              Recreate scenario from current plan
            </Link>
            <button
              type="button"
              className={secondary}
              onClick={() => {
                setBaselineConflict(false);
                setApplyError(null);
                setConfirmApply(false);
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : (
        <ErrorNotice error={applyError} />
      )}

      {applySuccess && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-[#3D5C4A] bg-[#7CA690]/15 p-5 text-[#3D5C4A]"
        >
          <p className="font-semibold">{applySuccess}</p>
          <Link className={`${action} mt-3`} href="/dashboard/plan">
            View active plan
          </Link>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-[#FFFCF8] p-5">
        <div className="flex items-center gap-2">
          <Badge tone={isApplied ? "sage" : "neutral"}>
            {isApplied ? "Applied to Live Plan" : "Draft Scenario"}
          </Badge>
          {isApplied && scenario.appliedAt && (
            <span className="text-xs text-[#475467]">Applied {date(scenario.appliedAt)}</span>
          )}
        </div>
        <p className="text-xs text-[#475467]">
          Baseline preservation: Reviewing this evaluation does not change your plan. Applying it creates a new plan version.
        </p>
      </div>

      <div className="min-w-0 grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-[#FFFCF8] p-4">
              <span className="text-xs uppercase tracking-wider text-[#475467]">
                Monthly Surplus
              </span>
              <p className="mt-1 text-2xl tabular-nums text-[#1F2A44]">
                {money(sim?.cashFlow?.monthlySurplus)}
              </p>
              {deltas?.cashFlow?.monthlySurplusDelta && (
                <span className="mt-1 block text-xs font-semibold">
                  Delta: {formatDeltaStr(deltas.cashFlow.monthlySurplusDelta)}
                </span>
              )}
            </div>

            <div className="rounded-xl border border-border bg-[#FFFCF8] p-4">
              <span className="text-xs uppercase tracking-wider text-[#475467]">
                Emergency Runway
              </span>
              <p className="mt-1 text-2xl tabular-nums text-[#1F2A44]">
                {sim?.emergencyFund?.runwayMonths
                  ? `${sim.emergencyFund.runwayMonths} mo`
                  : "N/A"}
              </p>
              {deltas?.emergencyFund?.runwayMonthsDelta && (
                <span className="mt-1 block text-xs font-semibold">
                  Delta: {deltas.emergencyFund.runwayMonthsDelta} mo
                </span>
              )}
            </div>

            <div className="rounded-xl border border-border bg-[#FFFCF8] p-4">
              <span className="text-xs uppercase tracking-wider text-[#475467]">
                Total Outflows
              </span>
              <p className="mt-1 text-2xl tabular-nums text-[#1F2A44]">
                {money(sim?.cashFlow?.totalOutflows)}
              </p>
              {deltas?.cashFlow?.totalExpensesDelta && (
                <span className="mt-1 block text-xs font-semibold">
                  Delta: {formatDeltaStr(deltas.cashFlow.totalExpensesDelta)}
                </span>
              )}
            </div>
          </div>

          <Panel title="Evaluation comparison against baseline">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Detailed comparison between baseline plan and {scenario.name}
                </caption>
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-[#475467]">
                    <th scope="col" className="p-3">Metric</th>
                    <th scope="col" className="p-3">Current Baseline</th>
                    <th scope="col" className="p-3">Scenario Projection</th>
                    <th scope="col" className="p-3">Impact (Delta)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <th scope="row" className="p-3 font-medium">Take-Home Income</th>
                    <td className="p-3 tabular-nums">{money(baseline?.cashFlow?.monthlyIncome)}</td>
                    <td className="p-3 tabular-nums">{money(sim?.cashFlow?.monthlyIncome)}</td>
                    <td className="p-3 tabular-nums font-semibold">
                      {formatDeltaStr(deltas?.cashFlow?.monthlyIncomeDelta)}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-3 font-medium">Essential Expenses</th>
                    <td className="p-3 tabular-nums">{money(baseline?.cashFlow?.essentialExpenses)}</td>
                    <td className="p-3 tabular-nums">{money(sim?.cashFlow?.essentialExpenses)}</td>
                    <td className="p-3 tabular-nums text-muted-foreground">—</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-3 font-medium">Discretionary Spending</th>
                    <td className="p-3 tabular-nums">{money(baseline?.cashFlow?.discretionaryExpenses)}</td>
                    <td className="p-3 tabular-nums">{money(sim?.cashFlow?.discretionaryExpenses)}</td>
                    <td className="p-3 tabular-nums text-muted-foreground">—</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-3 font-medium">EMI Commitments</th>
                    <td className="p-3 tabular-nums">{money(baseline?.cashFlow?.emis)}</td>
                    <td className="p-3 tabular-nums">{money(sim?.cashFlow?.emis)}</td>
                    <td className="p-3 tabular-nums font-semibold">
                      {formatDeltaStr(deltas?.loan?.monthlyEmiDelta)}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-3 font-medium">Total Monthly Outflows</th>
                    <td className="p-3 tabular-nums">{money(baseline?.cashFlow?.totalOutflows)}</td>
                    <td className="p-3 tabular-nums">{money(sim?.cashFlow?.totalOutflows)}</td>
                    <td className="p-3 tabular-nums font-semibold">
                      {formatDeltaStr(deltas?.cashFlow?.totalExpensesDelta)}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-3 font-medium">Monthly Surplus</th>
                    <td className="p-3 tabular-nums">{money(baseline?.cashFlow?.monthlySurplus)}</td>
                    <td className="p-3 tabular-nums font-semibold text-[#1F2A44]">{money(sim?.cashFlow?.monthlySurplus)}</td>
                    <td className="p-3 tabular-nums font-bold">
                      {formatDeltaStr(deltas?.cashFlow?.monthlySurplusDelta)}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-3 font-medium">Emergency Runway</th>
                    <td className="p-3">{baseline?.emergencyFund?.runwayMonths ? `${baseline.emergencyFund.runwayMonths} mo` : "N/A"}</td>
                    <td className="p-3">{sim?.emergencyFund?.runwayMonths ? `${sim.emergencyFund.runwayMonths} mo` : "N/A"}</td>
                    <td className="p-3 font-semibold">
                      {deltas?.emergencyFund?.runwayMonthsDelta ? `${deltas.emergencyFund.runwayMonthsDelta} mo` : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Decision & plan application">
            {isApplied ? (
              <div className="space-y-3 text-sm text-[#475467]">
                <p>
                  This scenario was explicitly applied to your live plan on {date(scenario.appliedAt)}.
                </p>
                {scenario.appliedVersionId && (
                  <p className="font-medium text-[#1F2A44]">
                    Generated Plan Version: {scenario.appliedVersionId.slice(0, 8)}…
                  </p>
                )}
                <Link className={`${action} w-full text-center mt-3`} href="/dashboard/plan">
                  View updated plan
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[#475467]">
                  Applying this scenario updates your active financial plan with these simulated values. A new traceable plan version will be created.
                </p>

                {isBaselineStaleBeforeApply && (
                  <div className="rounded-xl border border-[#D97706]/60 bg-[#FEF3C7]/40 p-3.5 text-xs text-[#92400E] space-y-1.5">
                    <p className="font-semibold">Notice: Plan baseline has changed</p>
                    <p className="text-[11px] text-[#78350F]">
                      Active plan is at Version {currentPlan?.currentVersion.versionNumber}, while this scenario targets baseline {scenario.baselineVersionId.slice(0, 8)}…. Applying may require re-evaluating against the current plan.
                    </p>
                  </div>
                )}

                {confirmApply ? (
                  <div className="rounded-xl border border-[#5E55C9] bg-[#5E55C9]/10 p-4 space-y-3">
                    <p className="text-sm font-semibold text-[#1F2A44]">
                      Confirm application to live plan?
                    </p>
                    <p className="text-xs text-[#344054]">
                      This will archive Version {currentPlan?.currentVersion.versionNumber} and create Version {(currentPlan?.currentVersion.versionNumber ?? 0) + 1} with these changes.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={action}
                        disabled={applyPending}
                        onClick={() => void handleApply()}
                      >
                        {applyPending ? "Applying…" : "Confirm & Apply"}
                      </button>
                      <button
                        type="button"
                        className={secondary}
                        disabled={applyPending}
                        onClick={() => setConfirmApply(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`${action} w-full`}
                    onClick={() => setConfirmApply(true)}
                  >
                    Apply scenario to active plan
                  </button>
                )}
              </div>
            )}
          </Panel>

          <Panel title="Assumptions & completeness">
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-[#475467]">Policy Version</dt>
                <dd className="font-medium">{evaluation?.policyVersion ?? "v1"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#475467]">General Inflation</dt>
                <dd className="font-medium">{evaluation?.resolvedAssumptions.generalInflation}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#475467]">Expected Return</dt>
                <dd className="font-medium">{evaluation?.resolvedAssumptions.returns.expected}%</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}

function formatDeltaStr(delta: string | null | undefined): string {
  if (!delta) return "—";
  const num = Number(delta);
  if (isNaN(num)) return delta;
  if (num === 0) return "No change";
  const sign = num > 0 ? "+" : "-";
  return `${sign}${money(String(Math.abs(num)))}`;
}
