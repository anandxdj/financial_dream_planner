import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { households } from "../households/model";
import { users } from "../../database/models/user";

extendZodWithOpenApi(z);

export const DOCUMENT_STATUS = {
  pending: "pending",
  available: "available",
  deletePending: "delete_pending",
  deleted: "deleted",
  failed: "failed",
} as const;

export type DocumentStatus = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    uploaderUserId: uuid("uploader_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    mediaType: text("media_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    checksum: text("checksum").notNull(),
    objectKey: text("object_key").notNull(),
    status: text("status").notNull().default("pending"),
    retentionExpiresAt: timestamp("retention_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("documents_object_key_uidx").on(table.objectKey),
    uniqueIndex("documents_household_id_uidx").on(table.householdId, table.id),
    check(
      "documents_status_check",
      sql`${table.status} IN ('pending', 'available', 'delete_pending', 'deleted', 'failed')`,
    ),
    check("documents_byte_size_check", sql`${table.byteSize} >= 0`),
    index("documents_household_idx").on(table.householdId),
    index("documents_household_status_idx").on(table.householdId, table.status),
    index("documents_household_created_idx").on(table.householdId, table.createdAt),
    index("documents_retention_idx").on(table.retentionExpiresAt),
  ],
);

export type SelectDocument = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// --- Zod Schemas ---

export const UploadDocumentRequestSchema = z
  .object({
    displayName: z
      .string()
      .min(1, { message: "displayName must be at least 1 character" })
      .max(255, { message: "displayName must be at most 255 characters" }),
    mediaType: z
      .string()
      .min(1, { message: "mediaType is required" })
      .max(100, { message: "mediaType too long" }),
    content: z
      .string()
      .min(1, { message: "Base64 content is required" })
      .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/, {
        message: "content must be canonical base64",
      }),
    idempotencyKey: z.string().min(1).max(128).optional(),
  })
  .strict();

export const DocumentMetadataSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  uploaderUserId: z.string().uuid(),
  displayName: z.string(),
  mediaType: z.string(),
  byteSize: z.number().int().nonnegative(),
  checksum: z.string(),
  status: z.enum(["pending", "available", "delete_pending", "deleted", "failed"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  retentionExpiresAt: z.string().datetime().nullable().optional(),
});

export const DocumentResponseSchema = z.object({
  data: DocumentMetadataSchema,
});

export const DocumentListResponseSchema = z.object({
  data: z.array(DocumentMetadataSchema),
  nextCursor: z.string().nullable().optional(),
});

export const DownloadGrantDataSchema = z.object({
  downloadUrl: z.string(),
  expiresAt: z.string().datetime(),
});

export const DownloadGrantResponseSchema = z.object({
  data: DownloadGrantDataSchema,
});

export const DocumentDeleteResponseSchema = z.object({
  data: z.object({
    id: z.string().uuid(),
    status: z.literal("deleted"),
  }),
});

export const DocumentIdParamsSchema = z
  .object({
    id: z.string().uuid({ message: "Invalid document ID format" }),
  })
  .strict();

export const DocumentListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
}).strict();

export const EmptyDocumentActionBodySchema = z.object({}).strict();
