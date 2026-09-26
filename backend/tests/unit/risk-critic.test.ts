import { describe, expect, it } from "vitest";
import {
  enforceRiskPolicy,
  validateRiskPolicy,
} from "../../src/modules/planner/safety/risk-validator";

describe("Risk Policy Validator Unit Tests", () => {
  it("approves planning guidance cleanly, delegating safety guidelines to the system prompt", () => {
    expect(validateRiskPolicy("You should focus on broad-market index funds.").approved).toBe(true);
    expect(validateRiskPolicy("In the short term, you should prioritize building a 6-month buffer.").approved).toBe(true);
    expect(validateRiskPolicy("For your long term goals like retirement, invest in index funds.").approved).toBe(true);
    expect(validateRiskPolicy("Consider buying term insurance and health insurance for your family.").approved).toBe(true);
  });

  it("enforceRiskPolicy runs without throwing as safety is prompt-guided", () => {
    expect(() => enforceRiskPolicy("Educational financial advice")).not.toThrow();
  });
});
