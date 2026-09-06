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

    // Check all 9 default nav items are rendered
    for (const item of DEFAULT_PLANNER_NAV) {
      expect(screen.getAllByText(item.label).length).toBeGreaterThan(0);
    }

    // Verify Release 2 routes are present
    expect(screen.getAllByText("Scenarios").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Loans").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Investments").length).toBeGreaterThan(0);

    // Verify F17-F20 routes are present
    expect(screen.getAllByText("Reports").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Notifications").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Data sources").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Notification preferences").length).toBeGreaterThan(0);
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
