import { randomUUID } from "node:crypto";
import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import type { Database } from "../../database";
import { jobRuns, runEvents, type SelectJobRun, type SelectRunEvent } from "../../database/schema";
import { AppError } from "../../shared/errors/app-error";
import type { RunEventType } from "./model";

export interface RunStore {
  create(kind: string, input: Record<string, unknown>): Promise<SelectJobRun>;
  get(id: string): Promise<SelectJobRun | undefined>;
  cancel(id: string): Promise<SelectJobRun | undefined>;
  append(runId: string, type: RunEventType, payload: Record<string, unknown>): Promise<SelectRunEvent>;
  eventsAfter(runId: string, eventId?: string): Promise<SelectRunEvent[]>;
}

export class PostgresRunStore implements RunStore {
  constructor(private readonly database: Database) {}
  async create(kind: string, input: Record<string, unknown>) {
    return (await this.database.insert(jobRuns).values({ kind, input }).returning())[0]!;
  }

  async get(id: string) {
    return (await this.database.select().from(jobRuns).where(eq(jobRuns.id, id)).limit(1))[0];
  }

  async cancel(id: string) {
    const cancelled = (await this.database.update(jobRuns).set({ status: "cancelled", cancelRequestedAt: new Date(), completedAt: new Date() }).where(and(eq(jobRuns.id, id), inArray(jobRuns.status, ["queued", "running"]))).returning())[0];
    return cancelled ?? this.get(id);
  }

  async append(runId: string, type: RunEventType, payload: Record<string, unknown>) {
    return await this.database.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${runId}))`);
      const [row] = await tx.insert(runEvents).values({ runId, type, payload, sequence: sql<number>`(select coalesce(max(sequence), 0) + 1 from run_events where run_id = ${runId})` }).returning();
      return row!;
    });
  }
  async eventsAfter(runId: string, eventId?: string) {
    let sequence = 0;
    if (eventId) {
      const anchor = (await this.database.select().from(runEvents).where(and(eq(runEvents.id, eventId), eq(runEvents.runId, runId))).limit(1))[0];
      if (!anchor) throw new AppError(400, "INVALID_EVENT_CURSOR", "Event cursor does not belong to this run");
      sequence = anchor.sequence;
    }
    return this.database.select().from(runEvents).where(and(eq(runEvents.runId, runId), gt(runEvents.sequence, sequence))).orderBy(asc(runEvents.sequence));
  }
}

export class InMemoryRunStore implements RunStore {
  private readonly runs = new Map<string, SelectJobRun>();
  private readonly events = new Map<string, SelectRunEvent[]>();

  async create(kind: string, input: Record<string, unknown>) {
    const now = new Date();
    const run: SelectJobRun = { id: randomUUID(), kind, status: "queued", input, result: null, error: null, cancelRequestedAt: null, startedAt: null, completedAt: null, createdAt: now, updatedAt: now };
    this.runs.set(run.id, run);
    return run;
  }

  async get(id: string) { return this.runs.get(id); }

  async cancel(id: string) {
    const run = this.runs.get(id);
    if (!run || !["queued", "running"].includes(run.status)) return run;
    const now = new Date();
    const cancelled: SelectJobRun = { ...run, status: "cancelled", cancelRequestedAt: now, completedAt: now, updatedAt: now };
    this.runs.set(id, cancelled);
    return cancelled;
  }

  async append(runId: string, type: RunEventType, payload: Record<string, unknown>) {
    const events = this.events.get(runId) ?? [];
    const event: SelectRunEvent = { id: randomUUID(), runId, sequence: events.length + 1, type, payload, createdAt: new Date() };
    events.push(event);
    this.events.set(runId, events);
    return event;
  }

  async eventsAfter(runId: string, eventId?: string) {
    const events = this.events.get(runId) ?? [];
    if (!eventId) return events;
    const index = events.findIndex((event) => event.id === eventId);
    if (index < 0) throw new AppError(400, "INVALID_EVENT_CURSOR", "Event cursor does not belong to this run");
    return events.slice(index + 1);
  }
}

export class RunService {
  constructor(private readonly store: RunStore) {}
  create(kind: string, input: Record<string, unknown>) { return this.store.create(kind, input); }
  async get(id: string) { const run = await this.store.get(id); if (!run) throw new AppError(404, "RUN_NOT_FOUND", "Run not found"); return run; }
  async cancel(id: string) { const run = await this.store.cancel(id); if (!run) throw new AppError(404, "RUN_NOT_FOUND", "Run not found"); return run; }
  async appendEvent(runId: string, type: RunEventType, payload: Record<string, unknown>) { await this.get(runId); return this.store.append(runId, type, payload); }
  async eventsAfter(runId: string, eventId?: string) { await this.get(runId); return this.store.eventsAfter(runId, eventId); }
  eventsAfterKnownRun(runId: string, eventId?: string) { return this.store.eventsAfter(runId, eventId); }
}
