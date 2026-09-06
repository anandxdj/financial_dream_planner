import { Router } from "express";
import { requireAuth } from "../../shared/middleware/require-auth";
import * as investmentsController from "./investments.controller";

export const investmentsRouter = Router();

investmentsRouter.use(requireAuth);

investmentsRouter.get("/", investmentsController.getSummary);
investmentsRouter.put("/", investmentsController.updateInputs);
investmentsRouter.post("/simulate", investmentsController.simulate);
investmentsRouter.post("/projection", investmentsController.simulate);
