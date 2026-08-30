import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { isDockerAvailable, resetTestDb, startTestDb, stopTestDb } from "../helpers/db";
import {
  db,
  financialSnapshots,
  households,
  planVersions,
  plannerConversations,
  plannerMessages,
  users,
} from "../../src/database";
import { recalculatePlan } from "../../src/modules/plans/plans.service";
import { cleanupExpiredRecords } from "../../src/modules/planner/retention.service";
import {
  analyzePlan,
  getConversationMessages,
  listConversations,
  postChatMessage,
} from "../../src/modules/planner/planner.service";
import type { LlmProvider, LlmRequest, LlmResponse } from "../../src/modules/planner/llm/llm-provider";
import { AppError } from "../../src/shared/errors/app-error";

describe.skipIf(!isDockerAvailable())("Planner PostgreSQL Integration & Invariants", () => {
  const household1Id = "11111111-1111-1111-1111-111111111111";
  const user1Id = "22222222-2222-2222-2222-222222222222";
  const household2Id = "33333333-3333-3333-3333-333333333333";
  const user2Id = "44444444-4444-4444-4444-444444444444";

  const createMockLlm = (output: string): LlmProvider => ({
    providerName: "mock-llm",
    generate: async (_req: LlmRequest): Promise<LlmResponse> => ({
      content: output,
      provider: "mock-llm",
      model: "mock-model",
    }),
  });

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();

    // Create households & users
    await db.insert(households).values([
      { id: household1Id, name: "Household 1" },
      { id: household2Id, name: "Household 2" },
    ]);

    await db.insert(users).values([
      {
        id: user1Id,
        email: "user1@integration.test",
        displayName: "User 1",
      },
      {
        id: user2Id,
        email: "user2@integration.test",
        displayName: "User 2",
      },
    ]);
  });

  it("STRICTLY GUARANTEES plan and baseline immutability during chat and analysis", async () => {
    // 1. Create baseline plan
    const baseline = await recalculatePlan(household1Id, {
      asOf: "2026-08-30T10:00:00.000Z",
      revision: 0,
      inputs: {
        cashFlow: {
          income: "100000.00",
          essentialExpenses: "40000.00",
          discretionaryExpenses: "20000.00",
        },
      },
    });

    const snapshotsBefore = await db.select().from(financialSnapshots);
    const versionsBefore = await db.select().from(planVersions);

    expect(snapshotsBefore).toHaveLength(1);
    expect(versionsBefore).toHaveLength(1);
    const initialSnapshotHash = snapshotsBefore[0].outputHash;
    const initialVersionNumber = versionsBefore[0].versionNumber;

    // 2. Perform planner chat
    const mockLlm = createMockLlm("Consider saving more in liquid funds.");
    const chatRes = await postChatMessage(
      household1Id,
      user1Id,
      { message: "What is my current surplus?" },
      { llmProvider: mockLlm },
    );
    expect(chatRes.message.sender).toBe("assistant");

    // 3. Perform plan analysis
    const analyzeRes = await analyzePlan(
      household1Id,
      user1Id,
      {},
      { llmProvider: mockLlm },
    );
    expect(analyzeRes.message.sender).toBe("assistant");

    // 4. Verify no database mutations on plan or snapshot tables
    const snapshotsAfter = await db.select().from(financialSnapshots);
    const versionsAfter = await db.select().from(planVersions);

    expect(snapshotsAfter).toHaveLength(1);
    expect(versionsAfter).toHaveLength(1);
    expect(snapshotsAfter[0].outputHash).toBe(initialSnapshotHash);
    expect(versionsAfter[0].versionNumber).toBe(initialVersionNumber);
    expect(versionsAfter[0].id).toBe(baseline.currentVersion.id);
  });

  it("persists user message to DB even when downstream LLM processing fails", async () => {
    const failingLlm: LlmProvider = {
      providerName: "failing-llm",
      generate: async () => {
        throw new AppError(503, "PROVIDER_UNAVAILABLE", "Remote LLM service down");
      },
    };

    let caughtError: any;
    try {
      await postChatMessage(
        household1Id,
        user1Id,
        { message: "Persist me on failure" },
        { llmProvider: failingLlm },
      );
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();

    // Verify user message exists in database
    const savedMessages = await db.select().from(plannerMessages);
    expect(savedMessages).toHaveLength(1);
    expect(savedMessages[0].content).toBe("Persist me on failure");
    expect(savedMessages[0].sender).toBe("user");
    expect(savedMessages[0].sequenceNumber).toBe(1);

    // Verify no assistant message was saved
    const savedAssistant = savedMessages.filter((m) => m.sender === "assistant");
    expect(savedAssistant).toHaveLength(0);
  });

  it("filters expired conversations/messages and performs batch cleanup", async () => {
    const pastDate = new Date("2026-01-01T00:00:00.000Z");
    const expiredRetentionDate = new Date("2026-04-01T00:00:00.000Z"); // Expired relative to 2026-08-30

    // Insert an expired conversation and message directly
    const [expConv] = await db
      .insert(plannerConversations)
      .values({
        householdId: household1Id,
        userId: user1Id,
        title: "Old Expired Conversation",
        status: "active",
        createdAt: pastDate,
        updatedAt: pastDate,
        retentionExpiresAt: expiredRetentionDate,
      })
      .returning();

    await db.insert(plannerMessages).values({
      householdId: household1Id,
      conversationId: expConv.id,
      sender: "user",
      content: "Old message",
      sequenceNumber: 1,
      citations: [],
      createdAt: pastDate,
      retentionExpiresAt: expiredRetentionDate,
    });

    // Create an active non-expired conversation
    const mockLlm = createMockLlm("Active conversation response");
    const activeChat = await postChatMessage(
      household1Id,
      user1Id,
      { message: "Active message" },
      { llmProvider: mockLlm },
    );

    // 1. Service list query hides expired conversation
    const visibleConvs = await listConversations(household1Id);
    expect(visibleConvs.data).toHaveLength(1);
    expect(visibleConvs.data[0].id).toBe(activeChat.conversationId);

    // 2. Service message query returns 404 for expired conversation
    await expect(getConversationMessages(household1Id, expConv.id)).rejects.toMatchObject({
      code: "CONVERSATION_NOT_FOUND",
      statusCode: 404,
    });

    // 3. Retention batch cleanup deletes expired records
    const cleanupResult = await cleanupExpiredRecords({ now: new Date("2026-08-30T10:00:00.000Z") });
    expect(cleanupResult.deletedMessages).toBeGreaterThanOrEqual(1);
    expect(cleanupResult.deletedConversations).toBeGreaterThanOrEqual(1);

    // Verify active conversation remains intact
    const remainingConvs = await db.select().from(plannerConversations);
    expect(remainingConvs).toHaveLength(1);
    expect(remainingConvs[0].id).toBe(activeChat.conversationId);
  });

  it("enforces strict cross-tenant non-disclosure (404 on cross-household access)", async () => {
    const mockLlm = createMockLlm("Household 1 secret advice");
    const h1Chat = await postChatMessage(
      household1Id,
      user1Id,
      { message: "Household 1 financial data" },
      { llmProvider: mockLlm },
    );

    // Household 2 attempting to access Household 1 conversation receives 404
    await expect(
      getConversationMessages(household2Id, h1Chat.conversationId),
    ).rejects.toMatchObject({
      code: "CONVERSATION_NOT_FOUND",
      statusCode: 404,
    });

    // Household 2 attempting to append to Household 1 conversation receives 404
    await expect(
      postChatMessage(
        household2Id,
        user2Id,
        { conversationId: h1Chat.conversationId, message: "Cross tenant attempt" },
        { llmProvider: mockLlm },
      ),
    ).rejects.toMatchObject({
      code: "CONVERSATION_NOT_FOUND",
      statusCode: 404,
    });
  });

  it("allocates stable user/assistant sequence pairs under concurrent chat requests", async () => {
    const mockLlm = createMockLlm("Prudent educational guidance.");
    const initial = await postChatMessage(household1Id, user1Id, { message: "Start" }, { llmProvider: mockLlm });
    await Promise.all([
      postChatMessage(household1Id, user1Id, { conversationId: initial.conversationId, message: "First concurrent question" }, { llmProvider: mockLlm }),
      postChatMessage(household1Id, user1Id, { conversationId: initial.conversationId, message: "Second concurrent question" }, { llmProvider: mockLlm }),
    ]);
    const messages = await getConversationMessages(household1Id, initial.conversationId);
    expect(messages.map((message) => message.sequenceNumber)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(messages.filter((message) => message.sender === "assistant")).toHaveLength(3);
  });
});
