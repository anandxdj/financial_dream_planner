import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Money, formatMoney } from "./money";

describe("Money component and formatMoney helper", () => {
  it("enforces Unknown is Not Zero principle (never displays ₹0 for missing values)", () => {
    expect(formatMoney(null)).toBe("Not provided");
    expect(formatMoney(undefined)).toBe("Not provided");
    expect(formatMoney("")).toBe("Not provided");
    expect(formatMoney("NaN")).toBe("Unknown");

    const { rerender } = render(<Money value={null} />);
    expect(screen.getByText("Not provided")).toBeInTheDocument();
    expect(screen.queryByText("₹0")).not.toBeInTheDocument();

    rerender(<Money value={undefined} fallback="Unknown balance" />);
    expect(screen.getByText("Unknown balance")).toBeInTheDocument();
  });

  it("formats Indian currency with proper grouping and tabular-nums", () => {
    expect(formatMoney("50000")).toContain("50,000");
    expect(formatMoney("2800000")).toContain("28,00,000");

    render(<Money value="120000" />);
    const el = screen.getByText(/1,20,000/);
    expect(el).toHaveClass("tabular-nums");
  });

  it("supports compact formatting for large numbers in Indian units", () => {
    expect(formatMoney("1250000", { compact: true })).toBe("₹12.5 L");
    expect(formatMoney("18000000", { compact: true })).toBe("₹1.8 Cr");
    expect(formatMoney("45000", { compact: true })).toBe("₹45k");
  });
});
