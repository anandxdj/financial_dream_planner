import { Router } from "express";
import { requireAuth } from "../../shared/middleware/require-auth";
import * as plansController from "./plans.controller";

export const plansRouter = Router();

plansRouter.use(requireAuth);

plansRouter.post("/recalculate", plansController.recalculate);
plansRouter.get("/current", plansController.getCurrent);
plansRouter.get("/history", plansController.getHistory);
plansRouter.get("/history/:id", plansController.getVersionById);
plansRouter.get("/versions/:id", plansController.getVersionById);
plansRouter.post("/versions/:id/restore", plansController.restore);
plansRouter.post("/history/:id/restore", plansController.restore);
plansRouter.post("/restore", plansController.restore);
