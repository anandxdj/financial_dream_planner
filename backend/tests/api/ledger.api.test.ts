import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";
import { COOKIE } from "../../src/config/constants";
import { isDockerAvailable, resetTestDb, startTestDb, stopTestDb } from "../helpers/db";

const user1 = {
  email: "ledger.user1@example.com",
  password: "Password123!",
  displayName: "Ledger User 1",
};

const user2 = {
  email: "ledger.user2@example.com",
  password: "Password123!",
  displayName: "Ledger User 2",
};

function cookieValue(response: request.Response, name: string) {
  const header = response.headers["set-cookie"];
  const list = Array.isArray(header) ? header : header ? [header] : [];
  return list.find((entry) => entry.startsWith(`${name}=`))?.split(";")[0]?.split("=")[1];
}

function csrfHeaders(response: request.Response) {
  return { Origin: "http://localhost:3000", "X-CSRF-Token": cookieValue(response, COOKIE.csrf)! };
}

describe.skipIf(!isDockerAvailable())("ledger API", () => {
  const app = createApp();

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  it("requires authentication for all ledger endpoints", async () => {
    const unauthAccounts = await request(app).get("/api/v1/accounts");
    expect(unauthAccounts.status).toBe(401);

    const unauthCategories = await request(app).get("/api/v1/categories");
    expect(unauthCategories.status).toBe(401);

    const unauthTransactions = await request(app).get("/api/v1/transactions");
    expect(unauthTransactions.status).toBe(401);

    const unauthSync = await request(app).post("/api/v1/transactions/sync").send({ syncId: "1", transactions: [] });
    expect(unauthSync.status).toBe(401);

    const unauthCashFlow = await request(app).get("/api/v1/transactions/cash-flow");
    expect(unauthCashFlow.status).toBe(401);
  });

  it("performs full Accounts CRUD scoped to authenticated household", async () => {
    const agent1 = request.agent(app);
    const registered1 = await agent1.post("/api/v1/auth/register").send(user1);

    // Create Account
    const created = await agent1.post("/api/v1/accounts").set(csrfHeaders(registered1)).send({
      name: "Salary Savings",
      type: "SAVINGS",
      currency: "INR",
      institutionName: "HDFC Bank",
      maskedNumber: "4567",
      currentBalance: "25000.00",
    });
    expect(created.status).toBe(201);
    expect(created.body.data.name).toBe("Salary Savings");
    expect(created.body.data.currentBalance).toBe("25000.00");
    const accountId = created.body.data.id;

    // List Accounts
    const listRes = await agent1.get("/api/v1/accounts");
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);

    // Get Account
    const getRes = await agent1.get(`/api/v1/accounts/${accountId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.institutionName).toBe("HDFC Bank");

    // Update Account
    const updateRes = await agent1.patch(`/api/v1/accounts/${accountId}`).set(csrfHeaders(registered1)).send({
      name: "Primary Savings",
      currentBalance: "30000.00",
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe("Primary Savings");
    expect(updateRes.body.data.currentBalance).toBe("30000.00");

    // User 2 cannot access User 1's account
    const agent2 = request.agent(app);
    await agent2.post("/api/v1/auth/register").send(user2);

    const user2Get = await agent2.get(`/api/v1/accounts/${accountId}`);
    expect(user2Get.status).toBe(404);

    // Delete Account
    const deleteRes = await agent1.delete(`/api/v1/accounts/${accountId}`).set(csrfHeaders(registered1));
    expect(deleteRes.status).toBe(204);

    const getAfterDelete = await agent1.get(`/api/v1/accounts/${accountId}`);
    expect(getAfterDelete.status).toBe(404);
  });

  it("performs full Categories CRUD and preserves system categories", async () => {
    const agent1 = request.agent(app);
    const registered1 = await agent1.post("/api/v1/auth/register").send(user1);

    // Create Category
    const created = await agent1.post("/api/v1/categories").set(csrfHeaders(registered1)).send({
      name: "Dining Out",
      categoryType: "EXPENSE",
    });
    expect(created.status).toBe(201);
    expect(created.body.data.name).toBe("Dining Out");
    const catId = created.body.data.id;

    // List Categories
    const listRes = await agent1.get("/api/v1/categories");
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((c: { id: string }) => c.id === catId)).toBe(true);

    // Update Category
    const updateRes = await agent1.patch(`/api/v1/categories/${catId}`).set(csrfHeaders(registered1)).send({
      name: "Restaurants & Dining",
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe("Restaurants & Dining");

    // Delete Category
    const deleteRes = await agent1.delete(`/api/v1/categories/${catId}`).set(csrfHeaders(registered1));
    expect(deleteRes.status).toBe(204);
  });

  it("syncs SMS observations, retrieves list, and aggregates cash-flow", async () => {
    const agent1 = request.agent(app);
    const registered1 = await agent1.post("/api/v1/auth/register").send(user1);

    // Create an account first
    const accRes = await agent1.post("/api/v1/accounts").set(csrfHeaders(registered1)).send({
      name: "HDFC",
      maskedNumber: "3812",
    });
    const accountId = accRes.body.data.id;

    // Initial Cash Flow (no data)
    const initialCashFlow = await agent1.get("/api/v1/transactions/cash-flow");
    expect(initialCashFlow.status).toBe(200);
    expect(initialCashFlow.body.data.hasData).toBe(false);
    expect(initialCashFlow.body.data.totalIncome).toBeNull();

    // Sync Batch 1
    const sync1 = await agent1.post("/api/v1/transactions/sync").set(csrfHeaders(registered1)).send({
      syncId: "sync_batch_001",
      transactions: [
        {
          clientId: "sms_local_101",
          amount: "650.00",
          direction: "DEBIT",
          merchantName: "SWIGGY",
          accountLast4: "3812",
          paymentMethod: "UPI",
          occurredAt: "2026-08-29T18:30:00.000Z",
          externalReference: "9283818282",
          sourceType: "SMS",
          parserConfidence: 0.98,
        },
        {
          clientId: "sms_local_102",
          amount: "50000.00",
          direction: "CREDIT",
          merchantName: "SALARY CREDITED",
          accountLast4: "3812",
          paymentMethod: "NEFT",
          occurredAt: "2026-08-29T09:00:00.000Z",
          externalReference: "SALARY-2026-08",
          sourceType: "SMS",
          parserConfidence: 0.99,
        },
      ],
    });

    expect(sync1.status).toBe(200);
    expect(sync1.body.created).toBe(2);
    expect(sync1.body.duplicates).toBe(0);
    expect(sync1.body.needsReview).toBe(0);

    // Replay Batch 1 (idempotent duplicate detection)
    const syncReplay = await agent1.post("/api/v1/transactions/sync").set(csrfHeaders(registered1)).send({
      syncId: "sync_batch_001_replay",
      transactions: [
        {
          clientId: "sms_local_101",
          amount: "650.00",
          direction: "DEBIT",
          merchantName: "SWIGGY",
          occurredAt: "2026-08-29T18:30:00.000Z",
          externalReference: "9283818282",
          sourceType: "SMS",
        },
      ],
    });
    expect(syncReplay.status).toBe(200);
    expect(syncReplay.body.created).toBe(0);
    expect(syncReplay.body.duplicates).toBe(1);

    // List Transactions
    const txList = await agent1.get("/api/v1/transactions");
    expect(txList.status).toBe(200);
    expect(txList.body.data).toHaveLength(2);
    expect(txList.body.data[0].accountId).toBe(accountId);

    // Get Single Transaction with Provenance
    const singleTx = await agent1.get(`/api/v1/transactions/${txList.body.data[0].id}`);
    expect(singleTx.status).toBe(200);
    expect(singleTx.body.data.provenance).toHaveLength(1);
    expect(singleTx.body.data.provenance[0].sourceType).toBe("SMS");

    // Cash Flow Snapshot
    const cashFlowRes = await agent1.get("/api/v1/transactions/cash-flow");
    expect(cashFlowRes.status).toBe(200);
    expect(cashFlowRes.body.data.hasData).toBe(true);
    expect(cashFlowRes.body.data.totalIncome).toBe("50000.00");
    expect(cashFlowRes.body.data.totalExpenses).toBe("650.00");
    expect(cashFlowRes.body.data.netCashFlow).toBe("49350.00");
    expect(cashFlowRes.body.data.transactionCount).toBe(2);
  });
});
