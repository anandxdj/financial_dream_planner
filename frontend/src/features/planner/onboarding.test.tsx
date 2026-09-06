import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Onboarding } from "./onboarding";

const { put, post, routerPush, planning } = vi.hoisted(() => ({
  put: vi.fn(),
  post: vi.fn(),
  routerPush: vi.fn(),
  planning: {
    inputs: { cashFlow: { income: "100" } },
    completedStep: 0,
    estimates: [],
    revision: 4,
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: routerPush }) }));
vi.mock("./planning-queries", () => ({
  usePlanning: () => ({ data: planning, isPending: false, error: null, refetch: vi.fn() }),
}));
vi.mock("./queries", () => ({
  unwrap: (result: { data?: unknown; error?: unknown }) => {
    if (result.error) throw result.error;
    return result.data;
  },
}));
vi.mock("@/lib/sdk", () => ({ sdk: { PUT: put, POST: post } }));

describe("Web Onboarding flow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("advances revisions after a save and preserves edits on a later conflict", async () => {
    put
      .mockResolvedValueOnce({ data: { data: { ...planning, revision: 5 } } })
      .mockResolvedValueOnce({ error: new Error("Revision is stale") });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Onboarding />
      </QueryClientProvider>
    );

    // Welcome Screen -> click Get started
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));

    // Goals Screen -> click Next
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Income Screen -> edit salary
    const income = screen.getByLabelText(/monthly take-home salary/i);
    fireEvent.change(income, { target: { value: "125" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(701);
    });
    expect(put).toHaveBeenCalledTimes(1);
    expect(put.mock.calls[0][1].body.expectedRevision).toBe(4);

    // Edit again to trigger conflict
    fireEvent.change(income, { target: { value: "150" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(701);
    });
    expect(put).toHaveBeenCalledTimes(2);
    expect(put.mock.calls[1][1].body.expectedRevision).toBe(5);
    expect(income).toHaveValue("150");
    expect(screen.getByText(/couldn’t save\. your edits are still here/i)).toBeInTheDocument();
  });

  it("generates plan with Idempotency-Key and redirects to plan reveal", async () => {
    put.mockResolvedValue({ data: { data: { ...planning, revision: 4 } } });
    post.mockResolvedValueOnce({ data: { data: { planId: "p1" } } });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Onboarding />
      </QueryClientProvider>
    );

    // Welcome Screen -> click Get started
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));

    // Jump directly to Review step via sidebar
    fireEvent.click(screen.getByRole("button", { name: /review/i }));

    const generateBtn = screen.getByRole("button", { name: /generate my plan/i });
    await act(async () => {
      fireEvent.click(generateBtn);
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/api/v1/households/planning/generate", {
      params: { header: { "Idempotency-Key": expect.any(String) } },
      body: { expectedRevision: 4 },
    });

    // Advance through the generation checkpoints to reach the completion screen
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    // On completion screen, clicking "View My Plan" redirects to /dashboard/plan?welcome=1
    const viewPlanBtn = screen.getByRole("button", { name: /view my plan/i });
    fireEvent.click(viewPlanBtn);
    expect(routerPush).toHaveBeenCalledWith("/dashboard/plan?welcome=1");
  });

  it("allows selecting goals and navigating through all wizard steps", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Onboarding />
      </QueryClientProvider>
    );

    // Welcome Screen
    expect(screen.getByText(/welcome to/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));

    // Goals Screen
    expect(screen.getByText(/what are your financial goals\?/i)).toBeInTheDocument();
    expect(screen.getByText("Buy a Car")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Buy a Car"));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Income Screen
    expect(screen.getByText(/tell us about your income/i)).toBeInTheDocument();
    expect(screen.getByText(/total monthly income/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Expenses Screen
    expect(screen.getByText(/what are your monthly expenses\?/i)).toBeInTheDocument();
    expect(screen.getByText(/total monthly expenses/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Loans Screen
    expect(screen.getByText(/do you have any loans or emis\?/i)).toBeInTheDocument();
    expect(screen.getByText("Home Loan")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Investments Screen
    expect(screen.getByText(/tell us about your investments/i)).toBeInTheDocument();
    expect(screen.getByText("Mutual Funds")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Review Screen
    expect(screen.getByText(/review your information/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate my plan/i })).toBeInTheDocument();
  });
});
