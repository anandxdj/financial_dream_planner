import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";
import { COOKIE } from "../../src/config/constants";
import { FakeObjectStorage } from "../../src/modules/storage";
import { isDockerAvailable, resetTestDb, startTestDb, stopTestDb } from "../helpers/db";

const user1 = {
  email: "docs.user1@example.com",
  password: "Password123!",
  displayName: "Docs User 1",
};

const user2 = {
  email: "docs.user2@example.com",
  password: "Password123!",
  displayName: "Docs User 2",
};

function cookieValue(response: request.Response, name: string) {
  const header = response.headers["set-cookie"];
  const list = Array.isArray(header) ? header : header ? [header] : [];
  return list.find((entry) => entry.startsWith(`${name}=`))?.split(";")[0]?.split("=")[1];
}

function csrfHeaders(response: request.Response) {
  return { Origin: "http://localhost:3000", "X-CSRF-Token": cookieValue(response, COOKIE.csrf)! };
}

describe.skipIf(!isDockerAvailable())("U8 Documents API Endpoints", () => {
  const fakeStorage = new FakeObjectStorage();
  const app = createApp({ storage: fakeStorage });

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    fakeStorage.clear();
    await resetTestDb();
  });

  it("requires authentication for all document endpoints", async () => {
    const unauthUpload = await request(app).post("/api/v1/documents").send({});
    expect(unauthUpload.status).toBe(401);

    const unauthList = await request(app).get("/api/v1/documents");
    expect(unauthList.status).toBe(401);

    const unauthGet = await request(app).get("/api/v1/documents/123e4567-e89b-12d3-a456-426614174000");
    expect(unauthGet.status).toBe(401);

    const unauthDownload = await request(app).post("/api/v1/documents/123e4567-e89b-12d3-a456-426614174000/download").send({});
    expect(unauthDownload.status).toBe(401);

    const unauthDelete = await request(app).delete("/api/v1/documents/123e4567-e89b-12d3-a456-426614174000");
    expect(unauthDelete.status).toBe(401);
  });

  it("requires consent before uploading documents", async () => {
    const regRes = await request(app).post("/api/v1/auth/register").send(user1);
    expect(regRes.status).toBe(201);
    const cookies = [
      `${COOKIE.access}=${cookieValue(regRes, COOKIE.access)}`,
      `${COOKIE.refresh}=${cookieValue(regRes, COOKIE.refresh)}`,
      `${COOKIE.csrf}=${cookieValue(regRes, COOKIE.csrf)}`,
    ].join("; ");

    const uploadWithoutConsent = await request(app)
      .post("/api/v1/documents")
      .set("Cookie", cookies)
      .set(csrfHeaders(regRes))
      .send({
        displayName: "Statement.pdf",
        mediaType: "application/pdf",
        content: Buffer.from("test document").toString("base64"),
      });

    expect(uploadWithoutConsent.status).toBe(403);
    expect(uploadWithoutConsent.body.error.code).toBe("CONSENT_REQUIRED");
  });

  it("uploads, lists, downloads, and deletes documents with tenant isolation", async () => {
    // 1. Register User 1 and grant consent
    const regRes1 = await request(app).post("/api/v1/auth/register").send(user1);
    const cookies1 = [
      `${COOKIE.access}=${cookieValue(regRes1, COOKIE.access)}`,
      `${COOKIE.refresh}=${cookieValue(regRes1, COOKIE.refresh)}`,
      `${COOKIE.csrf}=${cookieValue(regRes1, COOKIE.csrf)}`,
    ].join("; ");

    const consentRes1 = await request(app)
      .post("/api/v1/privacy/consents")
      .set("Cookie", cookies1)
      .set(csrfHeaders(regRes1))
      .send({
        purpose: "document_storage",
        action: "granted",
        policyVersion: "2026.1",
        idempotencyKey: "consent-key-u1",
      });
    expect(consentRes1.status).toBe(201);

    // 2. Upload document as User 1
    const uploadRes = await request(app)
      .post("/api/v1/documents")
      .set("Cookie", cookies1)
      .set(csrfHeaders(regRes1))
      .send({
        displayName: "Bank_Statement_2026.pdf",
        mediaType: "application/pdf",
        content: Buffer.from("Confidential Statement Content", "utf8").toString("base64"),
      });

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.data).toBeDefined();
    const docId = uploadRes.body.data.id;
    expect(uploadRes.body.data.displayName).toBe("Bank_Statement_2026.pdf");
    expect(uploadRes.body.data.status).toBe("available");
    expect(uploadRes.body.data).not.toHaveProperty("objectKey"); // Never expose internal object key!

    // 3. List documents for User 1
    const listRes = await request(app)
      .get("/api/v1/documents")
      .set("Cookie", cookies1);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].id).toBe(docId);

    // 4. Get document details for User 1
    const getRes = await request(app)
      .get(`/api/v1/documents/${docId}`)
      .set("Cookie", cookies1);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(docId);

    // 5. Register User 2 (cross-tenant check)
    const regRes2 = await request(app).post("/api/v1/auth/register").send(user2);
    const cookies2 = [
      `${COOKIE.access}=${cookieValue(regRes2, COOKIE.access)}`,
      `${COOKIE.refresh}=${cookieValue(regRes2, COOKIE.refresh)}`,
      `${COOKIE.csrf}=${cookieValue(regRes2, COOKIE.csrf)}`,
    ].join("; ");

    const crossTenantGet = await request(app)
      .get(`/api/v1/documents/${docId}`)
      .set("Cookie", cookies2);
    expect(crossTenantGet.status).toBe(404); // Non-disclosure of foreign documents

    // 6. Generate download grant for User 1
    const downloadRes = await request(app)
      .post(`/api/v1/documents/${docId}/download`)
      .set("Cookie", cookies1)
      .set(csrfHeaders(regRes1))
      .send({});
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.body.data.downloadUrl).toBeDefined();
    expect(downloadRes.body.data.expiresAt).toBeDefined();
    expect(downloadRes.body.data).not.toHaveProperty("objectKey");

    // 7. Delete document as User 1
    const deleteRes = await request(app)
      .delete(`/api/v1/documents/${docId}`)
      .set("Cookie", cookies1)
      .set(csrfHeaders(regRes1));
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.status).toBe("deleted");

    // 8. Subsequent get returns 404
    const getAfterDelete = await request(app)
      .get(`/api/v1/documents/${docId}`)
      .set("Cookie", cookies1);
    expect(getAfterDelete.status).toBe(404);
  });
});
