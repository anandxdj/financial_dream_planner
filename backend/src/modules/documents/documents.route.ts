import { Router } from "express";
import { requireAuth } from "../../shared/middleware/require-auth";
import * as documentsController from "./documents.controller";

export const documentsRouter = Router();

documentsRouter.use(requireAuth);

documentsRouter.post("/", documentsController.upload);
documentsRouter.get("/", documentsController.list);
documentsRouter.get("/:id", documentsController.getById);
documentsRouter.post("/:id/download", documentsController.download);
documentsRouter.delete("/:id", documentsController.deleteDoc);
