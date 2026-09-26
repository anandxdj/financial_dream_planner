import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiPlanner } from "./ai";

const { get, post, executePlannerRun, stagePlannerProposal } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  executePlannerRun: vi.fn(),
  stagePlannerProposal: vi.fn(),
}));

vi.mock("@/lib/sdk", () => ({
  sdk: { GET: get, POST: post },
  subscribeRun: vi.fn(),
}));

vi.mock("@/features/ai/services/run.service", () => ({
  executePlannerRun,
}));

vi.mock("@/features/ai/services/proposal.service", () => ({
  stagePlannerProposal,
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

const mockProposal = {
  type: "scenario_draft" as const,
  name: "Increase Monthly SIP Contributions",
  description: "Boost equity SIP by ₹5,000 to accelerate wealth compounding.",
  baselineVersionId: "plan-v2",
  overlay: {
    income: [],
    expenses: [],
    goals: [],
    loans: [],
    investments: [],
  },
  evaluation: {
    status: "success" as const,
    metrics: {
      monthlySurplusDelta: "-5000",
      targetNetWorthDelta: "+1200000",
    },
  },
  provenance: {
    planVersionNumber: 2,
    snapshotAsOf: "2026-09-02T00:00:00.000Z",
    engineVersion: "v1.2",
    policyVersion: "v1",
  },
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
    metadata: {
      grounding: "engine-backed",
      planVersionNumber: 2,
      planAsOf: "2026-09-02T00:00:00.000Z",
      engineVersion: "v1.2",
    },
    createdAt: "2026-09-02T00:00:01.000Z",
    retentionExpiresAt: "2026-12-01T00:00:01.000Z",
  },
];

function ok<T>(data: T) {
  return { response: new Response(null, { status: 200 }), data };
}

function mockDefaultGet(custom?: { conversations?: unknown[]; messages?: unknown[]; plan?: unknown }) {
  get.mockImplementation((path: string) => {
    if (path === "/api/v1/planner/conversations") {
      return Promise.resolve(ok({ data: custom?.conversations ?? [] }));
    }
    if (path.includes("/messages")) {
      return Promise.resolve(ok({ data: custom?.messages ?? [] }));
    }
    if (path === "/api/v1/plans/current") {
      return Promise.resolve(ok({ data: custom?.plan ?? null }));
    }
    if (path === "/api/v1/households/planning") {
      return Promise.resolve(ok({ data: { revision: 1 } }));
    }
    if (path === "/api/v1/goals") {
      return Promise.resolve(ok({ data: [] }));
    }
    return Promise.resolve(ok({ data: [] }));
  });
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
    mockDefaultGet({ conversations: [] });
    executePlannerRun.mockResolvedValue({ result: { conversationId: conversation.id, message: messages[1] } });
    renderPlanner();

    expect(await screen.findByRole("heading", { name: "Your AI copilot for a brighter tomorrow." })).toBeInTheDocument();

    // Verify starter prompt chips
    expect(screen.getByRole("button", { name: "Plan for a home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save on taxes" })).toBeInTheDocument();

    // Verify privacy notes
    expect(screen.getByText("Used for your planning experience and never to auto-execute financial actions.")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/ask anything about your finances, goals, or loans/i), { target: { value: "Review my buffer" } });
    fireEvent.click(screen.getByRole("button", { name: "Send query" }));

    await waitFor(() => expect(executePlannerRun).toHaveBeenCalledWith({ kind: "chat", message: "Review my buffer" }));
  });

  it("loads conversation history and exposes assistant citations as safe external links", async () => {
    mockDefaultGet({ conversations: [conversation], messages });
    renderPlanner();

    expect(await screen.findByText("Is my emergency fund safe?")).toBeInTheDocument();
    expect(screen.getByText("Keep the money accessible and review the insured limit.")).toBeInTheDocument();

    // Verify attributable source provenance
    expect(screen.getByText("Plan v2")).toBeInTheDocument();
    expect(screen.getByText("Engine v1.2")).toBeInTheDocument();

    const sources = screen.getByText("Sources (1)").closest("details");
    expect(sources).not.toBeNull();
    const link = within(sources!).getByRole("link", { name: /Reserve Bank of India: deposit insurance/i });
    expect(link).toHaveAttribute("href", citation.canonicalSourceUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(within(sources!).getByText(`Supports: ${citation.claim}`)).toBeInTheDocument();
  });

  it("keeps New conversation selected instead of reopening the latest history item", async () => {
    mockDefaultGet({ conversations: [conversation], messages });
    renderPlanner();
    expect(await screen.findByText("Is my emergency fund safe?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /start fresh/i }));

    expect(screen.getByRole("heading", { name: "Your AI copilot for a brighter tomorrow." })).toBeInTheDocument();
    expect(screen.queryByText("Is my emergency fund safe?")).not.toBeInTheDocument();
  });

  it("retains a failed chat message and retries the same request", async () => {
    mockDefaultGet({ conversations: [] });
    executePlannerRun
      .mockRejectedValueOnce(new Error("I couldn't validate that answer."))
      .mockResolvedValueOnce({ result: { conversationId: conversation.id, message: messages[1] } });

    renderPlanner();
    await screen.findByRole("heading", { name: "Your AI copilot for a brighter tomorrow." });

    fireEvent.change(screen.getByPlaceholderText(/ask anything about your finances, goals, or loans/i), { target: { value: "Check this assumption" } });
    fireEvent.click(screen.getByRole("button", { name: "Send query" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("I couldn't validate that answer.");
    expect(screen.getByText("Check this assumption")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(executePlannerRun).toHaveBeenCalledTimes(2));
    expect(executePlannerRun).toHaveBeenLastCalledWith({ kind: "chat", message: "Check this assumption" });
  });

  it("renders dynamically generated proposals and scales modal projections to active plan data", async () => {
    const proposalMessage = {
      ...messages[1],
      metadata: {
        proposals: [mockProposal],
      },
    };
    mockDefaultGet({ conversations: [conversation], messages: [messages[0], proposalMessage] });
    stagePlannerProposal.mockResolvedValue({ scenario: { id: "scen-1", name: mockProposal.name } });

    renderPlanner();

    fireEvent.click(await screen.findByText("Financial context"));
    expect(await screen.findByText("Increase Monthly SIP Contributions")).toBeInTheDocument();
    const reviewButtons = screen.getAllByRole("button", { name: /review scenario/i });
    fireEvent.click(reviewButtons[0]);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Review scenario draft")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm & Stage in Scenarios" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByText(/was staged and verified by the financial engine/i)).toBeInTheDocument();
  });
});
