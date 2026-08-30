import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db, eq, households, transactions, transactionSources } from "../../src/database";
import { isDockerAvailable, resetTestDb, startTestDb, stopTestDb } from "../helpers/db";
import {
  createAccount,
  deleteAccount,
  getAccountById,
  listAccounts,
  updateAccount,
} from "../../src/modules/accounts/accounts.service";
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "../../src/modules/categories/categories.service";
import {
  getCashFlowSnapshot,
  listTransactions,
  syncTransactions,
} from "../../src/modules/transactions/transactions.service";

describe.skipIf(!isDockerAvailable())("ledger integration & concurrency", () => {
  let household1Id: string;
  let household2Id: string;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();

    const [h1] = await db.insert(households).values({ name: "Household 1" }).returning();
    const [h2] = await db.insert(households).values({ name: "Household 2" }).returning();
    household1Id = h1.id;
    household2Id = h2.id;
  });

  it("enforces tenant boundary on accounts and categories", async () => {
    const acc1 = await createAccount(household1Id, { name: "HDFC", currentBalance: "1500.00" });
    const cat1 = await createCategory(household1Id, { name: "Groceries" });

    const h1Accounts = await listAccounts(household1Id);
    expect(h1Accounts).toHaveLength(1);
    expect(h1Accounts[0].id).toBe(acc1.id);

    const h2Accounts = await listAccounts(household2Id);
    expect(h2Accounts).toHaveLength(0);

    await expect(getAccountById(household2Id, acc1.id)).rejects.toMatchObject({ statusCode: 404 });
    await expect(updateAccount(household2Id, acc1.id, { name: "Hacked" })).rejects.toMatchObject({ statusCode: 404 });
    await expect(deleteAccount(household2Id, acc1.id)).rejects.toMatchObject({ statusCode: 404 });

    await expect(getCategoryById(household2Id, cat1.id)).rejects.toMatchObject({ statusCode: 404 });
    await expect(updateCategory(household2Id, cat1.id, { name: "Hacked" })).rejects.toMatchObject({ statusCode: 404 });
    await expect(deleteCategory(household2Id, cat1.id)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("handles concurrent exact replay with zero duplicate canonical rows", async () => {
    const syncPayload = {
      syncId: "sync-concurrent-1",
      transactions: [
        {
          clientId: "sms-client-c1",
          amount: "1250.00",
          direction: "DEBIT" as const,
          merchantName: "Swiggy",
          occurredAt: "2026-08-29T12:00:00.000Z",
          externalReference: "UTR-CONCURRENT-999",
          sourceType: "SMS",
        },
      ],
    };

    const [res1, res2] = await Promise.all([
      syncTransactions(household1Id, syncPayload),
      syncTransactions(household1Id, { ...syncPayload, syncId: "sync-concurrent-2", transactions: [{ ...syncPayload.transactions[0], clientId: "sms-client-c2" }] }),
    ]);

    const totalCreated = res1.created + res2.created;
    const totalDuplicates = res1.duplicates + res2.duplicates;

    expect(totalCreated).toBe(1);
    expect(totalDuplicates).toBe(1);

    const txRows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.householdId, household1Id));

    expect(txRows).toHaveLength(1);
    expect(txRows[0].externalReference).toBe("UTR-CONCURRENT-999");
    expect(txRows[0].status).toBe("verified");
  });

  it("isolates same external reference across distinct households", async () => {
    const ref = "UTR-SHARED-REF-888";

    const res1 = await syncTransactions(household1Id, {
      syncId: "sync-h1",
      transactions: [
        {
          clientId: "sms-h1",
          amount: "300.00",
          direction: "DEBIT" as const,
          merchantName: "Uber",
          occurredAt: "2026-08-29T14:00:00.000Z",
          externalReference: ref,
        },
      ],
    });

    const res2 = await syncTransactions(household2Id, {
      syncId: "sync-h2",
      transactions: [
        {
          clientId: "sms-h2",
          amount: "300.00",
          direction: "DEBIT" as const,
          merchantName: "Uber",
          occurredAt: "2026-08-29T14:00:00.000Z",
          externalReference: ref,
        },
      ],
    });

    expect(res1.created).toBe(1);
    expect(res2.created).toBe(1);

    const h1Tx = await listTransactions(household1Id, {});
    const h2Tx = await listTransactions(household2Id, {});

    expect(h1Tx.data).toHaveLength(1);
    expect(h2Tx.data).toHaveLength(1);
    expect(h1Tx.data[0].id).not.toBe(h2Tx.data[0].id);
  });

  it("preserves fallback fingerprint collisions as distinct needs_review rows (ambiguous twins)", async () => {
    const item1 = {
      clientId: "sms-twin-1",
      amount: "100.00",
      direction: "DEBIT" as const,
      merchantName: "Chai Point",
      occurredAt: "2026-08-29T10:00:00.000Z",
    };
    const item2 = {
      clientId: "sms-twin-2",
      amount: "100.00",
      direction: "DEBIT" as const,
      merchantName: "CHAI POINT",
      occurredAt: "2026-08-29T10:02:00.000Z", // Same 5-minute bucket
    };

    const res1 = await syncTransactions(household1Id, { syncId: "sync-twin-1", transactions: [item1] });
    expect(res1.created).toBe(1);
    expect(res1.needsReview).toBe(0);

    const res2 = await syncTransactions(household1Id, { syncId: "sync-twin-2", transactions: [item2] });
    expect(res2.created).toBe(0);
    expect(res2.needsReview).toBe(1);

    const txRows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.householdId, household1Id));

    expect(txRows).toHaveLength(2);
    expect(txRows.every((t) => t.status === "needs_review")).toBe(true);
  });

  it("attaches provenance idempotently without creating duplicate transactions", async () => {
    const item = {
      clientId: "sms-prov-1",
      amount: "450.00",
      direction: "CREDIT" as const,
      merchantName: "Refund",
      occurredAt: "2026-08-29T16:00:00.000Z",
      externalReference: "REF-PROV-111",
    };

    await syncTransactions(household1Id, { syncId: "sync-p1", transactions: [item] });

    // Same clientId & reference re-synced
    const replaySameClient = await syncTransactions(household1Id, { syncId: "sync-p2", transactions: [item] });
    expect(replaySameClient.duplicates).toBe(1);

    // Different source/client observation for same external reference
    const secondSource = {
      clientId: "bank-prov-2",
      amount: "450.00",
      direction: "CREDIT" as const,
      occurredAt: "2026-08-29T16:00:00.000Z",
      externalReference: "REF-PROV-111",
      sourceType: "BANK_PROVIDER",
    };
    const attachSource = await syncTransactions(household1Id, { syncId: "sync-p3", transactions: [secondSource] });
    expect(attachSource.duplicates).toBe(1);

    const txs = await db.select().from(transactions).where(eq(transactions.householdId, household1Id));
    expect(txs).toHaveLength(1);

    const sources = await db
      .select()
      .from(transactionSources)
      .where(eq(transactionSources.transactionId, txs[0].id));

    expect(sources).toHaveLength(2);
  });

  it("treats a reference-free client replay as a duplicate, not an ambiguous twin", async () => {
    const item = { clientId: "sms-no-ref-replay", amount: "25.00", direction: "DEBIT" as const, merchantName: "Cafe", occurredAt: "2026-08-29T16:00:00.000Z" };
    const [first, replay] = await Promise.all([
      syncTransactions(household1Id, { syncId: "first", transactions: [item] }),
      syncTransactions(household1Id, { syncId: "replay", transactions: [item] }),
    ]);
    expect(first.created + replay.created).toBe(1);
    expect(first.duplicates + replay.duplicates).toBe(1);
    expect(first.needsReview + replay.needsReview).toBe(0);
    expect((await listTransactions(household1Id, {})).data).toHaveLength(1);
  });

  it("rejects account identifiers owned by another household", async () => {
    const foreignAccount = await createAccount(household2Id, { name: "Foreign" });
    await expect(syncTransactions(household1Id, { syncId: "cross-tenant", transactions: [{ clientId: "sms-cross-tenant", accountId: foreignAccount.id, amount: "10.00", direction: "DEBIT", occurredAt: "2026-08-29T16:00:00.000Z" }] })).rejects.toMatchObject({ code: "INVALID_ACCOUNT" });
  });

  it("returns explicit null for no-data vs exact 0.00 for net-zero cash flow", async () => {
    const emptySnapshot = await getCashFlowSnapshot(household1Id);
    expect(emptySnapshot.hasData).toBe(false);
    expect(emptySnapshot.totalIncome).toBeNull();
    expect(emptySnapshot.totalExpenses).toBeNull();
    expect(emptySnapshot.netCashFlow).toBeNull();
    expect(emptySnapshot.transactionCount).toBe(0);

    // Add balanced credit and debit
    await syncTransactions(household1Id, {
      syncId: "sync-cf",
      transactions: [
        {
          clientId: "cf-1",
          amount: "750.50",
          direction: "CREDIT",
          occurredAt: "2026-08-29T10:00:00.000Z",
          externalReference: "CF-INCOME-1",
        },
        {
          clientId: "cf-2",
          amount: "750.50",
          direction: "DEBIT",
          occurredAt: "2026-08-29T11:00:00.000Z",
          externalReference: "CF-EXPENSE-1",
        },
      ],
    });

    const balancedSnapshot = await getCashFlowSnapshot(household1Id);
    expect(balancedSnapshot.hasData).toBe(true);
    expect(balancedSnapshot.totalIncome).toBe("750.50");
    expect(balancedSnapshot.totalExpenses).toBe("750.50");
    expect(balancedSnapshot.netCashFlow).toBe("0.00");
    expect(balancedSnapshot.transactionCount).toBe(2);
  });
});
