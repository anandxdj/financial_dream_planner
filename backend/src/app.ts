import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.route";
import { usersRouter } from "./modules/users/users.route";
import { accountsRouter } from "./modules/accounts/accounts.route";
import { categoriesRouter } from "./modules/categories/categories.route";
import { transactionsRouter } from "./modules/transactions/transactions.route";
import { financialEngineRouter } from "./modules/financial-engine/financial-engine.route";
import { plansRouter } from "./modules/plans/plans.route";
import { scenariosRouter } from "./modules/scenarios/scenarios.route";
import { plannerRouter } from "./modules/planner/planner.route";
import { researchRouter } from "./modules/research/research.route";
import { driftRouter } from "./modules/drift/drift.route";
import { errorHandler } from "./shared/middleware/error-handler";
import { requestId } from "./shared/middleware/request-id";
import { logger } from "./shared/logger/logger";
import { createRunRouter } from "./modules/runs/run.route";
import type { RunService } from "./modules/runs/run.service";
import { protectCookieRequests } from "./shared/middleware/csrf";
import { createStorageFromConfig, setGlobalStorage, type ObjectStorage } from "./modules/storage";
import { privacyRouter } from "./modules/privacy/privacy.route";
import { documentsRouter } from "./modules/documents/documents.route";
import { createHealthRouter } from "./modules/health/health.route";
import type { HealthDependencies } from "./modules/health/health.service";
import { recordHttpRequest } from "./modules/metrics/metrics";

export interface AppDependencies {
  runService?: RunService;
  storage?: ObjectStorage;
  health?: HealthDependencies;
}

export function createApp(dependencies: AppDependencies = {}) {
  const app = express();
  const storage = dependencies.storage ?? createStorageFromConfig(env);
  setGlobalStorage(storage);

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "15mb" }));
  app.use(cookieParser());
  app.use(protectCookieRequests);
  app.use(requestId);
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
      const routePath = typeof req.route?.path === "string" ? req.route.path : undefined;
      const metricRoute = routePath
        ? `${req.baseUrl}${routePath}`
        : res.statusCode === 404
          ? "/unmatched"
          : "/other";
      recordHttpRequest(req.method, metricRoute, res.statusCode, durationSec);
      logger.info("http_request", {
        requestId: req.requestId,
        method: req.method,
        route: metricRoute,
        statusCode: res.statusCode,
        durationMs: Math.round(durationSec * 1000),
      });
    });
    next();
  });

  app.use(createHealthRouter(dependencies.health));

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/accounts", accountsRouter);
  app.use("/api/v1/categories", categoriesRouter);
  app.use("/api/v1/transactions", transactionsRouter);
  app.use("/api/v1/financial-engine", financialEngineRouter);
  app.use("/api/v1/plans", plansRouter);
  app.use("/api/v1/scenarios", scenariosRouter);
  app.use("/api/v1/planner", plannerRouter);
  app.use("/api/v1/research", researchRouter);
  app.use("/api/v1/drift", driftRouter);
  app.use("/api/v1/privacy", privacyRouter);
  app.use("/api/v1/documents", documentsRouter);
  if (dependencies.runService) app.use("/api/v1/runs", createRunRouter(dependencies.runService));

  app.use(errorHandler);
  return app;
}
