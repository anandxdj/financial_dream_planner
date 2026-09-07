import { z } from "zod";

export const PlannerRunRequestSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("chat"),
      message: z.string().trim().min(1).max(4000),
      conversationId: z.string().uuid().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("analyze"),
      conversationId: z.string().uuid().optional(),
    })
    .strict(),
]);

export const PlannerRunCreatedSchema = z.object({
  data: z.object({
    id: z.string().uuid(),
    kind: z.string(),
    status: z.enum(["queued", "running", "completed", "failed", "cancelled"]),
    createdAt: z.string().datetime(),
  }),
});

export type PlannerRunRequest = z.infer<typeof PlannerRunRequestSchema>;
export type PlannerRunCreated = z.infer<typeof PlannerRunCreatedSchema>["data"];
