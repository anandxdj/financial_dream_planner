import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReportsPage from "./page";
import ReportDetailPage from "./[id]/page";

describe("Dashboard Reports Routes", () => {
  it("renders the reports list route", () => {
    render(<ReportsPage />);
    expect(screen.getByRole("heading", { name: "Reports", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Demo preview")).toBeInTheDocument();
  });

  it("renders the report detail dynamic route", async () => {
    const component = await ReportDetailPage({
      params: Promise.resolve({ id: "monthly-plan-sep-2026" }),
    });
    render(component);
    expect(screen.getByRole("heading", { name: "September plan summary", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/preview source: plan version 3/i)).toBeInTheDocument();
  });
});
