"use client";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "@/lib/sdk";
import { demoStore } from "@/lib/demo-store";
import { unwrap } from "./queries";

export function usePlanning() {
  return useQuery({
    queryKey: ["planning"],
    queryFn: async () => {
      if (demoStore.isDemoMode()) {
        return demoStore.getPlanning();
      }
      try {
        const res = await sdk.GET("/api/v1/households/planning");
        if (res.response.ok) {
          return unwrap(res).data;
        }
      } catch {
        // Fallback
      }
      return demoStore.getPlanning();
    },
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      if (demoStore.isDemoMode()) {
        const demoGoals = demoStore.getGoals();

        // Check if there are any backend goals for the active user that need to be synchronized into demoStore
        try {
          const res = await sdk.GET("/api/v1/goals");
          if (res.response.ok) {
            const serverGoals = unwrap(res).data ?? [];
            let updated = false;
            for (const sg of serverGoals) {
              const exists = demoStore.getGoals().some(
                (dg) => dg.id === sg.id || dg.name.trim().toLowerCase() === sg.name.trim().toLowerCase()
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
            if (updated) {
              return demoStore.getGoals();
            }
          }
        } catch {
          // Ignore backend sync failure in demo mode
        }

        return demoGoals;
      }

      try {
        const res = await sdk.GET("/api/v1/goals");
        if (res.response.ok) {
          const data = unwrap(res).data;
          return data ?? [];
        }
      } catch {
        // Fallback
      }
      return [];
    },
  });
}

export function useFeasibility() {
  return useQuery({
    queryKey: ["goals", "feasibility"],
    queryFn: async () => {
      if (demoStore.isDemoMode()) {
        return demoStore.getFeasibility();
      }
      try {
        const res = await sdk.GET("/api/v1/goals/feasibility");
        if (res.response.ok) {
          return unwrap(res).data;
        }
      } catch {
        // Fallback
      }
      return demoStore.getFeasibility();
    },
  });
}

export function useGoalContributions(goalId: string) {
  return useQuery({
    queryKey: ["goals", goalId, "contributions"],
    queryFn: async () => {
      return demoStore.getGoalContributions(goalId);
    },
  });
}

export type Planning = NonNullable<ReturnType<typeof usePlanning>["data"]>;
export type Inputs = Planning["inputs"];
export type Goal = NonNullable<ReturnType<typeof useGoals>["data"]>[number];

