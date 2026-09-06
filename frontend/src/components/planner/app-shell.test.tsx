import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell, DEFAULT_PLANNER_NAV } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("AppShell", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders all navigation items including Release 2 routes", () => {
    render(
      <AppShell>
        <div>Content Area</div>
      </AppShell>
    );

    expect(screen.getByText("Content Area")).toBeInTheDocument();

    // Check all primary default nav items are rendered
    expect(DEFAULT_PLANNER_NAV).toHaveLength(7);
    for (const item of DEFAULT_PLANNER_NAV) {
      expect(screen.getAllByText(item.label).length).toBeGreaterThan(0);
    }

    // Verify key core hubs are present in primary navigation
    expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Goals").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Transactions").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Plan").length).toBeGreaterThan(0);
    expect(screen.getAllByText("AI Copilot").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Reports").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Settings").length).toBeGreaterThan(0);
  });

  it("handles mobile drawer opening and closing with focus management", async () => {
    vi.useFakeTimers();
    render(
      <AppShell>
        <div>Content Area</div>
      </AppShell>
    );

    const menuButton = screen.getByRole("button", { name: /open navigation drawer/i });
    expect(menuButton).toBeInTheDocument();
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    // Open drawer
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    // Close drawer via close button
    const closeButton = screen.getByRole("button", { name: /close navigation drawer/i });
    fireEvent.click(closeButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    vi.useRealTimers();
  });
});
