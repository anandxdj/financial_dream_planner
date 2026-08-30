import { Router } from "express";
import { requireAuth } from "../../shared/middleware/require-auth";
import * as categoriesController from "./categories.controller";

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get("/", categoriesController.list);
categoriesRouter.post("/", categoriesController.create);
categoriesRouter.get("/:id", categoriesController.getById);
categoriesRouter.patch("/:id", categoriesController.update);
categoriesRouter.delete("/:id", categoriesController.remove);
