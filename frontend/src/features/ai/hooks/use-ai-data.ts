"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  analyzeCurrentPlan,
  getPlannerConversations,
  getPlannerMessages,
  sendPlannerMessage,
} from "../services/ai.service";
import {
  getAiCurrentPlan,
  getAiGoals,
  getAiPlanning,
} from "../services/financial-context.service";
import { stagePlannerProposal } from "../services/proposal.service";

export function useAiFinancialContext() {
  const currentPlan = useQuery({
    queryKey: ["ai", "context", "plan"],
    queryFn: getAiCurrentPlan,
  });
  const planning = useQuery({
    queryKey: ["ai", "context", "planning"],
    queryFn: getAiPlanning,
  });
  const goals = useQuery({
    queryKey: ["ai", "context", "goals"],
    queryFn: getAiGoals,
  });

  return { currentPlan, planning, goals };
}

export function usePlannerConversations() {
  return useQuery({
    queryKey: ["planner", "conversations"],
    queryFn: () => getPlannerConversations(30),
  });
}

export function usePlannerMessages(conversationId?: string | null) {
  return useQuery({
    queryKey: ["planner", "messages", conversationId],
    queryFn: () => getPlannerMessages(conversationId!),
    enabled: Boolean(conversationId),
  });
}

export function usePlannerChatMutation() {
  return useMutation({
    mutationFn: ({ message, conversationId }: { message: string; conversationId?: string }) =>
      sendPlannerMessage(message, conversationId),
  });
}

export function usePlannerAnalyzeMutation() {
  return useMutation({
    mutationFn: ({ conversationId }: { conversationId?: string } = {}) =>
      analyzeCurrentPlan(conversationId),
  });
}

export function useStagePlannerProposalMutation() {
  return useMutation({ mutationFn: stagePlannerProposal });
}
