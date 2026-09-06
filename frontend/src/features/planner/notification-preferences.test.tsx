import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NotificationPreferences } from "./notification-preferences";

describe("notification preferences", () => {
  afterEach(cleanup);

  it("renders notification preferences and initial toggle states", () => {
    render(<NotificationPreferences />);

    expect(screen.getByRole("heading", { name: "Notification preferences", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /plan check-ins/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /monthly report summary/i })).not.toBeChecked();
  });

  it("supports accessible local toggles, saves, and resets", () => {
    render(<NotificationPreferences />);

    const monthlySummary = screen.getByRole("checkbox", { name: /monthly report summary/i });
    fireEvent.click(monthlySummary);
    expect(monthlySummary).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: /save preferences/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/preferences saved successfully/i);

    fireEvent.click(screen.getByRole("button", { name: /reset defaults/i }));
    expect(monthlySummary).not.toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent(/preferences reset to defaults/i);
  });

  it("supports toggling delivery channels as accessible controls", () => {
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

  it("supports Plan Drift alerts, Monthly budget summaries, and Goal milestone celebrations toggles", () => {
    render(<NotificationPreferences />);

    const driftAlerts = screen.getByRole("checkbox", { name: /spending and drift alerts/i });
    const goalMilestones = screen.getByRole("checkbox", { name: /goal milestones\)/i });
    const monthlySummary = screen.getByRole("checkbox", { name: /monthly report summary\)/i });

    expect(driftAlerts).toBeChecked();
    expect(goalMilestones).toBeChecked();
    expect(monthlySummary).not.toBeChecked();

    fireEvent.click(driftAlerts);
    expect(driftAlerts).not.toBeChecked();

    fireEvent.click(monthlySummary);
    expect(monthlySummary).toBeChecked();
  });

  it("supports multi-channel delivery matrix toggles across Email, SMS, and WhatsApp", () => {
    render(<NotificationPreferences />);

    const driftEmail = screen.getByRole("checkbox", { name: "Plan Drift alerts via Email" });
    const driftSms = screen.getByRole("checkbox", { name: "Plan Drift alerts via SMS" });
    const driftWhatsApp = screen.getByRole("checkbox", { name: "Plan Drift alerts via WhatsApp" });

    expect(driftEmail).toBeChecked();
    expect(driftSms).toBeChecked();
    expect(driftWhatsApp).not.toBeChecked();

    fireEvent.click(driftWhatsApp);
    expect(driftWhatsApp).toBeChecked();

    const milestoneWhatsApp = screen.getByRole("checkbox", { name: "Goal milestone celebrations via WhatsApp" });
    expect(milestoneWhatsApp).toBeChecked();

    const monthlyEmail = screen.getByRole("checkbox", { name: "Monthly budget summaries via Email" });
    const monthlySms = screen.getByRole("checkbox", { name: "Monthly budget summaries via SMS" });
    expect(monthlyEmail).toBeChecked();
    expect(monthlySms).not.toBeChecked();

    fireEvent.click(monthlySms);
    expect(monthlySms).toBeChecked();
  });

  it("supports SMS and WhatsApp global delivery channel toggles", () => {
    render(<NotificationPreferences />);

    const smsChannel = screen.getByRole("checkbox", { name: /sms notifications/i });
    const whatsAppChannel = screen.getByRole("checkbox", { name: /whatsapp notifications/i });

    expect(smsChannel).not.toBeChecked();
    expect(whatsAppChannel).not.toBeChecked();

    fireEvent.click(smsChannel);
    expect(smsChannel).toBeChecked();

    fireEvent.click(whatsAppChannel);
    expect(whatsAppChannel).toBeChecked();
  });
});
