import type { SourceType } from "./model";

export function classifySourceType(urlStr: string): SourceType {
  let hostname = "";
  try {
    const parsed = new URL(urlStr);
    hostname = parsed.hostname.toLowerCase();
  } catch {
    return "community";
  }

  // 1. Government / Regulator
  if (
    hostname.endsWith(".gov.in") ||
    hostname.endsWith(".nic.in") ||
    hostname.endsWith(".gov") ||
    hostname === "rbi.org.in" ||
    hostname.endsWith(".rbi.org.in") ||
    hostname === "sebi.gov.in" ||
    hostname.endsWith(".sebi.gov.in") ||
    hostname === "incometaxindia.gov.in" ||
    hostname === "incometax.gov.in" ||
    hostname === "pfrda.org.in" ||
    hostname.endsWith(".pfrda.org.in") ||
    hostname === "epfindia.gov.in" ||
    hostname.endsWith(".epfindia.gov.in") ||
    hostname === "sec.gov" ||
    hostname.endsWith(".sec.gov") ||
    hostname === "irs.gov" ||
    hostname.endsWith(".irs.gov") ||
    hostname === "federalreserve.gov" ||
    hostname === "gov.uk" ||
    hostname.endsWith(".gov.uk")
  ) {
    return "government_regulator";
  }

  // 2. Exchange / Official Filing
  if (
    hostname === "nseindia.com" ||
    hostname.endsWith(".nseindia.com") ||
    hostname === "bseindia.com" ||
    hostname.endsWith(".bseindia.com") ||
    hostname === "mcxindia.com" ||
    hostname.endsWith(".mcxindia.com") ||
    hostname === "nyse.com" ||
    hostname.endsWith(".nyse.com") ||
    hostname === "nasdaq.com" ||
    hostname.endsWith(".nasdaq.com")
  ) {
    return "exchange_official_filing";
  }

  // 3. Official Provider
  if (
    hostname === "amfiindia.com" ||
    hostname.endsWith(".amfiindia.com") ||
    hostname === "npstrust.org.in" ||
    hostname.endsWith(".npstrust.org.in") ||
    hostname === "licindia.in" ||
    hostname.endsWith(".licindia.in") ||
    hostname === "camsonline.com" ||
    hostname.endsWith(".camsonline.com") ||
    hostname === "kfintech.com" ||
    hostname.endsWith(".kfintech.com") ||
    hostname === "sbi.co.in" ||
    hostname === "hdfcbank.com" ||
    hostname === "icicibank.com" ||
    hostname === "axisbank.com" ||
    hostname === "kotak.com"
  ) {
    return "official_provider";
  }

  // 4. Structured Finance API
  if (hostname.startsWith("api.") && (hostname.includes("finance") || hostname.includes("market"))) {
    return "structured_finance_api";
  }

  // 5. Reputable Publication
  if (
    hostname === "livemint.com" ||
    hostname.endsWith(".livemint.com") ||
    hostname === "economictimes.indiatimes.com" ||
    hostname === "moneycontrol.com" ||
    hostname.endsWith(".moneycontrol.com") ||
    hostname === "thehindubusinessline.com" ||
    hostname.endsWith(".thehindubusinessline.com") ||
    hostname === "financialexpress.com" ||
    hostname.endsWith(".financialexpress.com") ||
    hostname === "business-standard.com" ||
    hostname.endsWith(".business-standard.com") ||
    hostname === "reuters.com" ||
    hostname.endsWith(".reuters.com") ||
    hostname === "bloomberg.com" ||
    hostname.endsWith(".bloomberg.com") ||
    hostname === "ft.com" ||
    hostname.endsWith(".ft.com") ||
    hostname === "wsj.com" ||
    hostname.endsWith(".wsj.com") ||
    hostname === "cnbc.com" ||
    hostname.endsWith(".cnbc.com")
  ) {
    return "reputable_publication";
  }

  // 6. Community / other
  return "community";
}

export function extractPublisher(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return host;
  } catch {
    return "Unknown";
  }
}

export const SOURCE_TYPE_RANK: Record<SourceType, number> = {
  government_regulator: 1,
  exchange_official_filing: 2,
  official_provider: 3,
  structured_finance_api: 4,
  reputable_publication: 5,
  community: 6,
};

export function getSourceTypeRank(type: string): number {
  return SOURCE_TYPE_RANK[type as SourceType] ?? 99;
}

export function compareEvidenceRank(
  a: { sourceType: string; confidence: string; createdAt: Date },
  b: { sourceType: string; confidence: string; createdAt: Date },
): number {
  const rankDiff = getSourceTypeRank(a.sourceType) - getSourceTypeRank(b.sourceType);
  if (rankDiff !== 0) return rankDiff;

  const confDiff = Number(b.confidence) - Number(a.confidence);
  if (confDiff !== 0) return confDiff;

  return a.createdAt.getTime() - b.createdAt.getTime();
}
