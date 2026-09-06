import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import NotificationsPage from "@/app/dashboard/notifications/page";
import { Notifications } from "./notifications";

describe("Notifications", () => {
  afterEach(cleanup);

  it("labels the local demo and renders valid planner deep links", () => {
    render(<Notifications />);
    expect(screen.getByText("Demo preview")).toBeInTheDocument();
    expect(screen.getByText("Local state only")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review plan" })).toHaveAttribute("href", "/dashboard/plan");
    expect(screen.getByRole("link", { name: "Review transactions" })).toHaveAttribute("href", "/dashboard/transactions");
    expect(screen.getByRole("link", { name: "View goals" })).toHaveAttribute("href", "/dashboard/goals");
    expect(screen.getByRole("link", { name: "Open reports" })).toHaveAttribute("href", "/dashboard/reports");
  });

  it("supports read-state and priority filtering interactions", () => {
    render(<Notifications />);
    expect(screen.getByRole("status")).toHaveTextContent("2 unread notifications");
    fireEvent.click(screen.getAllByRole("button", { name: "Mark as read" })[0]);
    expect(screen.getByRole("status")).toHaveTextContent("1 unread notification");
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    expect(screen.getByText("Monthly review preview is ready")).toBeInTheDocument();
    expect(screen.queryByText("Your plan is ready for review")).not.toBeInTheDocument();
  });

  it("offers a reversible empty-state demo control", () => {
    render(<Notifications />);
    fireEvent.click(screen.getByRole("button", { name: "Clear demo inbox" }));
    expect(screen.getByRole("heading", { name: "Demo inbox cleared" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restore demo notifications" }));
    expect(screen.getByText("Your plan is ready for review")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("2 unread notifications");
  });

  it("supports mark-all-as-read, link-click read updates, and unread filter empty state", () => {
    render(<Notifications />);
    expect(screen.getByRole("button", { name: "Mark all as read" })).toBeInTheDocument();

    // Deep link marks item as read
    fireEvent.click(screen.getByRole("link", { name: "Review plan" }));
    expect(screen.getByRole("status")).toHaveTextContent("1 unread notification");

    // Mark all as read
    fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));
    expect(screen.getByRole("status")).toHaveTextContent("0 unread notifications");
    expect(screen.queryByRole("button", { name: "Mark all as read" })).not.toBeInTheDocument();

    // Unread filter now shows empty filter state
    fireEvent.click(screen.getByRole("button", { name: "Unread" }));
    expect(screen.getByRole("heading", { name: "No notifications match this filter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show all notifications" })).toBeInTheDocument();

    // Resetting filter displays all items again
    fireEvent.click(screen.getByRole("button", { name: "Show all notifications" }));
    expect(screen.getByText("Your plan is ready for review")).toBeInTheDocument();

    // Can toggle read item back to unread
    fireEvent.click(screen.getAllByRole("button", { name: "Mark as unread" })[0]);
    expect(screen.getByRole("status")).toHaveTextContent("1 unread notification");
  });

  it("renders the /dashboard/notifications route page", () => {
    render(<NotificationsPage />);
    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByText("Demo preview")).toBeInTheDocument();
    expect(screen.getByText("Local state only")).toBeInTheDocument();
  });
});


