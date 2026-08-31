import type { Express } from "express";
import { sql } from "drizzle-orm";
import { createApp } from "./app";
import { env, type Env } from "./config/env";
import { connectDb, db, disconnectDb } from "./database";
import { RunService, PostgresRunStore } from "./modules/runs/run.service";
import { createDomainQueue, createRedisConnection } from "./modules/jobs/queue";
import { createStorageFromConfig, type ObjectStorage } from "./modules/storage";
import type { HealthDependencies } from "./modules/health/health.service";

export interface ApiRuntime {
  app: Express;
  setShuttingDown(val: boolean): void;
  close(): Promise<void>;
}

export async function composeApi(
  config: Env = env,
  options: { storage?: ObjectStorage } = {},
): Promise<ApiRuntime> {
  await connectDb(config.DATABASE_URL);
  const redis = createRedisConnection(config.REDIS_URL);
  const queue = createDomainQueue(redis);
  const runService = new RunService(new PostgresRunStore(db));
  const storage = options.storage ?? createStorageFromConfig(config);

  let isShuttingDown = false;
  const health: HealthDependencies = {
    checkDb: async () => {
      try {
        await db.execute(sql`SELECT 1`);
        return true;
      } catch {
        return false;
      }
    },
    checkRedis: async () => {
      try {
        const res = await redis.ping();
        return res === "PONG";
      } catch {
        return false;
      }
    },
    isShuttingDown: () => isShuttingDown,
  };

  return {
    app: createApp({ runService, storage, health }),
    setShuttingDown(val: boolean) {
      isShuttingDown = val;
    },
    async close() {
      await queue.close();
      await redis.quit();
      await disconnectDb();
    },
  };
}
