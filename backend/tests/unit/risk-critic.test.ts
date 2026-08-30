import { describe, expect, it } from "vitest";
import {
  enforceRiskPolicy,
  validateRiskPolicy,
} from "../../src/modules/planner/safety/risk-validator";

describe("Risk Policy Validator Unit Tests", () => {
  it("rejects individual stock and equity buy/sell recommendations", () => {
    expect(validateRiskPolicy("You should buy shares of Reliance for good returns.").approved).toBe(false);
    expect(validateRiskPolicy("I recommend you sell stock of Tata Motors immediately.").approved).toBe(false);
    expect(validateRiskPolicy("Buy Infosys with a target price of ₹2000.").approved).toBe(false);
    expect(validateRiskPolicy("Short Tesla stock now.").approved).toBe(false);
  });

  it("rejects promises of guaranteed investment returns", () => {
    expect(validateRiskPolicy("This strategy gives guaranteed returns of 18% per year.").approved).toBe(false);
    expect(validateRiskPolicy("Enjoy risk-free profit with this allocation.").approved).toBe(false);
    expect(validateRiskPolicy("Assured gains of 15% guaranteed.").approved).toBe(false);
  });

  it("rejects autonomous execution promises", () => {
    expect(validateRiskPolicy("I have executed the trade in your brokerage account.").approved).toBe(false);
    expect(validateRiskPolicy("I will file your taxes directly with the IT department.").approved).toBe(false);
    expect(validateRiskPolicy("I have updated your plan baseline.").approved).toBe(false);
  });

  it("approves prudent, educational financial planning guidance", () => {
    const cleanAdvice = `
      Based on your monthly cash flow, you have ₹30,000 in surplus savings.
      A prudent approach is to first build a 6-month emergency fund in liquid savings accounts or fixed deposits.
      Once your emergency fund is established, consider allocating surplus towards diversified broad-market index mutual funds or PPF for long-term goals.
    `;
    const result = validateRiskPolicy(cleanAdvice);
    expect(result.approved).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("enforceRiskPolicy throws 422 RISK_POLICY_VIOLATION when advice contains prohibited recommendations", () => {
    try {
      enforceRiskPolicy("You must buy stock of TCS for guaranteed returns!");
      expect.unreachable("Should have thrown error");
    } catch (err: any) {
      expect(err.code).toBe("RISK_POLICY_VIOLATION");
      expect(err.statusCode).toBe(422);
    }
  });
});
