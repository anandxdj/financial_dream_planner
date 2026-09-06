import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CanIAffordThisPage from "./page";

vi.mock("@/lib/sdk", () => ({ sdk: { POST: vi.fn() } }));
vi.mock("@/features/planner/analytics", () => ({ trackFunnel: vi.fn() }));

describe("Can I Afford This Alias Route", () => {
  it("renders the Affordability decision tool on the alias path", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <CanIAffordThisPage />
      </QueryClientProvider>
    );

    expect(
      screen.getByRole("heading", { name: /can i afford this\?/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/purchase amount/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /check affordability/i })).toBeInTheDocument();
  });
});
