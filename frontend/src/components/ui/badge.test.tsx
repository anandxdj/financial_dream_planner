import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge component", () => {
  it("renders with tone styling and text content", () => {
    render(<Badge tone="sage">On Track</Badge>);
    const badge = screen.getByText("On Track");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-[#3D5C4A]");
  });

  it("renders decorative dot with aria-hidden", () => {
    const { container } = render(<Badge tone="gold" dot>Review Needed</Badge>);
    expect(screen.getByText("Review Needed")).toBeInTheDocument();
    const dot = container.querySelector("[aria-hidden='true']");
    expect(dot).toBeInTheDocument();
  });
});
