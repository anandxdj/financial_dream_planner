import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { env, type Env } from "./config/env";
import { connectDb, db, disconnectDb, type Database } from "./database";
import { jobRuns } from "./database/schema";
import { OutboxDispatcher } from "./modules/jobs/outbox";
import { createDomainQueue, createDomainWorker, createRedisConnection } from "./modules/jobs/queue";
import { RUN_EVENT_TYPE } from "./modules/runs/model";
import { PostgresRunStore, RunService } from "./modules/runs/run.service";
import { processDriftCheck } from "./modules/drift/drift.service";
import { processPrivacyExport, processHouseholdDeletion } from "./modules/privacy/privacy.service";
import { createStorageFromConfig, type ObjectStorage } from "./modules/storage";
import { logger } from "./shared/logger/logger";
import { recordJobOutcome, recordPrivacyOperation } from "./modules/metrics/metrics";

export interface WorkerRuntime {
  close(): Promise<void>;
}

export interface WorkerCompositionOptions {
  config?: Env;
  connect?: (url: string) => Promise<void>;
  disconnect?: () => Promise<void>;
  database?: () => Database;
  storage?: ObjectStorage;
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
  const storage = options.storage ?? createStorageFromConfig(config);
  const redis = (options.redisFactory ?? createRedisConnection)(config.REDIS_URL);
  const queue = (options.queueFactory ?? createDomainQueue)(redis);
  const runService = new RunService(new PostgresRunStore(database));

  const worker = (options.workerFactory ?? createDomainWorker)(redis, async (job) => {
    const correlationId = randomUUID();
    const jobId = job.id;
    const name = job.name;

    try {
      if (name === "privacy_export") {
        const exportId =
          typeof job.data?.exportId === "string"
            ? job.data.exportId
            : typeof job.id === "string"
              ? job.id
              : undefined;
        if (exportId) {
          log.info("privacy_export_job_started", { correlationId, jobId, exportId });
          await processPrivacyExport(exportId, database, storage);
          recordJobOutcome("privacy_export", "completed");
          recordPrivacyOperation("export", "completed");
          log.info("privacy_export_job_completed", { correlationId, jobId, exportId });
          return;
        }
      }

      if (name === "household_deletion") {
        const deletionId =
          typeof job.data?.deletionId === "string"
            ? job.data.deletionId
            : typeof job.id === "string"
              ? job.id
              : undefined;
        if (deletionId) {
          log.info("household_deletion_job_started", { correlationId, jobId, deletionId });
          await processHouseholdDeletion(deletionId, database, storage);
          recordJobOutcome("household_deletion", "completed");
          recordPrivacyOperation("deletion", "completed");
          log.info("household_deletion_job_completed", { correlationId, jobId, deletionId });
          return;
        }
      }

      if (name === "drift_check") {
        const targetCheckId =
          typeof job.data?.checkId === "string"
            ? job.data.checkId
            : typeof job.id === "string"
              ? job.id
              : undefined;
        if (targetCheckId) {
          log.info("drift_job_started", { correlationId, jobId, checkId: targetCheckId });
          await processDriftCheck(targetCheckId, database);
          recordJobOutcome("drift_check", "completed");
          log.info("drift_job_completed", { correlationId, jobId, checkId: targetCheckId });
          return;
        }
      }

      const runId = typeof job.data?.runId === "string" ? job.data.runId : undefined;
      if (!runId) {
        recordJobOutcome(name, "completed");
        return;
      }
      const run = (await database.select().from(jobRuns).where(eq(jobRuns.id, runId)).limit(1))[0];
      if (!run || run.cancelRequestedAt) {
        recordJobOutcome(name, "cancelled");
        return;
      }
      await database.update(jobRuns).set({ status: "running", startedAt: new Date() }).where(eq(jobRuns.id, runId));
      await runService.appendEvent(runId, RUN_EVENT_TYPE.started, { jobId: job.id, name: job.name });
      log.info("job_started", { correlationId, jobId: job.id, runId, name: job.name });
      await database.update(jobRuns).set({ status: "completed", completedAt: new Date(), result: {} }).where(eq(jobRuns.id, runId));
      await runService.appendEvent(runId, RUN_EVENT_TYPE.completed, {});
      recordJobOutcome(name, "completed");
    } catch (err) {
      recordJobOutcome(name, "failed");
      if (name === "privacy_export") recordPrivacyOperation("export", "failed");
      if (name === "household_deletion") recordPrivacyOperation("deletion", "failed");
      log.error("job_execution_failed", {
        correlationId,
        jobId,
        name,
        error: err instanceof Error ? err.message : "unknown",
      });
      throw err;
    }
  });

  const dispatcher = options.dispatcherFactory?.(database, queue) ?? new OutboxDispatcher(database, queue);

  // Initial startup replay of undispatched outbox records
  void dispatcher.dispatchBatch().catch((error) => {
    log.error("startup_outbox_replay_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
  });

  const dispatchTimer = setInterval(() => {
    void dispatcher.dispatchBatch().catch((error) => {
      log.error("outbox_dispatch_failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
    });
  }, 1000);

  return {
    async close() {
      clearInterval(dispatchTimer);
      try {
        await worker.pause(true);
      } catch {
        // worker may already be stopping
      }
      await worker.close();
      await queue.close();
      await redis.quit();
      await disconnect();
    },
  };
}
