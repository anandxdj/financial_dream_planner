import crypto from "node:crypto";
import { and, desc, eq, gt, isNull, lt, or } from "drizzle-orm";
import { db, type Database } from "../../database";
import { documents, type SelectDocument } from "./model";
import { consentRecords, CONSENT_PURPOSE } from "../privacy/model";
import { getObjectStorage, type ObjectStorage, generateObjectKey } from "../storage";
import { AppError } from "../../shared/errors/app-error";
import { recordAuditEvent } from "../privacy/privacy.service";

export interface CreateDocumentInput {
  displayName: string;
  mediaType: string;
  content: string; // Base64 encoded
  idempotencyKey?: string;
}

export function sanitizeDisplayName(name: string): string {
  if (typeof name !== "string") {
    throw new AppError(400, "INVALID_INPUT", "displayName must be a string");
  }
  const cleaned = name.trim();
  if (cleaned.length === 0 || cleaned.length > 255) {
    throw new AppError(400, "INVALID_INPUT", "displayName must be between 1 and 255 characters");
  }
  if (/[\x00-\x1F\x7F]/.test(cleaned)) {
    throw new AppError(400, "INVALID_INPUT", "displayName contains invalid control characters");
  }
  return cleaned;
}

export function serializeDocument(doc: SelectDocument) {
  return {
    id: doc.id,
    householdId: doc.householdId,
    uploaderUserId: doc.uploaderUserId,
    displayName: doc.displayName,
    mediaType: doc.mediaType,
    byteSize: doc.byteSize,
    checksum: doc.checksum,
    status: doc.status as "pending" | "available" | "delete_pending" | "deleted" | "failed",
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    retentionExpiresAt: doc.retentionExpiresAt ? doc.retentionExpiresAt.toISOString() : null,
  };
}

export async function createDocument(
  householdId: string,
  uploaderUserId: string,
  input: CreateDocumentInput,
  storage: ObjectStorage = getObjectStorage(),
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<SelectDocument> {
  // 1. Verify caller has granted consent for document_storage
  const [latestConsent] = await database
    .select()
    .from(consentRecords)
    .where(
      and(
        eq(consentRecords.householdId, householdId),
        eq(consentRecords.userId, uploaderUserId),
        eq(consentRecords.purpose, CONSENT_PURPOSE.documentStorage),
      ),
    )
    .orderBy(desc(consentRecords.createdAt))
    .limit(1);

  if (!latestConsent || latestConsent.action !== "granted") {
    throw new AppError(403, "CONSENT_REQUIRED", "Document storage consent is required");
  }

  // 2. Validate and sanitize input
  const displayName = sanitizeDisplayName(input.displayName);
  const mediaType = input.mediaType.trim();
  if (!mediaType || mediaType.length > 100 || /[\x00-\x1F\x7F]/.test(mediaType)) {
    throw new AppError(400, "INVALID_INPUT", "Invalid mediaType");
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(input.content, "base64");
  } catch {
    throw new AppError(400, "INVALID_INPUT", "Invalid base64 document content");
  }

  if (buffer.length === 0) {
    throw new AppError(400, "INVALID_INPUT", "Document content cannot be empty");
  }

  // 10 MB maximum limit
  if (buffer.length > 10 * 1024 * 1024) {
    throw new AppError(400, "PAYLOAD_TOO_LARGE", "Document exceeds maximum size limit of 10MB");
  }

  const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
  const objectKey = generateObjectKey("documents");
  const now = clock();

  // 3. Insert metadata row with status 'pending'
  const [doc] = await database
    .insert(documents)
    .values({
      householdId,
      uploaderUserId,
      displayName,
      mediaType,
      byteSize: buffer.length,
      checksum,
      objectKey,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // 4. Upload bytes to storage
  try {
    await storage.upload(objectKey, buffer, mediaType);
  } catch {
    await database
      .update(documents)
      .set({ status: "failed", updatedAt: clock() })
      .where(eq(documents.id, doc.id));
    throw new AppError(503, "STORAGE_UNAVAILABLE", "Failed to upload document to storage");
  }

  // 5. Mark status 'available'
  const [availableDoc] = await database
    .update(documents)
    .set({ status: "available", updatedAt: clock() })
    .where(eq(documents.id, doc.id))
    .returning();

  // 6. Record audit event
  await recordAuditEvent(
    {
      householdId,
      action: "document_uploaded",
      actorType: "user",
      actorId: uploaderUserId,
      entityType: "document",
      entityId: doc.id,
      metadata: {
        byteSize: buffer.length,
      },
    },
    database,
  );

  return availableDoc;
}

export async function listDocuments(
  householdId: string,
  query: { cursor?: string; limit?: number },
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<{ data: SelectDocument[]; nextCursor: string | null }> {
  const limit = Math.max(1, Math.min(query.limit ?? 20, 100));
  const now = clock();

  const conditions = [
    eq(documents.householdId, householdId),
    eq(documents.status, "available"),
    or(isNull(documents.retentionExpiresAt), gt(documents.retentionExpiresAt, now)),
  ];

  if (query.cursor) {
    const cursorDate = new Date(query.cursor);
    if (!isNaN(cursorDate.getTime())) {
      conditions.push(lt(documents.createdAt, cursorDate));
    }
  }

  const rows = await database
    .select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt), desc(documents.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;

  return { data: items, nextCursor };
}

export async function getDocumentById(
  householdId: string,
  id: string,
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<SelectDocument> {
  const now = clock();
  const [doc] = await database
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.id, id),
        eq(documents.householdId, householdId),
        eq(documents.status, "available"),
        or(isNull(documents.retentionExpiresAt), gt(documents.retentionExpiresAt, now)),
      ),
    )
    .limit(1);

  if (!doc) {
    throw new AppError(404, "NOT_FOUND", "Document not found");
  }

  return doc;
}

export async function createDocumentDownloadGrant(
  householdId: string,
  id: string,
  storage: ObjectStorage = getObjectStorage(),
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<{ downloadUrl: string; expiresAt: string }> {
  const doc = await getDocumentById(householdId, id, database, clock);
  const grant = await storage.createDownloadGrant(doc.objectKey, 300);
  return {
    downloadUrl: grant.downloadUrl,
    expiresAt: grant.expiresAt.toISOString(),
  };
}

export async function deleteDocument(
  householdId: string,
  id: string,
  storage: ObjectStorage = getObjectStorage(),
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<{ id: string; status: "deleted" }> {
  const [doc] = await database
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.householdId, householdId)))
    .limit(1);

  if (!doc) {
    throw new AppError(404, "NOT_FOUND", "Document not found");
  }

  if (doc.status === "deleted") {
    return { id: doc.id, status: "deleted" };
  }

  // 1. Mark status delete_pending
  await database
    .update(documents)
    .set({ status: "delete_pending", updatedAt: clock() })
    .where(eq(documents.id, id));

  // 2. Delete object from storage
  try {
    await storage.delete(doc.objectKey);
  } catch {
    throw new AppError(503, "STORAGE_UNAVAILABLE", "Failed to delete document from storage");
  }

  // 3. Mark status deleted with 30-day retention
  const retentionDate = new Date(clock().getTime() + 30 * 24 * 60 * 60 * 1000);
  await database
    .update(documents)
    .set({ status: "deleted", retentionExpiresAt: retentionDate, updatedAt: clock() })
    .where(eq(documents.id, id));

  // 4. Record audit event
  await recordAuditEvent(
    {
      householdId,
      action: "document_deleted",
      actorType: "user",
      actorId: doc.uploaderUserId,
      entityType: "document",
      entityId: id,
      metadata: { status: "deleted" },
    },
    database,
  );

  return { id: doc.id, status: "deleted" };
}

export const uploadDocument = createDocument;
export const getDownloadGrant = createDocumentDownloadGrant;
