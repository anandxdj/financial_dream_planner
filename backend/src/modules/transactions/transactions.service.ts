import Decimal from "decimal.js";
import { and, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../../database/client";
import { accounts } from "../accounts/model";
import { categories } from "../categories/model";
import { transactions, transactionSources, type SelectTransaction, type SelectTransactionSource } from "./model";
import {
  fallbackFingerprint,
  normalizeExternalReference,
  normalizeMerchant,
} from "./dedupe";
import { AppError } from "../../shared/errors/app-error";
import { DecimalAmount, parseCursor, serializeCursor, type Cursor } from "../../shared/api/primitives";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export interface SyncTransactionItem {
  clientId: string;
  amount: string;
  currency?: string;
  direction: "DEBIT" | "CREDIT";
  merchantName?: string;
  accountId?: string;
  accountLast4?: string;
  paymentMethod?: string;
  occurredAt: string;
  balanceAfter?: string | number;
  externalReference?: string;
  sourceType?: string;
  parserConfidence?: number;
}

export interface SyncTransactionsInput {
  syncId: string;
  transactions: SyncTransactionItem[];
}

export interface SyncTransactionsResult {
  syncId: string;
  created: number;
  duplicates: number;
  needsReview: number;
}

export interface ListTransactionsQuery {
  cursor?: string;
  limit?: number;
  accountId?: string;
  categoryId?: string;
  direction?: "DEBIT" | "CREDIT";
  status?: "verified" | "needs_review" | "pending";
  startDate?: string;
  endDate?: string;
}

export interface CreateManualTransactionInput {
  accountId?: string;
  categoryId?: string;
  amount: string;
  currency?: string;
  direction: "DEBIT" | "CREDIT";
  merchantName?: string;
  occurredAt?: string;
  paymentMethod?: string;
  description?: string;
  externalReference?: string;
}

export interface UpdateTransactionInput {
  accountId?: string | null;
  categoryId?: string | null;
  merchantName?: string | null;
  description?: string | null;
  status?: "verified" | "needs_review" | "pending";
}

export interface CashFlowQuery {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  currency?: string;
}

async function assertAccountAccess(householdId: string, accountId: string | null | undefined) {
  if (!accountId) return;
  const [row] = await db.select({ id: accounts.id }).from(accounts).where(and(eq(accounts.id, accountId), eq(accounts.householdId, householdId))).limit(1);
  if (!row) throw new AppError(400, "INVALID_ACCOUNT", "Account does not belong to the authenticated household");
}

async function assertCategoryAccess(householdId: string, categoryId: string | null | undefined) {
  if (!categoryId) return;
  const [row] = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.id, categoryId), or(isNull(categories.householdId), eq(categories.householdId, householdId)))).limit(1);
  if (!row) throw new AppError(400, "INVALID_CATEGORY", "Category does not belong to the authenticated household");
}

export interface CashFlowSnapshot {
  totalIncome: string | null;
  totalExpenses: string | null;
  netCashFlow: string | null;
  currency: string;
  transactionCount: number;
  hasData: boolean;
}

export async function syncTransactions(
  householdId: string,
  input: SyncTransactionsInput,
): Promise<SyncTransactionsResult> {
  let created = 0;
  let duplicates = 0;
  let needsReview = 0;

  for (const item of input.transactions) {
    const formattedAmount = DecimalAmount.from(item.amount).toString();
    const occurredAtDate = new Date(item.occurredAt);
    if (Number.isNaN(occurredAtDate.getTime())) {
      throw new AppError(400, "INVALID_DATE", "Invalid occurredAt date");
    }

    const normalizedRef = normalizeExternalReference(item.externalReference);
    const normalizedMerchantName = normalizeMerchant(item.merchantName);
    const sourceType = item.sourceType ?? "SMS";

    const [replayedSource] = await db.select({ id: transactionSources.id }).from(transactionSources).where(and(
      eq(transactionSources.householdId, householdId),
      eq(transactionSources.sourceType, sourceType),
      eq(transactionSources.clientId, item.clientId),
    )).limit(1);
    if (replayedSource) {
      duplicates++;
      continue;
    }

    // Resolve account if accountLast4 provided and accountId not explicitly given
    let targetAccountId = item.accountId ?? null;
    if (targetAccountId) await assertAccountAccess(householdId, targetAccountId);
    if (!targetAccountId && item.accountLast4) {
      const [matchedAccount] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.householdId, householdId), eq(accounts.maskedNumber, item.accountLast4)))
        .limit(1);
      if (matchedAccount) {
        targetAccountId = matchedAccount.id;
      }
    }

    const safeMetadata: Record<string, unknown> = {};
    if (item.accountLast4) safeMetadata.accountLast4 = item.accountLast4;
    if (item.balanceAfter !== undefined) safeMetadata.balanceAfter = item.balanceAfter;
    if (item.paymentMethod) safeMetadata.paymentMethod = item.paymentMethod;

    if (normalizedRef) {
      const wasCreated = await db.transaction(async (tx) => {
          const [insertedTx] = await tx
            .insert(transactions)
            .values({
              householdId,
              accountId: targetAccountId,
              amount: formattedAmount,
              currency: (item.currency ?? "INR").toUpperCase(),
              direction: item.direction,
              merchantName: item.merchantName?.trim() || null,
              merchantNormalized: normalizedMerchantName,
              occurredAt: occurredAtDate,
              paymentMethod: item.paymentMethod?.trim() || null,
              externalReference: normalizedRef,
              status: "verified",
              parserConfidence: item.parserConfidence !== undefined ? String(item.parserConfidence) : null,
              fallbackFingerprint: null,
            }).onConflictDoNothing()
            .returning();
          const canonical = insertedTx ?? (await tx.select().from(transactions).where(and(eq(transactions.householdId, householdId), eq(transactions.externalReference, normalizedRef))).limit(1))[0];
          if (!canonical) throw new AppError(409, "SYNC_CONFLICT", "Concurrent transaction could not be resolved");
          await tx.insert(transactionSources).values({
            householdId,
            transactionId: canonical.id,
            sourceType,
            clientId: item.clientId,
            externalReference: normalizedRef,
            sourceMetadataJson: Object.keys(safeMetadata).length > 0 ? safeMetadata : null,
            confidence: item.parserConfidence !== undefined ? String(item.parserConfidence) : null,
            importedAt: new Date(),
          }).onConflictDoNothing();
          return Boolean(insertedTx);
      });
      if (wasCreated) created++; else duplicates++;
    } else {
      // Reference-free observation: conservative fallback fingerprint
      const fingerprint = fallbackFingerprint({
        householdId,
        accountId: targetAccountId ?? "",
        amount: formattedAmount,
        direction: item.direction,
        merchantName: item.merchantName,
        occurredAt: occurredAtDate,
      });

      const fallbackOutcome = await db.transaction(async (tx) => {
          await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${householdId}:${fingerprint}`}))`);
          const [concurrentReplay] = await tx.select({ id: transactionSources.id }).from(transactionSources).where(and(
            eq(transactionSources.householdId, householdId),
            eq(transactionSources.sourceType, sourceType),
            eq(transactionSources.clientId, item.clientId),
          )).limit(1);
          if (concurrentReplay) return "duplicate" as const;
          const existingCollisions = await tx.select({ id: transactions.id }).from(transactions).where(and(eq(transactions.householdId, householdId), eq(transactions.fallbackFingerprint, fingerprint)));
          const hasCollision = existingCollisions.length > 0;
          if (hasCollision) {
            await tx
              .update(transactions)
              .set({ status: "needs_review", updatedAt: new Date() })
              .where(
                and(
                  eq(transactions.householdId, householdId),
                  eq(transactions.fallbackFingerprint, fingerprint),
                ),
              );
          }

          const [insertedTx] = await tx
            .insert(transactions)
            .values({
              householdId,
              accountId: targetAccountId,
              amount: formattedAmount,
              currency: (item.currency ?? "INR").toUpperCase(),
              direction: item.direction,
              merchantName: item.merchantName?.trim() || null,
              merchantNormalized: normalizedMerchantName,
              occurredAt: occurredAtDate,
              paymentMethod: item.paymentMethod?.trim() || null,
              externalReference: null,
              status: hasCollision ? "needs_review" : "verified",
              parserConfidence: item.parserConfidence !== undefined ? String(item.parserConfidence) : null,
              fallbackFingerprint: fingerprint,
            })
            .returning();

          await tx.insert(transactionSources).values({
            householdId,
            transactionId: insertedTx.id,
            sourceType,
            clientId: item.clientId,
            externalReference: null,
            sourceMetadataJson: Object.keys(safeMetadata).length > 0 ? safeMetadata : null,
            confidence: item.parserConfidence !== undefined ? String(item.parserConfidence) : null,
            importedAt: new Date(),
          }).onConflictDoNothing();
          return hasCollision ? "needs_review" as const : "created" as const;
        });
      if (fallbackOutcome === "duplicate") duplicates++;
      else if (fallbackOutcome === "needs_review") needsReview++;
      else created++;
    }
  }

  return { syncId: input.syncId, created, duplicates, needsReview };
}

export async function listTransactions(
  householdId: string,
  query: ListTransactionsQuery,
): Promise<{ data: SelectTransaction[]; nextCursor?: string }> {
  const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
  const conditions = [eq(transactions.householdId, householdId)];

  if (query.accountId) conditions.push(eq(transactions.accountId, query.accountId));
  if (query.categoryId) conditions.push(eq(transactions.categoryId, query.categoryId));
  if (query.direction) conditions.push(eq(transactions.direction, query.direction));
  if (query.status) conditions.push(eq(transactions.status, query.status));
  if (query.startDate) conditions.push(gte(transactions.occurredAt, new Date(query.startDate)));
  if (query.endDate) conditions.push(lte(transactions.occurredAt, new Date(query.endDate)));

  if (query.cursor) {
    const parsed = parseCursor(query.cursor);
    conditions.push(
      sql`(${transactions.occurredAt}, ${transactions.id}) < (${new Date(parsed.createdAt)}, ${parsed.id}::uuid)`,
    );
  }

  const rows = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.occurredAt), desc(transactions.id))
    .limit(limit + 1);

  const hasNext = rows.length > limit;
  const items = hasNext ? rows.slice(0, limit) : rows;

  let nextCursor: string | undefined;
  if (hasNext && items.length > 0) {
    const lastItem = items[items.length - 1];
    const cursorObj: Cursor = {
      id: lastItem.id,
      createdAt: lastItem.occurredAt.toISOString(),
    };
    nextCursor = serializeCursor(cursorObj);
  }

  return { data: items, nextCursor };
}

export async function getTransactionById(
  householdId: string,
  id: string,
): Promise<SelectTransaction & { provenance: SelectTransactionSource[] }> {
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.householdId, householdId)))
    .limit(1);

  if (!transaction) {
    throw new AppError(404, "NOT_FOUND", "Transaction not found");
  }

  const sources = await db
    .select()
    .from(transactionSources)
    .where(and(eq(transactionSources.transactionId, id), eq(transactionSources.householdId, householdId)))
    .orderBy(transactionSources.importedAt);

  return { ...transaction, provenance: sources };
}

export async function createManualTransaction(
  householdId: string,
  input: CreateManualTransactionInput,
): Promise<SelectTransaction> {
  const formattedAmount = DecimalAmount.from(input.amount).toString();
  const occurredAtDate = input.occurredAt ? new Date(input.occurredAt) : new Date();
  const normalizedRef = normalizeExternalReference(input.externalReference);
  const normalizedMerchantName = normalizeMerchant(input.merchantName);
  await assertAccountAccess(householdId, input.accountId);
  await assertCategoryAccess(householdId, input.categoryId);

  const result = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(transactions)
      .values({
        householdId,
        accountId: input.accountId ?? null,
        categoryId: input.categoryId ?? null,
        amount: formattedAmount,
        currency: (input.currency ?? "INR").toUpperCase(),
        direction: input.direction,
        merchantName: input.merchantName?.trim() || null,
        merchantNormalized: normalizedMerchantName,
        occurredAt: occurredAtDate,
        paymentMethod: input.paymentMethod?.trim() || null,
        description: input.description?.trim() || null,
        externalReference: normalizedRef,
        status: "verified",
        parserConfidence: "1.0000",
        fallbackFingerprint: null,
      })
      .returning();

    await tx.insert(transactionSources).values({
      householdId,
      transactionId: inserted.id,
      sourceType: "MANUAL",
      clientId: null,
      externalReference: normalizedRef,
      sourceMetadataJson: null,
      confidence: "1.0000",
      importedAt: new Date(),
    });

    return inserted;
  });

  return result;
}

export async function updateTransaction(
  householdId: string,
  id: string,
  input: UpdateTransactionInput,
): Promise<SelectTransaction> {
  await getTransactionById(householdId, id);
  await assertAccountAccess(householdId, input.accountId);
  await assertCategoryAccess(householdId, input.categoryId);

  const updates: Partial<typeof transactions.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.accountId !== undefined) updates.accountId = input.accountId;
  if (input.categoryId !== undefined) updates.categoryId = input.categoryId;
  if (input.merchantName !== undefined) {
    updates.merchantName = input.merchantName?.trim() || null;
    updates.merchantNormalized = normalizeMerchant(input.merchantName ?? undefined);
  }
  if (input.description !== undefined) updates.description = input.description?.trim() || null;
  if (input.status !== undefined) updates.status = input.status;

  const [updated] = await db
    .update(transactions)
    .set(updates)
    .where(and(eq(transactions.id, id), eq(transactions.householdId, householdId)))
    .returning();

  return updated;
}

export async function deleteTransaction(householdId: string, id: string): Promise<void> {
  await getTransactionById(householdId, id);
  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.householdId, householdId)));
}

export async function getCashFlowSnapshot(
  householdId: string,
  query: CashFlowQuery = {},
): Promise<CashFlowSnapshot> {
  const conditions = [eq(transactions.householdId, householdId)];

  if (query.accountId) conditions.push(eq(transactions.accountId, query.accountId));
  const currency = (query.currency ?? "INR").toUpperCase();
  conditions.push(eq(transactions.currency, currency));
  if (query.startDate) conditions.push(gte(transactions.occurredAt, new Date(query.startDate)));
  if (query.endDate) conditions.push(lte(transactions.occurredAt, new Date(query.endDate)));

  const matched = await db
    .select({
      amount: transactions.amount,
      direction: transactions.direction,
      currency: transactions.currency,
    })
    .from(transactions)
    .where(and(...conditions));

  if (matched.length === 0) {
    return {
      totalIncome: null,
      totalExpenses: null,
      netCashFlow: null,
      currency,
      transactionCount: 0,
      hasData: false,
    };
  }

  let totalIncome = new Decimal(0);
  let totalExpenses = new Decimal(0);

  for (const row of matched) {
    const dec = new Decimal(row.amount);
    if (row.direction === "CREDIT") {
      totalIncome = totalIncome.add(dec);
    } else if (row.direction === "DEBIT") {
      totalExpenses = totalExpenses.add(dec);
    }
  }

  const netCashFlow = totalIncome.minus(totalExpenses);

  return {
    totalIncome: totalIncome.toFixed(2),
    totalExpenses: totalExpenses.toFixed(2),
    netCashFlow: netCashFlow.toFixed(2),
    currency,
    transactionCount: matched.length,
    hasData: true,
  };
}
