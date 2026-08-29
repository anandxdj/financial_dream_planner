import { composeWorker } from "./worker-composition";

const runtime = await composeWorker();
process.once("SIGTERM", () => void runtime.close());
process.once("SIGINT", () => void runtime.close());
