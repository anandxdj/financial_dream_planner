import { setReadinessState } from "../metrics/metrics";

export interface ReadinessChecks {
  database: "ready" | "not_ready";
  redis: "ready" | "not_ready";
}

export interface ReadinessResult {
  status: "ready" | "not_ready";
  checks: ReadinessChecks;
}

export interface HealthDependencies {
  checkDb?: () => Promise<boolean>;
  checkRedis?: () => Promise<boolean>;
  isShuttingDown?: () => boolean;
}

export function checkLiveness(): { status: "ok" } {
  return { status: "ok" };
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function checkReadiness(
  deps: HealthDependencies = {},
  timeoutMs = 1500,
): Promise<{ statusCode: number; body: ReadinessResult }> {
  if (deps.isShuttingDown?.()) {
    setReadinessState("database", false);
    setReadinessState("redis", false);
    return {
      statusCode: 503,
      body: {
        status: "not_ready",
        checks: { database: "not_ready", redis: "not_ready" },
      },
    };
  }

  const dbProbe = async (): Promise<boolean> => {
    if (!deps.checkDb) return false;
    try {
      return await deps.checkDb();
    } catch {
      return false;
    }
  };

  const redisProbe = async (): Promise<boolean> => {
    if (!deps.checkRedis) return false;
    try {
      return await deps.checkRedis();
    } catch {
      return false;
    }
  };

  const [dbOk, redisOk] = await Promise.all([
    withTimeout(dbProbe(), timeoutMs, false),
    withTimeout(redisProbe(), timeoutMs, false),
  ]);

  setReadinessState("database", dbOk);
  setReadinessState("redis", redisOk);

  const allReady = dbOk && redisOk;
  return {
    statusCode: allReady ? 200 : 503,
    body: {
      status: allReady ? "ready" : "not_ready",
      checks: {
        database: dbOk ? "ready" : "not_ready",
        redis: redisOk ? "ready" : "not_ready",
      },
    },
  };
}
