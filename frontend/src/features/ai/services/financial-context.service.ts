import { sdk } from "@/lib/sdk";
import { unwrap } from "@/features/planner/queries";

export async function getAiCurrentPlan() {
  const response = await sdk.GET("/api/v1/plans/current");
  if (response.response.status === 404) return null;
  return unwrap(response).data;
}

export async function getAiPlanning() {
  const response = await sdk.GET("/api/v1/households/planning");
  return unwrap(response).data;
}

export async function getAiGoals() {
  const response = await sdk.GET("/api/v1/goals");
  return unwrap(response).data ?? [];
}

export type AiCurrentPlan = Awaited<ReturnType<typeof getAiCurrentPlan>>;
export type AiPlanning = Awaited<ReturnType<typeof getAiPlanning>>;
export type AiGoal = Awaited<ReturnType<typeof getAiGoals>>[number];
