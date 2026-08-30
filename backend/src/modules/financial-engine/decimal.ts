import Decimal from "decimal.js";
import { AppError } from "../../shared/errors/app-error";

// Configure Decimal with precision 40 and ROUND_HALF_UP as mandated by the numeric contract
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

const decimalPattern = /^-?\d+(?:\.\d+)?$/;

export function isValidDecimalString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!decimalPattern.test(trimmed)) return false;
  try {
    const d = new Decimal(trimmed);
    return d.isFinite();
  } catch {
    return false;
  }
}

export function parseDecimal(value: string | undefined | null, fieldName = "value"): Decimal {
  if (value === undefined || value === null) {
    throw new AppError(400, "INVALID_DECIMAL", `Missing required decimal value for ${fieldName}`);
  }
  if (typeof value !== "string") {
    throw new AppError(400, "INVALID_DECIMAL", `Field ${fieldName} must be a string, received ${typeof value}`);
  }
  const trimmed = value.trim();
  if (!decimalPattern.test(trimmed)) {
    throw new AppError(400, "INVALID_DECIMAL", `Field ${fieldName} must be a valid base-10 decimal string: "${value}"`);
  }
  try {
    const d = new Decimal(trimmed);
    if (!d.isFinite()) {
      throw new AppError(400, "INVALID_DECIMAL", `Field ${fieldName} must be a finite decimal: "${value}"`);
    }
    return d;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(400, "INVALID_DECIMAL", `Invalid decimal for ${fieldName}: "${value}"`);
  }
}

export function parseNonNegativeDecimal(value: string | undefined | null, fieldName = "value"): Decimal {
  const d = parseDecimal(value, fieldName);
  if (d.isNegative()) {
    throw new AppError(400, "INVALID_DECIMAL", `Field ${fieldName} must be non-negative, received ${value}`);
  }
  return d;
}

export function parsePositiveDecimal(value: string | undefined | null, fieldName = "value"): Decimal {
  const d = parseDecimal(value, fieldName);
  if (d.isNegative() || d.isZero()) {
    throw new AppError(400, "INVALID_DECIMAL", `Field ${fieldName} must be strictly positive, received ${value}`);
  }
  return d;
}

/**
 * Format money outputs to 2 decimal places with half-up rounding.
 * Only called at public output boundaries.
 */
export function formatMoney(value: Decimal | string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const d = value instanceof Decimal ? value : new Decimal(String(value));
  return d.toFixed(2);
}

/**
 * Format rates, percentages, and ratios to 4 decimal places with half-up rounding.
 * Only called at public output boundaries.
 */
export function formatRate(value: Decimal | string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const d = value instanceof Decimal ? value : new Decimal(String(value));
  return d.toFixed(4);
}
