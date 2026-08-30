import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { isDockerAvailable, resetTestDb, startTestDb, stopTestDb } from "../helpers/db";
import { db, evidence, households, researchRuns, users } from "../../src/database";
import { executeResearch, getResearchRun, getRunEvidence } from "../../src/modules/research/research.service";
import type { SearchCandidate, SearchProvider } from "../../src/modules/research/search-provider";

describe.skipIf(!isDockerAvailable())("Research PostgreSQL Integration", () => {
  const household1Id = "11111111-1111-1111-1111-111111111111";
  const user1Id = "22222222-2222-2222-2222-222222222222";
  const household2Id = "33333333-3333-3333-3333-333333333333";
  const user2Id = "44444444-4444-4444-4444-444444444444";

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();

    await db.insert(households).values([
      { id: household1Id, name: "Household 1" },
      { id: household2Id, name: "Household 2" },
    ]);

    await db.insert(users).values([
      {
        id: user1Id,
        email: "user1@research.test",
        displayName: "User 1",
      },
      {
        id: user2Id,
        email: "user2@research.test",
        displayName: "User 2",
      },
    ]);
  });

  it("persists research runs and evidence in database with correct rank ordering", async () => {
    const mockSearchProvider: SearchProvider = {
      providerName: "mock-search",
      search: async (_query: string): Promise<SearchCandidate[]> => [
        {
          url: "https://livemint.com/news/repo-update",
          title: "Livemint Repo Rate Update",
          content: "RBI announces repo rate stays at 6.5%.",
          score: 0.85,
        },
        {
          url: "https://rbi.org.in/press/monetary-policy-statement",
          title: "RBI Official Press Release",
          content: "The Reserve Bank of India policy repo rate remains at 6.5%.",
          score: 0.95,
        },
      ],
    };

    const mockFetchTransport = async (url: string) => {
      if (url.includes("rbi.org.in")) {
        return new Response(
          "<html><head><title>RBI Official</title></head><body><p>The Reserve Bank of India policy repo rate remains at 6.5%.</p></body></html>",
          { status: 200, headers: { "Content-Type": "text/html" } },
        );
      }
      return new Response(
        "<html><head><title>Livemint Update</title></head><body><p>RBI announces repo rate stays at 6.5%.</p></body></html>",
        { status: 200, headers: { "Content-Type": "text/html" } },
      );
    };

    const publicDns = async () => ["93.184.216.34"];

    const result = await executeResearch(
      household1Id,
      user1Id,
      { query: "Current RBI repo rate", topic: "interest_rates" },
      {
        searchProvider: mockSearchProvider,
        fetchTransport: mockFetchTransport as any,
        dnsLookup: publicDns,
      },
    );

    expect(result.run.status).toBe("completed");
    expect(result.evidence).toHaveLength(2);

    // Evidence should be sorted with Government/Regulator first (rank 1), then Publication (rank 5)
    expect(result.evidence[0].sourceType).toBe("government_regulator");
    expect(result.evidence[0].canonicalSourceUrl).toBe("https://rbi.org.in/press/monetary-policy-statement");
    expect(result.evidence[1].sourceType).toBe("reputable_publication");

    // Check DB persistence
    const dbRun = await getResearchRun(household1Id, result.run.id);
    expect(dbRun.id).toBe(result.run.id);

    const dbEvidence = await getRunEvidence(household1Id, result.run.id);
    expect(dbEvidence).toHaveLength(2);
    expect(dbEvidence[0].sourceType).toBe("government_regulator");
    expect(dbEvidence[1].sourceType).toBe("reputable_publication");

    // Check retention & freshness dates
    const diffRetention = (dbRun.retentionExpiresAt.getTime() - dbRun.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    expect(Math.round(diffRetention)).toBe(90);

    const diffFreshness =
      (dbEvidence[0].freshnessExpiresAt.getTime() - dbEvidence[0].retrievedAt.getTime()) / (1000 * 60 * 60 * 24);
    expect(Math.round(diffFreshness)).toBe(30);
  });

  it("enforces tenant isolation across households on research runs and evidence", async () => {
    const [run] = await db
      .insert(researchRuns)
      .values({
        householdId: household1Id,
        userId: user1Id,
        query: "Secret strategy",
        topic: "tax_planning",
        status: "completed",
        provider: "mock",
        createdAt: new Date(),
        retentionExpiresAt: new Date(Date.now() + 90 * 86400000),
      })
      .returning();

    await db.insert(evidence).values({
      householdId: household1Id,
      researchRunId: run.id,
      topic: "tax_planning",
      claim: "Claim text",
      canonicalSourceUrl: "https://incometaxindia.gov.in/rules",
      publisher: "incometaxindia.gov.in",
      sourceType: "government_regulator",
      retrievedAt: new Date(),
      freshnessExpiresAt: new Date(Date.now() + 30 * 86400000),
      contentHash: "a".repeat(64),
      supportingExcerpt: "Excerpt",
      confidence: "0.90",
      createdAt: new Date(),
      retentionExpiresAt: new Date(Date.now() + 90 * 86400000),
    });

    // Household 2 receives 404 when querying Household 1's run or evidence
    await expect(getResearchRun(household2Id, run.id)).rejects.toMatchObject({
      code: "RESEARCH_RUN_NOT_FOUND",
      statusCode: 404,
    });

    await expect(getRunEvidence(household2Id, run.id)).rejects.toMatchObject({
      code: "RESEARCH_RUN_NOT_FOUND",
      statusCode: 404,
    });
  });
});
