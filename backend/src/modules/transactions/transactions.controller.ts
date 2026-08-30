import type { Request, Response } from "express";
import { z } from "zod";
import * as transactionsService from "./transactions.service";
import Decimal from "decimal.js";

const positiveMoneyRegex = /^(?!0+(?:\.0{1,2})?$)\d+(?:\.\d{1,2})?$/;

export const syncTransactionItemSchema = z.object({
  clientId: z.string().trim().min(1).max(128),
  amount: z.string().trim().regex(positiveMoneyRegex, "Amount must be a positive decimal string with at most 2 decimal places"),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).optional(),
  direction: z.enum(["DEBIT", "CREDIT"]),
  merchantName: z.string().trim().max(255).optional(),
  accountId: z.string().uuid().optional(),
  accountLast4: z.string().trim().max(10).optional(),
  paymentMethod: z.string().trim().max(50).optional(),
  occurredAt: z.string().datetime(),
  balanceAfter: z.union([z.string(), z.number()]).optional(),
  externalReference: z.string().trim().max(255).optional(),
  sourceType: z.string().trim().max(50).optional().default("SMS"),
  parserConfidence: z.number().min(0).max(1).optional(),
}).strict();

export const syncTransactionsSchema = z.object({
  syncId: z.string().trim().min(1).max(128),
  transactions: z.array(syncTransactionItemSchema),
}).strict();

export const createTransactionSchema = z.object({
  amount: z.string().trim().regex(positiveMoneyRegex, "Amount must be a positive decimal string with at most 2 decimal places"),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).optional(),
  direction: z.enum(["DEBIT", "CREDIT"]),
  merchantName: z.string().trim().max(255).optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  occurredAt: z.string().datetime().optional(),
  paymentMethod: z.string().trim().max(50).optional(),
  description: z.string().trim().max(500).optional(),
  externalReference: z.string().trim().max(255).optional(),
});

export const updateTransactionSchema = z.object({
  accountId: z.string().uuid().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  merchantName: z.string().trim().max(255).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  status: z.enum(["verified", "needs_review", "pending"]).optional(),
});

export const listTransactionsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  direction: z.enum(["DEBIT", "CREDIT"]).optional(),
  status: z.enum(["verified", "needs_review", "pending"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const cashFlowQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  accountId: z.string().uuid().optional(),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).transform((value) => value.toUpperCase()).optional(),
});

function getParamId(req: Request): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

function transactionOutput<T extends { amount: string }>(transaction: T) {
  return { ...transaction, amount: new Decimal(transaction.amount).toFixed(2) };
}

export async function sync(req: Request, res: Response) {
  const body = syncTransactionsSchema.parse(req.body);
  const result = await transactionsService.syncTransactions(req.auth!.householdId, body);
  res.status(200).json(result);
}

export async function list(req: Request, res: Response) {
  const query = listTransactionsQuerySchema.parse(req.query);
  const result = await transactionsService.listTransactions(req.auth!.householdId, query);
  res.json({ ...result, data: result.data.map(transactionOutput) });
}

export async function getById(req: Request, res: Response) {
  const transaction = await transactionsService.getTransactionById(req.auth!.householdId, getParamId(req));
  res.json({ data: transactionOutput(transaction) });
}

export async function create(req: Request, res: Response) {
  const body = createTransactionSchema.parse(req.body);
  const transaction = await transactionsService.createManualTransaction(req.auth!.householdId, body);
  res.status(201).json({ data: transactionOutput(transaction) });
}

export async function update(req: Request, res: Response) {
  const body = updateTransactionSchema.parse(req.body);
  const transaction = await transactionsService.updateTransaction(req.auth!.householdId, getParamId(req), body);
  res.json({ data: transactionOutput(transaction) });
}

export async function remove(req: Request, res: Response) {
  await transactionsService.deleteTransaction(req.auth!.householdId, getParamId(req));
  res.status(204).send();
}

export async function cashFlow(req: Request, res: Response) {
  const query = cashFlowQuerySchema.parse(req.query);
  const result = await transactionsService.getCashFlowSnapshot(req.auth!.householdId, query);
  res.json({ data: result });
}
