"use client";

import { useQuery } from "@tanstack/react-query";
import { sdk } from "@/lib/sdk";
import { demoStore } from "@/lib/demo-store";
import { unwrap } from "./queries";

export function usePlanning() {
  return useQuery({
    queryKey: ["planning"],
    queryFn: async () => {
      if (demoStore.isDemoMode()) return demoStore.getPlanning();
      const res = await sdk.GET("/api/v1/households/planning");
      return unwrap(res).data;
    },
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      if (demoStore.isDemoMode()) {
        const demoGoals = demoStore.getGoals();

        try {
          const res = await sdk.GET("/api/v1/goals");
          if (res.response.ok) {
            const serverGoals = unwrap(res).data ?? [];
            let updated = false;
            for (const sg of serverGoals) {
              const exists = demoStore.getGoals().some(
                (dg) => dg.id === sg.id || dg.name.trim().toLowerCase() === sg.name.trim().toLowerCase(),
              );
              if (!exists && demoStore.getGoals().length < 3) {
                demoStore.addGoal({
                  name: sg.name,
                  category: sg.category as Goal["category"],
                  targetAmount: String(sg.targetAmount),
                  targetDate: sg.targetDate,
                  currentSavings: String(sg.currentSavings),
                  monthlyContribution: String(sg.monthlyContribution),
                });
                updated = true;
              }
            }
            if (updated) return demoStore.getGoals();
          }
        } catch {
          // Explicit demo mode remains available even if backend sync fails.
        }

        return demoGoals;
      }

      const res = await sdk.GET("/api/v1/goals");
      return unwrap(res).data ?? [];
    },
  });
}

export function useFeasibility() {
  return useQuery({
    queryKey: ["goals", "feasibility"],
    queryFn: async () => {
      if (demoStore.isDemoMode()) return demoStore.getFeasibility();
      const res = await sdk.GET("/api/v1/goals/feasibility");
      return unwrap(res).data;
    },
  });
}

export function useGoalContributions(goalId: string) {
  return useQuery({
    queryKey: ["goals", goalId, "contributions"],
    queryFn: async () => demoStore.getGoalContributions(goalId),
    enabled: demoStore.isDemoMode() && Boolean(goalId),
  });
}

export type Planning = NonNullable<ReturnType<typeof usePlanning>["data"]>;
export type Inputs = Planning["inputs"];
export type Goal = NonNullable<ReturnType<typeof useGoals>["data"]>[number];
