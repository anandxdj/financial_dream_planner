"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/sdk";
import { useCurrentPlan, unwrap } from "./queries";
import { usePlanHistory, useCurrentDrift, useDriftEvents } from "./decision-queries";
import { action, secondary, Panel, PageTitle, ErrorNotice, Loading, Empty, money, date } from "./ui";
import { Badge } from "@/components/planner/badge";

export function PlanHistory() {
  const currentPlanQuery = useCurrentPlan();
  const historyQuery = usePlanHistory();
  const currentDriftQuery = useCurrentDrift();
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const historyItems = historyQuery.data?.data ?? [];
  const current = currentPlanQuery.data;
  const currentOutput = current?.snapshot.calculatedOutput;
  const pendingDrift = currentDriftQuery.data?.status === "pending" ? currentDriftQuery.data : null;

  const selectedItem = historyItems.find((item) => item.version.id === selectedVersionId);
  const selectedOutput = selectedItem?.snapshot.calculatedOutput;

  return (
    <>
      <PageTitle
        title="Plan history and drift"
        description="Review past saved versions and drift detected against your baseline. Viewing history does not mutate your active plan."
      >
        <Link className={secondary} href="/dashboard/plan">
          Back to current plan
        </Link>
      </PageTitle>

      <ErrorNotice error={currentPlanQuery.error} retry={() => void currentPlanQuery.refetch()} />
      <ErrorNotice error={historyQuery.error} retry={() => void historyQuery.refetch()} />
      <ErrorNotice error={currentDriftQuery.error} retry={() => void currentDriftQuery.refetch()} />

      {(currentPlanQuery.isPending || historyQuery.isPending) && <Loading />}

      {pendingDrift && (
        <div
          role="status"
          className="mb-6 rounded-2xl border border-[#8A531D] bg-[#E6B46A]/15 p-5 text-[#1F2A44]"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="warning" dot size="sm">
                  Drift Detected
                </Badge>
                <h2 className="text-xl font-medium">Recorded activity has diverged from your plan</h2>
              </div>
              <p className="mt-1 text-sm text-[#475467]">
                Observed cash flow and balances differ from your saved baseline. Your baseline remains strictly unchanged until you explicitly review and accept the drift.
              </p>
            </div>
            <Link className={action} href={`/dashboard/plan/review/${pendingDrift.id}`}>
              Review drift findings
            </Link>
          </div>
        </div>
      )}

      {current && (
        <Panel title={`Active Baseline — Version ${current.currentVersion.versionNumber}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <p className="text-xs text-[#475467]">
              Created {date(current.currentVersion.createdAt)} · Snapshot revision {current.snapshot.revision}
            </p>
            <Badge tone="sage">Active Baseline</Badge>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-[#FFF9F0]/60 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                Planned Income
              </dt>
              <dd className="mt-1 text-2xl font-normal tabular-nums text-[#1F2A44]">
                {money(currentOutput?.cashFlow?.monthlyIncome)}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-[#FFF9F0]/60 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                Planned Outflows
              </dt>
              <dd className="mt-1 text-2xl font-normal tabular-nums text-[#1F2A44]">
                {money(currentOutput?.cashFlow?.totalOutflows)}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-[#FFF9F0]/60 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                Monthly Surplus
              </dt>
              <dd className="mt-1 text-2xl font-normal tabular-nums text-[#1F2A44]">
                {money(currentOutput?.cashFlow?.monthlySurplus)}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-[#FFF9F0]/60 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                Emergency Coverage
              </dt>
              <dd className="mt-1 text-2xl font-normal tabular-nums text-[#1F2A44]">
                {currentOutput?.emergencyFund?.runwayMonths
                  ? `${currentOutput.emergencyFund.runwayMonths} mo`
                  : "Not available"}
              </dd>
            </div>
          </dl>
        </Panel>
      )}

      {selectedItem && (
        <section
          aria-label="Version comparison"
          className="mt-6 rounded-2xl border-2 border-[#5E55C9] bg-[#FFFCF8] p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-medium text-[#1F2A44]">
                Comparing Version {selectedItem.version.versionNumber} with Active Baseline
              </h2>
              <p className="text-xs text-[#475467]">
                Saved {date(selectedItem.version.createdAt)} · Traceable Revision {selectedItem.snapshot.revision}
              </p>
            </div>
            <button
              type="button"
              className={secondary}
              onClick={() => setSelectedVersionId(null)}
            >
              Close comparison
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">
                Comparison between Version {selectedItem.version.versionNumber} and active baseline
              </caption>
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-[#475467]">
                  <th scope="col" className="p-3">Financial Metric</th>
                  <th scope="col" className="p-3">Version {selectedItem.version.versionNumber}</th>
                  <th scope="col" className="p-3">Active Baseline</th>
                  <th scope="col" className="p-3">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                <tr>
                  <th scope="row" className="p-3 font-medium">Monthly Income</th>
                  <td className="p-3 tabular-nums">{money(selectedOutput?.cashFlow?.monthlyIncome)}</td>
                  <td className="p-3 tabular-nums">{money(currentOutput?.cashFlow?.monthlyIncome)}</td>
                  <td className="p-3 tabular-nums font-semibold">
                    {formatDelta(selectedOutput?.cashFlow?.monthlyIncome, currentOutput?.cashFlow?.monthlyIncome)}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-medium">Total Outflows</th>
                  <td className="p-3 tabular-nums">{money(selectedOutput?.cashFlow?.totalOutflows)}</td>
                  <td className="p-3 tabular-nums">{money(currentOutput?.cashFlow?.totalOutflows)}</td>
                  <td className="p-3 tabular-nums font-semibold">
                    {formatDelta(selectedOutput?.cashFlow?.totalOutflows, currentOutput?.cashFlow?.totalOutflows)}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-medium">Monthly Surplus</th>
                  <td className="p-3 tabular-nums">{money(selectedOutput?.cashFlow?.monthlySurplus)}</td>
                  <td className="p-3 tabular-nums">{money(currentOutput?.cashFlow?.monthlySurplus)}</td>
                  <td className="p-3 tabular-nums font-semibold">
                    {formatDelta(selectedOutput?.cashFlow?.monthlySurplus, currentOutput?.cashFlow?.monthlySurplus)}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-medium">Emergency Reserves</th>
                  <td className="p-3 tabular-nums">{money(selectedOutput?.emergencyFund?.currentReserves)}</td>
                  <td className="p-3 tabular-nums">{money(currentOutput?.emergencyFund?.currentReserves)}</td>
                  <td className="p-3 tabular-nums font-semibold">
                    {formatDelta(selectedOutput?.emergencyFund?.currentReserves, currentOutput?.emergencyFund?.currentReserves)}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-medium">Runway Coverage</th>
                  <td className="p-3">{selectedOutput?.emergencyFund?.runwayMonths ? `${selectedOutput.emergencyFund.runwayMonths} months` : "N/A"}</td>
                  <td className="p-3">{currentOutput?.emergencyFund?.runwayMonths ? `${currentOutput.emergencyFund.runwayMonths} months` : "N/A"}</td>
                  <td className="p-3 text-muted-foreground">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-[#475467]">
            Historical version outputs are immutable snapshots. Comparing does not alter current baseline or any saved inputs.
          </p>
        </section>
      )}

      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-serif font-normal text-[#1F2A44]">Saved version history</h2>
        {historyItems.length === 0 && !historyQuery.isPending && (
          <Empty href="/dashboard/plan" label="Go to plan">
            No saved plan versions recorded yet. Generate your first plan to start tracking version history.
          </Empty>
        )}

        <div className="divide-y divide-border rounded-2xl border border-border bg-[#FFFCF8] overflow-hidden">
          {historyItems.map((item) => {
            const isCurrent = item.version.id === current?.currentVersion.id;
            const isSelected = item.version.id === selectedVersionId;
            const out = item.snapshot.calculatedOutput;

            return (
              <div
                key={item.version.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 hover:bg-[#FFF9F0]/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1F2A44]">
                      Version {item.version.versionNumber}
                    </span>
                    {isCurrent ? (
                      <Badge tone="sage" size="sm">Current</Badge>
                    ) : (
                      <Badge tone="neutral" size="sm">
                        v{item.version.versionNumber}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#475467]">
                    Generated {date(item.version.createdAt)} · Revision {item.snapshot.revision} · Policy {item.snapshot.policyVersion}
                  </p>
                  <p className="text-xs text-[#344054]">
                    Surplus: <span className="tabular-nums font-semibold">{money(out?.cashFlow?.monthlySurplus)}</span> · Emergency runway: {out?.emergencyFund?.runwayMonths ? `${out.emergencyFund.runwayMonths} mo` : "N/A"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isCurrent && (
                    <button
                      type="button"
                      className={secondary}
                      onClick={() =>
                        setSelectedVersionId(isSelected ? null : item.version.id)
                      }
                      aria-pressed={isSelected}
                    >
                      {isSelected ? "Hide comparison" : "Compare with baseline"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

export function DriftReview({ id }: { id: string }) {
  const client = useQueryClient();
  const currentPlanQuery = useCurrentPlan();
  const driftListQuery = useDriftEvents();
  const currentDriftQuery = useCurrentDrift();

  const [confirmAccept, setConfirmAccept] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const driftEvent =
    driftListQuery.data?.find((e) => e.id === id) ||
    (currentDriftQuery.data?.id === id ? currentDriftQuery.data : null);

  const currentPlan = currentPlanQuery.data;

  async function handleAccept() {
    setActionPending(true);
    setActionError(null);
    try {
      const res = unwrap(
        await sdk.POST("/api/v1/drift/{id}/accept", {
          params: { path: { id } },
        })
      );
      client.setQueryData(["plan"], {
        plan: res.data.plan,
        currentVersion: res.data.version,
        snapshot: res.data.snapshot,
      });
      await Promise.all([
        client.invalidateQueries({ queryKey: ["plan"] }),
        client.invalidateQueries({ queryKey: ["drift"] }),
      ]);
      setActionSuccess(
        `Drift accepted! New Plan Version ${res.data.version.versionNumber} has been created and activated.`
      );
      setConfirmAccept(false);
    } catch (err) {
      setActionError(err);
    } finally {
      setActionPending(false);
    }
  }

  async function handleKeep() {
    setActionPending(true);
    setActionError(null);
    try {
      unwrap(
        await sdk.POST("/api/v1/drift/{id}/keep", {
          params: { path: { id } },
        })
      );
      await Promise.all([
        client.invalidateQueries({ queryKey: ["drift"] }),
      ]);
      setActionSuccess("Drift dismissed. Your active baseline was kept intact.");
    } catch (err) {
      setActionError(err);
    } finally {
      setActionPending(false);
    }
  }

  if (driftListQuery.isPending && !driftEvent) return <Loading />;

  if (!driftEvent) {
    return (
      <>
        <PageTitle title="Drift review" description="Review divergence between recorded reality and your plan baseline." />
        <ErrorNotice error={driftListQuery.error} retry={() => void driftListQuery.refetch()} />
        <Empty href="/dashboard/plan/history" label="View plan history">
          The requested drift event could not be found or has expired.
        </Empty>
      </>
    );
  }

  const isPending = driftEvent.status === "pending";

  return (
    <>
      <PageTitle
        title="Drift review"
        description={`Event ID ${driftEvent.id.slice(0, 8)}… · Detected ${date(driftEvent.createdAt)}`}
      >
        <Link className={secondary} href="/dashboard/plan/history">
          Back to plan history
        </Link>
      </PageTitle>

      <ErrorNotice error={actionError} />

      {actionSuccess && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-[#3D5C4A] bg-[#7CA690]/15 p-5 text-[#3D5C4A]"
        >
          <p className="font-medium">{actionSuccess}</p>
          <Link className={`${action} mt-3`} href="/dashboard/plan">
            View updated plan
          </Link>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-border bg-[#FFFCF8] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-[#475467]">
              Current Drift Status
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-serif text-[#1F2A44]">
                {driftEvent.status === "pending"
                  ? "Pending decision"
                  : driftEvent.status === "accepted"
                  ? "Drift accepted into new version"
                  : "Baseline kept (drift dismissed)"}
              </h2>
              <Badge
                tone={
                  driftEvent.status === "pending"
                    ? "warning"
                    : driftEvent.status === "accepted"
                    ? "sage"
                    : "neutral"
                }
              >
                {driftEvent.status}
              </Badge>
            </div>
          </div>
          <p className="max-w-md text-xs text-[#475467]">
            Baseline unchanged rule: Your baseline is never modified without your consent. You decide whether to create a new plan version or maintain your baseline.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Observed drift findings">
            <p className="mb-4 text-xs text-[#475467]">
              {driftEvent.findings.length} divergence(s) identified against baseline version
            </p>
            {driftEvent.findings.length === 0 ? (
              <p className="text-muted-foreground">No material drift findings recorded for this event.</p>
            ) : (
              <div className="space-y-4">
                {driftEvent.findings.map((f, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-[#FFF9F0]/50 p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          tone={
                            f.severity === "critical"
                              ? "danger"
                              : f.severity === "warning"
                              ? "warning"
                              : "blue"
                          }
                          size="sm"
                        >
                          {f.severity}
                        </Badge>
                        <span className="font-semibold text-[#1F2A44] capitalize">
                          {f.code.replace(/_/g, " ")}
                        </span>
                      </div>
                      {f.relativeDelta && (
                        <span className="text-xs font-semibold tabular-nums text-[#344054]">
                          Delta: {f.relativeDelta}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#344054]">{f.description}</p>
                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-border">
                      <div>
                        <span className="text-[#475467] block">Baseline expectation</span>
                        <span className="font-medium tabular-nums text-[#1F2A44]">
                          {money(f.baselineValue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#475467] block">Observed reality</span>
                        <span className="font-medium tabular-nums text-[#1F2A44]">
                          {money(f.observedValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Make your decision">
            <p className="mb-4 text-xs text-[#475467]">Choose how to handle this drift event</p>
            {isPending ? (
              <div className="space-y-4">
                <p className="text-sm text-[#475467]">
                  Accepting creates a new traceable plan version incorporating these observed changes. Your previous baseline is archived.
                </p>
                {confirmAccept ? (
                  <div className="rounded-xl border border-[#5E55C9] bg-[#5E55C9]/10 p-4 space-y-3">
                    <p className="text-sm font-semibold text-[#1F2A44]">
                      Confirm update to live plan?
                    </p>
                    <p className="text-xs text-[#344054]">
                      This will generate a new immutable plan version. Baseline Version {currentPlan?.currentVersion.versionNumber} will remain in history.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={action}
                        disabled={actionPending}
                        onClick={() => void handleAccept()}
                      >
                        {actionPending ? "Updating…" : "Confirm & Accept"}
                      </button>
                      <button
                        type="button"
                        className={secondary}
                        disabled={actionPending}
                        onClick={() => setConfirmAccept(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      className={`${action} w-full`}
                      onClick={() => setConfirmAccept(true)}
                    >
                      Accept drift and create new version
                    </button>
                    <button
                      type="button"
                      className={`${secondary} w-full`}
                      disabled={actionPending}
                      onClick={() => void handleKeep()}
                    >
                      {actionPending ? "Dismissing…" : "Keep current baseline"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-sm text-[#475467]">
                <p>
                  This drift event was resolved on {date(driftEvent.resolvedAt)}.
                </p>
                {driftEvent.createdVersionId && (
                  <p className="font-medium text-[#1F2A44]">
                    Created version ID: {driftEvent.createdVersionId}
                  </p>
                )}
                <Link className={`${secondary} mt-3 inline-block`} href="/dashboard/plan">
                  Return to active plan
                </Link>
              </div>
            )}
          </Panel>

          <Panel title="Active baseline reference">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#475467]">Version</dt>
                <dd className="font-medium text-[#1F2A44]">
                  Version {currentPlan?.currentVersion.versionNumber ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#475467]">As of date</dt>
                <dd className="font-medium text-[#1F2A44]">
                  {date(currentPlan?.snapshot.asOf)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#475467]">Monthly surplus</dt>
                <dd className="font-medium tabular-nums text-[#1F2A44]">
                  {money(currentPlan?.snapshot.calculatedOutput.cashFlow?.monthlySurplus)}
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}

function formatDelta(oldVal: string | null | undefined, currentVal: string | null | undefined): string {
  if (!oldVal || !currentVal) return "—";
  const o = Number(oldVal);
  const c = Number(currentVal);
  if (isNaN(o) || isNaN(c)) return "—";
  const diff = c - o;
  if (diff === 0) return "No change";
  const sign = diff > 0 ? "+" : "-";
  return `${sign}${money(String(Math.abs(diff)))}`;
}
