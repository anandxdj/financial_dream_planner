import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoansOverview } from "./loans";

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
      cashFlow: { monthlySurplus: "45000" },
    },
  },
};

const mockLoanResponse = {
  monthlyEmi: "30385.45",
  totalPrincipal: "3500000",
  totalInterest: "3792508.00",
  totalPayment: "7292508.00",
  tenureMonths: 240,
  annualRate: "8.5",
  monthlyRate: "0.007083",
  schedule: [
    { month: 1, payment: "30385.45", principal: "5635.45", interest: "24750.00", remainingBalance: "3494364.55" },
    { month: 2, payment: "30385.45", principal: "5675.36", interest: "24710.09", remainingBalance: "3488689.19" },
  ],
  prepaymentComparison: {
    originalTotalInterest: "3792508.00",
    revisedTotalInterest: "3310000.00",
    interestSaved: "482508.00",
    originalTenureMonths: 240,
    revisedTenureMonths: 215,
    monthsSaved: 25,
    revisedMonthlyEmi: "30385.45",
    schedule: [],
  },
  refinancingComparison: {
    currentRemainingInterest: "3792508.00",
    newMonthlyEmi: "28800.00",
    newTotalInterest: "3450000.00",
    processingFee: "10000",
    netSavings: "332508.00",
    isBeneficial: true,
  },
  completeness: { status: "complete", missing: [], warnings: [] },
  policyVersion: "v1",
  resolvedAssumptions: { generalInflation: "5" },
};

vi.mock("./queries", () => ({
  useCurrentPlan: () => ({ data: mockCurrentPlan, isPending: false, error: null, refetch: vi.fn() }),
  useAccounts: () => ({ data: [], isPending: false, error: null, refetch: vi.fn() }),
  unwrap: (result: { data: unknown }) => result.data,
}));

vi.mock("./planning-queries", () => ({
  usePlanning: () => ({
    data: {
      inputs: {
        loan: { principal: "3500000", annualRate: "8.5", tenureMonths: 240 },
        netWorth: { liabilities: [] },
      },
    },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("./decision-queries", () => ({
  useLoanCalculation: () => ({
    data: mockLoanResponse,
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
  useLoans: () => ({
    data: { data: [], summary: { totalOutstandingPrincipal: "0", totalMonthlyEmi: "0", activeLoansCount: 0 } },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe("LoansOverview feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    post.mockResolvedValue({
      response: new Response(null, { status: 200 }),
      data: { data: mockLoanResponse },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("displays mandatory regulatory disclosure banner", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <LoansOverview />
      </QueryClientProvider>
    );

    expect(screen.getByText("Educational planning simulation only")).toBeInTheDocument();
    expect(screen.getByText(/it is not a loan offer, pre-approval, credit quote, or endorsement/i)).toBeInTheDocument();
  });

  it("renders calculated EMI, total interest, payment, and cash flow impact", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <LoansOverview />
      </QueryClientProvider>
    );

    expect(screen.getByText("Monthly EMI")).toBeInTheDocument();
    expect(screen.getByText("Total Interest")).toBeInTheDocument();
    expect(screen.getByText("Total Payment")).toBeInTheDocument();
    expect(screen.getByText("Impact on your monthly cash flow")).toBeInTheDocument();
  });

  it("renders prepayment interest savings and tenure reduction", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <LoansOverview />
      </QueryClientProvider>
    );

    expect(screen.getByText("Prepayment impact analysis")).toBeInTheDocument();
    expect(screen.getByText("Interest Saved")).toBeInTheDocument();
    expect(screen.getByText("Tenure Saved")).toBeInTheDocument();
    expect(screen.getByText(/25 months/i)).toBeInTheDocument();
  });

  it("renders refinancing comparison and recommendation", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <LoansOverview />
      </QueryClientProvider>
    );

    expect(screen.getByText("Refinancing feasibility")).toBeInTheDocument();
    expect(screen.getByText("Beneficial to Refinance")).toBeInTheDocument();
    expect(screen.getByText("Net savings after fees")).toBeInTheDocument();
  });

  it("renders accessible amortization schedule table with tabular numerals", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <LoansOverview />
      </QueryClientProvider>
    );

    expect(screen.getByText("Amortization schedule (accessible table)")).toBeInTheDocument();
    expect(screen.getByText("Month 1")).toBeInTheDocument();
    expect(screen.getByText("Month 2")).toBeInTheDocument();
  });
});
