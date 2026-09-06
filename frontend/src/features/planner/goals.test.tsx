import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Goals, GoalDetail } from "./goals";

const { del, patch, post } = vi.hoisted(() => ({
  del: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/lib/sdk", () => ({
  sdk: {
    POST: post,
    PATCH: patch,
    DELETE: del,
  },
}));

vi.mock("./planning-queries", () => ({
  useGoals: () => ({
    data: [
      { id: "g1", name: "Home Purchase", category: "home", targetAmount: "5000000", targetDate: "2030-01-01", currentSavings: "1000000", monthlyContribution: "60000", revision: 1 },
      { id: "g2", name: "Travel", category: "travel", targetAmount: "200000", targetDate: "2031-01-01", currentSavings: "50000", monthlyContribution: "20000", revision: 1 },
      { id: "g3", name: "Education", category: "education", targetAmount: "300000", targetDate: "2032-01-01", currentSavings: "20000", monthlyContribution: "15000", revision: 1 },
    ],
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
  useFeasibility: () => ({
    data: {
      overAllocated: true,
      availableMonthlyCapacity: "80000",
      goals: [
        {
          id: "g1",
          result: { requiredSip: "75000", isFeasible: false },
        },
      ],
    },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe("goals", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    del.mockResolvedValue({ response: new Response(null, { status: 200 }), data: { ok: true } });
    patch.mockResolvedValue({ response: new Response(null, { status: 200 }), data: { ok: true } });
    post.mockResolvedValue({ response: new Response(null, { status: 201 }), data: { ok: true } });
  });

  it("keeps all three chosen goals visible and explains over-allocation", () => {
    render(<Goals />);
    expect(screen.getByText(/contributions exceed available monthly capacity/i)).toBeInTheDocument();
    expect(screen.getByText(/you have three active goals/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add a goal/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /review goal/i })).toHaveLength(3);
  });

  it("displays goal details, engine required SIP, and confirms goal deletion", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <GoalDetail id="g1" />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { name: "Home Purchase" })).toBeInTheDocument();
    expect(screen.getByText("Funding outlook")).toBeInTheDocument();
    expect(screen.getByText(/per month required/i)).toBeInTheDocument();

    const removeBtn = screen.getByRole("button", { name: "Remove goal" });
    fireEvent.click(removeBtn);

    expect(screen.getByRole("button", { name: "Confirm removal" })).toBeInTheDocument();
    const keepBtn = screen.getByRole("button", { name: "Keep goal" });
    expect(keepBtn).toBeInTheDocument();

    fireEvent.click(keepBtn);
    expect(screen.queryByRole("button", { name: "Confirm removal" })).not.toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Remove goal" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm removal" }));

    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    expect(del).toHaveBeenCalledWith("/api/v1/goals/{id}", {
      params: { path: { id: "g1" } },
    });
  });
});
