import { and, eq, or, isNull } from "drizzle-orm";
import { db } from "../../database/client";
import { categories, type SelectCategory } from "./model";
import { AppError } from "../../shared/errors/app-error";

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  categoryType?: "EXPENSE" | "INCOME" | "TRANSFER" | "OTHER";
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  categoryType?: "EXPENSE" | "INCOME" | "TRANSFER" | "OTHER";
}

export async function listCategories(householdId: string): Promise<SelectCategory[]> {
  return db
    .select()
    .from(categories)
    .where(or(isNull(categories.householdId), eq(categories.householdId, householdId)))
    .orderBy(categories.name);
}

export async function getCategoryById(householdId: string, id: string): Promise<SelectCategory> {
  const [category] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.id, id),
        or(isNull(categories.householdId), eq(categories.householdId, householdId)),
      ),
    )
    .limit(1);

  if (!category) {
    throw new AppError(404, "NOT_FOUND", "Category not found");
  }
  return category;
}

export async function createCategory(householdId: string, input: CreateCategoryInput): Promise<SelectCategory> {
  const [created] = await db
    .insert(categories)
    .values({
      householdId,
      name: input.name.trim(),
      slug: input.slug?.trim() || null,
      categoryType: input.categoryType ?? "EXPENSE",
      isSystem: false,
    })
    .returning();

  return created;
}

export async function updateCategory(
  householdId: string,
  id: string,
  input: UpdateCategoryInput,
): Promise<SelectCategory> {
  const existing = await getCategoryById(householdId, id);
  if (existing.isSystem || !existing.householdId) {
    throw new AppError(403, "FORBIDDEN", "System categories cannot be modified");
  }

  const updates: Partial<typeof categories.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.slug !== undefined) updates.slug = input.slug.trim() || null;
  if (input.categoryType !== undefined) updates.categoryType = input.categoryType;

  const [updated] = await db
    .update(categories)
    .set(updates)
    .where(and(eq(categories.id, id), eq(categories.householdId, householdId)))
    .returning();

  return updated;
}

export async function deleteCategory(householdId: string, id: string): Promise<void> {
  const existing = await getCategoryById(householdId, id);
  if (existing.isSystem || !existing.householdId) {
    throw new AppError(403, "FORBIDDEN", "System categories cannot be deleted");
  }

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.householdId, householdId)));
}
