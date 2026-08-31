import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { COOKIE } from "../../src/config/constants";
import { FakeObjectStorage } from "../../src/modules/storage";
import { db } from "../../src/database";
import { processDriftCheck } from "../../src/modules/drift/drift.service";
import { processHouseholdDeletion, processPrivacyExport } from "../../src/modules/privacy/privacy.service";
import {
  resetTestDb,
  startTestDb,
  stopTestDb,
} from "../helpers/db";

function cookieValue(response: request.Response, name: string) {
  const header = response.headers["set-cookie"];
  const list = Array.isArray(header) ? header : header ? [header] : [];
  const match = list.find((entry) => entry.startsWith(`${name}=`));
  return match?.split(";")[0]?.split("=")[1];
}

function csrfHeaders(response: request.Response) {
  const csrf = cookieValue(response, COOKIE.csrf)!;
  return { Origin: "http://localhost:3000", "X-CSRF-Token": csrf };
}

describe("Closed-Beta 8-step Smoke Flow Acceptance", () => {
  let fakeStorage: FakeObjectStorage;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    await startTestDb();
    fakeStorage = new FakeObjectStorage();
    app = createApp({ storage: fakeStorage });
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    fakeStorage.clear();
    app = createApp({ storage: fakeStorage });
  });

  it("executes the full 8-step closed beta operational smoke contract cleanly", async () => {
    // -------------------------------------------------------------
    // Step 1: Invite / local auth creates session and owner household
    // -------------------------------------------------------------
    const agent1 = request.agent(app);
    const reg1 = await agent1
      .post("/api/v1/auth/register")
      .send({
        email: "tenant1@example.com",
        password: "Password123!",
        displayName: "Tenant One",
      })
      .set("x-request-id", "smoke-step1-req");

    expect(reg1.status).toBe(201);
    expect(reg1.body.user.email).toBe("tenant1@example.com");
    expect(reg1.headers["x-request-id"]).toBe("smoke-step1-req");

    const me1 = await agent1.get("/api/v1/users/me");
    expect(me1.status).toBe(200);
    expect(me1.body.user.displayName).toBe("Tenant One");

    // -------------------------------------------------------------
    // Step 2: Second tenant isolation verification
    // -------------------------------------------------------------
    const agent2 = request.agent(app);
    const reg2 = await agent2
      .post("/api/v1/auth/register")
      .send({
        email: "tenant2@example.com",
        password: "Password123!",
        displayName: "Tenant Two",
      });
    expect(reg2.status).toBe(201);

    // -------------------------------------------------------------
    // Step 3: Account, category, ledger ingestion & cash-flow
    // -------------------------------------------------------------
    const createAcc1 = await agent1
      .post("/api/v1/accounts")
      .set(csrfHeaders(reg1))
      .send({
        name: "Tenant 1 Savings",
        currency: "INR",
        type: "SAVINGS",
        currentBalance: "100000.00",
      });
    expect(createAcc1.status).toBe(201);
    const account1Id = createAcc1.body.data.id;

    // Verify tenant 2 CANNOT read or patch tenant 1's account
    const t2GetAcc = await agent2.get(`/api/v1/accounts/${account1Id}`);
    expect(t2GetAcc.status).toBe(404);

    const t2PatchAcc = await agent2
      .patch(`/api/v1/accounts/${account1Id}`)
      .set(csrfHeaders(reg2))
      .send({ name: "Hacked Account" });
    expect(t2PatchAcc.status).toBe(404);

    // Sync transactions for tenant 1
    const syncRes = await agent1
      .post("/api/v1/transactions/sync")
      .set(csrfHeaders(reg1))
      .send({
        syncId: "sync-smoke-1",
        transactions: [
          {
            clientId: "tx-client-1",
            amount: "5000.00",
            currency: "INR",
            direction: "DEBIT",
            merchantName: "Supermarket",
            accountId: account1Id,
            occurredAt: new Date().toISOString(),
          },
        ],
      });
    expect(syncRes.status).toBe(200);
    expect(syncRes.body.created).toBe(1);

    const cashFlow = await agent1.get("/api/v1/transactions/cash-flow");
    expect(cashFlow.status).toBe(200);
    expect(cashFlow.body.data.currency).toBe("INR");

    // -------------------------------------------------------------
    // Step 4: Plan recalculation, scenario execution, drift check
    // -------------------------------------------------------------
    const recalcRes = await agent1
      .post("/api/v1/plans/recalculate")
      .set(csrfHeaders(reg1))
      .send({
        asOf: "2026-08-30T10:00:00.000Z",
        revision: 0,
        inputs: {
          cashFlow: {
            income: "100000.00",
            essentialExpenses: "40000.00",
            discretionaryExpenses: "20000.00",
            emis: "0.00",
            mandatoryObligations: "0.00",
          },
          emergencyFund: {
            essentialExpenses: "40000.00",
            incomeStability: "stable",
            currentReserves: "100000.00",
          },
        },
      });
    expect(recalcRes.status).toBe(200);
    expect(recalcRes.body.data.currentVersion.versionNumber).toBe(1);

    const currentPlan = await agent1.get("/api/v1/plans/current");
    expect(currentPlan.status).toBe(200);
    expect(currentPlan.body.data.plan.id).toBeDefined();

    const scenario = await agent1.post("/api/v1/scenarios").set(csrfHeaders(reg1)).send({
      name: "Closed beta promotion",
      overlay: { cashFlow: { income: "120000.00" } },
    });
    expect(scenario.status).toBe(201);
    const scenarioRun = await agent1
      .post(`/api/v1/scenarios/${scenario.body.data.id}/run`)
      .set(csrfHeaders(reg1));
    expect(scenarioRun.status).toBe(200);
    const scenarioApply = await agent1
      .post(`/api/v1/scenarios/${scenario.body.data.id}/apply`)
      .set(csrfHeaders(reg1));
    expect(scenarioApply.status).toBe(200);
    expect(scenarioApply.body.data.version.versionNumber).toBe(2);

    const driftCreate = await agent1.post("/api/v1/drift/checks").set(csrfHeaders(reg1)).send({
      baselineVersionId: scenarioApply.body.data.version.id,
      mode: "lightweight",
      asOf: "2026-08-31T10:00:00.000Z",
      revision: 1,
      inputs: { cashFlow: { income: "150000.00" } },
      idempotencyKey: "smoke-drift-1",
    });
    expect(driftCreate.status).toBe(202);
    const driftEvent = await processDriftCheck(driftCreate.body.data.id, db);
    expect(driftEvent).toBeDefined();
    const driftAccept = await agent1
      .post(`/api/v1/drift/${driftEvent!.id}/accept`)
      .set(csrfHeaders(reg1));
    expect(driftAccept.status).toBe(200);
    expect(driftAccept.body.data.event.status).toBe("accepted");

    // -------------------------------------------------------------
    // Step 5: Document consent, upload, and metadata isolation
    // -------------------------------------------------------------
    // Grant consent for document storage
    const consentRes = await agent1
      .post("/api/v1/privacy/consents")
      .set(csrfHeaders(reg1))
      .send({
        purpose: "document_storage",
        action: "granted",
        policyVersion: "2026.1",
        idempotencyKey: "smoke-consent-doc-1",
      });
    expect([200, 201]).toContain(consentRes.status);

    const docUpload = await agent1
      .post("/api/v1/documents")
      .set(csrfHeaders(reg1))
      .send({
        displayName: "bank_statement.pdf",
        mediaType: "application/pdf",
        content: Buffer.from("PDF data content").toString("base64"),
      });
    expect(docUpload.status).toBe(201);
    const docId = docUpload.body.data.id;

    // Tenant 2 cannot access document
    const t2Doc = await agent2.get(`/api/v1/documents/${docId}`);
    expect(t2Doc.status).toBe(404);

    // -------------------------------------------------------------
    // Step 6: Export consent, request, and download grant
    // -------------------------------------------------------------
    const exportConsent = await agent1
      .post("/api/v1/privacy/consents")
      .set(csrfHeaders(reg1))
      .send({
        purpose: "privacy_export",
        action: "granted",
        policyVersion: "2026.1",
        idempotencyKey: "smoke-consent-exp-1",
      });
    expect([200, 201]).toContain(exportConsent.status);

    const exportReq = await agent1
      .post("/api/v1/privacy/exports")
      .set(csrfHeaders(reg1))
      .send({ idempotencyKey: "smoke-exp-req-1" });
    expect([200, 202]).toContain(exportReq.status);
    await processPrivacyExport(exportReq.body.data.id, db, fakeStorage);
    const exportStatus = await agent1.get(`/api/v1/privacy/exports/${exportReq.body.data.id}`);
    expect(exportStatus.body.data.status).toBe("completed");
    const exportDownload = await agent1
      .post(`/api/v1/privacy/exports/${exportReq.body.data.id}/download`)
      .set(csrfHeaders(reg1))
      .send({});
    expect(exportDownload.status).toBe(200);

    // -------------------------------------------------------------
    // Step 7: Deletion consent, two-step confirmation, tenant 2 survives
    // -------------------------------------------------------------
    const deleteConsent = await agent1
      .post("/api/v1/privacy/consents")
      .set(csrfHeaders(reg1))
      .send({
        purpose: "household_deletion",
        action: "granted",
        policyVersion: "2026.1",
        idempotencyKey: "smoke-consent-del-1",
      });
    expect([200, 201]).toContain(deleteConsent.status);

    const deleteInit = await agent1
      .post("/api/v1/privacy/deletions")
      .set(csrfHeaders(reg1))
      .send({ idempotencyKey: "smoke-del-req-1" });
    expect([200, 201]).toContain(deleteInit.status);
    const deletionId = deleteInit.body.data.deletion.id;
    const confirmationToken = deleteInit.body.data.confirmationToken;

    if (confirmationToken) {
      const deleteConfirm = await agent1
        .post(`/api/v1/privacy/deletions/${deletionId}/confirm`)
        .set(csrfHeaders(reg1))
        .send({ confirmationToken });
      expect(deleteConfirm.status).toBe(200);
      expect(deleteConfirm.body.data.status).toBe("queued");
      await processHouseholdDeletion(deletionId, db, fakeStorage);
    }

    const deletedTenant = await agent1.get("/api/v1/users/me");
    expect(deletedTenant.status).toBe(401);

    // Tenant 2 survives unaffected
    const t2Me = await agent2.get("/api/v1/users/me");
    expect(t2Me.status).toBe(200);
    expect(t2Me.body.user.displayName).toBe("Tenant Two");

    // -------------------------------------------------------------
    // Step 8: Correlation headers and no secret leakage
    // -------------------------------------------------------------
    expect(reg1.headers["x-request-id"]).toBeTruthy();
    expect(recalcRes.headers["x-request-id"]).toBeTruthy();
    expect(JSON.stringify(reg1.body)).not.toContain("Password123!");
  });
});
