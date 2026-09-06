import { sdk } from "@/lib/sdk";
import { unwrap } from "@/features/planner/queries";

export async function getPlannerConversations(limit = 30) {
  const response = await sdk.GET("/api/v1/planner/conversations", {
    params: { query: { limit } },
  });
  return unwrap(response);
}

export async function getPlannerMessages(conversationId: string) {
  const response = await sdk.GET("/api/v1/planner/conversations/{id}/messages", {
    params: { path: { id: conversationId } },
  });
  return unwrap(response).data;
}

export async function sendPlannerMessage(message: string, conversationId?: string) {
  const response = await sdk.POST("/api/v1/planner/chat", {
    body: conversationId ? { message, conversationId } : { message },
  });
  return unwrap(response).data;
}

export async function analyzeCurrentPlan(conversationId?: string) {
  const response = await sdk.POST("/api/v1/planner/analyze", {
    body: conversationId ? { conversationId } : {},
  });
  return unwrap(response).data;
}

export type PlannerConversation = Awaited<ReturnType<typeof getPlannerConversations>>["data"][number];
export type PlannerMessage = Awaited<ReturnType<typeof getPlannerMessages>>[number];
