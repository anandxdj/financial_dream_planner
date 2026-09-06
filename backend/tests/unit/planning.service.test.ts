import { describe, expect, it } from "vitest";
import { affordability } from "../../src/modules/planning/planning.service";
import {
  affordabilitySchema,
  goalSchema,
  planningMetadataSchema,
} from "../../src/modules/planning/model";

describe("Release 1 affordability", () => {
  it("uses Decimal arithmetic and returns decimal-string boundaries", () => {
    const result = affordability({ purchaseAmount: "25", income: "100.10", expenses: "90.05", liquidSavings: "0", bufferMonths: 3 });
    expect(result.verdict).toBe("risky");
    expect(result.monthlySurplus).toBe("10.05");
    expect(result.bufferImpact).toBe("-295.15");
    expect(result.timeToAffordMonths).toBe(3);
    expect(result.comparison.buyNow).toBe("-25.00");
  });

  it("explains an unaffordable buffer without floating point drift", () => {
    const result = affordability({ purchaseAmount: "1", income: "0.30", expenses: "0.20", bufferMonths: 3 });
    expect(result.verdict).toBe("risky");
    expect(result.explanation).toContain("compromise");
  });

  it("returns safe when buyNow is greater than or equal to required reserve", () => {
    const result = affordability({
      purchaseAmount: "100.00",
      income: "100.00",
      expenses: "50.00",
      liquidSavings: "500.00",
      bufferMonths: 3,
    });
    expect(result.verdict).toBe("safe");
    expect(result.monthlySurplus).toBe("50.00");
    expect(result.bufferImpact).toBe("250.00");
    expect(result.timeToAffordMonths).toBe(0);
    expect(result.comparison.buyNow).toBe("400.00");
    expect(result.comparison.waitThreeMonths).toBe("550.00");
    expect(result.explanation).toContain("preserve the buffer");
  });

  it("returns tight when waitThreeMonths preserves reserve but buyNow does not", () => {
    const result = affordability({
      purchaseAmount: "100.00",
      income: "200.00",
      expenses: "100.00",
      liquidSavings: "300.00",
      bufferMonths: 3,
    });
    expect(result.verdict).toBe("tight");
    expect(result.monthlySurplus).toBe("100.00");
    expect(result.bufferImpact).toBe("-100.00");
    expect(result.timeToAffordMonths).toBe(0);
    expect(result.comparison.buyNow).toBe("200.00");
    expect(result.comparison.waitThreeMonths).toBe("500.00");
    expect(result.explanation).toContain("Waiting three months");
  });

  it("returns insufficient_data with null surplus/buffer when negative inputs are passed", () => {
    const result = affordability({
      purchaseAmount: "-50.00",
      income: "100.00",
      expenses: "50.00",
      bufferMonths: 3,
    });
    expect(result.verdict).toBe("insufficient_data");
    expect(result.monthlySurplus).toBeNull();
    expect(result.bufferImpact).toBeNull();
    expect(result.timeToAffordMonths).toBeNull();
    expect(result.explanation).toBe("Financial amounts must be non-negative.");
  });

  it("returns insufficient_data and null timeToAfford when surplus is zero or negative and purchase is unaffordable", () => {
    const result = affordability({
      purchaseAmount: "50.00",
      income: "100.00",
      expenses: "150.00",
      liquidSavings: "0.00",
      bufferMonths: 3,
    });
    expect(result.verdict).toBe("insufficient_data");
    expect(result.monthlySurplus).toBe("-50.00");
    expect(result.timeToAffordMonths).toBeNull();
    expect(result.explanation).toBe("No positive surplus is available.");
  });
});

describe("Release 1 planning schemas and strict envelopes", () => {
  it("rejects unknown properties in affordabilitySchema", () => {
    expect(() =>
      affordabilitySchema.parse({
        purchaseAmount: "100.00",
        income: "5000.00",
        expenses: "2000.00",
        extraField: "unexpected",
      }),
    ).toThrow();
  });

  it("rejects invalid money format in affordabilitySchema", () => {
    expect(() =>
      affordabilitySchema.parse({
        purchaseAmount: "abc",
        income: "5000.00",
        expenses: "2000.00",
      }),
    ).toThrow();
  });

  it("validates and enforces strict bounds on goalSchema", () => {
    const validGoal = {
      name: "Emergency Fund",
      category: "savings" as const,
      targetAmount: "100000.00",
      currentSavings: "10000.00",
      monthlyContribution: "5000.00",
      targetDate: "2027-12-31",
    };
    expect(goalSchema.parse(validGoal)).toEqual(validGoal);

    expect(() => goalSchema.parse({ ...validGoal, unexpected: true })).toThrow();
    expect(() => goalSchema.parse({ ...validGoal, targetDate: "2025-02-30" })).toThrow();
    expect(() => goalSchema.parse({ ...validGoal, category: "crypto" })).toThrow();
  });

  it("validates planningMetadataSchema structure and estimate path regexes", () => {
    const validMeta = {
      inputs: {
        cashFlow: {
          income: "80000.00",
          essentialExpenses: "30000.00",
        },
      },
      completedStep: 2,
      estimates: ["cashFlow.income", "cashFlow.essentialExpenses"],
    };
    expect(planningMetadataSchema.parse(validMeta)).toEqual(validMeta);

    expect(() =>
      planningMetadataSchema.parse({
        ...validMeta,
        estimates: ["invalid-identifier!"],
      }),
    ).toThrow();

    expect(() =>
      planningMetadataSchema.parse({
        ...validMeta,
        completedStep: 4,
      }),
    ).toThrow();

    expect(() =>
      planningMetadataSchema.parse({
        ...validMeta,
        unrecognized: "invalid",
      }),
    ).toThrow();
  });
});
