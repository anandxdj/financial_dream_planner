import type { Request, Response } from "express";
import {
  ConfirmDeletionRequestSchema,
  CreateConsentRequestSchema,
  CreateDeletionRequestSchema,
  CreateExportRequestSchema,
  EmptyPrivacyActionBodySchema,
  PrivacyIdParamsSchema,
} from "./model";
import * as privacyService from "./privacy.service";

function getParamId(req: Request): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

export async function createConsent(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const userId = req.auth!.userId;
  const input = CreateConsentRequestSchema.parse(req.body);
  const result = await privacyService.recordConsent(householdId, userId, input);

  res.status(result.statusCode).json({
    data: privacyService.serializeConsentRecord(result.record),
  });
}

export async function listConsents(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const userId = req.auth!.userId;
  const result = await privacyService.getEffectiveConsentState(householdId, userId);

  res.status(200).json({
    data: result,
  });
}

export async function createExport(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const userId = req.auth!.userId;
  const input = CreateExportRequestSchema.parse(req.body);
  const result = await privacyService.createOrDeduplicateExport(householdId, userId, input);

  res.status(result.statusCode).json({
    data: privacyService.serializePrivacyExport(result.exportRequest),
  });
}

export async function getExportById(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  PrivacyIdParamsSchema.parse({ id });
  const exportRow = await privacyService.getExportById(householdId, id);

  res.status(200).json({
    data: privacyService.serializePrivacyExport(exportRow),
  });
}

export async function downloadExport(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  PrivacyIdParamsSchema.parse({ id });
  EmptyPrivacyActionBodySchema.parse(req.body ?? {});
  const grant = await privacyService.createExportDownloadGrant(householdId, id);

  res.status(200).json({
    data: grant,
  });
}

export async function createDeletion(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const userId = req.auth!.userId;
  const sessionId = req.auth!.sessionId;
  const role = req.auth!.role;
  const authenticatedAt = req.auth!.authenticatedAt;
  const input = CreateDeletionRequestSchema.parse(req.body);
  const result = await privacyService.createOrDeduplicateDeletion(
    householdId,
    userId,
    sessionId,
    role,
    authenticatedAt,
    input,
  );

  res.status(result.statusCode).json({
    data: {
      deletion: privacyService.serializeHouseholdDeletion(result.deletion),
      ...(result.confirmationToken ? { confirmationToken: result.confirmationToken } : {}),
    },
  });
}

export async function confirmDeletion(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const userId = req.auth!.userId;
  const sessionId = req.auth!.sessionId;
  const id = getParamId(req);
  PrivacyIdParamsSchema.parse({ id });
  const input = ConfirmDeletionRequestSchema.parse(req.body);
  const result = await privacyService.confirmDeletion(
    householdId,
    userId,
    sessionId,
    id,
    input,
  );

  res.status(200).json({
    data: privacyService.serializeHouseholdDeletion(result),
  });
}

export async function getDeletionById(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  PrivacyIdParamsSchema.parse({ id });
  const deletion = await privacyService.getDeletionById(householdId, id);

  res.status(200).json({
    data: privacyService.serializeHouseholdDeletion(deletion),
  });
}
