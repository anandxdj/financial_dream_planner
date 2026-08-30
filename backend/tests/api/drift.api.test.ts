import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";
import { COOKIE } from "../../src/config/constants";
import { isDockerAvailable, resetTestDb, startTestDb, stopTestDb } from "../helpers/db";
import { processDriftCheck } from "../../src/modules/drift/drift.service";

const user1 = {
  email: "drift.user1@example.com",
  password: "Password123!",
  displayName: "Drift User 1",
};

const user2 = {
  email: "drift.user2@example.com",
  password: "Password123!",
  displayName: "Drift User 2",
};

function cookieValue(response: request.Response, name: string) {
  const header = response.headers["set-cookie"];
  const list = Array.isArray(header) ? header : header ? [header] : [];
  return list.find((entry) => entry.startsWith(`${name}=`))?.split(";")[0]?.split("=")[1];
}

function csrfHeaders(response: request.Response) {
  return { Origin: "http://localhost:3000", "X-CSRF-Token": cookieValue(response, COOKIE.csrf)! };
}

describe.skipIf(!isDockerAvailable())("U7 Drift API Endpoints", () => {
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

  it("requires authentication for all drift endpoints", async () => {
    const unauthCreate = await request(app).post("/api/v1/drift/checks").send({});
    expect(unauthCreate.status).toBe(401);

    const unauthGetCheck = await request(app).get("/api/v1/drift/checks/123e4567-e89b-12d3-a456-426614174000");
    expect(unauthGetCheck.status).toBe(401);

    const unauthCurrent = await request(app).get("/api/v1/drift/current");
    expect(unauthCurrent.status).toBe(401);

    const unauthList = await request(app).get("/api/v1/drift");
    expect(unauthList.status).toBe(401);

    const unauthAccept = await request(app).post("/api/v1/drift/123e4567-e89b-12d3-a456-426614174000/accept");
    expect(unauthAccept.status).toBe(401);

    const unauthKeep = await request(app).post("/api/v1/drift/123e4567-e89b-12d3-a456-426614174000/keep");
    expect(unauthKeep.status).toBe(401);
  });

  it("handles complete check creation, processing, current read, accept, and keep workflow", async () => {
    // 1. Register User 1 and initialize plan
    const regRes1 = await request(app).post("/api/v1/auth/register").send(user1);
    expect(regRes1.status).toBe(201);
    const authCookie1 = regRes1.headers["set-cookie"];
    const headers1 = { Cookie: authCookie1, ...csrfHeaders(regRes1) };

    const planRes = await request(app)
      .post("/api/v1/plans/recalculate")
      .set(headers1)
      .send({
        asOf: "2026-08-30T10:00:00.000Z",
        revision: 0,
        inputs: {
          cashFlow: {
            income: "100000.00",
            essentialExpenses: "30000.00",
            discretionaryExpenses: "20000.00",
            emis: "10000.00",
            mandatoryObligations: "5000.00",
          },
          emergencyFund: {
            essentialExpenses: "30000.00",
            emis: "10000.00",
            mandatoryObligations: "5000.00",
            incomeStability: "stable",
            dependents: 0,
            currentReserves: "270000.00",
          },
        },
      });
    expect(planRes.status).toBe(200);
    const baselineVersionId = planRes.body.data.currentVersion.id;

    // 2. Initial current pending drift should be null
    const currentBefore = await request(app).get("/api/v1/drift/current").set(headers1);
    expect(currentBefore.status).toBe(200);
    expect(currentBefore.body.data).toBeNull();

    // 3. Create drift check (returns 202 Accepted)
    const createCheckRes = await request(app)
      .post("/api/v1/drift/checks")
      .set(headers1)
      .send({
        baselineVersionId,
        mode: "lightweight",
        asOf: "2026-08-30T11:00:00.000Z",
        revision: 1,
        inputs: {
          cashFlow: {
            income: "130000.00", // 30% increase
            essentialExpenses: "30000.00",
            discretionaryExpenses: "20000.00",
            emis: "10000.00",
            mandatoryObligations: "5000.00",
          },
        },
        idempotencyKey: "api-drift-check-1",
      });
    expect(createCheckRes.status).toBe(202);
    expect(createCheckRes.body.data.status).toBe("queued");
    const checkId = createCheckRes.body.data.id;

    // 4. Strict validation: reject unknown fields (400)
    const invalidCheckRes = await request(app)
      .post("/api/v1/drift/checks")
      .set(headers1)
      .send({
        baselineVersionId,
        mode: "lightweight",
        asOf: "2026-08-30T11:00:00.000Z",
        revision: 1,
        inputs: { cashFlow: { income: "130000.00" } },
        idempotencyKey: "bad-extra-key",
        unknownProp: "illegal",
      });
    expect(invalidCheckRes.status).toBe(400);

    // 5. Process check via worker
    const processedEvent = await processDriftCheck(checkId);
    expect(processedEvent).toBeDefined();

    // 6. GET /checks/:id returns completed check and associated event
    const getCheckRes = await request(app)
      .get(`/api/v1/drift/checks/${checkId}`)
      .set(headers1);
    expect(getCheckRes.status).toBe(200);
    expect(getCheckRes.body.data.check.status).toBe("completed");
    expect(getCheckRes.body.data.event).toBeDefined();
    expect(getCheckRes.body.data.event.id).toBe(processedEvent!.id);

    // 7. GET /current returns pending event
    const currentAfter = await request(app).get("/api/v1/drift/current").set(headers1);
    expect(currentAfter.status).toBe(200);
    expect(currentAfter.body.data.id).toBe(processedEvent!.id);

    // 8. GET / lists drift events
    const listRes = await request(app).get("/api/v1/drift?status=pending").set(headers1);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].id).toBe(processedEvent!.id);

    const invalidAcceptBody = await request(app)
      .post(`/api/v1/drift/${processedEvent!.id}/accept`)
      .set(headers1)
      .send({ inputs: { cashFlow: { income: "1" } } });
    expect(invalidAcceptBody.status).toBe(400);

    // 9. Accept drift event (POST /api/v1/drift/:id/accept)
    const acceptRes = await request(app)
      .post(`/api/v1/drift/${processedEvent!.id}/accept`)
      .set(headers1);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.event.status).toBe("accepted");
    expect(acceptRes.body.data.version.versionNumber).toBe(2);
    expect(acceptRes.body.data.plan.currentVersionId).toBe(acceptRes.body.data.version.id);

    // 10. Idempotent accept returns 200 with same version
    const acceptRepeatRes = await request(app)
      .post(`/api/v1/drift/${processedEvent!.id}/accept`)
      .set(headers1);
    expect(acceptRepeatRes.status).toBe(200);
    expect(acceptRepeatRes.body.data.version.id).toBe(acceptRes.body.data.version.id);

    // 11. Cross-tenant isolation: User 2 cannot access User 1's check or event
    const regRes2 = await request(app).post("/api/v1/auth/register").send(user2);
    expect(regRes2.status).toBe(201);
    const authCookie2 = regRes2.headers["set-cookie"];
    const headers2 = { Cookie: authCookie2, ...csrfHeaders(regRes2) };

    const crossTenantGet = await request(app)
      .get(`/api/v1/drift/checks/${checkId}`)
      .set(headers2);
    expect(crossTenantGet.status).toBe(404);

    const crossTenantAccept = await request(app)
      .post(`/api/v1/drift/${processedEvent!.id}/accept`)
      .set(headers2);
    expect(crossTenantAccept.status).toBe(404);
  });
});
