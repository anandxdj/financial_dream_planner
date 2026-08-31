import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";
import { COOKIE } from "../../src/config/constants";
import { isDockerAvailable, resetTestDb, startTestDb, stopTestDb } from "../helpers/db";
import { FakeObjectStorage } from "../../src/modules/storage/fake-storage.adapter";
import {
  processHouseholdDeletion,
  processPrivacyExport,
  runPrivacyRetentionCleanup,
} from "../../src/modules/privacy/privacy.service";
import { auditEvents, consentRecords, db, eq, householdDeletions, households, privacyExports } from "../../src/database";

const user1 = {
  email: "privacy.user1@example.com",
  password: "Password123!",
  displayName: "Privacy User 1",
};

const user2 = {
  email: "privacy.user2@example.com",
  password: "Password123!",
  displayName: "Privacy User 2",
};

function cookieValue(response: request.Response, name: string) {
  const header = response.headers["set-cookie"];
  const list = Array.isArray(header) ? header : header ? [header] : [];
  return list.find((entry) => entry.startsWith(`${name}=`))?.split(";")[0]?.split("=")[1];
}

function csrfHeaders(response: request.Response) {
  return { Origin: "http://localhost:3000", "X-CSRF-Token": cookieValue(response, COOKIE.csrf)! };
}

describe.skipIf(!isDockerAvailable())("U8 Documents & Privacy API Endpoints", () => {
  const fakeStorage = new FakeObjectStorage();
  const app = createApp({ storage: fakeStorage });

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    fakeStorage.clear();
  });

  it("requires authentication for all document and privacy endpoints", async () => {
    const unauthDocUpload = await request(app).post("/api/v1/documents").send({});
    expect(unauthDocUpload.status).toBe(401);

    const unauthDocList = await request(app).get("/api/v1/documents");
    expect(unauthDocList.status).toBe(401);

    const unauthDocGet = await request(app).get("/api/v1/documents/123e4567-e89b-12d3-a456-426614174000");
    expect(unauthDocGet.status).toBe(401);

    const unauthDocDownload = await request(app).post("/api/v1/documents/123e4567-e89b-12d3-a456-426614174000/download");
    expect(unauthDocDownload.status).toBe(401);

    const unauthDocDelete = await request(app).delete("/api/v1/documents/123e4567-e89b-12d3-a456-426614174000");
    expect(unauthDocDelete.status).toBe(401);

    const unauthConsentCreate = await request(app).post("/api/v1/privacy/consents").send({});
    expect(unauthConsentCreate.status).toBe(401);

    const unauthConsentList = await request(app).get("/api/v1/privacy/consents");
    expect(unauthConsentList.status).toBe(401);

    const unauthExportCreate = await request(app).post("/api/v1/privacy/exports").send({});
    expect(unauthExportCreate.status).toBe(401);

    const unauthExportGet = await request(app).get("/api/v1/privacy/exports/123e4567-e89b-12d3-a456-426614174000");
    expect(unauthExportGet.status).toBe(401);

    const unauthDeletionCreate = await request(app).post("/api/v1/privacy/deletions").send({});
    expect(unauthDeletionCreate.status).toBe(401);

    const unauthDeletionConfirm = await request(app).post("/api/v1/privacy/deletions/123e4567-e89b-12d3-a456-426614174000/confirm").send({});
    expect(unauthDeletionConfirm.status).toBe(401);
  });

  it("handles complete consent lifecycle via API", async () => {
    const regRes1 = await request(app).post("/api/v1/auth/register").send(user1);
    expect(regRes1.status).toBe(201);
    const headers1 = { Cookie: regRes1.headers["set-cookie"], ...csrfHeaders(regRes1) };

    // Initial consents are not granted
    const listBefore = await request(app).get("/api/v1/privacy/consents").set(headers1);
    expect(listBefore.status).toBe(200);
    expect(listBefore.body.data.effective.document_storage.granted).toBe(false);

    // Record document_storage consent
    const grantRes = await request(app)
      .post("/api/v1/privacy/consents")
      .set(headers1)
      .send({
        purpose: "document_storage",
        action: "granted",
        idempotencyKey: "consent-key-1",
      });
    expect(grantRes.status).toBe(201);
    expect(grantRes.body.data.purpose).toBe("document_storage");
    expect(grantRes.body.data.action).toBe("granted");

    // Replay identical returns 200
    const replayRes = await request(app)
      .post("/api/v1/privacy/consents")
      .set(headers1)
      .send({
        purpose: "document_storage",
        action: "granted",
        idempotencyKey: "consent-key-1",
      });
    expect(replayRes.status).toBe(200);
    expect(replayRes.body.data.id).toBe(grantRes.body.data.id);

    // Replay with different action under same key returns 409
    const conflictRes = await request(app)
      .post("/api/v1/privacy/consents")
      .set(headers1)
      .send({
        purpose: "document_storage",
        action: "withdrawn",
        idempotencyKey: "consent-key-1",
      });
    expect(conflictRes.status).toBe(409);

    // Verify updated effective state
    const listAfter = await request(app).get("/api/v1/privacy/consents").set(headers1);
    expect(listAfter.status).toBe(200);
    expect(listAfter.body.data.effective.document_storage.granted).toBe(true);
    expect(listAfter.body.data.history).toHaveLength(1);
  });

  it("handles document upload, metadata listing, download grant, deletion, and cross-tenant non-disclosure", async () => {
    // 1. Register User 1 & User 2
    const regRes1 = await request(app).post("/api/v1/auth/register").send(user1);
    const headers1 = { Cookie: regRes1.headers["set-cookie"], ...csrfHeaders(regRes1) };

    const regRes2 = await request(app).post("/api/v1/auth/register").send(user2);
    const headers2 = { Cookie: regRes2.headers["set-cookie"], ...csrfHeaders(regRes2) };

    // Grant consent for User 1
    await request(app)
      .post("/api/v1/privacy/consents")
      .set(headers1)
      .send({ purpose: "document_storage", action: "granted", idempotencyKey: "u1-doc-consent" });

    // 2. Upload document
    const uploadRes = await request(app)
      .post("/api/v1/documents")
      .set(headers1)
      .send({
        displayName: "financial_plan_2026.pdf",
        mediaType: "application/pdf",
        content: Buffer.from("My PDF document content").toString("base64"),
      });

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.data.displayName).toBe("financial_plan_2026.pdf");
    expect(uploadRes.body.data.status).toBe("available");
    expect(uploadRes.body.data.objectKey).toBeUndefined(); // Never disclose object key!
    const docId = uploadRes.body.data.id;

    // 3. List documents for User 1
    const listRes = await request(app).get("/api/v1/documents").set(headers1);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].id).toBe(docId);

    // 4. Get by ID for User 1
    const getRes = await request(app).get(`/api/v1/documents/${docId}`).set(headers1);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(docId);

    // 5. Download grant for User 1
    const downloadRes = await request(app).post(`/api/v1/documents/${docId}/download`).set(headers1).send({});
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.body.data.downloadUrl).toBeDefined();
    expect(downloadRes.body.data.expiresAt).toBeDefined();

    // 6. Cross-tenant non-disclosure: User 2 cannot access or delete User 1's document (returns 404)
    const u2Get = await request(app).get(`/api/v1/documents/${docId}`).set(headers2);
    expect(u2Get.status).toBe(404);

    const u2Download = await request(app).post(`/api/v1/documents/${docId}/download`).set(headers2).send({});
    expect(u2Download.status).toBe(404);

    const u2Delete = await request(app).delete(`/api/v1/documents/${docId}`).set(headers2);
    expect(u2Delete.status).toBe(404);

    // 7. User 1 deletes document
    const deleteRes = await request(app).delete(`/api/v1/documents/${docId}`).set(headers1);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.status).toBe("deleted");

    // List for User 1 now hides deleted document
    const listAfter = await request(app).get("/api/v1/documents").set(headers1);
    expect(listAfter.status).toBe(200);
    expect(listAfter.body.data).toHaveLength(0);
  });

  it("handles privacy export workflow and two-step household deletion via API", async () => {
    const regRes = await request(app).post("/api/v1/auth/register").send(user1);
    const headers = { Cookie: regRes.headers["set-cookie"], ...csrfHeaders(regRes) };

    // 1. Grant consent for export and deletion
    await request(app)
      .post("/api/v1/privacy/consents")
      .set(headers)
      .send({ purpose: "privacy_export", action: "granted", idempotencyKey: "c-exp" });

    await request(app)
      .post("/api/v1/privacy/consents")
      .set(headers)
      .send({ purpose: "household_deletion", action: "granted", idempotencyKey: "c-del" });

    // 2. Create export request
    const exportCreateRes = await request(app)
      .post("/api/v1/privacy/exports")
      .set(headers)
      .send({ idempotencyKey: "exp-api-1" });

    expect(exportCreateRes.status).toBe(202);
    const exportId = exportCreateRes.body.data.id;

    // Simulate worker processing export
    await processPrivacyExport(exportId, db, fakeStorage);

    const exportGetRes = await request(app).get(`/api/v1/privacy/exports/${exportId}`).set(headers);
    expect(exportGetRes.status).toBe(200);
    expect(exportGetRes.body.data.status).toBe("completed");

    const exportDownloadRes = await request(app)
      .post(`/api/v1/privacy/exports/${exportId}/download`)
      .set(headers)
      .send({});
    expect(exportDownloadRes.status).toBe(200);
    expect(exportDownloadRes.body.data.downloadUrl).toBeDefined();

    // 3. Initiate two-step household deletion
    const delInitRes = await request(app)
      .post("/api/v1/privacy/deletions")
      .set(headers)
      .send({ idempotencyKey: "del-api-1" });

    expect(delInitRes.status).toBe(201);
    expect(delInitRes.body.data.confirmationToken).toBeDefined();
    const token = delInitRes.body.data.confirmationToken;
    const deletionId = delInitRes.body.data.deletion.id;

    // Replay deletion init returns existing without token
    const delInitReplay = await request(app)
      .post("/api/v1/privacy/deletions")
      .set(headers)
      .send({ idempotencyKey: "del-api-1" });
    expect(delInitReplay.status).toBe(200);
    expect(delInitReplay.body.data.confirmationToken).toBeUndefined();

    // Confirm deletion
    const delConfirmRes = await request(app)
      .post(`/api/v1/privacy/deletions/${deletionId}/confirm`)
      .set(headers)
      .send({ confirmationToken: token });

    expect(delConfirmRes.status).toBe(200);
    expect(delConfirmRes.body.data.status).toBe("queued");
  });

  it("deduplicates concurrent export and deletion requests", async () => {
    const regRes = await request(app).post("/api/v1/auth/register").send(user1);
    const headers = { Cookie: regRes.headers["set-cookie"], ...csrfHeaders(regRes) };

    for (const purpose of ["privacy_export", "household_deletion"] as const) {
      await request(app)
        .post("/api/v1/privacy/consents")
        .set(headers)
        .send({ purpose, action: "granted", idempotencyKey: `consent-${purpose}` });
    }

    const [exportA, exportB] = await Promise.all([
      request(app).post("/api/v1/privacy/exports").set(headers).send({ idempotencyKey: "export-concurrent" }),
      request(app).post("/api/v1/privacy/exports").set(headers).send({ idempotencyKey: "export-concurrent" }),
    ]);
    expect([exportA.status, exportB.status].sort()).toEqual([202, 202]);
    expect(exportA.body.data.id).toBe(exportB.body.data.id);

    const [deletionA, deletionB] = await Promise.all([
      request(app).post("/api/v1/privacy/deletions").set(headers).send({ idempotencyKey: "deletion-concurrent" }),
      request(app).post("/api/v1/privacy/deletions").set(headers).send({ idempotencyKey: "deletion-concurrent" }),
    ]);
    expect([deletionA.status, deletionB.status].sort()).toEqual([200, 201]);
    expect(deletionA.body.data.deletion.id).toBe(deletionB.body.data.deletion.id);
    expect([deletionA.body.data.confirmationToken, deletionB.body.data.confirmationToken].filter(Boolean)).toHaveLength(1);
  });

  it("preserves relational data on partial object deletion failure and recovers without crossing tenants", async () => {
    const targetRegistration = await request(app).post("/api/v1/auth/register").send(user1);
    const targetHeaders = { Cookie: targetRegistration.headers["set-cookie"], ...csrfHeaders(targetRegistration) };
    await request(app).post("/api/v1/auth/register").send(user2).expect(201);

    for (const purpose of ["document_storage", "household_deletion"] as const) {
      await request(app)
        .post("/api/v1/privacy/consents")
        .set(targetHeaders)
        .send({ purpose, action: "granted", idempotencyKey: `recovery-${purpose}` });
    }

    await request(app)
      .post("/api/v1/documents")
      .set(targetHeaders)
      .send({ displayName: "delete-me.txt", mediaType: "text/plain", content: Buffer.from("private").toString("base64") })
      .expect(201);

    const initiated = await request(app)
      .post("/api/v1/privacy/deletions")
      .set(targetHeaders)
      .send({ idempotencyKey: "recovery-deletion" });
    const deletionId = initiated.body.data.deletion.id as string;
    const targetHouseholdId = initiated.body.data.deletion.householdId as string;
    await request(app)
      .post(`/api/v1/privacy/deletions/${deletionId}/confirm`)
      .set(targetHeaders)
      .send({ confirmationToken: initiated.body.data.confirmationToken })
      .expect(200);

    fakeStorage.failNextDelete = true;
    await expect(processHouseholdDeletion(deletionId, db, fakeStorage)).rejects.toBeDefined();
    expect(await db.select().from(households).where(eq(households.id, targetHouseholdId))).toHaveLength(1);
    const [failed] = await db.select().from(householdDeletions).where(eq(householdDeletions.id, deletionId));
    expect(failed.status).toBe("failed");

    await processHouseholdDeletion(deletionId, db, fakeStorage);
    expect(await db.select().from(households).where(eq(households.id, targetHouseholdId))).toHaveLength(0);
    expect(await db.select().from(households)).toHaveLength(1);
    const [completed] = await db.select().from(householdDeletions).where(eq(householdDeletions.id, deletionId));
    expect(completed.status).toBe("completed");
    expect(completed.confirmationTokenHash).toBe("consumed");
    expect(await db.select().from(auditEvents).where(eq(auditEvents.householdId, targetHouseholdId))).not.toHaveLength(0);
    expect(await db.select().from(consentRecords).where(eq(consentRecords.householdId, targetHouseholdId))).not.toHaveLength(0);
  });

  it("hides expired exports during an outage and retries physical retention cleanup", async () => {
    const registration = await request(app).post("/api/v1/auth/register").send(user1);
    const headers = { Cookie: registration.headers["set-cookie"], ...csrfHeaders(registration) };
    await request(app)
      .post("/api/v1/privacy/consents")
      .set(headers)
      .send({ purpose: "privacy_export", action: "granted", idempotencyKey: "expiry-consent" });
    const created = await request(app)
      .post("/api/v1/privacy/exports")
      .set(headers)
      .send({ idempotencyKey: "expiry-export" });
    const exportId = created.body.data.id as string;
    await processPrivacyExport(exportId, db, fakeStorage);
    const [completed] = await db.select().from(privacyExports).where(eq(privacyExports.id, exportId));
    const key = completed.objectKey!;
    const expiredAt = new Date("2026-08-30T00:00:00.000Z");
    await db.update(privacyExports).set({ expiresAt: expiredAt }).where(eq(privacyExports.id, exportId));

    fakeStorage.unavailable = true;
    await runPrivacyRetentionCleanup(db, fakeStorage, () => new Date("2026-08-31T00:00:00.000Z"));
    const hidden = await request(app).post(`/api/v1/privacy/exports/${exportId}/download`).set(headers).send({});
    expect(hidden.status).toBe(410);
    const [retryable] = await db.select().from(privacyExports).where(eq(privacyExports.id, exportId));
    expect(retryable.status).toBe("completed");
    expect(retryable.objectKey).toBe(key);

    fakeStorage.unavailable = false;
    await runPrivacyRetentionCleanup(db, fakeStorage, () => new Date("2026-08-31T00:00:00.000Z"));
    const [cleaned] = await db.select().from(privacyExports).where(eq(privacyExports.id, exportId));
    expect(cleaned.status).toBe("expired");
    expect(cleaned.objectKey).toBeNull();
    expect(fakeStorage.hasKey(key)).toBe(false);
  });

  it("recovers the same durable export request after a storage upload outage", async () => {
    const registration = await request(app).post("/api/v1/auth/register").send(user1);
    const headers = { Cookie: registration.headers["set-cookie"], ...csrfHeaders(registration) };
    await request(app)
      .post("/api/v1/privacy/consents")
      .set(headers)
      .send({ purpose: "privacy_export", action: "granted", idempotencyKey: "retry-consent" });
    const created = await request(app)
      .post("/api/v1/privacy/exports")
      .set(headers)
      .send({ idempotencyKey: "retry-export" });
    const exportId = created.body.data.id as string;

    fakeStorage.failNextUpload = true;
    await expect(processPrivacyExport(exportId, db, fakeStorage)).rejects.toBeDefined();
    const [failed] = await db.select().from(privacyExports).where(eq(privacyExports.id, exportId));
    expect(failed.status).toBe("failed");
    expect(failed.failureCode).toBe("STORAGE_ERROR");

    await processPrivacyExport(exportId, db, fakeStorage);
    const [completed] = await db.select().from(privacyExports).where(eq(privacyExports.id, exportId));
    expect(completed.status).toBe("completed");
    expect(completed.attempts).toBe(2);
    expect(fakeStorage.getAllKeys()).toHaveLength(1);
  });
});
