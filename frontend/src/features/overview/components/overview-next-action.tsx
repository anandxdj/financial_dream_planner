import Link from "next/link";
import { ArrowRight, CircleAlert, Compass, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OverviewNextActionProps {
  hasPlan: boolean;
  stale: boolean;
  overAllocated?: boolean;
}

export function OverviewNextAction({ hasPlan, stale, overAllocated }: OverviewNextActionProps) {
  const state = !hasPlan
    ? {
        eyebrow: "Build your baseline",
        title: "Your financial command center starts with one saved plan.",
        description:
          "Add the goals and monthly money you know today. Missing details can stay explicitly unrecorded until you are ready.",
        href: "/onboarding",
        label: "Build my plan",
        icon: Compass,
        className: "border-blue/25 bg-blue/5",
      }
    : stale
      ? {
          eyebrow: "Plan needs review",
          title: "Your saved inputs changed after this plan was generated.",
          description:
            "Your active plan is still intact. Review the newer inputs before generating another immutable version.",
          href: "/dashboard/plan",
          label: "Review plan drift",
          icon: CircleAlert,
          className: "border-gold/30 bg-gold/5",
        }
      : overAllocated
        ? {
            eyebrow: "Capacity needs attention",
            title: "Your goal contributions need a trade-off review.",
            description:
              "The backend feasibility check found that your selected goal contributions exceed available capacity. Review goals before updating the plan.",
            href: "/dashboard/goals",
            label: "Review goals",
            icon: Target,
            className: "border-gold/30 bg-gold/5",
          }
        : {
            eyebrow: "Plan is current",
            title: "Your next useful step is to compare the plan with real money movement.",
            description:
              "Review recorded transactions and balances when your income, expenses, accounts, or goals change materially.",
            href: "/dashboard/transactions",
            label: "Review money reality",
            icon: Compass,
            className: "border-sage/25 bg-sage/5",
          };

  const Icon = state.icon;

  return (
    <section className={cn("rounded-2xl border p-5 sm:p-6", state.className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.09em] text-muted-ink">
            <Icon className="size-4" aria-hidden="true" />
            <span>{state.eyebrow}</span>
          </div>
          <h2 className="mt-2 font-serif text-2xl leading-tight text-navy sm:text-3xl">{state.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-ink sm:text-base">{state.description}</p>
        </div>
        <Link
          href={state.href}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy/90"
        >
          {state.label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
