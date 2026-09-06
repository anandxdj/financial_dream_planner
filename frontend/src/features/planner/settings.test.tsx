import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Settings } from "./settings";

const { post, logoutMutate } = vi.hoisted(() => ({
  post: vi.fn(),
  logoutMutate: vi.fn(),
}));

vi.mock("@/lib/sdk", () => ({
  sdk: {
    POST: post,
  },
}));

vi.mock("@/hooks/use-me", () => ({
  useMe: () => ({
    data: {
      displayName: "Anand Verma",
      email: "anand@example.com",
      emailVerifiedAt: "2026-09-01T00:00:00.000Z",
    },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-logout", () => ({
  useLogout: () => ({
    mutate: logoutMutate,
    isPending: false,
  }),
}));

describe("settings", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    post.mockResolvedValue({
      response: new Response(null, { status: 200 }),
      data: { data: { id: "export-1", status: "queued" } },
    });
  });

  it("renders profile, verified status, and navigation to saved financial data", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Settings />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Anand Verma")).toBeInTheDocument();
    expect(screen.getByText("anand@example.com")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review planning inputs/i })).toHaveAttribute("href", "/onboarding");
    expect(screen.getByRole("link", { name: /manage accounts/i })).toHaveAttribute("href", "/dashboard/accounts");
    expect(screen.getByRole("link", { name: /review goals/i })).toHaveAttribute("href", "/dashboard/goals");
    expect(screen.getByRole("link", { name: /view saved plan/i })).toHaveAttribute("href", "/dashboard/plan");
  });

  it("requests data export via privacy API", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Settings />
      </QueryClientProvider>,
    );

    const exportBtn = screen.getByRole("button", { name: /export my data/i });
    fireEvent.click(exportBtn);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith("/api/v1/privacy/exports", {
      body: { idempotencyKey: expect.any(String) },
    });
    expect(await screen.findByText(/data export requested/i)).toBeInTheDocument();
  });

  it("requires confirmation for destructive household deletion", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Settings />
      </QueryClientProvider>,
    );

    const requestBtn = screen.getByRole("button", { name: /request household deletion/i });
    fireEvent.click(requestBtn);

    expect(screen.getByText(/are you sure you want to permanently delete all data/i)).toBeInTheDocument();
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText(/are you sure you want to permanently delete all data/i)).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /request household deletion/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm permanent deletion/i }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith("/api/v1/privacy/deletions", {
      body: { idempotencyKey: expect.any(String) },
    });
    expect(await screen.findByText(/household deletion initiated/i)).toBeInTheDocument();
  });

  it("triggers logout on sign out", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Settings />
      </QueryClientProvider>,
    );

    const signoutBtn = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(signoutBtn);
    expect(logoutMutate).toHaveBeenCalledTimes(1);
  });
});
