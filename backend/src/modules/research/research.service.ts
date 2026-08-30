import { and, db, eq, gt } from "../../database";
import { AppError } from "../../shared/errors/app-error";
import { defaultDnsLookup, type DnsLookupFn } from "./dns-resolver";
import {
  evidence,
  researchRuns,
  type InsertEvidence,
  type SelectEvidence,
  type SelectResearchRun,
} from "./model";
import { safeFetchDocument } from "./safe-fetcher";
import { TavilySearchAdapter, type SearchProvider } from "./search-provider";
import { classifySourceType, compareEvidenceRank, extractPublisher } from "./source-classifier";
import { validateInputAgainstInjection } from "../planner/safety/prompt-injection";

export interface ResearchExecutionOptions {
  searchProvider?: SearchProvider;
  dnsLookup?: DnsLookupFn;
  fetchTransport?: (url: string, init?: RequestInit) => Promise<Response>;
  clock?: () => Date;
}

export function sanitizeInputString(val: string): string {
  // Normalize Unicode
  const normalized = val.normalize("NFC");
  // Reject NUL and control characters
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(normalized)) {
    throw new AppError(400, "INVALID_INPUT", "Input contains forbidden control characters");
  }
  return normalized.trim();
}

export function computeRetentionExpiresAt(baseDate: Date, days = 90): Date {
  return new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
}

export function computeFreshnessExpiresAt(baseDate: Date, days = 30): Date {
  return new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function executeResearch(
  householdId: string,
  userId: string,
  input: { query: string; topic: string },
  options: ResearchExecutionOptions = {},
): Promise<{ run: SelectResearchRun; evidence: SelectEvidence[] }> {
  const query = sanitizeInputString(input.query);
  const topic = sanitizeInputString(input.topic);

  if (!query || query.length > 500) {
    throw new AppError(400, "INVALID_INPUT", "Query must be between 1 and 500 characters");
  }
  if (!topic || topic.length > 100) {
    throw new AppError(400, "INVALID_INPUT", "Topic must be between 1 and 100 characters");
  }
  validateInputAgainstInjection(query);

  const now = options.clock ? options.clock() : new Date();
  const retentionExpiresAt = computeRetentionExpiresAt(now, 90);
  const freshnessExpiresAt = computeFreshnessExpiresAt(now, 30);

  const searchProvider = options.searchProvider ?? new TavilySearchAdapter();
  const dnsLookup = options.dnsLookup ?? defaultDnsLookup;
  const fetchTransport = options.fetchTransport;

  // Insert initial research run record
  const [createdRun] = await db
    .insert(researchRuns)
    .values({
      householdId,
      userId,
      query,
      topic,
      status: "running",
      provider: searchProvider.providerName,
      createdAt: now,
      retentionExpiresAt,
    })
    .returning();

  try {
    const candidates = await searchProvider.search(query, { maxResults: 5 });
    if (!candidates || candidates.length === 0) {
      await db
        .update(researchRuns)
        .set({ status: "failed", failureCode: "NO_SEARCH_RESULTS", completedAt: now })
        .where(eq(researchRuns.id, createdRun.id));
      throw new AppError(502, "RESEARCH_FAILED", "Search returned no candidate results");
    }

    const fetchedEvidenceList: InsertEvidence[] = [];

    for (const candidate of candidates) {
      try {
        const fetched = await safeFetchDocument(candidate.url, {
          dnsLookup,
          fetchTransport,
          timeoutMs: 8000,
        });

        const sourceType = classifySourceType(fetched.canonicalUrl);
        const publisher = extractPublisher(fetched.canonicalUrl);

        let pubTime: Date | null = null;
        if (candidate.publishedDate) {
          const d = new Date(candidate.publishedDate);
          if (!isNaN(d.getTime())) {
            pubTime = d;
          }
        }

        const confidenceStr =
          typeof candidate.score === "number" && !isNaN(candidate.score)
            ? Math.min(1.0, Math.max(0.1, candidate.score)).toFixed(2)
            : "1.00";

        fetchedEvidenceList.push({
          householdId,
          researchRunId: createdRun.id,
          topic,
          claim: (candidate.title || topic).slice(0, 500),
          canonicalSourceUrl: fetched.canonicalUrl,
          publisher,
          sourceType,
          publicationTime: pubTime,
          effectiveTime: null,
          retrievedAt: now,
          freshnessExpiresAt,
          contentHash: fetched.contentHash,
          supportingExcerpt: fetched.excerpt,
          confidence: confidenceStr,
          createdAt: now,
          retentionExpiresAt,
        });
      } catch {
        // Individual unsafe or failed URL is skipped; others continue
        continue;
      }
    }

    if (fetchedEvidenceList.length === 0) {
      await db
        .update(researchRuns)
        .set({ status: "failed", failureCode: "ALL_FETCHES_FAILED", completedAt: now })
        .where(eq(researchRuns.id, createdRun.id));
      throw new AppError(502, "RESEARCH_FAILED", "Failed to safely fetch any valid evidence from candidates");
    }

    // Persist evidence and mark completed in transaction
    const savedEvidence = await db.transaction(async (tx) => {
      const inserted = await tx.insert(evidence).values(fetchedEvidenceList).returning();
      await tx
        .update(researchRuns)
        .set({ status: "completed", completedAt: now })
        .where(eq(researchRuns.id, createdRun.id));
      return inserted;
    });

    const [finalRun] = await db.select().from(researchRuns).where(eq(researchRuns.id, createdRun.id));
    savedEvidence.sort(compareEvidenceRank);

    return { run: finalRun, evidence: savedEvidence };
  } catch (err: any) {
    const failureCode = err instanceof AppError
      ? (["NO_SEARCH_RESULTS", "RESEARCH_FAILED", "SEARCH_PROVIDER_ERROR", "SEARCH_TIMEOUT"].includes(err.code)
          ? err.code
          : "RESEARCH_FAILED")
      : "UNEXPECTED_ERROR";
    await db
      .update(researchRuns)
      .set({ status: "failed", failureCode, completedAt: options.clock ? options.clock() : new Date() })
      .where(and(eq(researchRuns.id, createdRun.id), eq(researchRuns.status, "running")));
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(502, "RESEARCH_FAILED", "Research execution failed");
  }
}

export async function getResearchRun(
  householdId: string,
  runId: string,
  now = new Date(),
): Promise<SelectResearchRun> {
  const [run] = await db
    .select()
    .from(researchRuns)
    .where(
      and(
        eq(researchRuns.id, runId),
        eq(researchRuns.householdId, householdId),
        gt(researchRuns.retentionExpiresAt, now),
      ),
    )
    .limit(1);

  if (!run) {
    throw new AppError(404, "RESEARCH_RUN_NOT_FOUND", "Research run not found");
  }
  return run;
}

export async function getRunEvidence(
  householdId: string,
  runId: string,
  now = new Date(),
): Promise<SelectEvidence[]> {
  // Verify run exists and belongs to household
  await getResearchRun(householdId, runId, now);

  const rows = await db
    .select()
    .from(evidence)
    .where(
      and(
        eq(evidence.researchRunId, runId),
        eq(evidence.householdId, householdId),
        gt(evidence.retentionExpiresAt, now),
      ),
    );

  rows.sort(compareEvidenceRank);
  return rows;
}

export function serializeResearchRun(run: SelectResearchRun) {
  return {
    id: run.id,
    householdId: run.householdId,
    userId: run.userId,
    query: run.query,
    topic: run.topic,
    status: run.status as SelectResearchRun["status"],
    provider: run.provider,
    failureCode: run.failureCode,
    createdAt: run.createdAt.toISOString(),
    completedAt: run.completedAt ? run.completedAt.toISOString() : null,
    retentionExpiresAt: run.retentionExpiresAt.toISOString(),
  };
}

export function serializeEvidence(item: SelectEvidence) {
  return {
    id: item.id,
    householdId: item.householdId,
    researchRunId: item.researchRunId,
    topic: item.topic,
    claim: item.claim,
    canonicalSourceUrl: item.canonicalSourceUrl,
    publisher: item.publisher,
    sourceType: item.sourceType as SelectEvidence["sourceType"],
    publicationTime: item.publicationTime ? item.publicationTime.toISOString() : null,
    effectiveTime: item.effectiveTime ? item.effectiveTime.toISOString() : null,
    retrievedAt: item.retrievedAt.toISOString(),
    freshnessExpiresAt: item.freshnessExpiresAt.toISOString(),
    contentHash: item.contentHash,
    supportingExcerpt: item.supportingExcerpt,
    confidence: item.confidence,
    createdAt: item.createdAt.toISOString(),
    retentionExpiresAt: item.retentionExpiresAt.toISOString(),
  };
}
