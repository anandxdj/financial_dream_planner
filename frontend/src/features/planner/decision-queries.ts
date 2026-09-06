"use client";

import { useQuery } from "@tanstack/react-query";
import { sdk } from "@/lib/sdk";
import { unwrap } from "./queries";
import type { paths } from "../../../../sdk/src/generated/schema";

export type LoanRequestBody = NonNullable<
  paths["/api/v1/financial-engine/loan"]["post"]["requestBody"]
>["content"]["application/json"];

export type InvestmentRequestBody = NonNullable<
  paths["/api/v1/financial-engine/investment-projection"]["post"]["requestBody"]
>["content"]["application/json"];

export type CreateScenarioBody = NonNullable<
  paths["/api/v1/scenarios"]["post"]["requestBody"]
>["content"]["application/json"];

export type ScenarioDomainInputs = NonNullable<CreateScenarioBody["overlay"]>;

export function usePlanHistory(options?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: ["plan", "history", options],
    queryFn: async () => {
      const res = await sdk.GET("/api/v1/plans/history", {
        params: { query: options },
      });
      return unwrap(res);
    },
  });
}

export function useCurrentDrift() {
  return useQuery({
    queryKey: ["drift", "current"],
    queryFn: async () => {
      const res = await sdk.GET("/api/v1/drift/current");
      if (res.response.status === 404) return null;
      return unwrap(res).data;
    },
  });
}

export function useDriftEvents(status?: "pending" | "kept" | "accepted" | "no_change") {
  return useQuery({
    queryKey: ["drift", "events", { status }],
    queryFn: async () => {
      const res = await sdk.GET("/api/v1/drift", {
        params: { query: { status } },
      });
      return unwrap(res).data;
    },
  });
}

export function useDriftCheck(id: string) {
  return useQuery({
    queryKey: ["drift", "checks", id],
    queryFn: async () => {
      const res = await sdk.GET("/api/v1/drift/checks/{id}", {
        params: { path: { id } },
      });
      return unwrap(res).data;
    },
    enabled: Boolean(id),
  });
}

export function useScenarios() {
  return useQuery({
    queryKey: ["scenarios"],
    queryFn: async () => {
      const res = await sdk.GET("/api/v1/scenarios");
      return unwrap(res).data;
    },
  });
}

export function useScenario(id: string) {
  return useQuery({
    queryKey: ["scenarios", id],
    queryFn: async () => {
      const res = await sdk.GET("/api/v1/scenarios/{id}", {
        params: { path: { id } },
      });
      return unwrap(res).data;
    },
    enabled: Boolean(id),
  });
}

export function useRunScenario(id: string, enabled = true) {
  return useQuery({
    queryKey: ["scenarios", id, "run"],
    queryFn: async () => {
      const res = await sdk.POST("/api/v1/scenarios/{id}/run", {
        params: { path: { id } },
      });
      return unwrap(res).data;
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useCompareScenarios(scenarioIds: string[], enabled = true) {
  return useQuery({
    queryKey: ["scenarios", "compare", scenarioIds.slice().sort().join(",")],
    queryFn: async () => {
      const res = await sdk.POST("/api/v1/scenarios/compare", {
        body: { scenarioIds },
      });
      return unwrap(res).data;
    },
    enabled: enabled && scenarioIds.length >= 2,
  });
}

export function useLoanCalculation(body: LoanRequestBody | null, enabled = true) {
  return useQuery({
    queryKey: ["financial-engine", "loan", body],
    queryFn: async () => {
      if (!body) return null;
      const res = await sdk.POST("/api/v1/financial-engine/loan", {
        body,
      });
      return unwrap(res).data;
    },
    enabled: Boolean(body) && enabled,
  });
}


export function useInvestmentProjection(body: InvestmentRequestBody | null, enabled = true) {
  return useQuery({
    queryKey: ["financial-engine", "investment-projection", body],
    queryFn: async () => {
      if (!body) return null;
      const res = await sdk.POST("/api/v1/financial-engine/investment-projection", {
        body,
      });
      return unwrap(res).data;
    },
    enabled: Boolean(body) && enabled,
  });
}

export function useLoans() {
  return useQuery({
    queryKey: ["loans"],
    queryFn: async () => {
      const res = await sdk.GET("/api/v1/loans");
      if (res.response.status === 404) return null;
      return unwrap(res);
    },
  });
}


export function useInvestmentSummary() {
  return useQuery({
    queryKey: ["investments", "summary"],
    queryFn: async () => {
      const res = await sdk.GET("/api/v1/investments");
      if (res.response.status === 404) return null;
      return unwrap(res).data;
    },
  });
}



