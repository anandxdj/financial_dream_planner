"use client";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "@/lib/sdk";
import { unwrap } from "./queries";
export function usePlanning() { return useQuery({ queryKey: ["planning"], queryFn: async () => unwrap(await sdk.GET("/api/v1/households/planning")).data }); }
export function useGoals() { return useQuery({ queryKey: ["goals"], queryFn: async () => unwrap(await sdk.GET("/api/v1/goals")).data }); }
export function useFeasibility() { return useQuery({ queryKey: ["goals", "feasibility"], queryFn: async () => unwrap(await sdk.GET("/api/v1/goals/feasibility")).data }); }
export type Planning = NonNullable<ReturnType<typeof usePlanning>["data"]>;
export type Inputs = Planning["inputs"];
export type Goal = NonNullable<ReturnType<typeof useGoals>["data"]>[number];
