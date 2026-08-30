import type { Request, Response } from "express";
import { CreateResearchRequestSchema, ResearchRunParamsSchema } from "./model";
import * as researchService from "./research.service";

export async function createResearch(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const userId = req.auth!.userId;
  const input = CreateResearchRequestSchema.parse(req.body);

  const result = await researchService.executeResearch(householdId, userId, input);

  res.status(200).json({
    data: {
      run: researchService.serializeResearchRun(result.run),
      evidence: result.evidence.map(researchService.serializeEvidence),
    },
  });
}

export async function getResearch(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const { id: runId } = ResearchRunParamsSchema.parse(req.params);

  const run = await researchService.getResearchRun(householdId, runId);

  res.status(200).json({
    data: researchService.serializeResearchRun(run),
  });
}

export async function getEvidence(req: Request, res: Response) {
  const householdId = req.auth!.householdId;
  const { id: runId } = ResearchRunParamsSchema.parse(req.params);

  const evidenceList = await researchService.getRunEvidence(householdId, runId);

  res.status(200).json({
    data: evidenceList.map(researchService.serializeEvidence),
  });
}
