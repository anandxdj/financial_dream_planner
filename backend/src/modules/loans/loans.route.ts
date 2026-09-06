import { Router } from "express";
import { requireAuth } from "../../shared/middleware/require-auth";
import * as loansController from "./loans.controller";

export const loansRouter = Router();

loansRouter.use(requireAuth);

loansRouter.get("/", loansController.list);
loansRouter.post("/", loansController.create);
loansRouter.get("/:id", loansController.getById);
loansRouter.patch("/:id", loansController.update);
loansRouter.delete("/:id", loansController.remove);
loansRouter.get("/:id/analysis", loansController.analyze);
loansRouter.post("/:id/calculate", loansController.analyze);
loansRouter.post("/:id/prepayment-simulation", loansController.simulatePrepayment);
loansRouter.post("/:id/prepayment-scenario", loansController.simulatePrepayment);
loansRouter.post("/:id/create-scenario", loansController.savePrepaymentScenario);
