"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { sdk } from "@/lib/sdk";
import { useGoals, useFeasibility, type Goal } from "./planning-queries";
import { unwrap } from "./queries";
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
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORY_TONES: Record<string, BadgeTone> = {
  home: "purple",
  car: "blue",
  travel: "gold",
  savings: "sage",
  education: "navy",
  medical: "danger",
  retirement: "sage",
  custom: "neutral",
};

export function GoalForm({ goal, onSaved }: { goal?: Goal; onSaved: () => void }) {
  const client = useQueryClient();
  const [error, setError] = useState<unknown>();
  const [pending, setPending] = useState(false);

  async function submit(form: FormData) {
    setPending(true);
    setError(null);
    const get = (key: string) => String(form.get(key) ?? "");
    const body = {
      name: get("name"),
      category: get("category") as Goal["category"],
      targetAmount: get("targetAmount"),
      targetDate: get("targetDate"),
      currentSavings: get("currentSavings"),
      monthlyContribution: get("monthlyContribution"),
    };
    try {
      if (goal) {
        unwrap(
          await sdk.PATCH("/api/v1/goals/{id}", {
            params: { path: { id: goal.id } },
            body: { ...body, expectedRevision: goal.revision },
          })
        );
      } else {
        unwrap(await sdk.POST("/api/v1/goals", { body }));
      }
      await Promise.all([
        client.invalidateQueries({ queryKey: ["goals"] }),
        client.invalidateQueries({ queryKey: ["planning"] }),
      ]);
      onSaved();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={submit} className="space-y-4">
      <Field label="Goal name" name="name" required maxLength={100} defaultValue={goal?.name} />
      <div className="space-y-1.5">
        <label htmlFor="goal-category" className="block text-sm font-semibold text-[#1F2A44]">
          Goal category
        </label>
        <select
          id="goal-category"
          className={cn(control, "bg-[#FFFCF8] text-base capitalize")}
          name="category"
          defaultValue={goal?.category ?? "savings"}
        >
          {["home", "car", "travel", "savings", "education", "medical", "retirement", "custom"].map(
            (c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            )
          )}
        </select>
      </div>
      <Field
        label="Target amount today (INR)"
        name="targetAmount"
        required
        inputMode="decimal"
        pattern="[0-9]+(\.[0-9]{1,2})?"
        defaultValue={goal?.targetAmount}
      />
      <Field label="Target date" name="targetDate" type="date" required defaultValue={goal?.targetDate} />
      <Field
        label="Already saved (INR)"
        name="currentSavings"
        required
        inputMode="decimal"
        pattern="[0-9]+(\.[0-9]{1,2})?"
        defaultValue={goal?.currentSavings}
        hint="Enter 0 only if you have not saved anything for this goal."
      />
      <Field
        label="Your monthly contribution (INR)"
        name="monthlyContribution"
        required
        inputMode="decimal"
        pattern="[0-9]+(\.[0-9]{1,2})?"
        defaultValue={goal?.monthlyContribution}
        hint="You choose the amount. We will explain whether it fits your plan."
      />
      <ErrorNotice error={error} />
      <button type="submit" className={action} disabled={pending}>
        {pending ? "Saving…" : "Save goal"}
      </button>
    </form>
  );
}
export function Goals({ onboarding = false }: { onboarding?: boolean }) {
  const query = useGoals();
  const feasibility = useFeasibility();
  const [adding, setAdding] = useState(false);

  return (
    <>
      {!onboarding && (
        <PageTitle
          title="Goals"
          description="Make room for what matters. Choose contributions for up to three active goals."
        />
      )}

      <ErrorNotice error={query.error} retry={() => void query.refetch()} />
      {query.isPending && <Loading />}

      {feasibility.data?.overAllocated && (
        <div
          role="status"
          className="mb-6 rounded-2xl border border-[#7D5200] bg-[#FFF9F0] p-5 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-[#7D5200] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#1F2A44]">Capacity Attention</h3>
              <p className="mt-1 text-sm text-[#344054]">
                Your contributions exceed available monthly capacity. Review your goal contributions or monthly money. Your chosen amounts have been kept.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {query.data?.map((goal) => {
          const targetNum = Number(goal.targetAmount) || 0;
          const savedNum = Number(goal.currentSavings) || 0;
          const progressPct = targetNum > 0 ? Math.min(100, Math.max(0, (savedNum / targetNum) * 100)) : 0;
          const categoryTone = CATEGORY_TONES[goal.category] ?? "neutral";

          return (
            <Panel key={goal.id} title={goal.name}>
              <div className="mb-3 flex items-center justify-between">
                <Badge tone={categoryTone} size="sm">
                  {goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}
                </Badge>
                <span className="text-xs font-semibold tabular-nums text-[#3D5C4A]">
                  {progressPct.toFixed(0)}% funded
                </span>
              </div>

              {/* Accessible Progress Bar */}
              <div
                className="mb-4 h-2 w-full overflow-hidden rounded-full bg-[#E8E1D6]/60"
                role="progressbar"
                aria-valuenow={Math.round(progressPct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${goal.name} funding progress`}
              >
                <div
                  className="h-full rounded-full bg-[#3D5C4A] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-[#475467]">Target today</dt>
                  <dd className="text-2xl font-serif tabular-nums text-[#1F2A44]">
                    {money(goal.targetAmount)}
                  </dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E8E1D6]/60 pt-2">
                  <dt className="text-xs text-[#475467]">By</dt>
                  <dd className="font-medium text-[#1F2A44]">{date(goal.targetDate)}</dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E8E1D6]/60 pt-2">
                  <dt className="text-xs text-[#475467]">Already saved</dt>
                  <dd className="font-semibold tabular-nums text-[#1F2A44]">
                    {money(goal.currentSavings)}
                  </dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E8E1D6]/60 pt-2">
                  <dt className="text-xs text-[#475467]">Your monthly contribution</dt>
                  <dd className="font-semibold tabular-nums text-[#5E55C9]">
                    {money(goal.monthlyContribution)}
                  </dd>
                </div>
              </dl>

              <Link
                className={`${secondary} mt-5 w-full justify-center text-xs font-semibold`}
                href={`/dashboard/goals/${goal.id}`}
              >
                Review goal
              </Link>
            </Panel>
          );
        })}
      </div>

      {query.data?.length === 0 && (
        <Empty>Start with a goal you care about. You can also continue and add goals later.</Empty>
      )}

      {query.data && query.data.length < 3 && (
        <div className="mt-6">
          {adding ? (
            <Panel title="Add a goal">
              <GoalForm onSaved={() => setAdding(false)} />
              <button
                type="button"
                className={`${secondary} mt-4 text-xs font-semibold`}
                onClick={() => setAdding(false)}
              >
                Cancel
              </button>
            </Panel>
          ) : (
            <button
              type="button"
              className={secondary}
              onClick={() => setAdding(true)}
            >
              Add a goal
            </button>
          )}
        </div>
      )}

      {query.data?.length === 3 && (
        <p className="mt-5 text-sm text-[#475467]">
          You have three active goals. Remove one before adding another.
        </p>
      )}
    </>
  );
}

export function GoalDetail({ id }: { id: string }) {
  const query = useGoals();
  const feasibility = useFeasibility();
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<unknown>();
  const [pending, setPending] = useState(false);

  const goal = query.data?.find((g) => g.id === id);

  async function remove() {
    setPending(true);
    try {
      unwrap(await sdk.DELETE("/api/v1/goals/{id}", { params: { path: { id } } }));
      await Promise.all([
        client.invalidateQueries({ queryKey: ["goals"] }),
        client.invalidateQueries({ queryKey: ["planning"] }),
      ]);
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }

  if (query.isPending) return <Loading />;
  if (!goal) {
    return (
      <>
        <ErrorNotice error={query.error} retry={() => void query.refetch()} />
        <Empty href="/dashboard/goals" label="View goals">
          This goal is no longer active or could not be found.
        </Empty>
      </>
    );
  }

  const result = feasibility.data?.goals.find((g) => g.id === id);
  const targetNum = Number(goal.targetAmount) || 0;
  const savedNum = Number(goal.currentSavings) || 0;
  const progressPct = targetNum > 0 ? Math.min(100, Math.max(0, (savedNum / targetNum) * 100)) : 0;
  const categoryTone = CATEGORY_TONES[goal.category] ?? "neutral";

  return (
    <>
      <div className="mb-2">
        <Link
          href="/dashboard/goals"
          className="inline-flex min-h-11 items-center text-xs font-semibold text-[#5E55C9] hover:underline"
        >
          ← Back to goals
        </Link>
      </div>

      <PageTitle
        title={goal.name}
        description={`Target ${money(goal.targetAmount)} by ${date(goal.targetDate)}`}
      >
        <div className="flex items-center gap-3">
          <Badge tone={categoryTone}>
            {goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}
          </Badge>
          <Link href="/dashboard/plan" className={action}>
            Update Plan
          </Link>
        </div>
      </PageTitle>

      {/* Asymmetrical 65/35 Planning & Action Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.85fr_1fr]">
        {/* Left Column (65%): Planning & Projection */}
        <div className="space-y-6">
          <Panel title="Your progress">
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-[#475467]">Funded to date</span>
                <span className="font-semibold tabular-nums text-[#3D5C4A]">
                  {progressPct.toFixed(1)}%
                </span>
              </div>
              <div
                className="h-3 w-full overflow-hidden rounded-full bg-[#E8E1D6]/60"
                role="progressbar"
                aria-valuenow={Math.round(progressPct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${goal.name} progress`}
              >
                <div
                  className="h-full rounded-full bg-[#3D5C4A] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <dl className="grid gap-5 sm:grid-cols-2 pt-2">
              <div className="rounded-xl border border-[#E8E1D6] bg-[#FFF9F0]/30 p-4">
                <dt className="text-xs font-medium text-[#475467]">Already saved</dt>
                <dd className="mt-1 text-3xl font-serif tabular-nums text-[#1F2A44]">
                  {money(goal.currentSavings)}
                </dd>
              </div>
              <div className="rounded-xl border border-[#E8E1D6] bg-[#FFF9F0]/30 p-4">
                <dt className="text-xs font-medium text-[#475467]">Monthly contribution</dt>
                <dd className="mt-1 text-3xl font-serif tabular-nums text-[#5E55C9]">
                  {money(goal.monthlyContribution)}
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-xs text-[#475467]">
              Your target is in today’s money. The plan accounts for inflation and return assumptions when evaluating funding.
            </p>
          </Panel>

          <Panel title="Funding outlook">
            <ErrorNotice error={feasibility.error} retry={() => void feasibility.refetch()} />
            {feasibility.isPending && <Loading />}
            {result && (
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-serif tabular-nums text-[#1F2A44]">
                    {money(result.result.requiredSip)} per month required
                  </p>
                  <p className="mt-2 text-xs text-[#475467]">
                    Calculated by the planning engine. Review the assumptions in your saved plan before changing your contribution.
                  </p>
                </div>

                {result.result.futureGoalCost && (
                  <div className="rounded-xl border border-[#E8E1D6] bg-[#FFF9F0]/40 p-4 text-sm">
                    <h4 className="font-semibold text-[#1F2A44] mb-2">
                      Inflation Impact Analysis
                    </h4>
                    <dl className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <dt className="text-[#475467]">Today’s money:</dt>
                        <dd className="font-semibold tabular-nums text-[#1F2A44]">
                          {money(goal.targetAmount)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[#475467]">Future inflated cost:</dt>
                        <dd className="font-semibold tabular-nums text-[#1F2A44]">
                          {money(result.result.futureGoalCost)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[#475467]">Assumed inflation:</dt>
                        <dd className="font-semibold tabular-nums text-[#1F2A44]">
                          {result.result.annualInflationUsed ?? "6.0"}% p.a.
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>

        {/* Right Column (35%): Contribution & Actions */}
        <div className="space-y-6">
          <Panel title={editing ? "Edit goal" : "Your contribution"}>
            {editing ? (
              <div className="space-y-4">
                <GoalForm goal={goal} onSaved={() => setEditing(false)} />
                <button
                  type="button"
                  className={`${secondary} text-xs font-semibold`}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                <p className="text-3xl font-serif tabular-nums text-[#1F2A44]">
                  {money(goal.monthlyContribution)}
                </p>
                <p className="my-4 text-xs text-[#475467]">
                  Changes are saved to your inputs. Update your plan when you are ready.
                </p>
                <button
                  type="button"
                  className={secondary}
                  onClick={() => setEditing(true)}
                >
                  Edit Goal
                </button>
              </div>
            )}
          </Panel>

          <Panel title="Manage goal">
            <ErrorNotice error={error} />
            {confirm ? (
              <div className="space-y-3">
                <p className="text-sm text-[#344054]">
                  Remove this active goal? Existing saved plan versions keep their previous assumptions.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={cn(secondary, "border-[#A13F39]/40 text-[#A13F39] hover:bg-[#A13F39]/10")}
                    disabled={pending}
                    onClick={() => void remove()}
                  >
                    {pending ? "Removing…" : "Confirm removal"}
                  </button>
                  <button
                    type="button"
                    className={secondary}
                    onClick={() => setConfirm(false)}
                  >
                    Keep goal
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={cn(secondary, "border-[#A13F39]/30 text-[#A13F39] hover:bg-[#A13F39]/10")}
                onClick={() => setConfirm(true)}
              >
                Remove goal
              </button>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
