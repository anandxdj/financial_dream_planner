import Link from "next/link";
import { ArrowRight, CalendarDays, Target } from "lucide-react";
import { Money } from "@/components/finance/money";

export interface OverviewGoalSummary {
  id: string;
  name: string;
  targetAmount: string;
  currentSavings: string;
  monthlyContribution: string;
  targetDate: string;
}

export interface GoalsRoadmapCardProps {
  goals: OverviewGoalSummary[];
}

function formatTargetDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "Date not provided";
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function GoalsRoadmapCard({ goals }: GoalsRoadmapCardProps) {
  const orderedGoals = [...goals]
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
    .slice(0, 3);

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-ink">Goal roadmap</p>
          <h2 className="mt-1 font-serif text-2xl text-navy">What your money is working toward</h2>
        </div>
        <Link href="/dashboard/goals" className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold text-purple hover:bg-purple/5">
          View goals <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {orderedGoals.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed bg-surface-muted/35 p-5">
          <Target className="size-5 text-purple" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-navy">No active goals recorded yet.</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-ink">
            Add up to three goals so your plan can show what each monthly contribution is meant to achieve.
          </p>
          <Link href="/dashboard/goals" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-navy px-4 text-sm font-semibold text-white">
            Add a goal <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <ol className="mt-5 space-y-3">
          {orderedGoals.map((goal, index) => (
            <li key={goal.id}>
              <Link
                href={`/dashboard/goals/${goal.id}`}
                className="group grid gap-4 rounded-xl border p-4 transition-colors hover:border-purple/30 hover:bg-purple/[0.025] sm:grid-cols-[auto_1fr_auto] sm:items-center"
              >
                <div className="flex size-9 items-center justify-center rounded-full border bg-surface-muted text-sm font-bold text-navy">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="truncate text-sm font-semibold text-navy">{goal.name}</h3>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-ink">
                      <CalendarDays className="size-3.5" aria-hidden="true" />
                      {formatTargetDate(goal.targetDate)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-ink">
                    <span>
                      Saved <Money value={goal.currentSavings} compact fallback="Not recorded" />
                    </span>
                    <span>
                      Target <Money value={goal.targetAmount} compact fallback="Not provided" />
                    </span>
                    <span>
                      Monthly <Money value={goal.monthlyContribution} compact fallback="Not recorded" />
                    </span>
                  </div>
                </div>
                <ArrowRight className="hidden size-4 text-muted-ink transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
