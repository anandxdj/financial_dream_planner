import { Router } from "express";
import { requireAuth } from "../../shared/middleware/require-auth";
import * as accountsController from "./accounts.controller";

export const accountsRouter = Router();

accountsRouter.use(requireAuth);

accountsRouter.get("/", accountsController.list);
accountsRouter.post("/", accountsController.create);
accountsRouter.get("/:id", accountsController.getById);
accountsRouter.patch("/:id", accountsController.update);
accountsRouter.delete("/:id", accountsController.remove);
