import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReportDetail, Reports } from "./reports";

describe("reports demo", () => {
  afterEach(cleanup);

  it("labels report cards as sample previews bound to distinct immutable versions", () => {
    render(<Reports />);

    expect(screen.getByText("Demo preview")).toBeInTheDocument();
    expect(screen.getByText(/do not create files, contact a server, or change a saved plan/i)).toBeInTheDocument();

    const september = screen.getByRole("heading", { name: "September plan summary" }).closest("section");
    const quarterly = screen.getByRole("heading", { name: "Quarterly plan check-in" }).closest("section");
    expect(september).not.toBeNull();
    expect(quarterly).not.toBeNull();
    expect(within(september!).getByText("Plan version 3")).toBeInTheDocument();
    expect(within(september!).getByText(/sample-v3/)).toBeInTheDocument();
    expect(within(quarterly!).getByText("Plan version 2")).toBeInTheDocument();
    expect(within(quarterly!).getByText(/sample-v2/)).toBeInTheDocument();
  });

  it("keeps detail metrics tied to the selected version and never claims an export completed", () => {
    render(<ReportDetail id="quarterly-check-in-jun-2026" />);

    expect(screen.getByRole("heading", { name: /preview source: plan version 2/i })).toBeInTheDocument();
    expect(screen.getByText(/immutable sample sample-v2/i)).toBeInTheDocument();
    expect(screen.getByText("₹1,42,000")).toBeInTheDocument();
    expect(screen.queryByText("₹1,50,000")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try demo export/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/no file was created/i);
    expect(screen.getByRole("status")).toHaveTextContent(/plan version 2 \(sample-v2\)/i);
  });

  it("renders a safe not-found state for an unknown preview", () => {
    render(<ReportDetail id="missing" />);

    expect(screen.getByRole("heading", { name: "Report not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to reports" })).toHaveAttribute("href", "/dashboard/reports");
  });

  it("supports version filtering, clearing the demo list, and restoring sample reports", () => {
    render(<Reports />);

    const select = screen.getByLabelText(/plan version/i);
    expect(select).toBeInTheDocument();

    // Filter to version 2
    fireEvent.change(select, { target: { value: "2" } });
    expect(screen.getByRole("heading", { name: "Quarterly plan check-in" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "September plan summary" })).not.toBeInTheDocument();

    // Reset to all
    fireEvent.change(select, { target: { value: "all" } });
    expect(screen.getByRole("heading", { name: "September plan summary" })).toBeInTheDocument();

    // Clear list to test empty state
    fireEvent.click(screen.getByRole("button", { name: /clear demo list/i }));
    expect(screen.getByRole("heading", { name: /no report previews available/i })).toBeInTheDocument();

    // Restore sample reports
    fireEvent.click(screen.getByRole("button", { name: /restore sample reports/i }));
    expect(screen.getByRole("heading", { name: "September plan summary" })).toBeInTheDocument();
  });

  it("supports recoverable export error simulation without claiming a background job", () => {
    render(<ReportDetail id="monthly-plan-sep-2026" />);

    // Simulate export error
    fireEvent.click(screen.getByRole("button", { name: /simulate export error/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/demo simulated failure/i);
    expect(screen.getByRole("alert")).toHaveTextContent(/recoverable preview error/i);

    // Retry export and recover
    fireEvent.click(screen.getByRole("button", { name: /retry export/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/recovered export preview/i);
    expect(screen.getByRole("status")).toHaveTextContent(/no file was created/i);
  });

  it("labels assumptions with explicit estimated and unknown disclosures and displays cash flow", () => {
    render(<ReportDetail id="monthly-plan-sep-2026" />);

    // Check cash flow table
    expect(screen.getByRole("table", { name: /cash flow allocation table/i })).toBeInTheDocument();
    expect(screen.getByText("Base take-home salary")).toBeInTheDocument();
    expect(screen.getByText("Home loan EMI")).toBeInTheDocument();

    // Check explicit disclosures
    const estimatedBadges = screen.getAllByText("Estimated assumption");
    expect(estimatedBadges.length).toBeGreaterThan(0);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getByText("Tax optimization deductions")).toBeInTheDocument();
  });
});
