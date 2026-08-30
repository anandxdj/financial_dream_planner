import crypto from "node:crypto";

/**
 * Recursively serializes any JSON-compatible value to a canonical string.
 * Object keys are sorted lexicographically; array item order is preserved.
 */
export function canonicalJsonStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }
  if (Array.isArray(value)) {
    return "[" + value.map((item) => canonicalJsonStringify(item ?? null)).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const pairs: string[] = [];
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined) {
      pairs.push(`${JSON.stringify(key)}:${canonicalJsonStringify(val)}`);
    }
  }
  return "{" + pairs.join(",") + "}";
}

/**
 * Computes a canonical SHA-256 hex digest for any JSON-compatible structure.
 */
export function computeCanonicalHash(value: unknown): string {
  const canonical = canonicalJsonStringify(value);
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}
