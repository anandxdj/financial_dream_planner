"use client";

import { useQuery } from "@tanstack/react-query";
import { sdk } from "@/lib/sdk";
import { demoStore } from "@/lib/demo-store";
import { useMe } from "@/hooks/use-me";
import {
  useAccounts,
  useCurrentPlan,
  useRecordedCashFlow,
  unwrap,
} from "@/features/planner/queries";
import {
  useFeasibility,
  useGoals,
  usePlanning,
} from "@/features/planner/planning-queries";

export function useOverviewData() {
  const me = useMe();
  const currentPlan = useCurrentPlan();
  const planning = usePlanning();
  const goals = useGoals();
  const feasibility = useFeasibility();
  const accounts = useAccounts();
  const recordedCashFlow = useRecordedCashFlow();

  const recentTransactions = useQuery({
    queryKey: ["transactions", "overview-recent"],
    queryFn: async () => {
      if (demoStore.isDemoMode()) return demoStore.getTransactions({ limit: 5 }).data;
      const response = await sdk.GET("/api/v1/transactions", {
        params: { query: { limit: 5 } },
      });
      return unwrap(response).data ?? [];
    },
  });

  const stale = Boolean(
    currentPlan.data &&
      planning.data &&
      currentPlan.data.snapshot.revision !== planning.data.revision,
  );

  const error =
    currentPlan.error ??
    planning.error ??
    goals.error ??
    feasibility.error ??
    accounts.error ??
    recordedCashFlow.error ??
    recentTransactions.error ??
    me.error;

  const isLoading =
    currentPlan.isPending ||
    planning.isPending ||
    goals.isPending ||
    accounts.isPending ||
    recordedCashFlow.isPending ||
    me.isPending;

  return {
    me,
    currentPlan,
    planning,
    goals,
    feasibility,
    accounts,
    recordedCashFlow,
    recentTransactions,
    stale,
    error,
    isLoading,
  };
}
