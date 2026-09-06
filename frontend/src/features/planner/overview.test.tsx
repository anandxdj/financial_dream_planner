import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Overview } from "./overview";
import * as planningQueries from "./planning-queries";

const { currentPlan, planningState, goalsData, feasibilityData, accountsData, recordedData } = vi.hoisted(() => ({
  planningState: { revision: 7 },
  currentPlan: {
    currentVersion: { versionNumber: 2, createdAt: "2026-09-01T00:00:00.000Z" },
    snapshot: {
      revision: 7,
      calculatedOutput: {
        cashFlow: {
          monthlyIncome: "120000",
          totalOutflows: "82000",
          monthlySurplus: "38000",
          emis: "15000",
          mandatoryObligations: "5000",
        },
        emergencyFund: {
          currentReserves: "300000",
          runwayMonths: "4.5",
        },
      },
      completeness: { status: "complete", missing: [], warnings: [] },
      policyVersion: "v1",
    },
  },
  goalsData: [
    { id: "g1", name: "Emergency Fund", targetAmount: "300000", targetDate: "2026-12-31", monthlyContribution: "25000" },
    { id: "g2", name: "House Downpayment", targetAmount: "2800000", targetDate: "2029-06-30", monthlyContribution: "45000" },
  ],
  feasibilityData: {
    availableMonthlyCapacity: "38000",
    overAllocated: false,
  },
  accountsData: [
    { id: "a1", name: "HDFC Salary", balance: "150000" },
    { id: "a2", name: "ICICI Savings", balance: "150000" },
  ],
  recordedData: {
    hasData: true,
    totalIncome: "125000",
    totalExpenses: "34000",
  },
}));

vi.mock("./queries", () => ({
  useCurrentPlan: () => ({ data: currentPlan, isPending: false, error: null, refetch: vi.fn() }),
  useRecordedCashFlow: () => ({ data: recordedData, isPending: false, error: null, refetch: vi.fn() }),
  useAccounts: () => ({ data: accountsData, isPending: false, error: null, refetch: vi.fn() }),
  unwrap: (result: { data: unknown }) => result.data,
}));

vi.mock("./planning-queries", () => ({
  usePlanning: () => ({ data: planningState, error: null, refetch: vi.fn() }),
  useGoals: () => ({ data: goalsData, isPending: false, error: null, refetch: vi.fn() }),
  useFeasibility: () => ({ data: feasibilityData, isPending: false, error: null, refetch: vi.fn() }),
}));

vi.mock("@/lib/sdk", () => ({
  sdk: {
    GET: vi.fn().mockResolvedValue({
      data: {
        data: [
          { id: "t1", merchantName: "Swiggy", amount: "450", currency: "INR", direction: "DEBIT" },
        ],
      },
    }),
  },
}));

describe("Overview Financial Command Center", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders dominant next action banner, completeness status, and key metrics", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Overview />
      </QueryClientProvider>
    );

    // Header and completeness badge
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Inputs complete")).toBeInTheDocument();

    // Dominant Next Action Banner
    expect(screen.getByText("RECOMMENDED NEXT STEP")).toBeInTheDocument();
    expect(screen.getByText("Keep your plan close to real life")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review financial inputs/i })).toHaveAttribute("href", "/onboarding");

    // Three High-Level Metric Panels
    expect(screen.getByText("Monthly surplus")).toBeInTheDocument();
    expect(screen.getByText("Emergency coverage")).toBeInTheDocument();
    expect(screen.getByText("4.5 months")).toBeInTheDocument();
    expect(screen.getByText("Within monthly capacity")).toBeInTheDocument();

    // Separated Planned vs Recorded Money
    expect(screen.getByText("Planned income")).toBeInTheDocument();
    expect(screen.getByText("Recorded this month")).toBeInTheDocument();
    expect(screen.getByText(/recorded activity is not added to planned expenses/i)).toBeInTheDocument();

    // Goals and Data sources
    expect(screen.getByText("Emergency Fund")).toBeInTheDocument();
    expect(screen.getByText("House Downpayment")).toBeInTheDocument();
    expect(screen.getByText(/2 manually maintained accounts/i)).toBeInTheDocument();
  });

  it("renders only real goals and inline add goal slot without dummy showcase cards", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Overview />
      </QueryClientProvider>
    );

    // Verifies real goals are rendered
    expect(screen.getByText("Emergency Fund")).toBeInTheDocument();
    expect(screen.getByText("House Downpayment")).toBeInTheDocument();
    // Verifies inline open slot is rendered
    expect(screen.getByText("Add another goal")).toBeInTheDocument();
    // Verifies fake default showcase items are NOT rendered
    expect(screen.queryByText("Buy a Home")).not.toBeInTheDocument();
    expect(screen.queryByText("Plan a Dream Vacation")).not.toBeInTheDocument();
    expect(screen.queryByText("Child's Education")).not.toBeInTheDocument();
  });

  it("renders dedicated empty state banner when user has 0 goals", () => {
    vi.spyOn(planningQueries, "useGoals").mockReturnValueOnce({
      data: [],
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Overview />
      </QueryClientProvider>
    );

    expect(screen.getByText("No goals created yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create your first goal/i })).toBeInTheDocument();
    expect(screen.getByText(/0 goals set — Start planning your financial dreams/i)).toBeInTheDocument();
  });
});
