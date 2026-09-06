import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DataSources } from "./data-sources";

describe("data sources", () => {
  afterEach(cleanup);

  it("clearly identifies the data sources and disconnected Android handoff", () => {
    render(<DataSources />);

    expect(screen.getByRole("heading", { name: "Data sources", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Disconnected");
    expect(screen.getByText(/browser cannot read your SMS messages/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /connect companion/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("previews connection freshness and review counts using local state", () => {
    render(<DataSources />);

    fireEvent.click(screen.getByRole("button", { name: /connect companion/i }));

    expect(screen.getByRole("status")).toHaveTextContent("Connected");
    expect(screen.getByText("Fresh 3 minutes ago")).toBeInTheDocument();
    expect(screen.getByText("18 transactions")).toBeInTheDocument();
    expect(screen.getByText("3 transactions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disconnect companion/i })).toHaveAttribute("aria-pressed", "true");
  });
});
