import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Affordability } from "./affordability";
import { getAnonymousDraft } from "@/services/onboarding-draft";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/lib/sdk", () => ({ sdk: { POST: post } }));
vi.mock("./analytics", () => ({ trackFunnel: vi.fn() }));

describe("affordability", () => {
  beforeEach(() => {
    window.localStorage.clear();
    post.mockReset();
  });

  it("calculates affordability, displays verdict and comparison, and preserves draft token", async () => {
    post
      .mockResolvedValueOnce({
        response: new Response(null, { status: 200 }),
        data: {
          data: {
            verdict: "safe",
            explanation: "Your monthly surplus supports this purchase.",
            monthlySurplus: "40000",
            bufferImpact: "50000",
            timeToAffordMonths: 2,
            comparison: { buyNow: "50000", waitThreeMonths: "170000" },
          },
        },
      })
      .mockResolvedValueOnce({
        response: new Response(null, { status: 200 }),
        data: {
          data: {
            draftToken: "token-abc-123",
          },
        },
      });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Affordability />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Can I afford this?")).toBeInTheDocument();

    const purchase = screen.getByLabelText(/purchase amount/i);
    const income = screen.getByLabelText(/monthly take-home income/i);
    const expenses = screen.getByLabelText(/total monthly expenses/i);
    const savings = screen.getByLabelText(/liquid savings/i);

    fireEvent.change(purchase, { target: { value: "50000" } });
    fireEvent.change(income, { target: { value: "80000" } });
    fireEvent.change(expenses, { target: { value: "40000" } });
    fireEvent.change(savings, { target: { value: "100000" } });

    fireEvent.click(screen.getByRole("button", { name: /check affordability/i }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith("/api/v1/affordability", {
      body: {
        purchaseAmount: "50000",
        income: "80000",
        expenses: "40000",
        liquidSavings: "100000",
      },
    });

    expect(await screen.findByText("Looks manageable")).toBeInTheDocument();
    expect(screen.getByText("Your monthly surplus supports this purchase.")).toBeInTheDocument();
    expect(screen.getByText("Buy now")).toBeInTheDocument();
    expect(screen.getByText("Wait three months")).toBeInTheDocument();

    const buildPlanBtn = screen.getByRole("button", { name: /build my plan with these inputs/i });
    fireEvent.click(buildPlanBtn);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post).toHaveBeenLastCalledWith("/api/v1/planning/drafts", {
      body: {
        inputs: {
          cashFlow: { income: "80000", essentialExpenses: "40000" },
          emergencyFund: { currentReserves: "100000" },
        },
        completedStep: 0,
        estimates: [],
      },
    });

    expect(getAnonymousDraft()).toBe("token-abc-123");
    expect(await screen.findByText(/your inputs are ready to carry into your plan/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create account and continue/i })).toHaveAttribute(
      "href",
      "/register?next=%2Fonboarding",
    );
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login?next=%2Fonboarding",
    );
  });
});
