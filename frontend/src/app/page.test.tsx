import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("Financial Dream Planner Landing Page", () => {
  it("renders the brand identity, hero headline, path to dreams, and key sections", () => {
    render(<HomePage />);

    // Brand and Hero headline
    expect(screen.getAllByText(/financial dream planner/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", {
        name: /where clarity meets financial confidence\./i,
        level: 1,
      })
    ).toBeInTheDocument();

    // Primary CTA to onboarding
    const planLinks = screen.getAllByRole("link", {
      name: /start planning|get started/i,
    });
    expect(planLinks.length).toBeGreaterThan(0);
    expect(planLinks[0].getAttribute("href")).toMatch(/\/onboarding/i);

    // Calculator anchor link
    expect(
      screen.getByRole("link", { name: /try interactive calculator/i })
    ).toHaveAttribute("href", "#calculator-preview");

    // Section 02: Features
    expect(
      screen.getByRole("heading", {
        name: /everything you need for a brighter financial future/i,
      })
    ).toBeInTheDocument();

    // Section 03: Path to Dreams (How It Works matching path_to_finance.png)
    expect(
      screen.getByRole("heading", {
        name: /a simple path to your financial dreams/i,
      })
    ).toBeInTheDocument();

    // The 4 steps
    expect(screen.getByRole("heading", { name: /connect your data/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /get a clear picture/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /set your goals/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /make it happen/i })).toBeInTheDocument();

    // Panoramic annotation quote
    expect(
      screen.getByText(/small steps towards a bigger tomorrow\./i)
    ).toBeInTheDocument();

    // Section 04: Pricing
    expect(
      screen.getByRole("heading", {
        name: /simple, transparent pricing/i,
      })
    ).toBeInTheDocument();

    // Section 05: About
    expect(
      screen.getByRole("heading", {
        name: /built for a financially brighter india/i,
      })
    ).toBeInTheDocument();

    // Section 06: Security & Privacy
    expect(
      screen.getByRole("heading", {
        name: /your data stays yours\./i,
      })
    ).toBeInTheDocument();

    // Section 07: Calculator Preview
    expect(
      screen.getByRole("heading", {
        name: /can i afford this\?/i,
      })
    ).toBeInTheDocument();
  });
});
