import { Router } from "express";
import { requireAuth } from "../../shared/middleware/require-auth";
import * as driftController from "./drift.controller";

export const driftRouter = Router();

driftRouter.use(requireAuth);

driftRouter.post("/checks", driftController.createCheck);
driftRouter.get("/checks/:id", driftController.getCheckById);
driftRouter.get("/current", driftController.getCurrent);
driftRouter.get("/", driftController.list);
driftRouter.post("/:id/accept", driftController.accept);
driftRouter.post("/:id/keep", driftController.keep);
