import { createHash } from "node:crypto";
import https from "node:https";
import { isIP } from "node:net";
import { Readable } from "node:stream";
import { AppError } from "../../shared/errors/app-error";
import { defaultDnsLookup, type DnsLookupFn } from "./dns-resolver";

export interface SafeFetchOptions {
  maxRedirects?: number;
  timeoutMs?: number;
  maxBytes?: number;
  dnsLookup?: DnsLookupFn;
  fetchTransport?: SafeFetchTransport;
}

export type SafeFetchTransport = (
  url: string,
  init: RequestInit | undefined,
  approvedAddresses: readonly string[],
) => Promise<Response>;

export interface SafeFetchResult {
  canonicalUrl: string;
  finalUrl: string;
  contentType: string;
  content: string;
  excerpt: string;
  contentHash: string;
  title?: string;
}

const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_MAX_BYTES = 512 * 1024; // 512 KB
const DEFAULT_MAX_EXCERPT_LENGTH = 1000;

async function pinnedHttpsFetch(
  url: string,
  init: RequestInit | undefined,
  approvedAddresses: readonly string[],
): Promise<Response> {
  const address = approvedAddresses[0];
  const family = isIP(address);
  if (!address || (family !== 4 && family !== 6)) {
    throw new AppError(400, "UNSAFE_SOURCE_URL", "No validated public address is available");
  }
  return await new Promise<Response>((resolve, reject) => {
    const request = https.request(new URL(url), {
      method: init?.method ?? "GET",
      headers: init?.headers as Record<string, string> | undefined,
      signal: init?.signal ?? undefined,
      lookup: (_hostname, _options, callback) => callback(null, address, family),
    }, (incoming) => {
      const headers = new Headers();
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
        else if (value !== undefined) headers.set(name, value);
      }
      resolve(new Response(Readable.toWeb(incoming) as ReadableStream, {
        status: incoming.statusCode ?? 502,
        statusText: incoming.statusMessage,
        headers,
      }));
    });
    request.on("error", reject);
    request.end();
  });
}

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "gclsrc",
  "dclid",
  "ref",
  "source",
  "campaign",
  "trk",
  "msclkid",
  "mc_cid",
  "mc_eid",
]);

export function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Not a valid IPv4
  }

  const [a, b, c] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private network)
  if (a === 10) return true;

  // 100.64.0.0/10 (Shared address space / Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-local)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private network)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 (IETF protocol assignments)
  if (a === 192 && b === 0 && c === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true;

  // 192.88.99.0/24 (6to4 relay)
  if (a === 192 && b === 88 && c === 99) return true;

  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future use)
  if (a >= 240) return true;

  return false;
}

export function isPrivateIpv6(ip: string): boolean {
  const cleanIp = ip.toLowerCase().trim();

  // Loopback / Unspecified
  if (cleanIp === "::1" || cleanIp === "::" || cleanIp === "0:0:0:0:0:0:0:1" || cleanIp === "0:0:0:0:0:0:0:0") {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:192.0.2.1 or ::ffff:c000:0201)
  if (cleanIp.startsWith("::ffff:") || cleanIp.startsWith("0:0:0:0:0:ffff:")) {
    const v4Part = cleanIp.split(":").pop();
    if (v4Part && v4Part.includes(".")) {
      return isPrivateIpv4(v4Part);
    }
    return true;
  }

  // Unique local address fc00::/7 (fc00... or fd00...)
  if (cleanIp.startsWith("fc") || cleanIp.startsWith("fd")) {
    return true;
  }

  // Link-local unicast fe80::/10 (fe8..., fe9..., fea..., feb...)
  if (/^fe[89ab]/i.test(cleanIp)) {
    return true;
  }

  // Multicast ff00::/8
  if (cleanIp.startsWith("ff")) {
    return true;
  }

  // Documentation 2001:db8::/32
  if (cleanIp.startsWith("2001:db8:") || cleanIp.startsWith("2001:0db8:")) {
    return true;
  }

  return false;
}

export function isIpAddress(host: string): boolean {
  const clean = host.replace(/^\[|\]$/g, "");
  // IPv4 regex (numbers or hex/octal representations)
  if (/^\d+(\.\d+)*$/.test(clean)) return true;
  if (/^0x[0-9a-fA-F]+/i.test(clean)) return true;
  // IPv6
  if (clean.includes(":")) return true;
  return false;
}

export function isLocalHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().trim();
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h.endsWith(".lan") ||
    h.endsWith(".intranet") ||
    h.endsWith(".corp") ||
    h.endsWith(".home") ||
    h.endsWith(".onion") ||
    h.endsWith(".arpa") ||
    h === "metadata.google.internal"
  ) {
    return true;
  }
  return false;
}

export function canonicalizeUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    parsed.protocol = "https:";
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.hash = "";

    // Remove default port
    if (parsed.port === "443") {
      parsed.port = "";
    }

    // Filter tracking params and sort
    const searchParams = new URLSearchParams();
    const sortedKeys = Array.from(parsed.searchParams.keys()).sort();
    for (const key of sortedKeys) {
      if (!TRACKING_PARAMS.has(key.toLowerCase())) {
        const values = parsed.searchParams.getAll(key);
        for (const val of values) {
          searchParams.append(key, val);
        }
      }
    }
    parsed.search = searchParams.toString();

    // Clean duplicate slashes in pathname
    parsed.pathname = parsed.pathname.replace(/\/+/g, "/");

    return parsed.toString();
  } catch {
    throw new AppError(400, "UNSAFE_SOURCE_URL", "Invalid URL format");
  }
}

export async function validateSafeUrl(urlStr: string, dnsLookup: DnsLookupFn = defaultDnsLookup): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new AppError(400, "UNSAFE_SOURCE_URL", "Malformed URL");
  }

  // HTTPS only
  if (parsed.protocol !== "https:") {
    throw new AppError(400, "UNSAFE_SOURCE_URL", "Only HTTPS URLs are permitted");
  }

  // No credentials in URL
  if (parsed.username || parsed.password) {
    throw new AppError(400, "UNSAFE_SOURCE_URL", "Credentials in URL are strictly prohibited");
  }

  // Default port only
  if (parsed.port && parsed.port !== "443") {
    throw new AppError(400, "UNSAFE_SOURCE_URL", "Non-default ports are strictly prohibited");
  }

  const hostname = parsed.hostname;

  // Reject IP literals
  if (isIpAddress(hostname)) {
    throw new AppError(400, "UNSAFE_SOURCE_URL", "IP literals are strictly prohibited");
  }

  // Reject local hostnames
  if (isLocalHostname(hostname)) {
    throw new AppError(400, "UNSAFE_SOURCE_URL", "Local or internal hostnames are prohibited");
  }

  // DNS resolution & IP check
  const ips = await dnsLookup(hostname);
  if (!ips || ips.length === 0) {
    throw new AppError(400, "UNSAFE_SOURCE_URL", "DNS resolution failed or returned no public addresses");
  }

  for (const ip of ips) {
    if (ip.includes(":") ? isPrivateIpv6(ip) : isPrivateIpv4(ip)) {
      throw new AppError(400, "UNSAFE_SOURCE_URL", `Host resolves to non-public or reserved IP: ${ip}`);
    }
  }

  return parsed;
}

export function stripHtmlToText(html: string): { title?: string; text: string } {
  // Extract title if present
  let title: string | undefined;
  const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  }

  let cleaned = html
    .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, " ")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-");

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return { title, text: cleaned };
}

export async function safeFetchDocument(
  targetUrl: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const dnsLookup = options.dnsLookup ?? defaultDnsLookup;
  const fetchTransport = options.fetchTransport ?? pinnedHttpsFetch;

  let currentUrlStr = targetUrl;
  const visitedUrls = new Set<string>();

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    if (visitedUrls.has(currentUrlStr)) {
      throw new AppError(400, "UNSAFE_SOURCE_URL", "Redirect loop detected");
    }
    visitedUrls.add(currentUrlStr);

    const validatedUrl = await validateSafeUrl(currentUrlStr, dnsLookup);
    const firstResolution = (await dnsLookup(validatedUrl.hostname)).slice().sort();
    for (const ip of firstResolution) {
      if (ip.includes(":") ? isPrivateIpv6(ip) : isPrivateIpv4(ip)) {
        throw new AppError(400, "UNSAFE_SOURCE_URL", "Host resolution changed to a non-public address");
      }
    }
    const secondResolution = (await dnsLookup(validatedUrl.hostname)).slice().sort();
    if (firstResolution.join(",") !== secondResolution.join(",")) {
      throw new AppError(400, "UNSAFE_SOURCE_URL", "DNS answers changed during source validation");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetchTransport(validatedUrl.toString(), {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,text/plain,application/json;q=0.9",
        },
        redirect: "manual",
        signal: controller.signal,
      }, secondResolution);
    } catch (err: any) {
      if (err.name === "AbortError" || controller.signal.aborted) {
        throw new AppError(504, "RESEARCH_TIMEOUT", "Safe document fetch timed out");
      }
      throw new AppError(502, "RESEARCH_FETCH_FAILED", "Document fetch failed");
    } finally {
      clearTimeout(timer);
    }

    // Handle redirects
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (redirectCount >= maxRedirects) {
        throw new AppError(400, "UNSAFE_SOURCE_URL", "Excessive redirects exceeded limit");
      }
      const location = response.headers.get("location");
      if (!location) {
        throw new AppError(502, "RESEARCH_FETCH_FAILED", "Redirect response missing Location header");
      }

      // Resolve relative redirect
      try {
        const nextUrl = new URL(location, currentUrlStr);
        if (nextUrl.protocol !== "https:") {
          throw new AppError(400, "UNSAFE_SOURCE_URL", "Cross-scheme redirect to non-HTTPS is prohibited");
        }
        currentUrlStr = nextUrl.toString();
        continue;
      } catch {
        throw new AppError(400, "UNSAFE_SOURCE_URL", "Malformed redirect Location header");
      }
    }

    if (!response.ok) {
      throw new AppError(502, "RESEARCH_FETCH_FAILED", `Remote server returned HTTP ${response.status}`);
    }

    // Validate Content-Type
    const contentType = response.headers.get("content-type") || "text/plain";
    const lowerType = contentType.toLowerCase();
    const isSupported =
      lowerType.includes("text/html") ||
      lowerType.includes("text/plain") ||
      lowerType.includes("application/json") ||
      lowerType.includes("application/xhtml+xml");

    if (!isSupported) {
      throw new AppError(400, "UNSUPPORTED_CONTENT_TYPE", `Unsupported content type: ${contentType}`);
    }

    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      throw new AppError(400, "DOCUMENT_TOO_LARGE", `Document exceeded maximum size limit of ${maxBytes} bytes`);
    }

    // Enforce the cap while streaming so a hostile response cannot be fully buffered first.
    const chunks: Uint8Array[] = [];
    let bytesRead = 0;
    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bytesRead += value.byteLength;
          if (bytesRead > maxBytes) {
            await reader.cancel();
            throw new AppError(400, "DOCUMENT_TOO_LARGE", `Document exceeded maximum size limit of ${maxBytes} bytes`);
          }
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
    }

    const rawBody = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), bytesRead).toString("utf-8");
    const { title, text } = stripHtmlToText(rawBody);

    const canonicalUrl = canonicalizeUrl(validatedUrl.toString());
    const contentHash = createHash("sha256").update(rawBody).digest("hex");
    const excerpt = text.slice(0, DEFAULT_MAX_EXCERPT_LENGTH).trim();

    return {
      canonicalUrl,
      finalUrl: validatedUrl.toString(),
      contentType,
      content: text,
      excerpt,
      contentHash,
      title,
    };
  }

  throw new AppError(400, "UNSAFE_SOURCE_URL", "Failed to fetch document after redirects");
}
