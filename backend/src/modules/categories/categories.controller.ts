import type { Request, Response } from "express";
import { z } from "zod";
import * as categoriesService from "./categories.service";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().max(100).optional(),
  categoryType: z.enum(["EXPENSE", "INCOME", "TRANSFER", "OTHER"]).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

function getParamId(req: Request): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

export async function list(req: Request, res: Response) {
  const categories = await categoriesService.listCategories(req.auth!.householdId);
  res.json({ data: categories });
}

export async function getById(req: Request, res: Response) {
  const category = await categoriesService.getCategoryById(req.auth!.householdId, getParamId(req));
  res.json({ data: category });
}

export async function create(req: Request, res: Response) {
  const body = createCategorySchema.parse(req.body);
  const category = await categoriesService.createCategory(req.auth!.householdId, body);
  res.status(201).json({ data: category });
}

export async function update(req: Request, res: Response) {
  const body = updateCategorySchema.parse(req.body);
  const category = await categoriesService.updateCategory(req.auth!.householdId, getParamId(req), body);
  res.json({ data: category });
}

export async function remove(req: Request, res: Response) {
  await categoriesService.deleteCategory(req.auth!.householdId, getParamId(req));
  res.status(204).send();
}
