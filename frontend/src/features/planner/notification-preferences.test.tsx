import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NotificationPreferences } from "./notification-preferences";

describe("notification preferences demo", () => {
  afterEach(cleanup);

  it("identifies every preference as local, non-persisted demo state", () => {
    render(<NotificationPreferences />);

    expect(screen.getByText("Demo preview")).toBeInTheDocument();
    expect(screen.getByText("Local state only")).toBeInTheDocument();
    expect(screen.getByText(/no email, push notification, or account preference is created/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /plan check-ins/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /monthly report summary/i })).not.toBeChecked();
  });

  it("supports accessible local toggles and resets without claiming an account save", () => {
    render(<NotificationPreferences />);

    const monthlySummary = screen.getByRole("checkbox", { name: /monthly report summary/i });
    fireEvent.click(monthlySummary);
    expect(monthlySummary).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: /keep demo choices locally/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/nothing was saved to your account/i);

    fireEvent.click(screen.getByRole("button", { name: /reset defaults/i }));
    expect(monthlySummary).not.toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent(/reset to sample defaults/i);
  });

  it("supports toggling delivery channels as local demo controls", () => {
    render(<NotificationPreferences />);

    const inApp = screen.getByRole("checkbox", { name: /in-app notifications/i });
    const email = screen.getByRole("checkbox", { name: /email digest/i });
    const push = screen.getByRole("checkbox", { name: /push notifications/i });

    expect(inApp).toBeChecked();
    expect(email).not.toBeChecked();
    expect(push).not.toBeChecked();

    fireEvent.click(email);
    expect(email).toBeChecked();

    fireEvent.click(push);
    expect(push).toBeChecked();

    // Resetting defaults resets delivery channels too
    fireEvent.click(screen.getByRole("button", { name: /reset defaults/i }));
    expect(email).not.toBeChecked();
    expect(push).not.toBeChecked();
  });

  it("supports digest frequency selection with accessible radio controls", () => {
    render(<NotificationPreferences />);

    const weeklyRadio = screen.getByRole("radio", { name: /weekly digest/i });
    const realtimeRadio = screen.getByRole("radio", { name: /real-time/i });
    const monthlyRadio = screen.getByRole("radio", { name: /monthly summary/i });

    expect(weeklyRadio).toBeChecked();
    expect(realtimeRadio).not.toBeChecked();

    fireEvent.click(realtimeRadio);
    expect(realtimeRadio).toBeChecked();
    expect(weeklyRadio).not.toBeChecked();

    fireEvent.click(monthlyRadio);
    expect(monthlyRadio).toBeChecked();
    expect(realtimeRadio).not.toBeChecked();
  });
});
