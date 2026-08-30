import { describe, expect, it } from "vitest";
import {
  DEFAULT_POLICY_VERSION,
  getPublishedPolicy,
  PUBLISHED_POLICIES,
  resolveAssumptions,
} from "../../src/modules/financial-engine/policy";
import { AppError } from "../../src/shared/errors/app-error";

describe("financial engine policy", () => {
  it("provides immutable published policy IN-2026.1", () => {
    const policy = getPublishedPolicy("IN-2026.1");
    expect(policy.version).toBe("IN-2026.1");
    expect(policy.generalInflation).toBe("6.0000");
    expect(policy.educationInflation).toBe("8.0000");
    expect(policy.medicalInflation).toBe("8.0000");
    expect(policy.returns.conservative).toBe("6.0000");
    expect(policy.returns.expected).toBe("9.0000");
    expect(policy.returns.optimistic).toBe("12.0000");
    expect(policy.defaultAnnualStepUp).toBe("0.0000");
    expect(policy.emergencyReserveMonths).toEqual({
      stable: 6,
      variable: 9,
      irregular: 12,
    });
  });

  it("is frozen and cannot be mutated", () => {
    const policy = PUBLISHED_POLICIES["IN-2026.1"];
    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(PUBLISHED_POLICIES)).toBe(true);
    expect(Object.isFrozen(policy.returns)).toBe(true);
    expect(Object.isFrozen(policy.emergencyReserveMonths)).toBe(true);
  });

  it("rejects unknown policy versions", () => {
    expect(() => getPublishedPolicy("UNKNOWN-2099")).toThrowError(AppError);
    expect(() => resolveAssumptions("IN-2027.1")).toThrowError(AppError);
  });

  it("resolves default assumptions when no overrides provided", () => {
    const resolved = resolveAssumptions();
    expect(resolved.policyVersion).toBe(DEFAULT_POLICY_VERSION);
    expect(resolved.generalInflation).toBe("6.0000");
    expect(resolved.educationInflation).toBe("8.0000");
    expect(resolved.medicalInflation).toBe("8.0000");
    expect(resolved.returns.expected).toBe("9.0000");
    expect(resolved.annualStepUp).toBe("0.0000");
    expect(resolved.emergencyReserveMonths.stable).toBe(6);
  });

  it("applies caller explicit overrides correctly", () => {
    const resolved = resolveAssumptions("IN-2026.1", {
      generalInflation: "7.5",
      expectedReturn: "11.25",
      annualStepUp: "5.0",
      emergencyReserveMonths: { stable: 8 },
    });

    expect(resolved.generalInflation).toBe("7.5000");
    expect(resolved.returns.expected).toBe("11.2500");
    expect(resolved.annualStepUp).toBe("5.0000");
    expect(resolved.emergencyReserveMonths.stable).toBe(8);
    expect(resolved.emergencyReserveMonths.variable).toBe(9); // Unmodified remains policy default
  });
});
