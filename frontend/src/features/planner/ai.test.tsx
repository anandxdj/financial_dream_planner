import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiPlanner } from "./ai";

const { get, post } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/lib/sdk", () => ({
  sdk: { GET: get, POST: post },
}));

const conversation = {
  id: "11111111-1111-4111-8111-111111111111",
  householdId: "22222222-2222-4222-8222-222222222222",
  userId: "33333333-3333-4333-8333-333333333333",
  title: "Emergency fund review",
  status: "active" as const,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-02T00:00:00.000Z",
  retentionExpiresAt: "2026-12-01T00:00:00.000Z",
};

const citation = {
  evidenceId: "44444444-4444-4444-8444-444444444444",
  topic: "deposit insurance",
  claim: "Eligible deposits have insurance coverage.",
  canonicalSourceUrl: "https://www.rbi.org.in/example",
  publisher: "Reserve Bank of India",
  sourceType: "government_regulator" as const,
  supportingExcerpt: "Eligible deposits are covered subject to applicable limits.",
  retrievedAt: "2026-09-02T00:00:00.000Z",
  freshnessExpiresAt: "2026-10-02T00:00:00.000Z",
};

const messages = [
  {
    id: "55555555-5555-4555-8555-555555555555",
    householdId: conversation.householdId,
    conversationId: conversation.id,
    sender: "user" as const,
    content: "Is my emergency fund safe?",
    sequenceNumber: 1,
    citations: [],
    createdAt: "2026-09-02T00:00:00.000Z",
    retentionExpiresAt: "2026-12-01T00:00:00.000Z",
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    householdId: conversation.householdId,
    conversationId: conversation.id,
    sender: "assistant" as const,
    content: "Keep the money accessible and review the insured limit.",
    sequenceNumber: 2,
    citations: [citation],
    createdAt: "2026-09-02T00:00:01.000Z",
    retentionExpiresAt: "2026-12-01T00:00:01.000Z",
  },
];

function ok<T>(data: T) {
  return { response: new Response(null, { status: 200 }), data };
}

function renderPlanner() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><AiPlanner /></QueryClientProvider>);
}

describe("AI planner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(cleanup);

  it("shows an actionable empty state and starts a chat without an undefined conversation id", async () => {
    get.mockResolvedValue(ok({ data: [] }));
    post.mockResolvedValue(ok({ data: { conversationId: conversation.id, message: messages[1] } }));
    renderPlanner();

    expect(await screen.findByText("No conversations yet.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Start with a planning question" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Ask the AI planner"), { target: { value: "  Review my buffer  " } });
    fireEvent.click(screen.getByRole("button", { name: "Send question" }));

    await waitFor(() => expect(post).toHaveBeenCalledWith("/api/v1/planner/chat", { body: { message: "Review my buffer" } }));
  });

  it("loads conversation history and exposes assistant citations as safe external links", async () => {
    get.mockImplementation((path: string) => path === "/api/v1/planner/conversations"
      ? Promise.resolve(ok({ data: [conversation] }))
      : Promise.resolve(ok({ data: messages })));
    renderPlanner();

    expect(await screen.findByText("Is my emergency fund safe?")).toBeInTheDocument();
    expect(screen.getByText("Keep the money accessible and review the insured limit.")).toBeInTheDocument();
    const sources = screen.getByText("Sources (1)").closest("details");
    expect(sources).not.toBeNull();
    const link = within(sources!).getByRole("link", { name: /Reserve Bank of India: deposit insurance/i });
    expect(link).toHaveAttribute("href", citation.canonicalSourceUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(within(sources!).getByText(`Supports: ${citation.claim}`)).toBeInTheDocument();
  });

  it("keeps New conversation selected instead of reopening the latest history item", async () => {
    get.mockImplementation((path: string) => path === "/api/v1/planner/conversations"
      ? Promise.resolve(ok({ data: [conversation] }))
      : Promise.resolve(ok({ data: messages })));
    renderPlanner();
    expect(await screen.findByText("Is my emergency fund safe?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New conversation" }));

    expect(screen.getByRole("heading", { name: "Start with a planning question" })).toBeInTheDocument();
    expect(screen.queryByText("Is my emergency fund safe?")).not.toBeInTheDocument();
  });

  it("retains a failed chat message and retries the same request", async () => {
    get.mockResolvedValue(ok({ data: [] }));
    post
      .mockResolvedValueOnce({
        response: new Response(null, { status: 422 }),
        error: { error: { message: "I couldn't validate that answer." } },
      })
      .mockResolvedValueOnce(ok({ data: { conversationId: conversation.id, message: messages[1] } }));
    renderPlanner();
    await screen.findByText("No conversations yet.");

    fireEvent.change(screen.getByLabelText("Ask the AI planner"), { target: { value: "Check this assumption" } });
    fireEvent.click(screen.getByRole("button", { name: "Send question" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("I couldn't validate that answer.");
    expect(screen.getByText("Check this assumption")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post).toHaveBeenLastCalledWith("/api/v1/planner/chat", { body: { message: "Check this assumption" } });
  });
});
