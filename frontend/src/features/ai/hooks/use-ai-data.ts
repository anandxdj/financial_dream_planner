"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getPlannerConversations,
  getPlannerMessages,
} from "../services/ai.service";
import {
  getAiCurrentPlan,
  getAiGoals,
  getAiPlanning,
} from "../services/financial-context.service";
import {
  stagePlannerProposal,
  type StagePlannerProposalOptions,
} from "../services/proposal.service";
import { executePlannerRun } from "../services/run.service";
import type { PlannerScenarioProposal } from "../types";

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
    mutationFn: async ({
      message,
      conversationId,
    }: {
      message: string;
      conversationId?: string;
    }) => {
      const { result } = await executePlannerRun({
        kind: "chat",
        message,
        ...(conversationId ? { conversationId } : {}),
      });
      return result;
    },
  });
}

export function usePlannerAnalyzeMutation() {
  return useMutation({
    mutationFn: async ({ conversationId }: { conversationId?: string } = {}) => {
      const { result } = await executePlannerRun({
        kind: "analyze",
        ...(conversationId ? { conversationId } : {}),
      });
      return result;
    },
  });
}

export function useStagePlannerProposalMutation() {
  return useMutation({
    mutationFn: ({
      proposal,
      options,
    }: {
      proposal: PlannerScenarioProposal;
      options?: StagePlannerProposalOptions;
    }) => stagePlannerProposal(proposal, options),
  });
}
