import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Transactions, TransactionEditor } from "./transactions";

const { getTransactions, del, patch, post, refreshViews, routerPush } = vi.hoisted(() => ({
  getTransactions: vi.fn(),
  del: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
  refreshViews: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("./queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./queries")>();
  return {
    ...actual,
    useAccounts: () => ({ data: [{ id: "acc-1", name: "HDFC" }] }),
    useCategories: () => ({ data: [{ id: "cat-1", name: "Groceries" }] }),
    useRefreshFinancialViews: () => refreshViews,
  };
});

vi.mock("@/lib/sdk", () => ({
  sdk: {
    GET: getTransactions,
    POST: post,
    PATCH: patch,
    DELETE: del,
  },
}));

describe("transactions", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    getTransactions.mockResolvedValue({
      response: new Response(null, { status: 200 }),
      data: {
        data: [],
        nextCursor: null,
      },
    });
    del.mockResolvedValue({
      response: new Response(null, { status: 200 }),
      data: { ok: true },
    });
    patch.mockResolvedValue({
      response: new Response(null, { status: 200 }),
      data: { ok: true },
    });
    post.mockResolvedValue({
      response: new Response(null, { status: 201 }),
      data: { ok: true },
    });
    refreshViews.mockResolvedValue(undefined);
  });

  it("labels transactions as recorded activity separate from planned amounts", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Transactions />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/recorded activity is separate from the monthly amounts in your plan/i)).toBeInTheDocument();
    expect(await screen.findByText(/no transactions match/i)).toBeInTheDocument();
  });

  it("reviews transaction without allowing amount/date edits, and requires confirmation before delete", async () => {
    getTransactions.mockResolvedValueOnce({
      response: new Response(null, { status: 200 }),
      data: {
        data: {
          id: "tx-123",
          amount: "1450.00",
          currency: "INR",
          direction: "DEBIT",
          merchantName: "Supermarket",
          description: "Weekly groceries",
          occurredAt: "2026-09-01T10:00:00.000Z",
          status: "verified",
          accountId: "acc-1",
          categoryId: "cat-1",
        },
      },
    });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TransactionEditor id="tx-123" />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/review transaction/i)).toBeInTheDocument();
    expect(screen.getByText(/₹1,450.00 · 1 Sept 2026 · Money out/i)).toBeInTheDocument();

    // Verify amount and date inputs are NOT rendered in edit mode
    expect(screen.queryByLabelText(/amount \(inr\)/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/date and time/i)).not.toBeInTheDocument();

    // Verify review status is editable
    expect(screen.getByLabelText(/review status/i)).toBeInTheDocument();

    // Delete confirmation
    const deleteBtn = screen.getByRole("button", { name: "Delete transaction" });
    fireEvent.click(deleteBtn);

    expect(screen.getByRole("button", { name: "Confirm delete" })).toBeInTheDocument();
    const keepBtn = screen.getByRole("button", { name: "Keep transaction" });
    expect(keepBtn).toBeInTheDocument();

    fireEvent.click(keepBtn);
    expect(screen.queryByRole("button", { name: "Confirm delete" })).not.toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete transaction" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    expect(del).toHaveBeenCalledWith("/api/v1/transactions/{id}", {
      params: { path: { id: "tx-123" } },
    });
    expect(refreshViews).toHaveBeenCalled();
  });
});
