"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/sdk";

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
export function useAccounts() { return useQuery({ queryKey: ["accounts"], queryFn: async () => unwrap(await sdk.GET("/api/v1/accounts")).data }); }
export function useCategories() { return useQuery({ queryKey: ["categories"], queryFn: async () => unwrap(await sdk.GET("/api/v1/categories")).data }); }
export function useCurrentPlan() { return useQuery({ queryKey: ["plan"], queryFn: async () => {
  const result = await sdk.GET("/api/v1/plans/current");
  if (result.response.status === 404) return null;
  return unwrap(result).data;
} }); }
export function useRecordedCashFlow() { return useQuery({ queryKey: ["recorded-cash-flow"], queryFn: async () => {
  const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return unwrap(await sdk.GET("/api/v1/transactions/cash-flow", { params: { query: { startDate: start.toISOString(), endDate: now.toISOString(), currency: "INR" } } })).data;
} }); }
export function useRefreshFinancialViews() { const client = useQueryClient(); return async () => {
  await Promise.all(["accounts", "transactions", "recorded-cash-flow", "planning", "goals"].map(key => client.invalidateQueries({ queryKey: [key] })));
}; }
