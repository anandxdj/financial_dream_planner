import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanningSubNav, TransactionsSubNav, SettingsSubNav } from "./sub-nav";

let currentPathname = "/dashboard/plan";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

describe("SubNav components", () => {
  afterEach(() => {
    cleanup();
  });
  describe("PlanningSubNav", () => {
    it("renders all planning tabs and marks active tab", () => {
      currentPathname = "/dashboard/plan";
      const { rerender } = render(<PlanningSubNav />);

      expect(screen.getByRole("navigation", { name: /planning sections navigation/i })).toBeInTheDocument();
      const roadmapLink = screen.getByRole("link", { name: /roadmap/i });
      expect(roadmapLink).toHaveAttribute("href", "/dashboard/plan");
      expect(roadmapLink).toHaveAttribute("aria-current", "page");

      const scenariosLink = screen.getByRole("link", { name: /scenarios/i });
      expect(scenariosLink).toHaveAttribute("href", "/dashboard/scenarios");
      expect(scenariosLink).not.toHaveAttribute("aria-current");

      expect(screen.getByRole("link", { name: /loans & debt/i })).toHaveAttribute("href", "/dashboard/loans");
      expect(screen.getByRole("link", { name: /investments/i })).toHaveAttribute("href", "/dashboard/investments");

      // Switch route to /dashboard/scenarios
      currentPathname = "/dashboard/scenarios";
      rerender(<PlanningSubNav />);
      expect(screen.getByRole("link", { name: /scenarios/i })).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("link", { name: /roadmap/i })).not.toHaveAttribute("aria-current");
    });
  });

  describe("TransactionsSubNav", () => {
    it("renders transactions and accounts tabs", () => {
      currentPathname = "/dashboard/transactions";
      render(<TransactionsSubNav />);

      expect(screen.getByRole("navigation", { name: /transactions and accounts navigation/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /transactions/i })).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("link", { name: /bank accounts/i })).toHaveAttribute("href", "/dashboard/accounts");
    });
  });

  describe("SettingsSubNav", () => {
    it("renders profile, integrations, and notification rules tabs", () => {
      currentPathname = "/dashboard/settings/notifications";
      render(<SettingsSubNav />);

      expect(screen.getByRole("navigation", { name: /settings sections navigation/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /notification rules/i })).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("link", { name: /profile & security/i })).toHaveAttribute("href", "/dashboard/settings");
      expect(screen.getByRole("link", { name: /integrations & sync/i })).toHaveAttribute("href", "/dashboard/settings/integrations");
    });
  });
});
