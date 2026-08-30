import type { Request, Response } from "express";
import { z } from "zod";
import * as accountsService from "./accounts.service";
import Decimal from "decimal.js";

export const createAccountSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(["SAVINGS", "CURRENT", "CREDIT_CARD", "WALLET", "BROKERAGE", "LOAN", "CASH", "OTHER"]).optional(),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).optional(),
  institutionName: z.string().trim().max(100).optional(),
  maskedNumber: z.string().trim().max(20).optional(),
  currentBalance: z.string().regex(/^-?\d+(?:\.\d{1,2})?$/).optional(),
});

export const updateAccountSchema = createAccountSchema.partial();

function getParamId(req: Request): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

function accountOutput<T extends { currentBalance: string | null }>(account: T) {
  return { ...account, currentBalance: account.currentBalance === null ? null : new Decimal(account.currentBalance).toFixed(2) };
}

export async function list(req: Request, res: Response) {
  const accounts = await accountsService.listAccounts(req.auth!.householdId);
  res.json({ data: accounts.map(accountOutput) });
}

export async function getById(req: Request, res: Response) {
  const account = await accountsService.getAccountById(req.auth!.householdId, getParamId(req));
  res.json({ data: accountOutput(account) });
}

export async function create(req: Request, res: Response) {
  const body = createAccountSchema.parse(req.body);
  const account = await accountsService.createAccount(req.auth!.householdId, body);
  res.status(201).json({ data: accountOutput(account) });
}

export async function update(req: Request, res: Response) {
  const body = updateAccountSchema.parse(req.body);
  const account = await accountsService.updateAccount(req.auth!.householdId, getParamId(req), body);
  res.json({ data: accountOutput(account) });
}

export async function remove(req: Request, res: Response) {
  await accountsService.deleteAccount(req.auth!.householdId, getParamId(req));
  res.status(204).send();
}
