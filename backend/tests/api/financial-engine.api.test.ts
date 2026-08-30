import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";
import { COOKIE } from "../../src/config/constants";
import { isDockerAvailable, resetTestDb, startTestDb, stopTestDb } from "../helpers/db";

const testUser = {
  email: "financial.engine.user@example.com",
  password: "Password123!",
  displayName: "Financial Engine User",
};

function cookieValue(response: request.Response, name: string) {
  const header = response.headers["set-cookie"];
  const list = Array.isArray(header) ? header : header ? [header] : [];
  return list.find((entry) => entry.startsWith(`${name}=`))?.split(";")[0]?.split("=")[1];
}

function csrfHeaders(response: request.Response) {
  return { Origin: "http://localhost:3000", "X-CSRF-Token": cookieValue(response, COOKIE.csrf)! };
}

describe.skipIf(!isDockerAvailable())("financial engine API", () => {
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

  it("requires authentication for all financial engine endpoints", async () => {
    const endpoints = [
      "/api/v1/financial-engine/cash-flow",
      "/api/v1/financial-engine/emergency-fund",
      "/api/v1/financial-engine/loan",
      "/api/v1/financial-engine/investment-projection",
      "/api/v1/financial-engine/goal-funding",
      "/api/v1/financial-engine/net-worth",
      "/api/v1/financial-engine/scenario",
    ];

    for (const endpoint of endpoints) {
      const res = await request(app).post(endpoint).send({});
      expect(res.status).toBe(401);
    }
  });

  it("performs stateless calculation across all endpoints when authenticated", async () => {
    const agent = request.agent(app);
    const registered = await agent.post("/api/v1/auth/register").send(testUser);
    const headers = csrfHeaders(registered);

    // 1. Cash Flow
    const cfRes = await agent
      .post("/api/v1/financial-engine/cash-flow")
      .set(headers)
      .send({
        income: "100000.00",
        essentialExpenses: "30000.00",
        discretionaryExpenses: "20000.00",
        emis: "15000.00",
        mandatoryObligations: "5000.00",
      });

    expect(cfRes.status).toBe(200);
    expect(cfRes.body.data.monthlySurplus).toBe("30000.00");
    expect(cfRes.body.data.savingsRate).toBe("30.0000");
    expect(cfRes.body.data.completeness.status).toBe("complete");
    expect(cfRes.body.data.policyVersion).toBe("IN-2026.1");

    // 2. Emergency Fund
    const efRes = await agent
      .post("/api/v1/financial-engine/emergency-fund")
      .set(headers)
      .send({
        essentialExpenses: "30000.00",
        emis: "10000.00",
        mandatoryObligations: "5000.00",
        incomeStability: "stable",
        dependents: 1,
        currentReserves: "90000.00",
        monthlyContribution: "25000.00",
      });

    expect(efRes.status).toBe(200);
    expect(efRes.body.data.targetAmount).toBe("315000.00");
    expect(efRes.body.data.runwayMonths).toBe("2.0000");
    expect(efRes.body.data.completionMonths).toBe(9);

    // 3. Loan
    const loanRes = await agent
      .post("/api/v1/financial-engine/loan")
      .set(headers)
      .send({
        principal: "5000000.00",
        annualRate: "8.5000",
        tenureMonths: 240,
        prepayments: [{ month: 12, amount: "500000.00" }],
      });

    expect(loanRes.status).toBe(200);
    expect(loanRes.body.data.monthlyEmi).toBe("43391.16");
    expect(loanRes.body.data.prepaymentComparison).toBeDefined();
    expect(loanRes.body.data.schedule).toHaveLength(240);

    // 4. Investment Projection
    const projRes = await agent
      .post("/api/v1/financial-engine/investment-projection")
      .set(headers)
      .send({
        initialLumpSum: "100000.00",
        monthlySip: "10000.00",
        horizonMonths: 60,
      });

    expect(projRes.status).toBe(200);
    expect(projRes.body.data.scenarios.expected.totalInvested).toBe("700000.00");
    expect(parseFloat(projRes.body.data.scenarios.expected.futureValue)).toBeGreaterThan(700000);

    // 5. Goal Funding
    const goalRes = await agent
      .post("/api/v1/financial-engine/goal-funding")
      .set(headers)
      .send({
        goalName: "Child Education",
        goalCategory: "education",
        targetAmountToday: "2000000.00",
        horizonMonths: 60,
        currentSavings: "500000.00",
        availableMonthlyCapacity: "35000.00",
      });

    expect(goalRes.status).toBe(200);
    expect(goalRes.body.data.annualInflationUsed).toBe("8.0000");
    expect(goalRes.body.data.feasibility).toBe("feasible");

    // 6. Net Worth
    const nwRes = await agent
      .post("/api/v1/financial-engine/net-worth")
      .set(headers)
      .send({
        assets: [{ name: "Savings", category: "Cash", value: "200000.00" }],
        liabilities: [{ name: "Loan", category: "Personal", value: "50000.00" }],
      });

    expect(nwRes.status).toBe(200);
    expect(nwRes.body.data.netWorth).toBe("150000.00");
    expect(nwRes.body.data.assetAllocations).toHaveLength(1);

    // 7. Scenario
    const scenRes = await agent
      .post("/api/v1/financial-engine/scenario")
      .set(headers)
      .send({
        name: "Test Scenario",
        baseline: {
          cashFlow: {
            income: "100000.00",
            essentialExpenses: "30000.00",
            discretionaryExpenses: "20000.00",
            emis: "10000.00",
            mandatoryObligations: "5000.00",
          },
        },
        scenario: {
          cashFlow: {
            income: "120000.00",
          },
        },
      });

    expect(scenRes.status).toBe(200);
    expect(scenRes.body.data.deltas.cashFlow.monthlySurplusDelta).toBe("20000.00");
  });

  it("rejects invalid request inputs (e.g. JavaScript numbers instead of decimal strings)", async () => {
    const agent = request.agent(app);
    const registered = await agent.post("/api/v1/auth/register").send({
      email: "validation.user@example.com",
      password: "Password123!",
      displayName: "Validation User",
    });
    const headers = csrfHeaders(registered);

    // Sending JavaScript number 10000 instead of string "10000.00"
    const badRes = await agent
      .post("/api/v1/financial-engine/cash-flow")
      .set(headers)
      .send({
        income: 10000 as never,
      });

    expect(badRes.status).toBe(400);
    expect(badRes.body.error.code).toBe("VALIDATION_ERROR");
  });
});
