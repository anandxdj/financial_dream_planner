"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/sdk";
import { demoStore } from "@/lib/demo-store";

export class PlannerApiError extends Error {
  code?: string;
  status: number;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "PlannerApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.error || !result.response.ok) {
    const error = result.error as { error?: { message?: string; code?: string; details?: unknown } } | undefined;
    const msg = error?.error?.message ?? `Request failed (${result.response.status}). Please try again.`;
    throw new PlannerApiError(msg, result.response.status, error?.error?.code, error?.error?.details);
  }
  return result.data as T;
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      if (demoStore.isDemoMode()) {
        const demoAccounts = demoStore.getAccounts();
        try {
          const res = await sdk.GET("/api/v1/accounts");
          if (res.response.ok) {
            const serverAccs = unwrap(res).data ?? [];
            let updated = false;
            for (const sa of serverAccs) {
              const exists = demoStore.getAccounts().some(
                (da) => da.id === sa.id || da.name.trim().toLowerCase() === sa.name.trim().toLowerCase()
              );
              if (!exists) {
                demoStore.addAccount({
                  name: sa.name,
                  type: sa.type,
                  currency: sa.currency,
                  currentBalance: String(sa.currentBalance ?? 0),
                });
                updated = true;
              }
            }
            if (updated) {
              return demoStore.getAccounts();
            }
          }
        } catch {
          // Ignore backend sync failure in demo mode
        }
        return demoAccounts;
      }
      try {
        const res = await sdk.GET("/api/v1/accounts");
        if (res.response.ok) {
          return unwrap(res).data ?? [];
        }
      } catch {
        // Fallback to demo store
      }
      return [];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const res = await sdk.GET("/api/v1/categories");
        if (res.response.ok) {
          const data = unwrap(res).data;
          if (data && data.length > 0) return data;
        }
      } catch {
        // Fallback to demo store
      }
      return demoStore.getCategories();
    },
  });
}

export function useCurrentPlan() {
  return useQuery({
    queryKey: ["plan"],
    queryFn: async () => {
      try {
        const result = await sdk.GET("/api/v1/plans/current");
        if (result.response.status === 404) return null;
        if (result.response.ok) {
          return unwrap(result).data;
        }
      } catch {
        // Fallback to demo store
      }
      return demoStore.getCurrentPlan();
    },
  });
}

export function useRecordedCashFlow() {
  return useQuery({
    queryKey: ["recorded-cash-flow"],
    queryFn: async () => {
      try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const res = await sdk.GET("/api/v1/transactions/cash-flow", {
          params: { query: { startDate: start.toISOString(), endDate: now.toISOString(), currency: "INR" } },
        });
        if (res.response.ok) {
          return unwrap(res).data;
        }
      } catch {
        // Fallback to demo store
      }
      return demoStore.getRecordedCashFlow();
    },
  });
}

export function useRefreshFinancialViews() {
  const client = useQueryClient();
  return async () => {
    await Promise.all(
      ["accounts", "categories", "transactions", "recorded-cash-flow", "planning", "goals", "plan", "loans", "investments", "scenarios"].map((key) =>
        client.invalidateQueries({ queryKey: [key] })
      )
    );
  };
}

