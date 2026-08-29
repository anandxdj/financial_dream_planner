import { Queue, Worker, type JobsOptions, type Processor } from "bullmq";
import IORedis from "ioredis";

export const DOMAIN_QUEUE = "domain-jobs";

export function createRedisConnection(url: string) {
  return new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
}

export function createDomainQueue(connection: IORedis) {
  return new Queue(DOMAIN_QUEUE, { connection, defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: 1000, removeOnFail: 5000 } });
}

export function createDomainWorker(connection: IORedis, processor: Processor) {
  return new Worker(DOMAIN_QUEUE, processor, { connection, concurrency: 5 });
}

export const durableJobOptions = (id: string): JobsOptions => ({ jobId: id });
