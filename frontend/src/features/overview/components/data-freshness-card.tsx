import Link from "next/link";
import { ArrowRight, Database, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface DataFreshnessCardProps {
  planVersion?: number | null;
  planAsOf?: string | Date | null;
  engineVersion?: string | null;
  policyVersion?: string | null;
  completenessStatus?: string | null;
  missingCount?: number;
  accountCount: number;
  planningUpdatedAt?: string | Date | null;
  stale: boolean;
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "Not available";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function DataFreshnessCard({
  planVersion,
  planAsOf,
  engineVersion,
  policyVersion,
  completenessStatus,
  missingCount = 0,
  accountCount,
  planningUpdatedAt,
  stale,
}: DataFreshnessCardProps) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-ink">Sources & freshness</p>
          <h2 className="mt-1 font-serif text-2xl text-navy">Know what each summary is based on</h2>
        </div>
        <Database className="size-5 shrink-0 text-blue" aria-hidden="true" />
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-blue" aria-hidden="true" />
              <p className="text-sm font-semibold text-navy">Active plan snapshot</p>
            </div>
            <Badge tone={stale ? "gold" : "sage"} size="sm" dot>
              {stale ? "Inputs changed" : "Current"}
            </Badge>
          </div>
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div><dt className="text-muted-ink">Version</dt><dd className="mt-0.5 font-semibold text-navy">{planVersion ? `v${planVersion}` : "Not generated"}</dd></div>
            <div><dt className="text-muted-ink">Snapshot as of</dt><dd className="mt-0.5 font-semibold text-navy">{formatDate(planAsOf)}</dd></div>
            <div><dt className="text-muted-ink">Engine</dt><dd className="mt-0.5 font-semibold text-navy">{engineVersion || "Not available"}</dd></div>
            <div><dt className="text-muted-ink">Policy</dt><dd className="mt-0.5 font-semibold text-navy">{policyVersion || "Not available"}</dd></div>
          </dl>
        </div>

        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="size-4 text-sage" aria-hidden="true" />
            <p className="text-sm font-semibold text-navy">Saved planning inputs</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={completenessStatus === "complete" ? "sage" : "gold"} size="sm">
              {completenessStatus === "complete" ? "Required inputs provided" : `${missingCount} missing field${missingCount === 1 ? "" : "s"}`}
            </Badge>
            <Badge tone="neutral" size="sm">{accountCount} recorded account{accountCount === 1 ? "" : "s"}</Badge>
          </div>
          <p className="mt-3 text-xs text-muted-ink">Planning inputs last changed {formatDate(planningUpdatedAt)}.</p>
        </div>
      </div>

      <Link href="/onboarding" className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold text-purple hover:bg-purple/5">
        Review financial inputs <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
