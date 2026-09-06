import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotificationPreferencesPage from "./page";

describe("Dashboard Settings Notifications Route", () => {
  it("renders the notification preferences route", () => {
    render(<NotificationPreferencesPage />);
    expect(
      screen.getByRole("heading", { name: "Notification preferences", level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /plan check-ins/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /in-app notifications/i })).toBeInTheDocument();
  });
});
