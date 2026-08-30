import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { DecimalAmount } from "../../src/shared/api/primitives";

describe("cash-flow exact decimal rules", () => {
  it("calculates exact net cash flow without binary floating-point drift", () => {
    // 0.1 + 0.2 in JS float is 0.30000000000000004
    const credits = [new Decimal("0.10"), new Decimal("0.20")];
    const debits = [new Decimal("0.30")];

    const totalIncome = credits.reduce((acc, c) => acc.add(c), new Decimal(0));
    const totalExpenses = debits.reduce((acc, d) => acc.add(d), new Decimal(0));
    const net = totalIncome.minus(totalExpenses);

    expect(totalIncome.toFixed(2)).toBe("0.30");
    expect(totalExpenses.toFixed(2)).toBe("0.30");
    expect(net.toFixed(2)).toBe("0.00");
  });

  it("distinguishes between explicit no-data null and observed zero", () => {
    function computeSnapshot(txs: Array<{ amount: string; direction: "DEBIT" | "CREDIT" }>) {
      if (txs.length === 0) {
        return {
          totalIncome: null,
          totalExpenses: null,
          netCashFlow: null,
          transactionCount: 0,
          hasData: false,
        };
      }
      let income = new Decimal(0);
      let expenses = new Decimal(0);
      for (const t of txs) {
        const d = new Decimal(t.amount);
        if (t.direction === "CREDIT") income = income.add(d);
        if (t.direction === "DEBIT") expenses = expenses.add(d);
      }
      return {
        totalIncome: income.toFixed(2),
        totalExpenses: expenses.toFixed(2),
        netCashFlow: income.minus(expenses).toFixed(2),
        transactionCount: txs.length,
        hasData: true,
      };
    }

    const noData = computeSnapshot([]);
    expect(noData.hasData).toBe(false);
    expect(noData.netCashFlow).toBeNull();
    expect(noData.totalIncome).toBeNull();

    const netZero = computeSnapshot([
      { amount: "100.00", direction: "CREDIT" },
      { amount: "100.00", direction: "DEBIT" },
    ]);
    expect(netZero.hasData).toBe(true);
    expect(netZero.netCashFlow).toBe("0.00");
    expect(netZero.totalIncome).toBe("100.00");
    expect(netZero.totalExpenses).toBe("100.00");
  });

  it("validates positive decimal string amounts via DecimalAmount", () => {
    expect(DecimalAmount.from("123.45").toString()).toBe("123.45");
    expect(DecimalAmount.from("100").toString()).toBe("100.00");
    expect(() => DecimalAmount.from("invalid")).toThrow();
    expect(() => DecimalAmount.from("12.345")).toThrow();
  });
});
