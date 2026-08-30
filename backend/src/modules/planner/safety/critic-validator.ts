import { and, db, eq } from "../../../database";
import { AppError } from "../../../shared/errors/app-error";
import { evidence } from "../../research/model";
import type { Citation } from "../model";

export interface CriticValidationResult {
  approved: boolean;
  validatedCitations: Citation[];
  reason?: string;
}

export async function validateCriticCitations(
  householdId: string,
  content: string,
  proposedCitations: Citation[],
  now = new Date(),
): Promise<CriticValidationResult> {
  const seenIds = new Set<string>();
  const validatedCitations: Citation[] = [];

  for (const citation of proposedCitations) {
    if (seenIds.has(citation.evidenceId)) {
      return {
        approved: false,
        validatedCitations: [],
        reason: `Duplicate citation ID found: ${citation.evidenceId}`,
      };
    }
    seenIds.add(citation.evidenceId);

    // Verify evidence ownership and existence in database
    const [evidenceRow] = await db
      .select()
      .from(evidence)
      .where(and(eq(evidence.id, citation.evidenceId), eq(evidence.householdId, householdId)))
      .limit(1);

    if (!evidenceRow) {
      return {
        approved: false,
        validatedCitations: [],
        reason: `Evidence ID ${citation.evidenceId} does not exist or belongs to another tenant`,
      };
    }

    // Verify freshness
    if (evidenceRow.freshnessExpiresAt.getTime() <= now.getTime()) {
      return {
        approved: false,
        validatedCitations: [],
        reason: `Evidence ${citation.evidenceId} freshness has expired`,
      };
    }

    // Verify URL consistency
    if (citation.canonicalSourceUrl !== evidenceRow.canonicalSourceUrl) {
      return {
        approved: false,
        validatedCitations: [],
        reason: `Citation URL does not match stored evidence URL for ${citation.evidenceId}`,
      };
    }

    validatedCitations.push({
      evidenceId: evidenceRow.id,
      topic: evidenceRow.topic,
      claim: evidenceRow.claim,
      canonicalSourceUrl: evidenceRow.canonicalSourceUrl,
      publisher: evidenceRow.publisher,
      sourceType: evidenceRow.sourceType as Citation["sourceType"],
      supportingExcerpt: evidenceRow.supportingExcerpt,
      retrievedAt: evidenceRow.retrievedAt.toISOString(),
      freshnessExpiresAt: evidenceRow.freshnessExpiresAt.toISOString(),
    });
  }

  // Check for uncited statutory / regulatory numbers if external regulatory claims are made
  const regulatoryKeywords = [
    /Section\s+80C\b/i,
    /Section\s+80D\b/i,
    /repo\s+rate\b/i,
    /reverse\s+repo\b/i,
    /EPF\s+interest\s+rate\b/i,
    /PPF\s+interest\s+rate\b/i,
    /RBI\s+monetary\s+policy\b/i,
  ];

  for (const regex of regulatoryKeywords) {
    if (regex.test(content) && validatedCitations.length === 0) {
      return {
        approved: false,
        validatedCitations: [],
        reason: `Content contains factual regulatory claims matching ${regex} without required evidence citations`,
      };
    }
  }

  return {
    approved: true,
    validatedCitations,
  };
}

export async function enforceCriticValidation(
  householdId: string,
  content: string,
  proposedCitations: Citation[],
  now = new Date(),
): Promise<Citation[]> {
  const result = await validateCriticCitations(householdId, content, proposedCitations, now);
  if (!result.approved) {
    throw new AppError(
      422,
      "CRITIC_VALIDATION_FAILED",
      `Critic validation failed: ${result.reason}`,
    );
  }
  return result.validatedCitations;
}
