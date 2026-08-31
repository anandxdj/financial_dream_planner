import crypto from "node:crypto";
import { and, desc, eq, inArray, isNotNull, lte, sql } from "drizzle-orm";
import {
  db,
  type Database,
  accounts,
  categories,
  transactions,
  transactionSources,
  plans,
  planVersions,
  financialSnapshots,
  scenarios,
  plannerConversations,
  plannerMessages,
  plannerMessageCitations,
  evidence,
  researchRuns,
  driftChecks,
  driftEvents,
  documents,
  households,
  householdMembers,
  users,
  sessions,
  sessionFamilies,
  authIdentities,
  authChallenges,
  outboxEvents,
} from "../../database";
import {
  auditEvents,
  consentRecords,
  householdDeletions,
  privacyExports,
  CONSENT_ACTION,
  CONSENT_POLICY_VERSION,
  CONSENT_PURPOSE,
  type ConsentPurpose,
  type SelectAuditEvent,
  type SelectConsentRecord,
  type SelectHouseholdDeletion,
  type SelectPrivacyExport,
} from "./model";
import { getObjectStorage, type ObjectStorage, generateObjectKey } from "../storage";
import { AppError } from "../../shared/errors/app-error";
import { redactSensitiveData } from "../../shared/logger/logger";

// --- Audit Helper ---

export async function recordAuditEvent(
  params: {
    householdId?: string | null;
    action: string;
    actorType?: string;
    actorId?: string | null;
    entityType: string;
    entityId?: string | null;
    requestId?: string | null;
    metadata?: Record<string, unknown>;
  },
  database: Database = db,
): Promise<SelectAuditEvent> {
  const safeMetadata = params.metadata
    ? (redactSensitiveData(params.metadata) as Record<string, unknown>)
    : {};

  const [event] = await database
    .insert(auditEvents)
    .values({
      householdId: params.householdId ?? null,
      action: params.action,
      actorType: params.actorType ?? "user",
      actorId: params.actorId ?? null,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      requestId: params.requestId ?? null,
      metadata: safeMetadata,
    })
    .returning();

  return event;
}

// --- Serializers ---

export function serializeConsentRecord(record: SelectConsentRecord) {
  return {
    id: record.id,
    householdId: record.householdId,
    userId: record.userId,
    purpose: record.purpose as "document_storage" | "privacy_export" | "household_deletion",
    policyVersion: record.policyVersion,
    action: record.action as "granted" | "withdrawn",
    metadata: record.metadata ?? {},
    idempotencyKey: record.idempotencyKey,
    createdAt: record.createdAt.toISOString(),
  };
}

export function serializePrivacyExport(exportRow: SelectPrivacyExport) {
  return {
    id: exportRow.id,
    householdId: exportRow.householdId,
    requestedByUserId: exportRow.requestedByUserId,
    status: exportRow.status as "queued" | "running" | "completed" | "failed" | "expired",
    attempts: exportRow.attempts,
    byteSize: exportRow.byteSize ?? null,
    checksum: exportRow.checksum ?? null,
    failureCode: exportRow.failureCode ?? null,
    expiresAt: exportRow.expiresAt ? exportRow.expiresAt.toISOString() : null,
    completedAt: exportRow.completedAt ? exportRow.completedAt.toISOString() : null,
    createdAt: exportRow.createdAt.toISOString(),
    updatedAt: exportRow.updatedAt.toISOString(),
  };
}

export function serializeHouseholdDeletion(deletionRow: SelectHouseholdDeletion) {
  return {
    id: deletionRow.id,
    householdId: deletionRow.householdId,
    requestedByUserId: deletionRow.requestedByUserId,
    status: deletionRow.status as "pending_confirmation" | "queued" | "running" | "failed" | "completed",
    attempts: deletionRow.attempts,
    confirmationExpiresAt: deletionRow.confirmationExpiresAt.toISOString(),
    confirmedAt: deletionRow.confirmedAt ? deletionRow.confirmedAt.toISOString() : null,
    completedAt: deletionRow.completedAt ? deletionRow.completedAt.toISOString() : null,
    failureCode: deletionRow.failureCode ?? null,
    createdAt: deletionRow.createdAt.toISOString(),
    updatedAt: deletionRow.updatedAt.toISOString(),
  };
}

// --- Consent Operations ---

export async function checkConsentGranted(
  householdId: string,
  userId: string,
  purpose: ConsentPurpose,
  database: Database = db,
): Promise<boolean> {
  const [latest] = await database
    .select()
    .from(consentRecords)
    .where(
      and(
        eq(consentRecords.householdId, householdId),
        eq(consentRecords.userId, userId),
        eq(consentRecords.purpose, purpose),
      ),
    )
    .orderBy(desc(consentRecords.createdAt))
    .limit(1);

  return Boolean(
    latest &&
      latest.action === CONSENT_ACTION.granted &&
      latest.policyVersion === CONSENT_POLICY_VERSION,
  );
}

export async function recordConsent(
  householdId: string,
  userId: string,
  input: {
    purpose: "document_storage" | "privacy_export" | "household_deletion";
    action: "granted" | "withdrawn";
    policyVersion?: string;
    idempotencyKey: string;
  },
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<{ record: SelectConsentRecord; statusCode: 200 | 201 }> {
  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${householdId}))`);
    return recordConsentLocked(
      householdId,
      userId,
      input,
      tx as unknown as Database,
      clock,
    );
  });
}

async function recordConsentLocked(
  householdId: string,
  userId: string,
  input: {
    purpose: "document_storage" | "privacy_export" | "household_deletion";
    action: "granted" | "withdrawn";
    policyVersion?: string;
    idempotencyKey: string;
  },
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<{ record: SelectConsentRecord; statusCode: 200 | 201 }> {
  const policyVersion = input.policyVersion || CONSENT_POLICY_VERSION;
  if (policyVersion !== CONSENT_POLICY_VERSION) {
    throw new AppError(400, "CONSENT_POLICY_INVALID", "Unsupported consent policy version");
  }

  // Check idempotency
  const [existing] = await database
    .select()
    .from(consentRecords)
    .where(
      and(
        eq(consentRecords.householdId, householdId),
        eq(consentRecords.idempotencyKey, input.idempotencyKey),
      ),
    )
    .limit(1);

  if (existing) {
    if (
      existing.purpose === input.purpose &&
      existing.action === input.action &&
      existing.policyVersion === policyVersion
    ) {
      return { record: existing, statusCode: 200 };
    }
    throw new AppError(
      409,
      "CONSENT_IDEMPOTENCY_CONFLICT",
      "Consent idempotency conflict: key already used with different parameters",
    );
  }

  const now = clock();
  const [created] = await database
    .insert(consentRecords)
    .values({
      householdId,
      userId,
      purpose: input.purpose,
      action: input.action,
      policyVersion,
      idempotencyKey: input.idempotencyKey,
      metadata: {},
      createdAt: now,
    })
    .returning();

  await recordAuditEvent(
    {
      householdId,
      action: input.action === "granted" ? "consent_granted" : "consent_withdrawn",
      actorType: "user",
      actorId: userId,
      entityType: "consent",
      entityId: created.id,
      metadata: {
        purpose: input.purpose,
        policyVersion,
      },
    },
    database,
  );

  return { record: created, statusCode: 201 };
}

export async function getEffectiveConsentState(
  householdId: string,
  userId: string,
  database: Database = db,
) {
  const records = await database
    .select()
    .from(consentRecords)
    .where(
      and(eq(consentRecords.householdId, householdId), eq(consentRecords.userId, userId)),
    )
    .orderBy(desc(consentRecords.createdAt));

  const purposes = [
    CONSENT_PURPOSE.documentStorage,
    CONSENT_PURPOSE.privacyExport,
    CONSENT_PURPOSE.householdDeletion,
  ];

  const effective: Record<
    string,
    { granted: boolean; policyVersion: string | null; updatedAt: string | null }
  > = {};

  for (const purpose of purposes) {
    const latest = records.find((r) => r.purpose === purpose);
    if (latest && latest.action === CONSENT_ACTION.granted) {
      effective[purpose] = {
        granted: true,
        policyVersion: latest.policyVersion,
        updatedAt: latest.createdAt.toISOString(),
      };
    } else {
      effective[purpose] = {
        granted: false,
        policyVersion: latest ? latest.policyVersion : null,
        updatedAt: latest ? latest.createdAt.toISOString() : null,
      };
    }
  }

  return {
    effective,
    history: records.map(serializeConsentRecord),
  };
}

// --- Privacy Export Operations ---

export async function createOrDeduplicateExport(
  householdId: string,
  userId: string,
  input: { idempotencyKey: string },
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<{ exportRequest: SelectPrivacyExport; statusCode: 200 | 202 }> {
  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${householdId}))`);
    return createOrDeduplicateExportLocked(
      householdId,
      userId,
      input,
      tx as unknown as Database,
      clock,
    );
  });
}

async function createOrDeduplicateExportLocked(
  householdId: string,
  userId: string,
  input: { idempotencyKey: string },
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<{ exportRequest: SelectPrivacyExport; statusCode: 200 | 202 }> {
  // 1. Verify consent
  const hasConsent = await checkConsentGranted(
    householdId,
    userId,
    CONSENT_PURPOSE.privacyExport,
    database,
  );
  if (!hasConsent) {
    throw new AppError(403, "CONSENT_REQUIRED", "Privacy export consent is required");
  }

  // 2. Check idempotency
  const [existing] = await database
    .select()
    .from(privacyExports)
    .where(
      and(
        eq(privacyExports.householdId, householdId),
        eq(privacyExports.idempotencyKey, input.idempotencyKey),
      ),
    )
    .limit(1);

  if (existing) {
    if (existing.status === "queued" || existing.status === "running") {
      return { exportRequest: existing, statusCode: 202 };
    }
    return { exportRequest: existing, statusCode: 200 };
  }

  const now = clock();
  const [created] = await database
    .insert(privacyExports)
    .values({
      householdId,
      requestedByUserId: userId,
      idempotencyKey: input.idempotencyKey,
      status: "queued",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Outbox event for worker delivery
  await database.insert(outboxEvents).values({
    topic: "privacy_export",
    aggregateId: created.id,
    payload: { exportId: created.id },
    createdAt: now,
    availableAt: now,
  });

  await recordAuditEvent(
    {
      householdId,
      action: "export_requested",
      actorType: "user",
      actorId: userId,
      entityType: "export",
      entityId: created.id,
      metadata: { idempotencyKey: input.idempotencyKey },
    },
    database,
  );

  return { exportRequest: created, statusCode: 202 };
}

export async function getExportById(
  householdId: string,
  id: string,
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<SelectPrivacyExport> {
  const [exportRow] = await database
    .select()
    .from(privacyExports)
    .where(and(eq(privacyExports.id, id), eq(privacyExports.householdId, householdId)))
    .limit(1);

  if (!exportRow) {
    throw new AppError(404, "NOT_FOUND", "Export not found");
  }

  // If completed but expired, hide artifact metadata and mark as expired
  if (
    exportRow.status === "completed" &&
    exportRow.expiresAt &&
    exportRow.expiresAt.getTime() <= clock().getTime()
  ) {
    return {
      ...exportRow,
      status: "expired",
      byteSize: null,
      checksum: null,
    };
  }

  return exportRow;
}

export async function createExportDownloadGrant(
  householdId: string,
  id: string,
  storage: ObjectStorage = getObjectStorage(),
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<{ downloadUrl: string; expiresAt: string }> {
  const [exportRow] = await database
    .select()
    .from(privacyExports)
    .where(and(eq(privacyExports.id, id), eq(privacyExports.householdId, householdId)))
    .limit(1);

  if (!exportRow) {
    throw new AppError(404, "NOT_FOUND", "Export not found");
  }

  if (exportRow.status !== "completed" || !exportRow.objectKey) {
    throw new AppError(404, "NOT_FOUND", "Export artifact is not ready or has expired");
  }

  if (exportRow.expiresAt && exportRow.expiresAt.getTime() <= clock().getTime()) {
    throw new AppError(410, "EXPORT_EXPIRED", "Export artifact has expired");
  }

  const grant = await storage.createDownloadGrant(exportRow.objectKey, 300);
  return {
    downloadUrl: grant.downloadUrl,
    expiresAt: grant.expiresAt.toISOString(),
  };
}

export async function processPrivacyExport(
  exportId: string,
  database: Database = db,
  storage: ObjectStorage = getObjectStorage(),
  clock: () => Date = () => new Date(),
): Promise<void> {
  const [exportRow] = await database
    .select()
    .from(privacyExports)
    .where(eq(privacyExports.id, exportId))
    .limit(1);

  if (!exportRow) return;
  if (
    exportRow.status === "completed" &&
    exportRow.expiresAt &&
    exportRow.expiresAt.getTime() > clock().getTime()
  ) {
    return; // idempotent redelivery
  }

  const now = clock();
  await database
    .update(privacyExports)
    .set({
      status: "running",
      startedAt: now,
      attempts: sql`${privacyExports.attempts} + 1`,
      updatedAt: now,
    })
    .where(eq(privacyExports.id, exportId));

  const targetHouseholdId = exportRow.householdId;

  // Build export payload snapshot
  const [household] = await database
    .select()
    .from(households)
    .where(eq(households.id, targetHouseholdId))
    .limit(1);

  const members = await database
    .select({
      id: householdMembers.id,
      userId: householdMembers.userId,
      role: householdMembers.role,
      activeAt: householdMembers.activeAt,
    })
    .from(householdMembers)
    .where(eq(householdMembers.householdId, targetHouseholdId));

  const memberUserIds = members.map((m) => m.userId);
  const userRows = memberUserIds.length > 0
    ? await database
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(inArray(users.id, memberUserIds))
    : [];

  const accountRows = await database
    .select()
    .from(accounts)
    .where(eq(accounts.householdId, targetHouseholdId));

  const categoryRows = await database
    .select()
    .from(categories)
    .where(eq(categories.householdId, targetHouseholdId));

  const transactionRows = await database
    .select()
    .from(transactions)
    .where(eq(transactions.householdId, targetHouseholdId));

  const planRows = await database
    .select()
    .from(plans)
    .where(eq(plans.householdId, targetHouseholdId));

  const planVersionRows = await database
    .select()
    .from(planVersions)
    .where(eq(planVersions.householdId, targetHouseholdId));

  const snapshotRows = await database
    .select()
    .from(financialSnapshots)
    .where(eq(financialSnapshots.householdId, targetHouseholdId));

  const scenarioRows = await database
    .select()
    .from(scenarios)
    .where(eq(scenarios.householdId, targetHouseholdId));

  const conversationRows = await database
    .select()
    .from(plannerConversations)
    .where(eq(plannerConversations.householdId, targetHouseholdId));

  const messageRows = await database
    .select()
    .from(plannerMessages)
    .where(eq(plannerMessages.householdId, targetHouseholdId));

  const researchRows = await database
    .select()
    .from(researchRuns)
    .where(eq(researchRuns.householdId, targetHouseholdId));

  const evidenceRows = await database
    .select()
    .from(evidence)
    .where(eq(evidence.householdId, targetHouseholdId));

  const driftCheckRows = await database
    .select()
    .from(driftChecks)
    .where(eq(driftChecks.householdId, targetHouseholdId));

  const driftEventRows = await database
    .select()
    .from(driftEvents)
    .where(eq(driftEvents.householdId, targetHouseholdId));

  const documentRows = await database
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.householdId, targetHouseholdId),
        eq(documents.status, "available"),
      ),
    );

  // Encode document contents within size bounds
  const exportDocuments: Array<Record<string, unknown>> = [];
  for (const doc of documentRows) {
    let contentBase64: string | null = null;
    if (doc.byteSize <= 5 * 1024 * 1024) {
      try {
        const bytes = await storage.download(doc.objectKey);
        const downloadedChecksum = crypto.createHash("sha256").update(bytes).digest("hex");
        if (downloadedChecksum === doc.checksum) {
          contentBase64 = bytes.toString("base64");
        }
      } catch {
        contentBase64 = null;
      }
    }
    exportDocuments.push({
      id: doc.id,
      displayName: doc.displayName,
      mediaType: doc.mediaType,
      byteSize: doc.byteSize,
      checksum: doc.checksum,
      createdAt: doc.createdAt.toISOString(),
      content: contentBase64,
    });
  }

  const exportPayload = {
    version: "2026.1",
    exportedAt: now.toISOString(),
    household: household
      ? { id: household.id, name: household.name, createdAt: household.createdAt.toISOString() }
      : null,
    members,
    users: userRows,
    accounts: accountRows,
    categories: categoryRows,
    transactions: transactionRows,
    plans: planRows,
    planVersions: planVersionRows,
    financialSnapshots: snapshotRows,
    scenarios: scenarioRows,
    plannerConversations: conversationRows,
    plannerMessages: messageRows,
    researchRuns: researchRows,
    evidence: evidenceRows,
    driftChecks: driftCheckRows,
    driftEvents: driftEventRows,
    documents: exportDocuments,
  };

  const payloadBuffer = Buffer.from(JSON.stringify(exportPayload, null, 2), "utf-8");
  const checksum = crypto.createHash("sha256").update(payloadBuffer).digest("hex");
  const objectKey = `${generateObjectKey("exports")}.json`;

  try {
    await storage.upload(objectKey, payloadBuffer, "application/json");
  } catch (err) {
    await database
      .update(privacyExports)
      .set({
        status: "failed",
        failureCode: "STORAGE_ERROR",
        failureMessage: "Failed to upload export artifact to storage",
        retentionExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: clock(),
      })
      .where(eq(privacyExports.id, exportId));
    throw err;
  }

  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  const retentionExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await database
    .update(privacyExports)
    .set({
      status: "completed",
      objectKey,
      byteSize: payloadBuffer.length,
      checksum,
      completedAt: now,
      expiresAt,
      retentionExpiresAt,
      failureCode: null,
      failureMessage: null,
      updatedAt: now,
    })
    .where(eq(privacyExports.id, exportId));

  await recordAuditEvent(
    {
      householdId: targetHouseholdId,
      action: "export_completed",
      actorType: "system",
      entityType: "export",
      entityId: exportId,
      metadata: { byteSize: payloadBuffer.length },
    },
    database,
  );
}

// --- Household Deletion Operations ---

export async function createOrDeduplicateDeletion(
  householdId: string,
  userId: string,
  sessionId: string,
  role: string,
  authenticatedAt: Date,
  input: { idempotencyKey: string },
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<{ deletion: SelectHouseholdDeletion; confirmationToken?: string; statusCode: 200 | 201 }> {
  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${householdId}))`);
    return createOrDeduplicateDeletionLocked(
      householdId,
      userId,
      sessionId,
      role,
      authenticatedAt,
      input,
      tx as unknown as Database,
      clock,
    );
  });
}

async function createOrDeduplicateDeletionLocked(
  householdId: string,
  userId: string,
  sessionId: string,
  role: string,
  authenticatedAt: Date,
  input: { idempotencyKey: string },
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<{ deletion: SelectHouseholdDeletion; confirmationToken?: string; statusCode: 200 | 201 }> {
  // 1. Verify owner role
  if (role !== "owner") {
    throw new AppError(403, "FORBIDDEN", "Only household owners can initiate deletion");
  }

  // 2. Verify consent
  const hasConsent = await checkConsentGranted(
    householdId,
    userId,
    CONSENT_PURPOSE.householdDeletion,
    database,
  );
  if (!hasConsent) {
    throw new AppError(403, "CONSENT_REQUIRED", "Household deletion consent is required");
  }

  // 3. Verify recent authentication (within 15 minutes)
  const now = clock();
  const authenticationAge = now.getTime() - authenticatedAt.getTime();
  if (authenticationAge < 0 || authenticationAge > 15 * 60 * 1000) {
    throw new AppError(401, "RECENT_AUTH_REQUIRED", "Recent authentication required for deletion");
  }

  // 4. Check existing deletion requests for this household
  const [existing] = await database
    .select()
    .from(householdDeletions)
    .where(
      and(
        eq(householdDeletions.householdId, householdId),
        sql`${householdDeletions.status} != 'completed'`,
      ),
    )
    .limit(1);

  if (existing) {
    if (existing.idempotencyKey === input.idempotencyKey) {
      if (existing.status === "pending_confirmation") {
        if (existing.confirmationExpiresAt.getTime() < now.getTime()) {
          throw new AppError(409, "CONFIRMATION_EXPIRED", "Previous deletion confirmation expired");
        }
        // Return existing without returning confirmation token again
        return { deletion: existing, statusCode: 200 };
      }
      return { deletion: existing, statusCode: 200 };
    }
    throw new AppError(
      409,
      "DELETION_IN_PROGRESS",
      "A deletion request is already in progress for this household",
    );
  }

  // 5. Generate confirmation token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const confirmationTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const confirmationExpiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
  const retentionExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours for unconfirmed

  const [created] = await database
    .insert(householdDeletions)
    .values({
      householdId,
      requestedByUserId: userId,
      sessionId,
      idempotencyKey: input.idempotencyKey,
      confirmationTokenHash,
      confirmationExpiresAt,
      status: "pending_confirmation",
      retentionExpiresAt,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await recordAuditEvent(
    {
      householdId,
      action: "deletion_requested",
      actorType: "user",
      actorId: userId,
      entityType: "household_deletion",
      entityId: created.id,
      metadata: { idempotencyKey: input.idempotencyKey },
    },
    database,
  );

  return { deletion: created, confirmationToken: rawToken, statusCode: 201 };
}

export async function confirmDeletion(
  householdId: string,
  userId: string,
  sessionId: string,
  id: string,
  input: { confirmationToken: string },
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<SelectHouseholdDeletion> {
  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${householdId}))`);
    return confirmDeletionLocked(
      householdId,
      userId,
      sessionId,
      id,
      input,
      tx as unknown as Database,
      clock,
    );
  });
}

async function confirmDeletionLocked(
  householdId: string,
  userId: string,
  sessionId: string,
  id: string,
  input: { confirmationToken: string },
  database: Database = db,
  clock: () => Date = () => new Date(),
): Promise<SelectHouseholdDeletion> {
  const [deletion] = await database
    .select()
    .from(householdDeletions)
    .where(and(eq(householdDeletions.id, id), eq(householdDeletions.householdId, householdId)))
    .limit(1);

  if (!deletion) {
    throw new AppError(404, "NOT_FOUND", "Deletion request not found");
  }

  if (deletion.requestedByUserId !== userId || deletion.sessionId !== sessionId) {
    throw new AppError(409, "DELETION_REQUEST_STALE", "Deletion request is no longer valid");
  }

  const [membership] = await database
    .select({ role: householdMembers.role })
    .from(householdMembers)
    .where(
      and(
        eq(householdMembers.householdId, householdId),
        eq(householdMembers.userId, userId),
        sql`${householdMembers.endedAt} is null`,
      ),
    )
    .limit(1);
  if (!membership || membership.role !== "owner") {
    throw new AppError(409, "DELETION_REQUEST_STALE", "Deletion request is no longer valid");
  }

  if (
    deletion.status === "queued" ||
    deletion.status === "running" ||
    deletion.status === "completed"
  ) {
    return deletion; // Idempotent reconfirmation
  }

  if (deletion.status !== "pending_confirmation") {
    throw new AppError(400, "INVALID_STATE", "Deletion request is not pending confirmation");
  }

  const now = clock();
  if (deletion.confirmationExpiresAt.getTime() < now.getTime()) {
    throw new AppError(409, "CONFIRMATION_EXPIRED", "Deletion confirmation token has expired");
  }

  const hasConsent = await checkConsentGranted(
    householdId,
    userId,
    CONSENT_PURPOSE.householdDeletion,
    database,
  );
  if (!hasConsent) {
    throw new AppError(409, "CONSENT_WITHDRAWN", "Household deletion consent has been withdrawn");
  }

  const tokenHash = crypto.createHash("sha256").update(input.confirmationToken).digest();
  const expectedHash = Buffer.from(deletion.confirmationTokenHash, "hex");
  if (expectedHash.length !== tokenHash.length || !crypto.timingSafeEqual(tokenHash, expectedHash)) {
    throw new AppError(400, "INVALID_CONFIRMATION_TOKEN", "Invalid confirmation token");
  }

  const [updated] = await database
    .update(householdDeletions)
    .set({
      status: "queued",
      confirmedAt: now,
      confirmationTokenHash: "consumed",
      updatedAt: now,
    })
    .where(eq(householdDeletions.id, id))
    .returning();

  await database.insert(outboxEvents).values({
    topic: "household_deletion",
    aggregateId: id,
    payload: { deletionId: id },
    createdAt: now,
    availableAt: now,
  });

  await recordAuditEvent(
    {
      householdId,
      action: "deletion_confirmed",
      actorType: "user",
      actorId: userId,
      entityType: "household_deletion",
      entityId: id,
    },
    database,
  );

  return updated;
}

export async function getDeletionById(
  householdId: string,
  id: string,
  database: Database = db,
): Promise<SelectHouseholdDeletion> {
  const [deletion] = await database
    .select()
    .from(householdDeletions)
    .where(and(eq(householdDeletions.id, id), eq(householdDeletions.householdId, householdId)))
    .limit(1);

  if (!deletion) {
    throw new AppError(404, "NOT_FOUND", "Deletion request not found");
  }

  return deletion;
}

export async function processHouseholdDeletion(
  deletionId: string,
  database: Database = db,
  storage: ObjectStorage = getObjectStorage(),
  clock: () => Date = () => new Date(),
): Promise<void> {
  const [deletion] = await database
    .select()
    .from(householdDeletions)
    .where(eq(householdDeletions.id, deletionId))
    .limit(1);

  if (!deletion) return;
  if (deletion.status === "completed") return;

  const now = clock();
  await database
    .update(householdDeletions)
    .set({
      status: "running",
      startedAt: now,
      attempts: sql`${householdDeletions.attempts} + 1`,
      updatedAt: now,
    })
    .where(eq(householdDeletions.id, deletionId));

  const targetHouseholdId = deletion.householdId;

  // Step 1: Enumerate and delete all object storage keys
  const docKeys = await database
    .select({ objectKey: documents.objectKey })
    .from(documents)
    .where(eq(documents.householdId, targetHouseholdId));

  const exportKeys = await database
    .select({ objectKey: privacyExports.objectKey })
    .from(privacyExports)
    .where(
      and(
        eq(privacyExports.householdId, targetHouseholdId),
        isNotNull(privacyExports.objectKey),
      ),
    );

  const allKeys = [
    ...docKeys.map((d) => d.objectKey).filter(Boolean),
    ...exportKeys.map((e) => e.objectKey!).filter(Boolean),
  ];

  try {
    for (const key of allKeys) {
      await storage.delete(key);
    }
  } catch (error) {
    await database
      .update(householdDeletions)
      .set({
        status: "failed",
        failureCode: "STORAGE_UNAVAILABLE",
        failureMessage: "Household object cleanup is incomplete",
        updatedAt: clock(),
      })
      .where(eq(householdDeletions.id, deletionId));
    throw error;
  }

  // Step 2: In a single database transaction, delete relational records
  await database.transaction(async (tx) => {
    // Record terminal audit event before deleting tenant rows
    await recordAuditEvent(
      {
        householdId: targetHouseholdId,
        action: "household_deleted",
        actorType: "system",
        entityType: "household",
        entityId: targetHouseholdId,
        requestId: deletionId,
      },
      tx as unknown as Database,
    );

    // Find all users associated with this household
    const members = await tx
      .select({ userId: householdMembers.userId })
      .from(householdMembers)
      .where(eq(householdMembers.householdId, targetHouseholdId));

    const memberUserIds = members.map((m) => m.userId);

    // Delete session families and sessions for this household
    const fams = await tx
      .select({ id: sessionFamilies.id })
      .from(sessionFamilies)
      .where(eq(sessionFamilies.householdId, targetHouseholdId));

    const famIds = fams.map((f) => f.id);
    if (famIds.length > 0) {
      await tx.delete(sessions).where(inArray(sessions.familyId, famIds));
      await tx.delete(sessionFamilies).where(inArray(sessionFamilies.id, famIds));
    }

    // Delete domain rows in foreign-key safe order
    await tx.delete(plannerMessageCitations).where(
      sql`${plannerMessageCitations.messageId} IN (
        SELECT id FROM ${plannerMessages} WHERE ${plannerMessages.householdId} = ${targetHouseholdId}
      )`,
    );
    await tx.delete(plannerMessages).where(eq(plannerMessages.householdId, targetHouseholdId));
    await tx.delete(plannerConversations).where(
      eq(plannerConversations.householdId, targetHouseholdId),
    );
    await tx.delete(evidence).where(eq(evidence.householdId, targetHouseholdId));
    await tx.delete(researchRuns).where(eq(researchRuns.householdId, targetHouseholdId));
    await tx.delete(driftEvents).where(eq(driftEvents.householdId, targetHouseholdId));
    await tx.delete(driftChecks).where(eq(driftChecks.householdId, targetHouseholdId));
    await tx.delete(scenarios).where(eq(scenarios.householdId, targetHouseholdId));
    await tx.delete(planVersions).where(eq(planVersions.householdId, targetHouseholdId));
    await tx.delete(financialSnapshots).where(
      eq(financialSnapshots.householdId, targetHouseholdId),
    );
    await tx.delete(plans).where(eq(plans.householdId, targetHouseholdId));
    await tx.delete(transactionSources).where(
      eq(transactionSources.householdId, targetHouseholdId),
    );
    await tx.delete(transactions).where(eq(transactions.householdId, targetHouseholdId));
    await tx.delete(accounts).where(eq(accounts.householdId, targetHouseholdId));
    await tx.delete(categories).where(eq(categories.householdId, targetHouseholdId));
    await tx.delete(documents).where(eq(documents.householdId, targetHouseholdId));
    await tx.delete(privacyExports).where(eq(privacyExports.householdId, targetHouseholdId));
    await tx.delete(householdMembers).where(eq(householdMembers.householdId, targetHouseholdId));
    await tx.delete(households).where(eq(households.id, targetHouseholdId));

    // Delete users who have no other household memberships
    for (const userId of memberUserIds) {
      const remaining = await tx
        .select()
        .from(householdMembers)
        .where(eq(householdMembers.userId, userId));

      if (remaining.length === 0) {
        await tx.delete(sessions).where(eq(sessions.userId, userId));
        await tx.delete(sessionFamilies).where(eq(sessionFamilies.userId, userId));
        await tx.delete(authChallenges).where(eq(authChallenges.userId, userId));
        await tx.delete(authIdentities).where(eq(authIdentities.userId, userId));
        await tx.delete(users).where(eq(users.id, userId));
      }
    }

    // Step 3: Mark household_deletions tombstone as completed
    const retentionDate = new Date(clock().getTime() + 30 * 24 * 60 * 60 * 1000);
    await tx
      .update(householdDeletions)
      .set({
        status: "completed",
        idempotencyKey: `deleted:${deletionId}`,
        confirmationTokenHash: "consumed",
        completedAt: clock(),
        retentionExpiresAt: retentionDate,
        updatedAt: clock(),
      })
      .where(eq(householdDeletions.id, deletionId));
  });
}

// --- Retention & Cleanup ---

export async function runPrivacyRetentionCleanup(
  database: Database = db,
  storage: ObjectStorage = getObjectStorage(),
  clock: () => Date = () => new Date(),
): Promise<{
  expiredExportsCleaned: number;
  expiredDeletionsCleaned: number;
  expiredDocumentsCleaned: number;
  expiredFailedExportsCleaned: number;
  orphanObjectsCleaned: number;
}> {
  const now = clock();
  let expiredExportsCleaned = 0;
  let expiredDeletionsCleaned = 0;
  let expiredDocumentsCleaned = 0;
  let expiredFailedExportsCleaned = 0;
  let orphanObjectsCleaned = 0;

  // 1. Expired export artifacts (after 24 hours): delete object and mark expired
  const expiredExports = await database
    .select()
    .from(privacyExports)
    .where(
      and(
        eq(privacyExports.status, "completed"),
        lte(privacyExports.expiresAt, now),
        isNotNull(privacyExports.objectKey),
      ),
    )
    .limit(50);

  for (const exp of expiredExports) {
    if (exp.objectKey) {
      try {
        await storage.delete(exp.objectKey);
      } catch {
        // Preserve the private key for retry. Reads already hide the expired artifact.
        continue;
      }
      await database
        .update(privacyExports)
        .set({ status: "expired", objectKey: null, updatedAt: now })
        .where(eq(privacyExports.id, exp.id));
      expiredExportsCleaned += 1;
    }
  }

  // 2. Unconfirmed deletion requests older than 24 hours
  const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const unconfirmedDeletions = await database
    .select({ id: householdDeletions.id })
    .from(householdDeletions)
    .where(
      and(
        eq(householdDeletions.status, "pending_confirmation"),
        lte(householdDeletions.createdAt, cutoff24h),
      ),
    )
    .limit(50);

  if (unconfirmedDeletions.length > 0) {
    const ids = unconfirmedDeletions.map((d) => d.id);
    await database.delete(householdDeletions).where(inArray(householdDeletions.id, ids));
    expiredDeletionsCleaned += ids.length;
  }

  // 3. Deleted document records older than retention deadline
  const expiredDocs = await database
    .select({ id: documents.id, objectKey: documents.objectKey })
    .from(documents)
    .where(
      and(
        eq(documents.status, "deleted"),
        lte(documents.retentionExpiresAt, now),
      ),
    )
    .limit(50);

  if (expiredDocs.length > 0) {
    const ids = expiredDocs.map((d) => d.id);
    await database.delete(documents).where(inArray(documents.id, ids));
    expiredDocumentsCleaned += ids.length;
  }

  // 4. Failed/expired exports older than retention deadline
  const oldExportRows = await database
    .select({ id: privacyExports.id })
    .from(privacyExports)
    .where(
      and(
        inArray(privacyExports.status, ["failed", "expired"]),
        lte(privacyExports.retentionExpiresAt, now),
      ),
    )
    .limit(50);

  if (oldExportRows.length > 0) {
    const ids = oldExportRows.map((e) => e.id);
    await database.delete(privacyExports).where(inArray(privacyExports.id, ids));
    expiredFailedExportsCleaned += ids.length;
  }

  // 5. Orphan documents cleanup: failed/delete_pending records older than 1 hour
  const cutoff1h = new Date(now.getTime() - 60 * 60 * 1000);
  const failedDocs = await database
    .select()
    .from(documents)
    .where(
      and(
        inArray(documents.status, ["failed", "delete_pending"]),
        lte(documents.createdAt, cutoff1h),
      ),
    )
    .limit(50);

  for (const doc of failedDocs) {
    let deleted = false;
    try {
      await storage.delete(doc.objectKey);
      orphanObjectsCleaned += 1;
      deleted = true;
    } catch {
      // Preserve retryable metadata while storage is unavailable.
    }
    if (deleted && doc.status === "delete_pending") {
      await database
        .update(documents)
        .set({ status: "deleted", updatedAt: now })
        .where(eq(documents.id, doc.id));
    }
  }

  return {
    expiredExportsCleaned,
    expiredDeletionsCleaned,
    expiredDocumentsCleaned,
    expiredFailedExportsCleaned,
    orphanObjectsCleaned,
  };
}

export const createExportRequest = createOrDeduplicateExport;
export const runRetentionCleanup = runPrivacyRetentionCleanup;
export const initiateDeletion = createOrDeduplicateDeletion;
