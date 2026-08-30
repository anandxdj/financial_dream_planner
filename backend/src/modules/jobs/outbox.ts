import { and, asc, eq, isNull, lte, sql } from "drizzle-orm";
import type { Queue } from "bullmq";
import type { Database } from "../../database";
import { outboxEvents } from "../../database/schema";
import { durableJobOptions } from "./queue";

export class OutboxDispatcher {
  private activeDispatch?: Promise<number>;

  constructor(private readonly database: Database, private readonly queue: Queue) {}

  dispatchBatch(limit = 50) {
    if (this.activeDispatch) return this.activeDispatch;
    this.activeDispatch = this.dispatch(limit).finally(() => { this.activeDispatch = undefined; });
    return this.activeDispatch;
  }

  private async dispatch(limit: number) {
    const events = await this.database.select().from(outboxEvents).where(and(isNull(outboxEvents.publishedAt), lte(outboxEvents.availableAt, new Date()))).orderBy(asc(outboxEvents.createdAt)).limit(limit);
    let published = 0;
    for (const event of events) {
      try {
        const durableId = event.topic === "drift_check" ? event.aggregateId : event.id;
        await this.queue.add(event.topic, event.payload, durableJobOptions(durableId));
        await this.database.update(outboxEvents).set({ publishedAt: new Date(), attempts: sql`${outboxEvents.attempts} + 1`, lastError: null }).where(and(eq(outboxEvents.id, event.id), isNull(outboxEvents.publishedAt)));
        published += 1;
      } catch (error) {
        await this.database.update(outboxEvents).set({ attempts: sql`${outboxEvents.attempts} + 1`, lastError: error instanceof Error ? error.message.slice(0, 1000) : "Unknown queue error", availableAt: new Date(Date.now() + 5000) }).where(eq(outboxEvents.id, event.id));
      }
    }
    return published;
  }
}
