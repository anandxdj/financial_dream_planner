import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScenariosList, ScenarioDetail, ScenarioCreate } from "./scenarios";

const { post, push } = vi.hoisted(() => ({
  post: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/sdk", () => ({
  sdk: {
    POST: post,
  },
}));

const mockCurrentPlan = {
  currentVersion: { id: "v1", versionNumber: 1, createdAt: "2026-09-01T00:00:00.000Z" },
  snapshot: {
    calculatedOutput: {
      cashFlow: { monthlyIncome: "100000", totalOutflows: "60000", monthlySurplus: "40000", investableCapacity: "30000" },
      emergencyFund: { runwayMonths: "6" },
    },
  },
};

const mockScenarios = [
  {
    id: "sc-1",
    householdId: "h1",
    baselineVersionId: "v1",
    name: "Job Change (+20%)",
    description: "New salary offer with higher take-home",
    overlay: { cashFlow: { income: "120000" } },
    status: "draft" as const,
    appliedVersionId: null,
    appliedAt: null,
    createdAt: "2026-09-02T10:00:00.000Z",
    updatedAt: "2026-09-02T10:00:00.000Z",
  },
  {
    id: "sc-2",
    householdId: "h1",
    baselineVersionId: "v1",
    name: "Buy Car with Loan",
    description: "New car EMI of 15k monthly",
    overlay: { cashFlow: { emis: "15000" } },
    status: "applied" as const,
    appliedVersionId: "v2",
    appliedAt: "2026-09-03T10:00:00.000Z",
    createdAt: "2026-09-02T11:00:00.000Z",
    updatedAt: "2026-09-03T10:00:00.000Z",
  },
];

const mockEvaluation = {
  name: "Job Change (+20%)",
  description: "New salary offer with higher take-home",
  baseline: {
    cashFlow: { monthlyIncome: "100000", totalOutflows: "60000", monthlySurplus: "40000", essentialExpenses: "40000", discretionaryExpenses: "20000", emis: "0" },
    emergencyFund: { runwayMonths: "6" },
  },
  scenario: {
    cashFlow: { monthlyIncome: "120000", totalOutflows: "60000", monthlySurplus: "60000", essentialExpenses: "40000", discretionaryExpenses: "20000", emis: "0" },
    emergencyFund: { runwayMonths: "8" },
  },
  deltas: {
    cashFlow: { monthlyIncomeDelta: "20000", monthlySurplusDelta: "20000", totalExpensesDelta: "0" },
    emergencyFund: { runwayMonthsDelta: "2" },
  },
  policyVersion: "v1",
  resolvedAssumptions: { generalInflation: "5", returns: { expected: "10" } },
};

vi.mock("./queries", () => ({
  useCurrentPlan: () => ({ data: mockCurrentPlan, isPending: false, error: null, refetch: vi.fn() }),
  unwrap: (result: { data: unknown }) => result.data,
}));

vi.mock("./decision-queries", () => ({
  useScenarios: () => ({ data: mockScenarios, isPending: false, error: null, refetch: vi.fn() }),
  useScenario: (id: string) => ({ data: mockScenarios.find((s) => s.id === id) || mockScenarios[0], isPending: false, error: null, refetch: vi.fn() }),
  useRunScenario: () => ({ data: mockEvaluation, isPending: false, error: null, refetch: vi.fn() }),
  useCompareScenarios: () => ({
    data: {
      baselineVersionId: "v1",
      scenarios: [mockEvaluation, { ...mockEvaluation, name: "Buy Car with Loan" }],
    },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe("Scenarios feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    post.mockResolvedValue({
      response: new Response(null, { status: 200 }),
      data: {
        data: {
          id: "sc-new",
          plan: { id: "p1" },
          version: { id: "v2", versionNumber: 2 },
          snapshot: { id: "s2" },
        },
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders scenario list and allows comparing multiple scenarios side-by-side", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <ScenariosList />
      </QueryClientProvider>
    );

    expect(screen.getByText("Decision scenarios")).toBeInTheDocument();
    expect(screen.getByText("Job Change (+20%)")).toBeInTheDocument();
    expect(screen.getByText("Buy Car with Loan")).toBeInTheDocument();

    // Select both scenarios
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    const compareBtn = screen.getByRole("button", { name: /compare \(2\)/i });
    fireEvent.click(compareBtn);

    expect(screen.getByText("Side-by-side scenario comparison")).toBeInTheDocument();
    expect(screen.getByText("Active Baseline")).toBeInTheDocument();
  });

  it("creates a new scenario and navigates to its evaluation", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <ScenarioCreate />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByLabelText(/scenario name/i), {
      target: { value: "Freelance Consulting" },
    });
    fireEvent.change(screen.getByLabelText(/hypothetical monthly take-home/i), {
      target: { value: "180000" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save and evaluate scenario/i }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith("/api/v1/scenarios", {
      body: {
        name: "Freelance Consulting",
        description: undefined,
        overlay: {
          cashFlow: { income: "180000" },
        },
      },
    });
    expect(push).toHaveBeenCalledWith("/dashboard/scenarios/sc-new");
  });

  it("renders scenario evaluation and requires explicit confirmation before applying", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <ScenarioDetail id="sc-1" />
      </QueryClientProvider>
    );

    expect(screen.getByRole("heading", { name: "Job Change (+20%)" })).toBeInTheDocument();
    expect(screen.getByText("Evaluation comparison against baseline")).toBeInTheDocument();

    const applyBtn = screen.getByRole("button", { name: /apply scenario to active plan/i });
    fireEvent.click(applyBtn);

    expect(screen.getByText("Confirm application to live plan?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm & Apply" })).toBeInTheDocument();

    // Cancel
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Confirm application to live plan?")).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();

    // Confirm
    fireEvent.click(screen.getByRole("button", { name: /apply scenario to active plan/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Apply" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      "/api/v1/scenarios/{id}/apply",
      expect.objectContaining({
        params: { path: { id: "sc-1" } },
      })
    );
  });
});
