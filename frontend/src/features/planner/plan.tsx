"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { sdk } from "@/lib/sdk";
import { useCurrentPlan, unwrap } from "./queries";
import { usePlanning } from "./planning-queries";
import { useCurrentDrift } from "./decision-queries";
import {
  action,
  secondary,
  Panel,
  PageTitle,
  ErrorNotice,
  Loading,
  Empty,
  money,
  date,
} from "./ui";
import { Badge } from "@/components/ui/badge";
import { trackFunnel } from "./analytics";

const Projection = dynamic(() => import("./projection").then((m) => m.Projection), {
  loading: () => <Loading />,
});

export function Plan() {
  const query = useCurrentPlan();
  const planning = usePlanning();
  const driftQuery = useCurrentDrift();
  const client = useQueryClient();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const [updated, setUpdated] = useState(false);
  const request = useRef<{ revision: number; key: string } | null>(null);

  async function generate() {
    if (!planning.data) return;
    setPending(true);
    setError(null);
    setUpdated(false);
    const revision = planning.data.revision;
    const generationRequest =
      request.current?.revision === revision
        ? request.current
        : { revision, key: crypto.randomUUID() };
    request.current = generationRequest;
    const key = generationRequest.key;
    try {
      const result = unwrap(
        await sdk.POST("/api/v1/households/planning/generate", {
          params: { header: { "Idempotency-Key": key } },
          body: { expectedRevision: revision },
        })
      );
      client.setQueryData(["plan"], result.data);
      await client.invalidateQueries({ queryKey: ["plan"] });
      trackFunnel(query.data ? "plan_updated" : "first_plan_generated");
      setUpdated(true);
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }

  const current = query.data;
  const output = current?.snapshot.calculatedOutput;
  const projection = output?.investment?.scenarios.expected;
  const needsUpdate =
    !!current && !!planning.data && current.snapshot.revision !== planning.data.revision;
  const pendingDrift = driftQuery.data?.status === "pending" ? driftQuery.data : null;

  return (
    <>
      {/* Narrative Header */}
      <PageTitle
        title="Your plan"
        description={
          current
            ? `Version ${current.currentVersion.versionNumber} · Generated ${date(
                current.currentVersion.createdAt
              )}`
            : "Turn your saved inputs into a plan you can revisit."
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link className={secondary} href="/dashboard/plan/history">
            Plan history
          </Link>
          <Link className={secondary} href="/onboarding">
            Edit financial inputs
          </Link>
        </div>
      </PageTitle>

      <ErrorNotice error={query.error} retry={() => void query.refetch()} />
      {query.isPending && <Loading />}
      <ErrorNotice error={planning.error} retry={() => void planning.refetch()} />
      <ErrorNotice error={driftQuery.error} retry={() => void driftQuery.refetch()} />

      {/* Conditional Drift Alert Banner (Release 2 Feature) */}
      {pendingDrift && (
        <div
          role="status"
          className="mb-6 rounded-2xl border border-[#7D5200] bg-[#FFF9F0] p-5 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-[#7D5200] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-medium text-[#1F2A44]">
                  Observed drift detected against active plan
                </h2>
                <p className="mt-1 text-sm text-[#475467]">
                  Recorded activity differs from your saved baseline. Your baseline remains strictly unchanged until you review.
                </p>
              </div>
            </div>
            <Link className={action} href={`/dashboard/plan/review/${pendingDrift.id}`}>
              Review drift findings
            </Link>
          </div>
        </div>
      )}

      {/* Conditional Stale Alert Banner */}
      {needsUpdate && (
        <div
          role="status"
          className="mb-6 rounded-2xl border border-[#7D5200] bg-[#FFF9F0] p-5 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-[#7D5200] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-2xl font-serif text-[#1F2A44]">Your plan needs updating</h2>
              <p className="mt-2 text-sm text-[#344054]">
                Your saved inputs have changed. Review them, then generate a new version when you are ready.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plan Generation / Update Trigger Panel */}
      <Panel title={current ? "Update your saved plan" : "Generate your first plan"}>
        <p className="mb-4 text-sm text-[#475467]">
          Generation uses your saved financial inputs and chosen goal contributions. The current version stays available until the new version succeeds.
        </p>
        <button
          type="button"
          className={action}
          disabled={pending || !planning.data}
          onClick={() => void generate()}
        >
          {pending ? "Generating your plan…" : current ? "Update Plan" : "Generate my plan"}
        </button>
        <ErrorNotice error={error} />
        {updated && (
          <p role="status" className="mt-3 text-sm font-semibold text-[#3D5C4A]">
            Your new plan version is saved.
          </p>
        )}
      </Panel>

      {/* Populated Plan Narrative Hierarchy */}
      {current ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* 1. Planned Monthly Cash Flow */}
          <Panel title="Planned monthly money">
            <dl className="space-y-4">
              {[
                ["Income", output?.cashFlow?.monthlyIncome],
                ["Total outflows", output?.cashFlow?.totalOutflows],
                ["Monthly surplus", output?.cashFlow?.monthlySurplus],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E1D6]/60 pb-3"
                >
                  <dt className="text-sm text-[#475467]">{label}</dt>
                  <dd className="text-lg font-semibold tabular-nums text-[#1F2A44]">
                    {money(value)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-xs text-[#475467]">
              These are planning inputs, separate from recorded transaction totals.
            </p>
          </Panel>

          {/* 2. Emergency Savings & Runway */}
          <Panel title="Emergency savings">
            <dl className="space-y-4">
              <div className="rounded-xl border border-[#E8E1D6] bg-[#FFF9F0]/30 p-4">
                <dt className="text-xs font-medium text-[#475467]">Current reserve</dt>
                <dd className="mt-1 text-2xl font-serif tabular-nums text-[#1F2A44]">
                  {money(output?.emergencyFund?.currentReserves)}
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E1D6]/60 pb-2">
                <dt className="text-sm text-[#475467]">Coverage</dt>
                <dd className="text-base font-medium text-[#1F2A44]">
                  {output?.emergencyFund?.runwayMonths
                    ? `${output.emergencyFund.runwayMonths} months`
                    : "Not available"}
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E1D6]/60 pb-2">
                <dt className="text-sm text-[#475467]">Funding shortfall</dt>
                <dd className="text-base font-semibold tabular-nums text-[#1F2A44]">
                  {money(output?.emergencyFund?.shortfall)}
                </dd>
              </div>
            </dl>
          </Panel>

          {/* 3. Long-Term Projection & Milestone Roadmap */}
          <Panel title="Projection" className="lg:col-span-2">
            {projection ? (
              <Projection
                points={projection.milestones.map((p) => ({
                  month: p.month,
                  value: p.futureValue,
                }))}
                summary={`Expected investment value ${money(
                  projection.futureValue
                )}. Assumed annual return ${
                  projection.annualRate
                }%. This is a projection, not a guaranteed outcome.`}
              />
            ) : (
              <Empty href="/onboarding" label="Review investment inputs">
                Add investment amounts and a time horizon to see a projection.
              </Empty>
            )}
          </Panel>

          {/* 4. Completeness, Missing Inputs & Estimates */}
          <Panel title="Completeness and estimates">
            <div className="mb-3 flex items-center gap-2">
              <Badge
                tone={current.snapshot.completeness.status === "complete" ? "sage" : "gold"}
                dot
              >
                {current.snapshot.completeness.status === "complete"
                  ? "Required inputs complete"
                  : "Some inputs missing"}
              </Badge>
            </div>
            <p className="text-sm text-[#344054]">
              {current.snapshot.completeness.status === "complete"
                ? "The engine has the required inputs for the calculated sections."
                : "Some inputs are missing. Available sections are shown with their assumptions."}
            </p>
            {current.snapshot.completeness.missing.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-[#7D5200]">Missing parameters:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-[#475467]">
                  {current.snapshot.completeness.missing.map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
              </div>
            )}
            {current.snapshot.completeness.warnings.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-[#7D5200]">Engine notices:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-[#475467]">
                  {current.snapshot.completeness.warnings.map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
              </div>
            )}
            {Boolean(planning.data?.estimates.length) && (
              <p className="mt-4 text-xs text-[#7D5200] font-medium">
                Estimated inputs: {planning.data?.estimates.join(", ")}
              </p>
            )}
          </Panel>

          {/* 5. Calculation Assumptions & Policy Audit */}
          <Panel title="Calculation assumptions">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-[#E8E1D6]/60 pb-2">
                <dt className="text-[#475467]">Policy version</dt>
                <dd className="font-semibold text-[#1F2A44]">{current.snapshot.policyVersion}</dd>
              </div>
              <div className="flex justify-between border-b border-[#E8E1D6]/60 pb-2">
                <dt className="text-[#475467]">General inflation</dt>
                <dd className="font-semibold tabular-nums text-[#1F2A44]">
                  {current.snapshot.resolvedAssumptions.generalInflation}%
                </dd>
              </div>
              <div className="flex justify-between border-b border-[#E8E1D6]/60 pb-2">
                <dt className="text-[#475467]">Expected annual return</dt>
                <dd className="font-semibold tabular-nums text-[#1F2A44]">
                  {current.snapshot.resolvedAssumptions.returns.expected}%
                </dd>
              </div>
              <div className="flex justify-between pt-1">
                <dt className="text-[#475467]">Source</dt>
                <dd className="text-xs text-[#475467]">
                  Manually saved inputs as of {date(current.snapshot.asOf)}
                </dd>
              </div>
            </dl>
            <Link href="/dashboard/goals" className={`${secondary} mt-5 text-xs font-semibold`}>
              Review goals
            </Link>
          </Panel>
        </div>
      ) : (
        !query.isPending && (
          <Empty href="/onboarding" label="Review your inputs">
            You do not have a saved plan yet. Start with your goals and monthly money.
          </Empty>
        )
      )}
    </>
  );
}
