import Decimal from "decimal.js";
import { z } from "zod";
import { AppError } from "../errors/app-error";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

const moneyPattern = /^-?\d+(?:\.\d{1,2})?$/;

export class DecimalAmount {
  private constructor(private readonly value: Decimal) {}

  static from(value: string) {
    if (!moneyPattern.test(value)) throw new AppError(400, "INVALID_DECIMAL", "Amount must have at most two decimal places");
    return new DecimalAmount(new Decimal(value));
  }

  add(value: string | DecimalAmount) {
    const next = value instanceof DecimalAmount ? value.value : DecimalAmount.from(value).value;
    return new DecimalAmount(this.value.add(next));
  }

  toString() { return this.value.toFixed(2); }
}

const cursorSchema = z.object({ id: z.string().uuid(), createdAt: z.string().datetime() });
export type Cursor = z.infer<typeof cursorSchema>;

export function serializeCursor(cursor: Cursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function parseCursor(value: string) {
  try { return cursorSchema.parse(JSON.parse(Buffer.from(value, "base64url").toString("utf8"))); }
  catch { throw new AppError(400, "INVALID_CURSOR", "Invalid pagination cursor"); }
}

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export function requireRevision(value: string | undefined) {
  const match = value?.match(/^(?:W\/)?\"(\d+)\"$/);
  if (!match) throw new AppError(428, "REVISION_REQUIRED", "A valid If-Match revision is required");
  return Number(match[1]);
}

export function revisionEtag(revision: number) { return `\"${revision}\"`; }

export const idempotencyKeySchema = z.string().trim().min(8).max(128).regex(/^[A-Za-z0-9._:-]+$/);
