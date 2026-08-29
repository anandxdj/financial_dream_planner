import { env } from "./config/env";
import { composeApi } from "./composition";
import { logger } from "./shared/logger/logger";

const runtime = await composeApi(env);

const server = runtime.app.listen(env.PORT, () => {
  logger.info("api_listening", { port: env.PORT, env: env.NODE_ENV });
});

async function shutdown() { server.close(async () => { await runtime.close(); process.exit(0); }); }
process.once("SIGTERM", () => void shutdown());
process.once("SIGINT", () => void shutdown());
