import { ArrowDownRight, ArrowUpRight, ShieldCheck, WalletCards } from "lucide-react";
import { FinancialMetric } from "@/components/finance/financial-metric";
import { Money } from "@/components/finance/money";

interface CashFlowOutput {
  monthlyIncome?: string | null;
  totalOutflows?: string | null;
  monthlySurplus?: string | null;
  savingsRate?: string | number | null;
  investableCapacity?: string | null;
}

interface EmergencyFundOutput {
  runwayMonths?: string | number | null;
  currentReserves?: string | null;
  targetAmount?: string | null;
  shortfall?: string | null;
}

export interface MonthlyRealityCardProps {
  cashFlow?: CashFlowOutput | null;
  emergencyFund?: EmergencyFundOutput | null;
}

function rate(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "Not provided";
  return `${value}%`;
}

export function MonthlyRealityCard({ cashFlow, emergencyFund }: MonthlyRealityCardProps) {
  const surplusNumber = Number(cashFlow?.monthlySurplus);
  const surplusKnown = cashFlow?.monthlySurplus !== null && cashFlow?.monthlySurplus !== undefined && Number.isFinite(surplusNumber);
  const deficit = surplusKnown && surplusNumber < 0;

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-ink">Current monthly reality</p>
          <h2 className="mt-1 font-serif text-2xl text-navy">What your saved plan says today</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue/20 bg-blue/5 px-2.5 py-1 text-xs font-semibold text-blue">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Engine output
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <FinancialMetric
          label="Monthly income"
          value={<Money value={cashFlow?.monthlyIncome} fallback="Not provided" className="text-inherit" />}
          helper="Saved plan output"
          icon={<WalletCards className="size-4" />}
        />
        <FinancialMetric
          label="Planned outflows"
          value={<Money value={cashFlow?.totalOutflows} fallback="Not provided" className="text-inherit" />}
          helper="Includes the outflows present in the active plan"
          icon={<ArrowDownRight className="size-4" />}
        />
      </div>

      <div className="mt-3 rounded-xl border border-border-warm bg-surface-muted/55 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-ink">
              {deficit ? "Monthly deficit" : "Monthly free capacity"}
            </p>
            <p className={`mt-1 text-3xl font-bold tabular-nums tracking-tight ${deficit ? "text-destructive" : "text-navy"}`}>
              <Money value={cashFlow?.monthlySurplus} fallback="Not provided" className="text-inherit" />
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-ink">Savings rate</p>
              <p className="mt-0.5 font-semibold tabular-nums text-navy">{rate(cashFlow?.savingsRate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-ink">Investable capacity</p>
              <p className="mt-0.5 font-semibold tabular-nums text-navy">
                <Money value={cashFlow?.investableCapacity} fallback="Not provided" compact />
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-ink">Emergency runway</p>
          <p className="mt-1 text-base font-semibold tabular-nums text-navy">
            {emergencyFund?.runwayMonths === null || emergencyFund?.runwayMonths === undefined
              ? "Not provided"
              : `${emergencyFund.runwayMonths} months`}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-ink">Current reserves</p>
          <p className="mt-1 text-base font-semibold tabular-nums text-navy">
            <Money value={emergencyFund?.currentReserves} fallback="Not provided" compact />
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-ink">Emergency shortfall</p>
          <p className="mt-1 text-base font-semibold tabular-nums text-navy">
            <Money value={emergencyFund?.shortfall} fallback="Not provided" compact />
          </p>
        </div>
      </div>
    </section>
  );
}
