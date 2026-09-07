import Link from "next/link";
import { ArrowRight, BookOpenCheck, ReceiptText } from "lucide-react";
import { Money } from "@/components/finance/money";
import { DataStateNotice } from "@/components/finance/data-state-notice";

export interface RecordedCashFlowSummary {
  hasData?: boolean;
  totalIncome?: string | null;
  totalExpenses?: string | null;
  netCashFlow?: string | null;
  transactionCount?: number | null;
  currency?: string;
}

export interface PlannedCashFlowSummary {
  monthlyIncome?: string | null;
  totalOutflows?: string | null;
  monthlySurplus?: string | null;
}

export interface RecordedVsPlannedCardProps {
  recorded?: RecordedCashFlowSummary | null;
  planned?: PlannedCashFlowSummary | null;
  recordedError?: boolean;
}

export function RecordedVsPlannedCard({
  recorded,
  planned,
  recordedError = false,
}: RecordedVsPlannedCardProps) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-ink">Plan vs reality</p>
          <h2 className="mt-1 font-serif text-2xl text-navy">Keep planned money separate from observed money</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-ink">
            Your plan is an immutable baseline. Recorded transactions show what actually moved this month and do not silently rewrite it.
          </p>
        </div>
        <Link href="/dashboard/transactions" className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold text-purple hover:bg-purple/5">
          View ledger <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-blue/20 bg-blue/[0.035] p-4">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="size-4 text-blue" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-navy">Saved plan</h3>
          </div>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-muted-ink">Monthly income</dt>
              <dd className="font-semibold tabular-nums text-navy"><Money value={planned?.monthlyIncome} fallback="Not provided" /></dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-muted-ink">Planned outflows</dt>
              <dd className="font-semibold tabular-nums text-navy"><Money value={planned?.totalOutflows} fallback="Not provided" /></dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t pt-3">
              <dt className="text-sm font-medium text-navy">Planned surplus / deficit</dt>
              <dd className="font-semibold tabular-nums text-navy"><Money value={planned?.monthlySurplus} fallback="Not provided" /></dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-sage/20 bg-sage/[0.035] p-4">
          <div className="flex items-center gap-2">
            <ReceiptText className="size-4 text-sage" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-navy">Recorded this month</h3>
          </div>

          {recordedError ? (
            <DataStateNotice
              className="mt-4"
              tone="warning"
              title="Recorded cash flow is temporarily unavailable"
              description="Your saved plan is still valid. Open Transactions to retry the observed-money view."
            />
          ) : recorded?.hasData ? (
            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-muted-ink">Observed income</dt>
                <dd className="font-semibold tabular-nums text-navy"><Money value={recorded.totalIncome} fallback="Unavailable" /></dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-muted-ink">Observed expenses</dt>
                <dd className="font-semibold tabular-nums text-navy"><Money value={recorded.totalExpenses} fallback="Unavailable" /></dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t pt-3">
                <dt className="text-sm font-medium text-navy">Observed net cash flow</dt>
                <dd className="font-semibold tabular-nums text-navy"><Money value={recorded.netCashFlow} fallback="Unavailable" /></dd>
              </div>
              {recorded.transactionCount !== null && recorded.transactionCount !== undefined ? (
                <p className="pt-1 text-xs text-muted-ink">Based on {recorded.transactionCount} recorded transaction{recorded.transactionCount === 1 ? "" : "s"} in this period.</p>
              ) : null}
            </dl>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed bg-card p-4">
              <p className="text-sm font-semibold text-navy">No recorded transactions for this period.</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-ink">
                This is intentionally different from ₹0. Add a manual transaction or sync supported data to compare reality with your plan.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
