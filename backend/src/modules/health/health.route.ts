import { Router } from "express";
import { env } from "../../config/env";
import { metrics, verifyMetricsToken } from "../metrics/metrics";
import { checkLiveness, checkReadiness, type HealthDependencies } from "./health.service";

export function createHealthRouter(deps: HealthDependencies = {}): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json(checkLiveness());
  });

  router.get("/ready", async (_req, res) => {
    const { statusCode, body } = await checkReadiness(deps);
    res.status(statusCode).json(body);
  });

  router.get("/metrics", (req, res) => {
    if (!env.METRICS_ENABLED) {
      res.status(404).end();
      return;
    }
    const authHeader = req.header("authorization");
    if (!verifyMetricsToken(authHeader, env.METRICS_BEARER_TOKEN)) {
      res.status(404).end();
      return;
    }
    res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    res.send(metrics.serialize());
  });

  return router;
}
