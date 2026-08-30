import { Router } from "express";
import { requireAuth } from "../../shared/middleware/require-auth";
import * as transactionsController from "./transactions.controller";

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

transactionsRouter.post("/sync", transactionsController.sync);
transactionsRouter.get("/cash-flow", transactionsController.cashFlow);
transactionsRouter.get("/", transactionsController.list);
transactionsRouter.post("/", transactionsController.create);
transactionsRouter.get("/:id", transactionsController.getById);
transactionsRouter.patch("/:id", transactionsController.update);
transactionsRouter.delete("/:id", transactionsController.remove);
