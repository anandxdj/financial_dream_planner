import { composeWorker } from "./worker-composition";
import { logger } from "./shared/logger/logger";

const runtime = await composeWorker();
logger.info("worker_listening");

let isStopping = false;
export async function shutdownWorker(signal = "SIGTERM"): Promise<number> {
  if (isStopping) return 0;
  isStopping = true;
  logger.info("worker_shutting_down", { signal });
  try {
    await runtime.close();
    logger.info("worker_shutdown_complete");
    return 0;
  } catch (err) {
    logger.error("worker_shutdown_error", {
      error: err instanceof Error ? err.message : "unknown",
    });
    return 1;
  }
}

if (process.env.NODE_ENV !== "test") {
  process.once("SIGTERM", () => void shutdownWorker("SIGTERM").then((code) => process.exit(code)));
  process.once("SIGINT", () => void shutdownWorker("SIGINT").then((code) => process.exit(code)));
}
