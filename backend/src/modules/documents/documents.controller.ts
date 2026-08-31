import type { Request, Response } from "express";
import {
  DocumentIdParamsSchema,
  DocumentListQuerySchema,
  EmptyDocumentActionBodySchema,
  UploadDocumentRequestSchema,
} from "./model";
import * as documentsService from "./documents.service";

function getParamId(req: Request): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

export async function upload(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const uploaderUserId = req.auth!.userId;
  const input = UploadDocumentRequestSchema.parse(req.body);
  const doc = await documentsService.createDocument(householdId, uploaderUserId, input);

  res.status(201).json({
    data: documentsService.serializeDocument(doc),
  });
}

export async function list(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const query = DocumentListQuerySchema.parse(req.query);
  const result = await documentsService.listDocuments(householdId, query);

  res.status(200).json({
    data: result.data.map(documentsService.serializeDocument),
    nextCursor: result.nextCursor,
  });
}

export async function getById(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  DocumentIdParamsSchema.parse({ id });
  const doc = await documentsService.getDocumentById(householdId, id);

  res.status(200).json({
    data: documentsService.serializeDocument(doc),
  });
}

export async function download(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  DocumentIdParamsSchema.parse({ id });
  EmptyDocumentActionBodySchema.parse(req.body ?? {});
  const grant = await documentsService.createDocumentDownloadGrant(householdId, id);

  res.status(200).json({
    data: grant,
  });
}

export async function deleteDoc(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const id = getParamId(req);
  DocumentIdParamsSchema.parse({ id });
  EmptyDocumentActionBodySchema.parse(req.body ?? {});
  const result = await documentsService.deleteDocument(householdId, id);

  res.status(200).json({
    data: result,
  });
}
