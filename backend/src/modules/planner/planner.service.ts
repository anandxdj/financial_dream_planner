import { and, desc, eq, gt, sql } from "../../database";
import { db } from "../../database";
import { AppError } from "../../shared/errors/app-error";
import { getCurrentPlan } from "../plans/plans.service";
import { sanitizeInputString, computeRetentionExpiresAt } from "../research/research.service";
import { createPlannerGraph } from "./graph/planner-graph";
import { FallbackLlmRouter } from "./llm/fallback-router";
import { GeminiLlmAdapter } from "./llm/gemini-adapter";
import type { LlmProvider } from "./llm/llm-provider";
import { OpenAiLlmAdapter } from "./llm/openai-adapter";
import {
  plannerConversations,
  plannerMessageCitations,
  plannerMessages,
  type SelectPlannerConversation,
  type SelectPlannerMessage,
} from "./model";
import { ToolRegistry, type ToolExecutionContext } from "./tools/tool-registry";

export interface PlannerServiceOptions {
  llmProvider?: LlmProvider;
  toolRegistry?: ToolRegistry;
  toolContext?: ToolExecutionContext;
  clock?: () => Date;
}

export function getDefaultLlmProvider(): LlmProvider {
  const primary = new OpenAiLlmAdapter();
  const fallback = new GeminiLlmAdapter();
  return new FallbackLlmRouter({ primary, fallback });
}

export async function postChatMessage(
  householdId: string,
  userId: string,
  input: { conversationId?: string; message: string },
  options: PlannerServiceOptions = {},
): Promise<{ conversationId: string; message: SelectPlannerMessage }> {
  const messageText = sanitizeInputString(input.message);
  if (!messageText || messageText.length > 4000) {
    throw new AppError(400, "INVALID_INPUT", "Message must be between 1 and 4000 characters");
  }

  const now = options.clock ? options.clock() : new Date();
  const retentionExpiresAt = computeRetentionExpiresAt(now, 90);
  let conversationId = input.conversationId;

  // Verify or create conversation
  if (conversationId) {
    const [conv] = await db
      .select()
      .from(plannerConversations)
      .where(
        and(
          eq(plannerConversations.id, conversationId),
          eq(plannerConversations.householdId, householdId),
          gt(plannerConversations.retentionExpiresAt, now),
        ),
      )
      .limit(1);

    if (!conv) {
      throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found or has expired");
    }
  } else {
    const title = messageText.slice(0, 60).replace(/\n/g, " ").trim() || "New Conversation";
    const [newConv] = await db
      .insert(plannerConversations)
      .values({
        householdId,
        userId,
        title,
        status: "active",
        createdAt: now,
        retentionExpiresAt,
      })
      .returning();
    conversationId = newConv.id;
  }

  const userSeq = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${conversationId}))`);
    const [row] = await tx.select({ maxSeq: sql<number>`coalesce(max(${plannerMessages.sequenceNumber}), 0)` })
      .from(plannerMessages)
      .where(and(eq(plannerMessages.conversationId, conversationId), eq(plannerMessages.householdId, householdId)));
    const maxSeq = Number(row?.maxSeq ?? 0);
    const nextUserSeq = maxSeq % 2 === 0 ? maxSeq + 1 : maxSeq + 2;
    await tx.insert(plannerMessages).values({ householdId, conversationId, sender: "user", content: messageText,
      sequenceNumber: nextUserSeq, citations: [], createdAt: now, retentionExpiresAt });
    return nextUserSeq;
  });

  // Execute Graph
  const llmProvider = options.llmProvider ?? getDefaultLlmProvider();
  const graph = createPlannerGraph({
    llmProvider,
    toolRegistry: options.toolRegistry,
    toolContext: options.toolContext,
    clock: options.clock,
  });

  const graphResult = await graph.invoke({
    householdId,
    userId,
    userMessage: messageText,
    isAnalyzeOnly: false,
  });

  if (graphResult.error) {
    // User message is preserved, but no assistant message is written
    throw graphResult.error;
  }

  const finalAnswer = graphResult.finalAnswer;
  if (!finalAnswer) {
    throw new AppError(502, "INVALID_PROVIDER_OUTPUT", "Graph execution produced no final answer");
  }

  const assistantSeq = userSeq + 1;
  const assistantMessage = await db.transaction(async (tx) => {
    const [message] = await tx.insert(plannerMessages).values({
      householdId,
      conversationId,
      sender: "assistant",
      content: finalAnswer.content,
      sequenceNumber: assistantSeq,
      citations: finalAnswer.citations,
      createdAt: new Date(),
      retentionExpiresAt,
    }).returning();
    if (finalAnswer.citations.length > 0) {
      await tx.insert(plannerMessageCitations).values(finalAnswer.citations.map((citation) => ({
        householdId, messageId: message.id, evidenceId: citation.evidenceId,
      })));
    }
    return message;
  });

  // Update conversation updatedAt
  await db
    .update(plannerConversations)
    .set({ updatedAt: new Date() })
    .where(eq(plannerConversations.id, conversationId));

  return {
    conversationId,
    message: assistantMessage,
  };
}

export async function analyzePlan(
  householdId: string,
  userId: string,
  input: { conversationId?: string },
  options: PlannerServiceOptions = {},
): Promise<{ conversationId: string; message: SelectPlannerMessage }> {
  // 1. Verify household has active current plan
  await getCurrentPlan(householdId);

  const now = options.clock ? options.clock() : new Date();
  const retentionExpiresAt = computeRetentionExpiresAt(now, 90);
  let conversationId = input.conversationId;

  if (conversationId) {
    const [conv] = await db
      .select()
      .from(plannerConversations)
      .where(
        and(
          eq(plannerConversations.id, conversationId),
          eq(plannerConversations.householdId, householdId),
          gt(plannerConversations.retentionExpiresAt, now),
        ),
      )
      .limit(1);

    if (!conv) {
      throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found or has expired");
    }
  } else {
    const [newConv] = await db
      .insert(plannerConversations)
      .values({
        householdId,
        userId,
        title: "Financial Plan Analysis",
        status: "active",
        createdAt: now,
        retentionExpiresAt,
      })
      .returning();
    conversationId = newConv.id;
  }

  const userRequestText = "Please perform an in-depth analysis of my current active financial plan.";
  const userSeq = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${conversationId}))`);
    const [row] = await tx.select({ maxSeq: sql<number>`coalesce(max(${plannerMessages.sequenceNumber}), 0)` })
      .from(plannerMessages)
      .where(and(eq(plannerMessages.conversationId, conversationId), eq(plannerMessages.householdId, householdId)));
    const maxSeq = Number(row?.maxSeq ?? 0);
    const nextUserSeq = maxSeq % 2 === 0 ? maxSeq + 1 : maxSeq + 2;
    await tx.insert(plannerMessages).values({ householdId, conversationId, sender: "user", content: userRequestText,
      sequenceNumber: nextUserSeq, citations: [], createdAt: now, retentionExpiresAt });
    return nextUserSeq;
  });

  const llmProvider = options.llmProvider ?? getDefaultLlmProvider();
  const graph = createPlannerGraph({
    llmProvider,
    toolRegistry: options.toolRegistry,
    toolContext: options.toolContext,
    clock: options.clock,
  });

  const graphResult = await graph.invoke({
    householdId,
    userId,
    userMessage: userRequestText,
    isAnalyzeOnly: true,
  });

  if (graphResult.error) {
    throw graphResult.error;
  }

  const finalAnswer = graphResult.finalAnswer;
  if (!finalAnswer) {
    throw new AppError(502, "INVALID_PROVIDER_OUTPUT", "Graph execution produced no final answer");
  }

  const assistantSeq = userSeq + 1;
  const assistantMessage = await db.transaction(async (tx) => {
    const [message] = await tx.insert(plannerMessages).values({
      householdId,
      conversationId,
      sender: "assistant",
      content: finalAnswer.content,
      sequenceNumber: assistantSeq,
      citations: finalAnswer.citations,
      createdAt: new Date(),
      retentionExpiresAt,
    }).returning();
    if (finalAnswer.citations.length > 0) {
      await tx.insert(plannerMessageCitations).values(finalAnswer.citations.map((citation) => ({
        householdId, messageId: message.id, evidenceId: citation.evidenceId,
      })));
    }
    return message;
  });

  await db
    .update(plannerConversations)
    .set({ updatedAt: new Date() })
    .where(eq(plannerConversations.id, conversationId));

  return {
    conversationId,
    message: assistantMessage,
  };
}

export async function listConversations(
  householdId: string,
  options: { cursor?: string; limit?: number } = {},
  now = new Date(),
): Promise<{ data: SelectPlannerConversation[]; nextCursor?: string }> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);

  const query = db
    .select()
    .from(plannerConversations)
    .where(
      and(
        eq(plannerConversations.householdId, householdId),
        gt(plannerConversations.retentionExpiresAt, now),
        options.cursor ? sql`${plannerConversations.createdAt} < ${options.cursor}` : undefined,
      ),
    )
    .orderBy(desc(plannerConversations.createdAt))
    .limit(limit + 1);

  const rows = await query;
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : undefined;

  return {
    data: items,
    nextCursor,
  };
}

export async function getConversationMessages(
  householdId: string,
  conversationId: string,
  now = new Date(),
): Promise<SelectPlannerMessage[]> {
  // Check conversation exists and belongs to household
  const [conv] = await db
    .select()
    .from(plannerConversations)
    .where(
      and(
        eq(plannerConversations.id, conversationId),
        eq(plannerConversations.householdId, householdId),
        gt(plannerConversations.retentionExpiresAt, now),
      ),
    )
    .limit(1);

  if (!conv) {
    throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found or has expired");
  }

  const messages = await db
    .select()
    .from(plannerMessages)
    .where(
      and(
        eq(plannerMessages.conversationId, conversationId),
        eq(plannerMessages.householdId, householdId),
        gt(plannerMessages.retentionExpiresAt, now),
      ),
    )
    .orderBy(plannerMessages.sequenceNumber);

  return messages;
}

export function serializeConversation(conv: SelectPlannerConversation) {
  return {
    id: conv.id,
    householdId: conv.householdId,
    userId: conv.userId,
    title: conv.title,
    status: conv.status as SelectPlannerConversation["status"],
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
    retentionExpiresAt: conv.retentionExpiresAt.toISOString(),
  };
}

export function serializeMessage(msg: SelectPlannerMessage) {
  return {
    id: msg.id,
    householdId: msg.householdId,
    conversationId: msg.conversationId,
    sender: msg.sender as SelectPlannerMessage["sender"],
    content: msg.content,
    sequenceNumber: msg.sequenceNumber,
    citations: msg.citations,
    metadata: msg.metadata ?? undefined,
    createdAt: msg.createdAt.toISOString(),
    retentionExpiresAt: msg.retentionExpiresAt.toISOString(),
  };
}
