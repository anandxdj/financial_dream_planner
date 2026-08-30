import { describe, expect, it } from "vitest";
import { calculateLoan } from "../../src/modules/financial-engine/loan";

describe("financial engine loan & amortization", () => {
  it("calculates exact zero-rate loan and clear schedule without division by zero", () => {
    const result = calculateLoan({
      principal: "120000.00",
      annualRate: "0.0000",
      tenureMonths: 12,
    });

    expect(result.completeness.status).toBe("complete");
    expect(result.monthlyEmi).toBe("10000.00");
    expect(result.totalPrincipal).toBe("120000.00");
    expect(result.totalInterest).toBe("0.00");
    expect(result.totalPayment).toBe("120000.00");
    expect(result.schedule).toHaveLength(12);
    expect(result.schedule[0].payment).toBe("10000.00");
    expect(result.schedule[0].interest).toBe("0.00");
    expect(result.schedule[0].remainingBalance).toBe("110000.00");
    expect(result.schedule[11].remainingBalance).toBe("0.00");
    expect(result.completeness.warnings).toContain("ZERO_RATE_APPLIED");
  });

  it("calculates standard interest-bearing EMI and clears final principal exactly", () => {
    // Principal: 5,000,000, Annual Rate: 8.5%, Tenure: 240 months (20 years)
    const result = calculateLoan({
      principal: "5000000.00",
      annualRate: "8.5000",
      tenureMonths: 240,
    });

    expect(result.completeness.status).toBe("complete");
    expect(result.monthlyEmi).toBe("43391.16");
    expect(result.totalPrincipal).toBe("5000000.00");
    expect(result.totalInterest).toBe("5413878.80");
    expect(result.totalPayment).toBe("10413878.80");
    expect(result.schedule).toHaveLength(240);
    // Verify first row: interest = 5,000,000 * 0.085 / 12 = 35416.67
    expect(result.schedule[0].interest).toBe("35416.67");
    expect(result.schedule[0].principal).toBe("7974.50");
    // Verify final row clears remaining balance to exactly 0.00
    expect(result.schedule[239].remainingBalance).toBe("0.00");
  });

  it("evaluates prepayment with tenure reduction and interest savings", () => {
    const result = calculateLoan({
      principal: "5000000.00",
      annualRate: "8.5000",
      tenureMonths: 240,
      prepayments: [
        { month: 12, amount: "500000.00" }, // 5 lakh prepayment at month 12
      ],
      prepaymentStrategy: "reduce_tenure",
    });

    expect(result.prepaymentComparison).not.toBeNull();
    const prepay = result.prepaymentComparison!;
    expect(prepay.originalTenureMonths).toBe(240);
    expect(prepay.revisedTenureMonths).toBeLessThan(240);
    expect(prepay.monthsSaved).toBeGreaterThan(30);
    expect(parseFloat(prepay.interestSaved)).toBeGreaterThan(1000000);
  });

  it("evaluates prepayment with EMI reduction", () => {
    const result = calculateLoan({
      principal: "5000000.00",
      annualRate: "8.5000",
      tenureMonths: 240,
      prepayments: [
        { month: 12, amount: "500000.00" },
      ],
      prepaymentStrategy: "reduce_emi",
    });

    expect(result.prepaymentComparison).not.toBeNull();
    const prepay = result.prepaymentComparison!;
    expect(parseFloat(prepay.revisedMonthlyEmi)).toBeLessThan(parseFloat(result.monthlyEmi!));
    expect(parseFloat(prepay.interestSaved)).toBeGreaterThan(0);
  });

  it("evaluates refinancing benefit with fees", () => {
    const result = calculateLoan({
      principal: "5000000.00",
      annualRate: "9.5000",
      tenureMonths: 240,
      refinancing: {
        newAnnualRate: "8.2500",
        newTenureMonths: 240,
        processingFee: "25000.00",
      },
    });

    expect(result.refinancingComparison).not.toBeNull();
    const ref = result.refinancingComparison!;
    expect(ref.isBeneficial).toBe(true);
    expect(parseFloat(ref.netSavings)).toBeGreaterThan(0);
    expect(parseFloat(ref.newMonthlyEmi)).toBeLessThan(parseFloat(result.monthlyEmi!));
  });

  it("handles missing inputs properly", () => {
    const incomplete = calculateLoan({
      principal: "1000000.00",
      // missing annualRate and tenureMonths
    });

    expect(incomplete.completeness.status).toBe("incomplete");
    expect(incomplete.completeness.missing).toEqual(["annualRate", "tenureMonths"]);
    expect(incomplete.monthlyEmi).toBeNull();
    expect(incomplete.schedule).toHaveLength(0);
  });
});
