import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/app-error";
import { idempotencyKeySchema } from "../../shared/api/primitives";
import * as service from "./planning.service";
import { affordabilitySchema, goalSchema, planningMetadataSchema } from "./model";
const id = (req: Request) => Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
const token = (req: Request) => Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
const expected = (req: Request) => { const value = req.body?.expectedRevision ?? req.header("if-match"); const n = Number(String(value ?? "")); if (!Number.isInteger(n) || n < 0) throw new AppError(400, "EXPECTED_REVISION_REQUIRED", "expectedRevision is required"); return n; };
export function affordability(req: Request, res: Response) { res.json({ data: service.affordability(affordabilitySchema.parse(req.body)) }); }
const metaSchema = planningMetadataSchema;
const metadata = (req: Request) => {
  const body = { ...req.body };
  delete body.expectedRevision;
  return metaSchema.parse(body);
};
export async function createDraft(req: Request, res: Response) { const m = metaSchema.parse(req.body ?? { inputs: {}, completedStep: 0, estimates: [] }); const row = await service.createDraft(m); res.status(201).json({ data: { draftToken: row.token, expiresAt: row.row.expiresAt.toISOString(), inputs: row.row.inputs, completedStep: row.row.completedStep, estimates: row.row.estimates, revision: row.row.revision } }); }
export async function getDraft(req: Request, res: Response) { const row = await service.getDraft(token(req)); res.json({ data: { inputs: row.inputs, completedStep: row.completedStep, estimates: row.estimates, revision: row.revision, expiresAt: row.expiresAt.toISOString() } }); }
export async function updateDraft(req: Request, res: Response) { const row = await service.updateDraft(token(req), metadata(req), expected(req)); res.json({ data: { inputs: row.inputs, completedStep: row.completedStep, estimates: row.estimates, revision: row.revision, expiresAt: row.expiresAt.toISOString() } }); }
export async function claimDraft(req: Request, res: Response) { const row = await service.claimDraft(token(req), req.auth!.householdId); res.json({ data: row }); }
export async function getPlanning(req: Request, res: Response) { const row = await service.getPlanning(req.auth!.householdId); res.json({ data: row }); }
export async function savePlanning(req: Request, res: Response) { const row = await service.savePlanning(req.auth!.householdId, req.auth!.userId, metadata(req), expected(req)); res.json({ data: row }); }
export async function generate(req: Request, res: Response) { const rawKey = req.header("idempotency-key"); if (!rawKey) throw new AppError(400, "IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key header is required"); const key = idempotencyKeySchema.parse(rawKey); const row = await service.generate(req.auth!.householdId, expected(req), key); res.json({ data: row }); }
export async function listGoals(req: Request, res: Response) { res.json({ data: await service.listGoals(req.auth!.householdId) }); }
export async function createGoal(req: Request, res: Response) { const body = goalSchema.parse(req.body); res.status(201).json({ data: await service.createGoal(req.auth!.householdId, body) }); }
export async function updateGoal(req: Request, res: Response) { const body = { ...req.body }; delete body.expectedRevision; const parsed = goalSchema.partial().strict().parse(body); res.json({ data: await service.mutateGoal(req.auth!.householdId, id(req), parsed, expected(req)) }); }
export async function deleteGoal(req: Request, res: Response) { await service.removeGoal(req.auth!.householdId, id(req)); res.status(204).send(); }
export async function feasibility(req: Request, res: Response) { res.json({ data: await service.feasibility(req.auth!.householdId) }); }
