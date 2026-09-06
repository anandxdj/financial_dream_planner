"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/sdk";
import { unwrap } from "@/features/planner/queries";
import type { Goal } from "@/features/planner/planning-queries";
import { demoStore } from "@/lib/demo-store";
import {
  action,
  control,
  Field,
  ErrorNotice,
} from "@/features/planner/ui";
import { cn } from "@/lib/utils";

export function GoalForm({
  goal,
  onSaved,
}: {
  goal?: Goal;
  onSaved: () => void;
}) {
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
      if (demoStore.isDemoMode()) {
        if (goal) {
          demoStore.updateGoal(goal.id, body);
          try {
            await sdk.PATCH("/api/v1/goals/{id}", {
              params: { path: { id: goal.id } },
              body: { ...body, expectedRevision: goal.revision },
            });
          } catch {
            // Best-effort in demo mode
          }
        } else {
          demoStore.addGoal(body);
          try {
            await sdk.POST("/api/v1/goals", { body });
          } catch {
            // Best-effort in demo mode
          }
        }
      } else {
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
      }
      await Promise.all([
        client.invalidateQueries({ queryKey: ["goals"] }),
        client.invalidateQueries({ queryKey: ["goals", "feasibility"] }),
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
      <Field
        label="Goal name"
        name="name"
        required
        maxLength={100}
        defaultValue={goal?.name}
      />
      <div className="space-y-1.5">
        <label
          htmlFor="goal-category"
          className="block text-sm font-semibold text-[#1F2A44]"
        >
          Goal category
        </label>
        <select
          id="goal-category"
          className={cn(control, "bg-[#FFFCF8] text-base capitalize")}
          name="category"
          defaultValue={goal?.category ?? "savings"}
        >
          {[
            "home",
            "car",
            "travel",
            "savings",
            "education",
            "medical",
            "retirement",
            "custom",
          ].map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
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
      <Field
        label="Target date"
        name="targetDate"
        type="date"
        required
        defaultValue={goal?.targetDate}
      />
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
