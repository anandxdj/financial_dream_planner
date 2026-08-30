import { Router } from "express";
import { requireAuth } from "../../shared/middleware/require-auth";
import * as controller from "./research.controller";

export const researchRouter = Router();

researchRouter.use(requireAuth);

researchRouter.post("/", controller.createResearch);
researchRouter.get("/:id", controller.getResearch);
researchRouter.get("/:id/evidence", controller.getEvidence);
