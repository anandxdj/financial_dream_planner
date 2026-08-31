import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";
import { COOKIE } from "../../src/config/constants";
import { FakeObjectStorage } from "../../src/modules/storage";
import { isDockerAvailable, resetTestDb, startTestDb, stopTestDb } from "../helpers/db";

const user1 = {
  email: "privacy.user1@example.com",
  password: "Password123!",
  displayName: "Privacy User 1",
};

function cookieValue(response: request.Response, name: string) {
  const header = response.headers["set-cookie"];
  const list = Array.isArray(header) ? header : header ? [header] : [];
  return list.find((entry) => entry.startsWith(`${name}=`))?.split(";")[0]?.split("=")[1];
}

function csrfHeaders(response: request.Response) {
  return { Origin: "http://localhost:3000", "X-CSRF-Token": cookieValue(response, COOKIE.csrf)! };
}

describe.skipIf(!isDockerAvailable())("U8 Privacy API Endpoints", () => {
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

  it("requires authentication for all privacy endpoints", async () => {
    const unauthConsentPost = await request(app).post("/api/v1/privacy/consents").send({});
    expect(unauthConsentPost.status).toBe(401);

    const unauthConsentGet = await request(app).get("/api/v1/privacy/consents");
    expect(unauthConsentGet.status).toBe(401);

    const unauthExportPost = await request(app).post("/api/v1/privacy/exports").send({});
    expect(unauthExportPost.status).toBe(401);

    const unauthDeletionPost = await request(app).post("/api/v1/privacy/deletions").send({});
    expect(unauthDeletionPost.status).toBe(401);

    const unauthDeletionConfirm = await request(app).post("/api/v1/privacy/deletions/123e4567-e89b-12d3-a456-426614174000/confirm").send({});
    expect(unauthDeletionConfirm.status).toBe(401);
  });

  it("records consent, respects idempotency, and lists effective states", async () => {
    const regRes = await request(app).post("/api/v1/auth/register").send(user1);
    const cookies = [
      `${COOKIE.access}=${cookieValue(regRes, COOKIE.access)}`,
      `${COOKIE.refresh}=${cookieValue(regRes, COOKIE.refresh)}`,
      `${COOKIE.csrf}=${cookieValue(regRes, COOKIE.csrf)}`,
    ].join("; ");

    // 1. Grant consent
    const grantRes = await request(app)
      .post("/api/v1/privacy/consents")
      .set("Cookie", cookies)
      .set(csrfHeaders(regRes))
      .send({
        purpose: "privacy_export",
        action: "granted",
        policyVersion: "2026.1",
        idempotencyKey: "consent-key-001",
      });

    expect(grantRes.status).toBe(201);
    expect(grantRes.body.data.action).toBe("granted");

    // 2. Replay same consent request with same idempotency key (returns 200)
    const replayRes = await request(app)
      .post("/api/v1/privacy/consents")
      .set("Cookie", cookies)
      .set(csrfHeaders(regRes))
      .send({
        purpose: "privacy_export",
        action: "granted",
        policyVersion: "2026.1",
        idempotencyKey: "consent-key-001",
      });

    expect(replayRes.status).toBe(200);
    expect(replayRes.body.data.id).toBe(grantRes.body.data.id);

    // 3. Replay with different payload throws 409 conflict
    const conflictRes = await request(app)
      .post("/api/v1/privacy/consents")
      .set("Cookie", cookies)
      .set(csrfHeaders(regRes))
      .send({
        purpose: "household_deletion",
        action: "granted",
        policyVersion: "2026.1",
        idempotencyKey: "consent-key-001",
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error.code).toBe("CONSENT_IDEMPOTENCY_CONFLICT");

    // 4. List consents
    const listRes = await request(app)
      .get("/api/v1/privacy/consents")
      .set("Cookie", cookies);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.effective.privacy_export.granted).toBe(true);
    expect(listRes.body.data.effective.household_deletion.granted).toBe(false);
    expect(listRes.body.data.history).toHaveLength(1);
  });

  it("handles export requests and deletion flow with confirmation token", async () => {
    const regRes = await request(app).post("/api/v1/auth/register").send(user1);
    const cookies = [
      `${COOKIE.access}=${cookieValue(regRes, COOKIE.access)}`,
      `${COOKIE.refresh}=${cookieValue(regRes, COOKIE.refresh)}`,
      `${COOKIE.csrf}=${cookieValue(regRes, COOKIE.csrf)}`,
    ].join("; ");

    // 1. Grant privacy_export and household_deletion consents
    await request(app)
      .post("/api/v1/privacy/consents")
      .set("Cookie", cookies)
      .set(csrfHeaders(regRes))
      .send({
        purpose: "privacy_export",
        action: "granted",
        policyVersion: "2026.1",
        idempotencyKey: "consent-exp-1",
      });

    await request(app)
      .post("/api/v1/privacy/consents")
      .set("Cookie", cookies)
      .set(csrfHeaders(regRes))
      .send({
        purpose: "household_deletion",
        action: "granted",
        policyVersion: "2026.1",
        idempotencyKey: "consent-del-1",
      });

    // 2. Request privacy export
    const exportRes = await request(app)
      .post("/api/v1/privacy/exports")
      .set("Cookie", cookies)
      .set(csrfHeaders(regRes))
      .send({ idempotencyKey: "export-key-1" });

    expect(exportRes.status).toBe(202);
    expect(exportRes.body.data.status).toBe("queued");
    const exportId = exportRes.body.data.id;

    // 3. Get export by ID
    const getExportRes = await request(app)
      .get(`/api/v1/privacy/exports/${exportId}`)
      .set("Cookie", cookies);
    expect(getExportRes.status).toBe(200);
    expect(getExportRes.body.data.id).toBe(exportId);

    // 4. Initiate deletion
    const initDelRes = await request(app)
      .post("/api/v1/privacy/deletions")
      .set("Cookie", cookies)
      .set(csrfHeaders(regRes))
      .send({ idempotencyKey: "deletion-key-1" });

    expect(initDelRes.status).toBe(201);
    expect(initDelRes.body.data.deletion.status).toBe("pending_confirmation");
    expect(initDelRes.body.data.confirmationToken).toBeDefined();
    const token = initDelRes.body.data.confirmationToken;
    const deletionId = initDelRes.body.data.deletion.id;

    // 5. Wrong confirmation token is rejected without consuming confirmation
    const wrongConfirm = await request(app)
      .post(`/api/v1/privacy/deletions/${deletionId}/confirm`)
      .set("Cookie", cookies)
      .set(csrfHeaders(regRes))
      .send({ confirmationToken: "wrong-token-value" });

    expect(wrongConfirm.status).toBe(400);
    expect(wrongConfirm.body.error.code).toBe("INVALID_CONFIRMATION_TOKEN");

    // 6. Valid confirmation queues the deletion
    const validConfirm = await request(app)
      .post(`/api/v1/privacy/deletions/${deletionId}/confirm`)
      .set("Cookie", cookies)
      .set(csrfHeaders(regRes))
      .send({ confirmationToken: token });

    expect(validConfirm.status).toBe(200);
    expect(validConfirm.body.data.status).toBe("queued");
  });
});
