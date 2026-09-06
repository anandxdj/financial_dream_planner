import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlanHistory, DriftReview } from "./history-drift";

const { post, get } = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
}));

vi.mock("@/lib/sdk", () => ({
  sdk: {
    POST: post,
    GET: get,
  },
}));

const mockCurrentPlan = {
  plan: { id: "p1", householdId: "h1", status: "active", currentVersionId: "v2" },
  currentVersion: { id: "v2", householdId: "h1", planId: "p1", versionNumber: 2, createdAt: "2026-09-02T10:00:00.000Z" },
  snapshot: {
    id: "s2",
    revision: 3,
    asOf: "2026-09-02T10:00:00.000Z",
    policyVersion: "v1",
    calculatedOutput: {
      cashFlow: { monthlyIncome: "150000", totalOutflows: "90000", monthlySurplus: "60000" },
      emergencyFund: { currentReserves: "360000", runwayMonths: "4" },
    },
  },
};

const mockHistory = [
  {
    version: { id: "v2", householdId: "h1", planId: "p1", versionNumber: 2, createdAt: "2026-09-02T10:00:00.000Z" },
    snapshot: {
      id: "s2",
      revision: 3,
      policyVersion: "v1",
      calculatedOutput: {
        cashFlow: { monthlyIncome: "150000", totalOutflows: "90000", monthlySurplus: "60000" },
        emergencyFund: { currentReserves: "360000", runwayMonths: "4" },
      },
    },
  },
  {
    version: { id: "v1", householdId: "h1", planId: "p1", versionNumber: 1, createdAt: "2026-08-01T10:00:00.000Z" },
    snapshot: {
      id: "s1",
      revision: 1,
      policyVersion: "v1",
      calculatedOutput: {
        cashFlow: { monthlyIncome: "120000", totalOutflows: "80000", monthlySurplus: "40000" },
        emergencyFund: { currentReserves: "240000", runwayMonths: "3" },
      },
    },
  },
];

const mockDriftEvent = {
  id: "drift-100",
  householdId: "h1",
  checkId: "chk-1",
  baselineVersionId: "v2",
  status: "pending" as const,
  findings: [
    {
      code: "spending_changed" as const,
      description: "Monthly outflows increased by 15% due to higher discretionary spending",
      baselineValue: "90000",
      observedValue: "103500",
      absoluteDelta: "13500",
      relativeDelta: "15.0",
      severity: "warning" as const,
      affectedOutputPaths: ["cashFlow.totalOutflows", "cashFlow.monthlySurplus"],
    },
  ],
  observedInputs: {},
  observedCalculatedOutput: null,
  observedOutputHash: "hash-123",
  deltas: null,
  createdVersionId: null,
  resolvedAt: null,
  createdAt: "2026-09-05T12:00:00.000Z",
  retentionExpiresAt: null,
};

vi.mock("./queries", () => ({
  useCurrentPlan: () => ({ data: mockCurrentPlan, isPending: false, error: null, refetch: vi.fn() }),
  unwrap: (result: { data: unknown }) => result.data,
}));

vi.mock("./decision-queries", () => ({
  usePlanHistory: () => ({ data: { data: mockHistory }, isPending: false, error: null, refetch: vi.fn() }),
  useCurrentDrift: () => ({ data: mockDriftEvent, isPending: false, error: null, refetch: vi.fn() }),
  useDriftEvents: () => ({ data: [mockDriftEvent], isPending: false, error: null, refetch: vi.fn() }),
}));

describe("PlanHistory and DriftReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    post.mockResolvedValue({
      response: new Response(null, { status: 200 }),
      data: {
        event: { ...mockDriftEvent, status: "accepted", resolvedAt: "2026-09-06T00:00:00.000Z" },
        plan: mockCurrentPlan.plan,
        version: { id: "v3", versionNumber: 3, createdAt: "2026-09-06T00:00:00.000Z" },
        snapshot: mockCurrentPlan.snapshot,
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders active baseline, history versions, and drift alert banner", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <PlanHistory />
      </QueryClientProvider>
    );

    expect(screen.getByText("Active Baseline — Version 2")).toBeInTheDocument();
    expect(screen.getByText("Recorded activity has diverged from your plan")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review drift findings/i })).toBeInTheDocument();
    expect(screen.getByText("Saved version history")).toBeInTheDocument();
  });

  it("allows side-by-side comparison of historical version with baseline without mutating baseline", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <PlanHistory />
      </QueryClientProvider>
    );

    const compareBtn = screen.getByRole("button", { name: "Compare with baseline" });
    fireEvent.click(compareBtn);

    expect(screen.getByText("Comparing Version 1 with Active Baseline")).toBeInTheDocument();
    expect(screen.getByText("Difference")).toBeInTheDocument();
    expect(screen.getByText("Historical version outputs are immutable snapshots. Comparing does not alter current baseline or any saved inputs.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close comparison" }));
    expect(screen.queryByText("Comparing Version 1 with Active Baseline")).not.toBeInTheDocument();
  });

  it("renders drift findings and requires explicit confirmation before accepting drift", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <DriftReview id="drift-100" />
      </QueryClientProvider>
    );

    expect(screen.getByText("Observed drift findings")).toBeInTheDocument();
    expect(screen.getByText(/spending changed/i)).toBeInTheDocument();
    expect(screen.getByText("warning")).toBeInTheDocument();

    const acceptBtn = screen.getByRole("button", { name: /accept drift and create new version/i });
    fireEvent.click(acceptBtn);

    expect(screen.getByText("Confirm update to live plan?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm & Accept" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

    // Cancel preserves state
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Confirm update to live plan?")).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();

    // Re-open and confirm
    fireEvent.click(screen.getByRole("button", { name: /accept drift and create new version/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Accept" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith("/api/v1/drift/{id}/accept", {
      params: { path: { id: "drift-100" } },
    });
  });

  it("allows dismissing drift to keep baseline intact", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <DriftReview id="drift-100" />
      </QueryClientProvider>
    );

    const keepBtn = screen.getByRole("button", { name: /keep current baseline/i });
    fireEvent.click(keepBtn);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith("/api/v1/drift/{id}/keep", {
      params: { path: { id: "drift-100" } },
    });
  });
});
