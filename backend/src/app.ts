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
import { errorHandler } from "./shared/middleware/error-handler";
import { requestId } from "./shared/middleware/request-id";
import { logger } from "./shared/logger/logger";
import { createRunRouter } from "./modules/runs/run.route";
import type { RunService } from "./modules/runs/run.service";
import { protectCookieRequests } from "./shared/middleware/csrf";

export interface AppDependencies { runService?: RunService; }

export function createApp(dependencies: AppDependencies = {}) {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(protectCookieRequests);
  app.use(requestId);
  app.use((req, _res, next) => {
    logger.info("request", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      userId: req.user?.id,
    });
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/accounts", accountsRouter);
  app.use("/api/v1/categories", categoriesRouter);
  app.use("/api/v1/transactions", transactionsRouter);
  app.use("/api/v1/financial-engine", financialEngineRouter);
  app.use("/api/v1/plans", plansRouter);
  app.use("/api/v1/scenarios", scenariosRouter);
  if (dependencies.runService) app.use("/api/v1/runs", createRunRouter(dependencies.runService));

  app.use(errorHandler);
  return app;
}
