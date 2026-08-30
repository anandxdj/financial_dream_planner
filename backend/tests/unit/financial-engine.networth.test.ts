import { describe, expect, it } from "vitest";
import { calculateNetWorth } from "../../src/modules/financial-engine/net-worth";

describe("financial engine net worth", () => {
  it("calculates total assets, total liabilities, net worth, and ordered allocations", () => {
    const result = calculateNetWorth({
      assets: [
        { name: "HDFC Savings", category: "Cash", value: "200000.00" },
        { name: "Nifty 50 Index", category: "Equity", value: "500000.00" },
        { name: "Mid Cap Mutual Fund", category: "Equity", value: "300000.00" },
        { name: "Gold ETF", category: "Gold", value: "100000.00" },
        { name: "EPF", category: "Retirement", value: "400000.00" },
      ],
      liabilities: [
        { name: "Home Loan", category: "Mortgage", value: "1200000.00" },
        { name: "Credit Card", category: "Revolving", value: "50000.00" },
      ],
    });

    expect(result.completeness.status).toBe("complete");
    // Total assets = 200k + 500k + 300k + 100k + 400k = 1,500,000.00
    expect(result.totalAssets).toBe("1500000.00");
    // Total liabilities = 1,200,000 + 50,000 = 1,250,000.00
    expect(result.totalLiabilities).toBe("1250000.00");
    // Net worth = 1,500,000 - 1,250,000 = 250,000.00
    expect(result.netWorth).toBe("250000.00");

    // Allocation percentages in order of appearance:
    // Cash: 200,000 / 1,500,000 = 13.3333%
    // Equity: 800,000 / 1,500,000 = 53.3333%
    // Gold: 100,000 / 1,500,000 = 6.6667%
    // Retirement: 400,000 / 1,500,000 = 26.6667%
    expect(result.assetAllocations).toEqual([
      { category: "Cash", totalValue: "200000.00", percentage: "13.3333" },
      { category: "Equity", totalValue: "800000.00", percentage: "53.3333" },
      { category: "Gold", totalValue: "100000.00", percentage: "6.6667" },
      { category: "Retirement", totalValue: "400000.00", percentage: "26.6667" },
    ]);

    expect(result.liabilityBreakdown).toEqual([
      { category: "Mortgage", totalValue: "1200000.00", percentage: "96.0000" },
      { category: "Revolving", totalValue: "50000.00", percentage: "4.0000" },
    ]);
  });

  it("handles zero assets gracefully without division by zero", () => {
    const result = calculateNetWorth({
      assets: [],
      liabilities: [{ name: "Loan", category: "Personal", value: "50000.00" }],
    });

    expect(result.totalAssets).toBe("0.00");
    expect(result.totalLiabilities).toBe("50000.00");
    expect(result.netWorth).toBe("-50000.00");
    expect(result.assetAllocations).toEqual([]);
  });

  it("handles missing inputs properly", () => {
    const incomplete = calculateNetWorth({});
    expect(incomplete.completeness.status).toBe("incomplete");
    expect(incomplete.completeness.missing).toEqual(["assets", "liabilities"]);
    expect(incomplete.totalAssets).toBeNull();
    expect(incomplete.netWorth).toBeNull();
  });
});
