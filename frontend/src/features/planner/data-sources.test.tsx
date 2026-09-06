import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DataSources } from "./data-sources";

describe("data sources", () => {
  afterEach(cleanup);

  it("clearly identifies the preview and disconnected Android handoff", () => {
    render(<DataSources />);

    expect(screen.getByText("Demo preview")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Disconnected");
    expect(screen.getByText(/browser cannot read your SMS messages/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /preview connected state/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("previews connection freshness and review counts using local state", () => {
    render(<DataSources />);

    fireEvent.click(screen.getByRole("button", { name: /preview connected state/i }));

    expect(screen.getByRole("status")).toHaveTextContent("Connected for demo");
    expect(screen.getByText("Fresh 3 minutes ago")).toBeInTheDocument();
    expect(screen.getByText("18 transactions")).toBeInTheDocument();
    expect(screen.getByText("3 transactions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disconnect demo/i })).toHaveAttribute("aria-pressed", "true");
  });
});
