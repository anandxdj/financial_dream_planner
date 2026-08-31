import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../src/database";
import { outboxEvents } from "../../src/database/schema";
import { checkReadiness } from "../../src/modules/health/health.service";
import { OutboxDispatcher } from "../../src/modules/jobs/outbox";
import {
  resetTestDb,
  startTestDb,
  stopTestDb,
} from "../helpers/db";

describe("operations & outbox recovery integration", () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  it("proves readiness probe against live database", async () => {
    const checkDb = async () => {
      await db.execute(sql`SELECT 1`);
      return true;
    };
    const checkRedis = async () => true;

    const result = await checkReadiness({ checkDb, checkRedis });
    expect(result.statusCode).toBe(200);
    expect(result.body.status).toBe("ready");
    expect(result.body.checks.database).toBe("ready");
  });

  it("outbox dispatcher replays pending events and recovers on retries", async () => {
    // Insert an un-dispatched outbox event
    const [inserted] = await db
      .insert(outboxEvents)
      .values({
        aggregateId: "11111111-1111-1111-1111-111111111111",
        topic: "drift_check",
        payload: { checkId: "check-1" },
        attempts: 0,
      })
      .returning();

    expect(inserted).toBeDefined();

    // Mock queue that succeeds on second attempt
    let attemptCount = 0;
    const mockQueue = {
      count: async () => 1,
      add: async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error("Simulated transient queue connection failure");
        }
      },
    };

    const dispatcher = new OutboxDispatcher(db, mockQueue as any);

    // First attempt fails and sets availableAt in future
    await dispatcher.dispatchBatch();
    const [failedEvent] = await db
      .select()
      .from(outboxEvents)
      .where(sql`id = ${inserted!.id}`);
    expect(failedEvent?.publishedAt).toBeNull();
    expect(failedEvent?.attempts).toBe(1);
    expect(failedEvent?.lastError).toContain("Simulated transient queue");

    // Fast-forward availableAt for retry
    await db
      .update(outboxEvents)
      .set({ availableAt: new Date(Date.now() - 1000) })
      .where(sql`id = ${inserted!.id}`);

    // Second attempt succeeds
    await dispatcher.dispatchBatch();
    const [successEvent] = await db
      .select()
      .from(outboxEvents)
      .where(sql`id = ${inserted!.id}`);
    expect(successEvent?.publishedAt).not.toBeNull();
    expect(successEvent?.attempts).toBe(2);
  });
});
