import { db, inArray, lte } from "../../database";
import { evidence, researchRuns } from "../research/model";
import { plannerConversations, plannerMessages } from "./model";

export interface CleanupResult {
  deletedConversations: number;
  deletedMessages: number;
  deletedEvidence: number;
  deletedResearchRuns: number;
}

export async function cleanupExpiredRecords(
  options: { batchSize?: number; now?: Date } = {},
): Promise<CleanupResult> {
  const batchSize = options.batchSize ?? 100;
  const now = options.now ?? new Date();

  let deletedMessages = 0;
  let deletedConversations = 0;
  let deletedEvidence = 0;
  let deletedResearchRuns = 0;

  // 1. Delete expired messages in batch
  const expiredMsgRows = await db
    .select({ id: plannerMessages.id })
    .from(plannerMessages)
    .where(lte(plannerMessages.retentionExpiresAt, now))
    .limit(batchSize);

  if (expiredMsgRows.length > 0) {
    const ids = expiredMsgRows.map((r) => r.id);
    const deleted = await db.delete(plannerMessages).where(inArray(plannerMessages.id, ids)).returning();
    deletedMessages = deleted.length;
  }

  // 2. Delete expired conversations in batch (cascades to remaining messages)
  const expiredConvRows = await db
    .select({ id: plannerConversations.id })
    .from(plannerConversations)
    .where(lte(plannerConversations.retentionExpiresAt, now))
    .limit(batchSize);

  if (expiredConvRows.length > 0) {
    const ids = expiredConvRows.map((r) => r.id);
    const deleted = await db
      .delete(plannerConversations)
      .where(inArray(plannerConversations.id, ids))
      .returning();
    deletedConversations = deleted.length;
  }

  // 3. Delete expired evidence in batch
  const expiredEvidenceRows = await db
    .select({ id: evidence.id })
    .from(evidence)
    .where(lte(evidence.retentionExpiresAt, now))
    .limit(batchSize);

  if (expiredEvidenceRows.length > 0) {
    const ids = expiredEvidenceRows.map((r) => r.id);
    const deleted = await db.delete(evidence).where(inArray(evidence.id, ids)).returning();
    deletedEvidence = deleted.length;
  }

  // 4. Delete expired research runs in batch (cascades to remaining evidence)
  const expiredRunRows = await db
    .select({ id: researchRuns.id })
    .from(researchRuns)
    .where(lte(researchRuns.retentionExpiresAt, now))
    .limit(batchSize);

  if (expiredRunRows.length > 0) {
    const ids = expiredRunRows.map((r) => r.id);
    const deleted = await db
      .delete(researchRuns)
      .where(inArray(researchRuns.id, ids))
      .returning();
    deletedResearchRuns = deleted.length;
  }

  return {
    deletedConversations,
    deletedMessages,
    deletedEvidence,
    deletedResearchRuns,
  };
}
