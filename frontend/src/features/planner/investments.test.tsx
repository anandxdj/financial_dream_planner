import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InvestmentsView } from "./investments";
import * as planningQueries from "./planning-queries";
import * as decisionQueries from "./decision-queries";

const { post } = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock("@/lib/sdk", () => ({
  sdk: {
    POST: post,
  },
}));

const mockCurrentPlan = {
  currentVersion: { versionNumber: 1 },
  snapshot: {
    calculatedOutput: {
      netWorth: {
        assetAllocations: [
          { category: "Equity mutual funds", totalValue: "500000", percentage: "50" },
          { category: "Fixed deposits & debt", totalValue: "300000", percentage: "30" },
          { category: "Bank savings", totalValue: "200000", percentage: "20" },
        ],
      },
    },
  },
};

const mockGoals = [
  {
    id: "g-retire",
    name: "Retirement Corpus",
    targetAmount: "20000000",
    targetDate: "2045-01-01",
    currentSavings: "1500000",
    monthlyContribution: "35000",
  },
];

const mockProjectionResponse = {
  initialLumpSum: "100000",
  monthlySip: "25000",
  annualStepUp: "10",
  horizonMonths: 120,
  scenarios: {
    conservative: {
      scenarioName: "conservative",
      annualRate: "6.0",
      totalInvested: "4780000",
      futureValue: "6500000",
      totalGains: "1720000",
      milestones: [
        { month: 12, year: 1, totalInvested: "400000", futureValue: "420000", totalGains: "20000" },
        { month: 120, year: 10, totalInvested: "4780000", futureValue: "6500000", totalGains: "1720000" },
      ],
    },
    expected: {
      scenarioName: "expected",
      annualRate: "10.0",
      totalInvested: "4780000",
      futureValue: "8800000",
      totalGains: "4020000",
      milestones: [
        { month: 12, year: 1, totalInvested: "400000", futureValue: "435000", totalGains: "35000" },
        { month: 120, year: 10, totalInvested: "4780000", futureValue: "8800000", totalGains: "4020000" },
      ],
    },
    optimistic: {
      scenarioName: "optimistic",
      annualRate: "14.0",
      totalInvested: "4780000",
      futureValue: "12200000",
      totalGains: "7420000",
      milestones: [
        { month: 12, year: 1, totalInvested: "400000", futureValue: "450000", totalGains: "50000" },
        { month: 120, year: 10, totalInvested: "4780000", futureValue: "12200000", totalGains: "7420000" },
      ],
    },
  },
  completeness: { status: "complete", missing: [], warnings: [] },
  policyVersion: "v1",
  resolvedAssumptions: { generalInflation: "5", returns: { conservative: "6.0", expected: "10.0", optimistic: "14.0" } },
};

vi.mock("./queries", () => ({
  useCurrentPlan: () => ({ data: mockCurrentPlan, isPending: false, error: null, refetch: vi.fn() }),
  unwrap: (result: { data: unknown }) => result.data,
}));

vi.mock("./planning-queries", () => ({
  usePlanning: () => ({
    data: {
      inputs: {
        investment: { initialLumpSum: "100000", monthlySip: "25000", annualStepUp: "10", horizonMonths: 120 },
      },
    },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
  useGoals: () => ({
    data: mockGoals,
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("./decision-queries", () => ({
  useInvestmentProjection: () => ({
    data: mockProjectionResponse,
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
  useInvestmentSummary: () => ({
    data: null,
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe("InvestmentsView feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    post.mockResolvedValue({
      response: new Response(null, { status: 200 }),
      data: { data: mockProjectionResponse },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("displays mandatory disclosure banner prohibiting broker execution language", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <InvestmentsView />
      </QueryClientProvider>
    );

    expect(screen.getByText("Educational planning simulation — No broker execution")).toBeInTheDocument();
    expect(screen.getByText(/this platform does not execute trades, offer brokerage services/i)).toBeInTheDocument();
  });

  it("renders Conservative, Expected, and Optimistic scenario projections", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <InvestmentsView />
      </QueryClientProvider>
    );

    expect(screen.getAllByText("Conservative").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Expected").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Optimistic").length).toBeGreaterThan(0);
  });

  it("renders compounding trajectory and accessible milestone data table", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <InvestmentsView />
      </QueryClientProvider>
    );

    expect(screen.getByText("Compounding trajectory over time")).toBeInTheDocument();
    expect(screen.getByText("View milestone data (accessible table)")).toBeInTheDocument();
    expect(screen.getByText("Year 1")).toBeInTheDocument();
    expect(screen.getByText("Year 10")).toBeInTheDocument();
  });

  it("renders broad asset allocation and links to active goals", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <InvestmentsView />
      </QueryClientProvider>
    );

    expect(screen.getByText("Broad asset allocation in your plan")).toBeInTheDocument();
    expect(screen.getByText("Equity mutual funds")).toBeInTheDocument();
    expect(screen.getByText("Fixed deposits & debt")).toBeInTheDocument();

    expect(screen.getByText("Goal linkage")).toBeInTheDocument();
    expect(screen.getByText("Retirement Corpus")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View goal" })).toBeInTheDocument();
  });

  it("renders uncalculated state without fabricated monetary defaults when planning inputs are empty", () => {
    vi.spyOn(planningQueries, "usePlanning").mockReturnValueOnce({
      data: { inputs: {} },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof planningQueries.usePlanning>);
    vi.spyOn(decisionQueries, "useInvestmentProjection").mockReturnValueOnce({
      data: undefined,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof decisionQueries.useInvestmentProjection>);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <InvestmentsView />
      </QueryClientProvider>
    );

    expect(
      screen.getByText(/no investment projection calculated yet/i)
    ).toBeInTheDocument();
    const lumpSumInput = screen.getByLabelText(/initial lump sum/i) as HTMLInputElement;
    const sipInput = screen.getByLabelText(/monthly sip contribution/i) as HTMLInputElement;
    expect(lumpSumInput.value).toBe("");
    expect(sipInput.value).toBe("");
  });
});
