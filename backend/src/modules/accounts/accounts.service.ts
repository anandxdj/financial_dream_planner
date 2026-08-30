import { and, eq } from "drizzle-orm";
import { db } from "../../database/client";
import { accounts, type SelectAccount } from "./model";
import { AppError } from "../../shared/errors/app-error";
import { DecimalAmount } from "../../shared/api/primitives";
import { transactions } from "../transactions/model";

export interface CreateAccountInput {
  name: string;
  type?: "SAVINGS" | "CURRENT" | "CREDIT_CARD" | "WALLET" | "BROKERAGE" | "LOAN" | "CASH" | "OTHER";
  currency?: string;
  institutionName?: string;
  maskedNumber?: string;
  currentBalance?: string;
}

export interface UpdateAccountInput {
  name?: string;
  type?: "SAVINGS" | "CURRENT" | "CREDIT_CARD" | "WALLET" | "BROKERAGE" | "LOAN" | "CASH" | "OTHER";
  currency?: string;
  institutionName?: string;
  maskedNumber?: string;
  currentBalance?: string;
}

export async function listAccounts(householdId: string): Promise<SelectAccount[]> {
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.householdId, householdId))
    .orderBy(accounts.createdAt);
}

export async function getAccountById(householdId: string, id: string): Promise<SelectAccount> {
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.householdId, householdId)))
    .limit(1);

  if (!account) {
    throw new AppError(404, "NOT_FOUND", "Account not found");
  }
  return account;
}

export async function createAccount(householdId: string, input: CreateAccountInput): Promise<SelectAccount> {
  const formattedBalance = input.currentBalance !== undefined
    ? DecimalAmount.from(input.currentBalance).toString()
    : null;

  const [created] = await db
    .insert(accounts)
    .values({
      householdId,
      name: input.name.trim(),
      type: input.type ?? "SAVINGS",
      currency: (input.currency ?? "INR").toUpperCase(),
      institutionName: input.institutionName?.trim() || null,
      maskedNumber: input.maskedNumber?.trim() || null,
      currentBalance: formattedBalance,
      balanceUpdatedAt: formattedBalance ? new Date() : null,
    })
    .returning();

  return created;
}

export async function updateAccount(
  householdId: string,
  id: string,
  input: UpdateAccountInput,
): Promise<SelectAccount> {
  await getAccountById(householdId, id);

  const updates: Partial<typeof accounts.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.type !== undefined) updates.type = input.type;
  if (input.currency !== undefined) updates.currency = input.currency.toUpperCase();
  if (input.institutionName !== undefined) updates.institutionName = input.institutionName.trim() || null;
  if (input.maskedNumber !== undefined) updates.maskedNumber = input.maskedNumber.trim() || null;
  if (input.currentBalance !== undefined) {
    updates.currentBalance = DecimalAmount.from(input.currentBalance).toString();
    updates.balanceUpdatedAt = new Date();
  }

  const [updated] = await db
    .update(accounts)
    .set(updates)
    .where(and(eq(accounts.id, id), eq(accounts.householdId, householdId)))
    .returning();

  return updated;
}

export async function deleteAccount(householdId: string, id: string): Promise<void> {
  await getAccountById(householdId, id);
  const [used] = await db.select({ id: transactions.id }).from(transactions).where(and(eq(transactions.householdId, householdId), eq(transactions.accountId, id))).limit(1);
  if (used) throw new AppError(409, "ACCOUNT_IN_USE", "Account with ledger history cannot be deleted");
  await db
    .delete(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.householdId, householdId)));
}
