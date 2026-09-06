import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Accounts } from "./accounts";

const { getAccounts, post, patch, del, refreshFinancialViews } = vi.hoisted(() => ({
  getAccounts: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
  refreshFinancialViews: vi.fn(),
}));

vi.mock("@/lib/sdk", () => ({
  sdk: {
    GET: getAccounts,
    POST: post,
    PATCH: patch,
    DELETE: del,
  },
}));

vi.mock("./queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./queries")>();
  return {
    ...actual,
    useAccounts: () => ({
      data: [
        {
          id: "acc-1",
          name: "HDFC Salary",
          type: "SAVINGS",
          currency: "INR",
          currentBalance: "150000.00",
          balanceUpdatedAt: "2026-09-01T00:00:00.000Z",
        },
      ],
      isPending: false,
      error: null,
      refetch: vi.fn(),
    }),
    useRefreshFinancialViews: () => refreshFinancialViews,
  };
});

describe("accounts", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    post.mockResolvedValue({
      response: new Response(null, { status: 201 }),
      data: { data: { id: "acc-2", name: "ICICI Savings" } },
    });
    del.mockResolvedValue({
      response: new Response(null, { status: 200 }),
      data: { data: { id: "acc-1" } },
    });
    patch.mockResolvedValue({
      response: new Response(null, { status: 200 }),
      data: { data: { id: "acc-1" } },
    });
    refreshFinancialViews.mockResolvedValue(undefined);
  });

  it("lists accounts and requires confirmation before deletion", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Accounts />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { name: "HDFC Salary" })).toBeInTheDocument();
    expect(screen.getByText("savings · INR")).toBeInTheDocument();

    const deleteBtn = screen.getByRole("button", { name: /^delete/i });
    fireEvent.click(deleteBtn);

    const confirmBtn = screen.getByRole("button", { name: /confirm delete/i });
    expect(confirmBtn).toBeInTheDocument();
    const keepBtn = screen.getByRole("button", { name: /keep account/i });
    expect(keepBtn).toBeInTheDocument();

    fireEvent.click(keepBtn);
    expect(screen.queryByRole("button", { name: /confirm delete/i })).not.toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /^delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    expect(del).toHaveBeenCalledWith("/api/v1/accounts/{id}", {
      params: { path: { id: "acc-1" } },
    });
    expect(refreshFinancialViews).toHaveBeenCalled();
  });

  it("creates a new account and refreshes financial views", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Accounts />
      </QueryClientProvider>,
    );

    const nameInput = screen.getByLabelText(/account name/i);
    const balanceInput = screen.getByLabelText(/current balance/i);

    fireEvent.change(nameInput, { target: { value: "Emergency Fund Account" } });
    fireEvent.change(balanceInput, { target: { value: "50000.50" } });

    fireEvent.click(screen.getByRole("button", { name: /save account/i }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith("/api/v1/accounts", {
      body: {
        name: "Emergency Fund Account",
        type: "SAVINGS",
        currency: "INR",
        currentBalance: "50000.50",
      },
    });
    expect(refreshFinancialViews).toHaveBeenCalled();
  });
});
