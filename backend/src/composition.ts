import type { Express } from "express";
import { createApp } from "./app";
import { env, type Env } from "./config/env";
import { connectDb, db, disconnectDb } from "./database";
import { RunService, PostgresRunStore } from "./modules/runs/run.service";
import { createDomainQueue, createRedisConnection } from "./modules/jobs/queue";

import { createStorageFromConfig, type ObjectStorage } from "./modules/storage";

export interface ApiRuntime { app: Express; close(): Promise<void>; }

export async function composeApi(
  config: Env = env,
  options: { storage?: ObjectStorage } = {},
): Promise<ApiRuntime> {
  await connectDb(config.DATABASE_URL);
  const redis = createRedisConnection(config.REDIS_URL);
  const queue = createDomainQueue(redis);
  const runService = new RunService(new PostgresRunStore(db));
  const storage = options.storage ?? createStorageFromConfig(config);
  return {
    app: createApp({ runService, storage }),
    async close() { await queue.close(); await redis.quit(); await disconnectDb(); },
  };
}
