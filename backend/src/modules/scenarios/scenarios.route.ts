import { Router } from "express";
import { requireAuth } from "../../shared/middleware/require-auth";
import * as scenariosController from "./scenarios.controller";

export const scenariosRouter = Router();

scenariosRouter.use(requireAuth);

scenariosRouter.post("/", scenariosController.create);
scenariosRouter.get("/", scenariosController.list);
scenariosRouter.post("/compare", scenariosController.compare);
scenariosRouter.get("/:id", scenariosController.getById);
scenariosRouter.post("/:id/run", scenariosController.run);
scenariosRouter.post("/:id/apply", scenariosController.apply);
