import { and, desc, eq, gt, sql } from "../../../database";
import { db } from "../../../database";
import type { LlmMessage } from "../llm/llm-provider";
import { plannerMessages } from "../model";

export interface ConversationMemoryOptions {
  householdId: string;
  conversationId: string;
  beforeSequenceNumber: number;
  now?: Date;
  maxMessages?: number;
  maxCharacters?: number;
}

const DEFAULT_MAX_MESSAGES = 12;
const DEFAULT_MAX_CHARACTERS = 12_000;

export function trimConversationHistory(
  messages: LlmMessage[],
  maxMessages = DEFAULT_MAX_MESSAGES,
  maxCharacters = DEFAULT_MAX_CHARACTERS,
): LlmMessage[] {
  const boundedMessages = messages.slice(-Math.max(1, maxMessages));
  const selected: LlmMessage[] = [];
  let usedCharacters = 0;

  for (let index = boundedMessages.length - 1; index >= 0; index -= 1) {
    const message = boundedMessages[index];
    const messageCharacters = message.content.length;
    if (selected.length > 0 && usedCharacters + messageCharacters > maxCharacters) break;
    selected.push(message);
    usedCharacters += messageCharacters;
  }

  return selected.reverse();
}

export async function loadConversationHistory(
  options: ConversationMemoryOptions,
): Promise<LlmMessage[]> {
  const now = options.now ?? new Date();
  const maxMessages = Math.max(1, Math.min(options.maxMessages ?? DEFAULT_MAX_MESSAGES, 30));
  const maxCharacters = Math.max(1_000, options.maxCharacters ?? DEFAULT_MAX_CHARACTERS);

  const rows = await db
    .select({
      sender: plannerMessages.sender,
      content: plannerMessages.content,
      sequenceNumber: plannerMessages.sequenceNumber,
    })
    .from(plannerMessages)
    .where(
      and(
        eq(plannerMessages.householdId, options.householdId),
        eq(plannerMessages.conversationId, options.conversationId),
        gt(plannerMessages.retentionExpiresAt, now),
        sql`${plannerMessages.sequenceNumber} < ${options.beforeSequenceNumber}`,
      ),
    )
    .orderBy(desc(plannerMessages.sequenceNumber))
    .limit(maxMessages);

  const chronological = rows
    .reverse()
    .filter((row) => row.sender === "user" || row.sender === "assistant")
    .map<LlmMessage>((row) => ({
      role: row.sender === "assistant" ? "assistant" : "user",
      content: row.content,
    }));

  return trimConversationHistory(chronological, maxMessages, maxCharacters);
}
