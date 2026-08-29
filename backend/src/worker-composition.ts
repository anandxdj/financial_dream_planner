import { eq } from "drizzle-orm";
import { env, type Env } from "./config/env";
import { connectDb, db, disconnectDb, type Database } from "./database";
import { jobRuns } from "./database/schema";
import { OutboxDispatcher } from "./modules/jobs/outbox";
import { createDomainQueue, createDomainWorker, createRedisConnection } from "./modules/jobs/queue";
import { RUN_EVENT_TYPE } from "./modules/runs/model";
import { PostgresRunStore, RunService } from "./modules/runs/run.service";
import { logger } from "./shared/logger/logger";

export interface WorkerRuntime { close(): Promise<void>; }
export interface WorkerCompositionOptions {
  config?: Env;
  connect?: (url: string) => Promise<void>;
  disconnect?: () => Promise<void>;
  database?: () => Database;
  redisFactory?: typeof createRedisConnection;
  queueFactory?: typeof createDomainQueue;
  workerFactory?: typeof createDomainWorker;
  dispatcherFactory?: (database: Database, queue: ReturnType<typeof createDomainQueue>) => Pick<OutboxDispatcher, "dispatchBatch">;
  log?: typeof logger;
}

export async function composeWorker(options: WorkerCompositionOptions = {}): Promise<WorkerRuntime> {
  const config = options.config ?? env;
  const connect = options.connect ?? connectDb;
  const disconnect = options.disconnect ?? disconnectDb;
  const log = options.log ?? logger;
  await connect(config.DATABASE_URL);
  const database = options.database?.() ?? db;
  const redis = (options.redisFactory ?? createRedisConnection)(config.REDIS_URL);
  const queue = (options.queueFactory ?? createDomainQueue)(redis);
  const runService = new RunService(new PostgresRunStore(database));
  const worker = (options.workerFactory ?? createDomainWorker)(redis, async (job) => {
    const runId = typeof job.data?.runId === "string" ? job.data.runId : undefined;
    if (!runId) return;
    const run = (await database.select().from(jobRuns).where(eq(jobRuns.id, runId)).limit(1))[0];
    if (!run || run.cancelRequestedAt) return;
    await database.update(jobRuns).set({ status: "running", startedAt: new Date() }).where(eq(jobRuns.id, runId));
    await runService.appendEvent(runId, RUN_EVENT_TYPE.started, { jobId: job.id, name: job.name });
    log.info("job_started", { jobId: job.id, runId, name: job.name });
    await database.update(jobRuns).set({ status: "completed", completedAt: new Date(), result: {} }).where(eq(jobRuns.id, runId));
    await runService.appendEvent(runId, RUN_EVENT_TYPE.completed, {});
  });
  const dispatcher = options.dispatcherFactory?.(database, queue) ?? new OutboxDispatcher(database, queue);
  const dispatchTimer = setInterval(() => void dispatcher.dispatchBatch().catch((error) => log.error("outbox_dispatch_failed", { error: error instanceof Error ? error.message : "unknown" })), 1000);

  return {
    async close() {
      clearInterval(dispatchTimer);
      await worker.close();
      await queue.close();
      await redis.quit();
      await disconnect();
    },
  };
}
