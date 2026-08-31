import { Router } from "express";
import { requireAuth } from "../../shared/middleware/require-auth";
import * as privacyController from "./privacy.controller";

export const privacyRouter = Router();

privacyRouter.use(requireAuth);

privacyRouter.post("/consents", privacyController.createConsent);
privacyRouter.get("/consents", privacyController.listConsents);

privacyRouter.post("/exports", privacyController.createExport);
privacyRouter.get("/exports/:id", privacyController.getExportById);
privacyRouter.post("/exports/:id/download", privacyController.downloadExport);

privacyRouter.post("/deletions", privacyController.createDeletion);
privacyRouter.post("/deletions/:id/confirm", privacyController.confirmDeletion);
privacyRouter.get("/deletions/:id", privacyController.getDeletionById);
