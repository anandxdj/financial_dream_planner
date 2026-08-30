import type { Request, Response } from "express";
import { PlannerAnalyzeRequestSchema, PlannerChatRequestSchema, PlannerConversationListQuerySchema, PlannerConversationParamsSchema } from "./model";
import * as plannerService from "./planner.service";

export async function postChat(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const userId = req.auth!.userId;
  const input = PlannerChatRequestSchema.parse(req.body);

  const result = await plannerService.postChatMessage(householdId, userId, input);

  res.status(200).json({
    data: {
      conversationId: result.conversationId,
      message: plannerService.serializeMessage(result.message),
    },
  });
}

export async function postAnalyze(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const userId = req.auth!.userId;
  const input = PlannerAnalyzeRequestSchema.parse(req.body);

  const result = await plannerService.analyzePlan(householdId, userId, input);

  res.status(200).json({
    data: {
      conversationId: result.conversationId,
      message: plannerService.serializeMessage(result.message),
    },
  });
}

export async function getConversations(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const query = PlannerConversationListQuerySchema.parse(req.query);
  const result = await plannerService.listConversations(householdId, query);

  res.status(200).json({
    data: result.data.map(plannerService.serializeConversation),
    nextCursor: result.nextCursor,
  });
}

export async function getMessages(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const { id: conversationId } = PlannerConversationParamsSchema.parse(req.params);

  const messages = await plannerService.getConversationMessages(householdId, conversationId);

  res.status(200).json({
    data: messages.map(plannerService.serializeMessage),
  });
}
