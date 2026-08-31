import type { Server } from "node:http";
import type { Socket } from "node:net";
import { env } from "./config/env";
import { composeApi, type ApiRuntime } from "./composition";
import { logger } from "./shared/logger/logger";

export interface GracefulServerOptions {
  server: Server;
  runtime: ApiRuntime;
  timeoutMs?: number;
  onExit?: (code: number) => void;
}

export function createGracefulShutdown(options: GracefulServerOptions) {
  let isStopping = false;
  const openSockets = new Set<Socket>();

  options.server.on("connection", (socket) => {
    openSockets.add(socket);
    socket.on("close", () => {
      openSockets.delete(socket);
    });
  });

  return async function shutdown(signal = "SIGTERM"): Promise<number> {
    if (isStopping) return 0;
    isStopping = true;
    logger.info("api_shutting_down", { signal });
    options.runtime.setShuttingDown(true);

    const timeoutMs = options.timeoutMs ?? env.SHUTDOWN_TIMEOUT_MS;

    const drainPromise = new Promise<number>((resolve) => {
      options.server.close(async (err) => {
        if (err) {
          logger.error("api_server_close_error", { error: err.message });
        }
        try {
          await options.runtime.close();
          logger.info("api_shutdown_complete");
          resolve(0);
        } catch (closeErr) {
          logger.error("api_runtime_close_error", {
            error: closeErr instanceof Error ? closeErr.message : "unknown",
          });
          resolve(1);
        }
      });
    });

    let forceTimer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<number>((resolve) => {
      forceTimer = setTimeout(() => {
        logger.error("shutdown_timeout_exceeded", { timeoutMs });
        for (const socket of openSockets) {
          socket.destroy();
        }
        openSockets.clear();
        resolve(1);
      }, timeoutMs);
      forceTimer.unref?.();
    });

    const exitCode = await Promise.race([drainPromise, timeoutPromise]);
    if (forceTimer) clearTimeout(forceTimer);
    if (options.onExit) {
      options.onExit(exitCode);
    }
    return exitCode;
  };
}

const runtime = await composeApi(env);

const server = runtime.app.listen(env.PORT, () => {
  logger.info("api_listening", { port: env.PORT, env: env.NODE_ENV });
});

export const shutdown = createGracefulShutdown({
  server,
  runtime,
  timeoutMs: env.SHUTDOWN_TIMEOUT_MS,
  onExit: (code) => {
    if (process.env.NODE_ENV !== "test") {
      process.exit(code);
    }
  },
});

if (process.env.NODE_ENV !== "test") {
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}
