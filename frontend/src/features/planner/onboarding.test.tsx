import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Onboarding } from "./onboarding";

const { put, post, routerPush, planning } = vi.hoisted(() => ({
  put: vi.fn(),
  post: vi.fn(),
  routerPush: vi.fn(),
  planning: { inputs: { cashFlow: { income: "100" } }, completedStep: 0, estimates: [], revision: 4 },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: routerPush }) }));
vi.mock("./goals", () => ({ Goals: () => <div>Goals editor</div> }));
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

describe("onboarding save state", () => {
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
    render(<QueryClientProvider client={client}><Onboarding /></QueryClientProvider>);

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    const income = screen.getByLabelText("Monthly take-home income");
    fireEvent.change(income, { target: { value: "125" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(701); });
    expect(put).toHaveBeenCalledTimes(1);
    expect(put.mock.calls[0][1].body.expectedRevision).toBe(4);

    fireEvent.change(income, { target: { value: "150" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(701); });
    expect(put).toHaveBeenCalledTimes(2);
    expect(put.mock.calls[1][1].body.expectedRevision).toBe(5);
    expect(income).toHaveValue("150");
    expect(screen.getByText(/couldn’t save. your edits are still here/i)).toBeInTheDocument();
  });

  it("generates plan with Idempotency-Key and redirects to plan reveal", async () => {
    put.mockResolvedValue({ data: { data: { ...planning, revision: 4 } } });
    post.mockResolvedValueOnce({ data: { data: { planId: "p1" } } });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><Onboarding /></QueryClientProvider>);

    // Jump to review step (step 3)
    fireEvent.click(screen.getByRole("button", { name: /4\. review/i }));

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
    expect(routerPush).toHaveBeenCalledWith("/dashboard/plan?welcome=1");
  });
});
