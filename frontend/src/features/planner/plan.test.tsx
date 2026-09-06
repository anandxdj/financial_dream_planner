import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Plan } from "./plan";

const { post, currentPlan, planningState } = vi.hoisted(() => ({
  post: vi.fn(),
  planningState: { revision: 7, estimates: [] },
  currentPlan: {
    currentVersion: { versionNumber: 3, createdAt: "2026-09-01T00:00:00.000Z" },
    snapshot: {
      revision: 7,
      asOf: "2026-09-01T00:00:00.000Z",
      calculatedOutput: { cashFlow: { monthlyIncome: "100", totalOutflows: "60", monthlySurplus: "40" }, emergencyFund: { currentReserves: "80", runwayMonths: "2", shortfall: "20" } },
      completeness: { status: "complete", missing: [], warnings: [] },
      policyVersion: "v1",
      resolvedAssumptions: { generalInflation: "5", returns: { expected: "8" } },
    },
  },
}));

vi.mock("./queries", () => ({
  useCurrentPlan: () => ({ data: currentPlan, isPending: false, error: null, refetch: vi.fn() }),
  unwrap: (result: { data: unknown }) => result.data,
}));
vi.mock("./planning-queries", () => ({
  usePlanning: () => ({ data: planningState, error: null, refetch: vi.fn() }),
}));
vi.mock("@/lib/sdk", () => ({ sdk: { POST: post } }));

describe("plan regeneration", () => {
  afterEach(() => {
    cleanup();
    planningState.revision = 7;
  });

  it("retains the current plan and reuses its idempotency key after a failed attempt", async () => {
    post.mockRejectedValueOnce(new Error("generation failed")).mockResolvedValueOnce({ data: currentPlan });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><Plan /></QueryClientProvider>);

    fireEvent.click(screen.getByRole("button", { name: "Update Plan" }));
    expect(screen.getByText("Planned monthly money")).toBeInTheDocument();
    await screen.findByText("generation failed");
    fireEvent.click(screen.getByRole("button", { name: "Update Plan" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));

    const first = post.mock.calls[0][1].params.header["Idempotency-Key"];
    const second = post.mock.calls[1][1].params.header["Idempotency-Key"];
    expect(first).toBe(second);
    expect(screen.getByText("Planned monthly money")).toBeInTheDocument();
  });

  it("displays stale plan banner when inputs revision is ahead of plan snapshot", () => {
    planningState.revision = 8;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><Plan /></QueryClientProvider>);

    expect(screen.getByRole("status")).toHaveTextContent("Your plan needs updating");
    expect(screen.getByText(/your saved inputs have changed/i)).toBeInTheDocument();
  });
});
