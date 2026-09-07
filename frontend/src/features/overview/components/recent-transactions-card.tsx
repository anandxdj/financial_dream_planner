import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, ReceiptText } from "lucide-react";
import { Money } from "@/components/finance/money";

export interface OverviewTransaction {
  id: string;
  amount: string;
  direction: "DEBIT" | "CREDIT";
  merchantName?: string | null;
  description?: string | null;
  occurredAt: string;
  status?: string;
}

export interface RecentTransactionsCardProps {
  transactions: OverviewTransaction[];
  isLoading?: boolean;
  hasError?: boolean;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function RecentTransactionsCard({ transactions, isLoading, hasError }: RecentTransactionsCardProps) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-ink">Recent money movement</p>
          <h2 className="mt-1 font-serif text-2xl text-navy">Latest recorded transactions</h2>
        </div>
        <ReceiptText className="size-5 shrink-0 text-purple" aria-hidden="true" />
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-2" aria-label="Loading recent transactions">
          {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-lg bg-surface-muted" />)}
        </div>
      ) : hasError ? (
        <div className="mt-5 rounded-xl border border-gold/25 bg-gold/5 p-4">
          <p className="text-sm font-semibold text-navy">Recent transactions are temporarily unavailable.</p>
          <p className="mt-1 text-sm text-muted-ink">Your saved plan remains available. Open the ledger to retry.</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed bg-surface-muted/35 p-4">
          <p className="text-sm font-semibold text-navy">No recorded transactions yet.</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-ink">Manual entries or supported sync data will appear here once recorded.</p>
        </div>
      ) : (
        <ul className="mt-5 divide-y">
          {transactions.slice(0, 5).map((transaction) => {
            const credit = transaction.direction === "CREDIT";
            const Icon = credit ? ArrowDownLeft : ArrowUpRight;
            const name = transaction.merchantName || transaction.description || "Transaction";
            return (
              <li key={transaction.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${credit ? "bg-sage/10 text-sage" : "bg-surface-muted text-muted-ink"}`}>
                  <Icon className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">{name}</p>
                  <p className="mt-0.5 text-xs text-muted-ink">{formatDate(transaction.occurredAt)}{transaction.status ? ` · ${transaction.status.replaceAll("_", " ")}` : ""}</p>
                </div>
                <Money
                  value={transaction.amount}
                  fallback="Unavailable"
                  className={credit ? "text-sage" : "text-navy"}
                />
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/dashboard/transactions" className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold text-purple hover:bg-purple/5">
        Open transactions <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
