"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Home,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { ErrorNotice, Loading } from "@/features/planner/ui";
import { cn } from "@/lib/utils";
import { toProposalViewModel, type ProposalViewModel } from "./adapters/proposal-view-model";
import { MessageCard } from "./components/message-card";
import { ProposalPreviewCard } from "./components/proposal-preview-card";
import { ProposalReviewModal } from "./components/proposal-review-modal";
import {
  useAiFinancialContext,
  usePlannerAnalyzeMutation,
  usePlannerChatMutation,
  usePlannerConversations,
  usePlannerMessages,
  useStagePlannerProposalMutation,
} from "./hooks/use-ai-data";
import type { PlannerConversation } from "./services/ai.service";
import { getPlannerMessageMetadata } from "./types";

const QUICK_STARTER_PILLS = [
  "Can I afford a dream vacation?",
  "How can I reach ₹1 Cr net worth?",
  "Review my loan prepayment options",
  "Analyze monthly cash flow drift",
] as const;

const TRY_STARTER_CHIPS = [
  "Plan for a home",
  "Save on taxes",
  "Should I use an index fund for a long-term goal?",
  "Retire early?",
] as const;

function formatMoney(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Not recorded";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return `₹ ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatRate(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Not recorded";
  return `${value}%`;
}

export function AiPlanner() {
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>();
  const [draft, setDraft] = useState("");
  const [localUserMessage, setLocalUserMessage] = useState<string>();
  const [reviewingProposal, setReviewingProposal] = useState<ProposalViewModel | null>(null);
  const [dismissedProposalIds, setDismissedProposalIds] = useState<Set<string>>(new Set());
  const [stagedNotification, setStagedNotification] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showContextSidebar, setShowContextSidebar] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const conversations = usePlannerConversations();
  const activeConversationId =
    conversationId === undefined ? conversations.data?.data[0]?.id : conversationId;
  const activeConversation = conversations.data?.data.find((conversation) => conversation.id === activeConversationId);
  const messages = usePlannerMessages(activeConversationId);
  const chat = usePlannerChatMutation();
  const analyze = usePlannerAnalyzeMutation();
  const stageProposal = useStagePlannerProposalMutation();
  const { currentPlan, planning, goals } = useAiFinancialContext();

  const planVersionNumber = currentPlan.data?.currentVersion?.versionNumber;
  const activePlanTag = planVersionNumber ? `Plan v${planVersionNumber}` : "No active plan";
  const isChatActive = Boolean(activeConversationId || localUserMessage);

  const proposals = useMemo(() => {
    const proposalMap = new Map<string, ProposalViewModel>();
    for (const message of messages.data ?? []) {
      const metadata = getPlannerMessageMetadata(message.metadata);
      for (const proposal of metadata.proposals ?? []) {
        const viewModel = toProposalViewModel(proposal);
        if (!dismissedProposalIds.has(viewModel.id)) {
          proposalMap.set(viewModel.id, viewModel);
        }
      }
    }
    return [...proposalMap.values()];
  }, [messages.data, dismissedProposalIds]);

  const suggestedPrompts = useMemo(() => {
    const activeGoals = goals.data ?? [];
    const vehicleGoal = activeGoals.find(
      (goal) =>
        goal.category === "car" ||
        goal.name?.toLowerCase().includes("car") ||
        goal.name?.toLowerCase().includes("bike"),
    );
    const educationGoal = activeGoals.find(
      (goal) =>
        goal.category === "education" ||
        goal.name?.toLowerCase().includes("education"),
    );

    return [
      vehicleGoal
        ? {
            icon: Car,
            category: "Vehicle Goal",
            prompt: `Can I afford ${vehicleGoal.name}?`,
            description: "Compare the purchase against your saved plan and buffer.",
          }
        : {
            icon: Home,
            category: "Buy a Home",
            prompt: "Can I afford a home in 5 years?",
            description: "Compare savings, down payment, and loan impact.",
          },
      {
        icon: TrendingUp,
        category: "Grow Investments",
        prompt: "How should I adjust my long-term investment plan?",
        description: "Use the financial engine to compare a concrete change.",
      },
      {
        icon: PiggyBank,
        category: "Plan for Retirement",
        prompt: "What changes could improve my retirement plan?",
        description: "Review the current plan before testing a scenario.",
      },
      educationGoal
        ? {
            icon: GraduationCap,
            category: "Education Goal",
            prompt: `Review my ${educationGoal.name} goal`,
            description: "Check target funding and monthly contribution needs.",
          }
        : {
            icon: ShieldCheck,
            category: "Emergency Cushion",
            prompt: "Is my emergency fund strong enough?",
            description: "Review the buffer using your current plan outputs.",
          },
    ];
  }, [goals.data]);

  const contextMetrics = useMemo(() => {
    const output = currentPlan.data?.snapshot?.calculatedOutput;
    const inputs = planning.data?.inputs;
    const activeGoals = goals.data ?? [];
    const monthlyIncome = output?.cashFlow?.monthlyIncome;
    const annualIncome = monthlyIncome ? Number(monthlyIncome) * 12 : null;
    const targetDates = activeGoals
      .map((goal) => new Date(`${goal.targetDate}T00:00:00Z`))
      .filter((date) => !Number.isNaN(date.getTime()));
    const furthestGoal = targetDates.sort((a, b) => b.getTime() - a.getTime())[0];
    const dependents = inputs?.emergencyFund?.dependents;

    return [
      {
        label: "Annual Income",
        value: annualIncome !== null && Number.isFinite(annualIncome) ? formatMoney(String(annualIncome)) : "Not recorded",
        note: "Display conversion from the plan's monthly income",
      },
      {
        label: "Monthly Outflows",
        value: formatMoney(output?.cashFlow?.totalOutflows),
        note: "Authoritative plan output",
      },
      {
        label: "Net Worth",
        value: formatMoney(output?.netWorth?.netWorth),
        note: "Authoritative plan output",
      },
      {
        label: "Savings Rate",
        value: formatRate(output?.cashFlow?.savingsRate),
        note: "Authoritative plan output",
      },
      {
        label: "Active Goals",
        value: `${activeGoals.length} active goal${activeGoals.length === 1 ? "" : "s"}`,
        note: activeGoals.length > 0 ? activeGoals.map((goal) => goal.name).slice(0, 3).join(", ") : "No active goals yet",
      },
      {
        label: "Goal Horizon",
        value: furthestGoal ? furthestGoal.toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "Not specified",
        note: "Furthest recorded active-goal date",
      },
      {
        label: "Family",
        value:
          dependents === undefined || dependents === null
            ? "Not specified"
            : Number(dependents) === 0
              ? "0 dependents"
              : `${dependents} dependent${Number(dependents) === 1 ? "" : "s"}`,
        note: "Recorded emergency-fund context",
      },
    ];
  }, [currentPlan.data, planning.data, goals.data]);

  const contextError = currentPlan.error ?? planning.error ?? goals.error;
  const requestError = chat.error ?? analyze.error ?? stageProposal.error;
  const displayedError = conversations.error ?? messages.error ?? requestError;
  const isWorking = chat.isPending || analyze.isPending;

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const element = scrollContainerRef.current;
    if (!element) return;
    if (typeof element.scrollTo === "function") {
      element.scrollTo({ top: element.scrollHeight, behavior });
    } else {
      element.scrollTop = element.scrollHeight;
    }
  }

  function handleScroll() {
    const element = scrollContainerRef.current;
    if (!element) return;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    const atBottom = distanceFromBottom <= 100;
    setIsAtBottom(atBottom);
    setShowScrollBottomBtn(!atBottom && element.scrollHeight > element.clientHeight + 100);
  }

  useEffect(() => {
    if (localUserMessage || isAtBottom) scrollToBottom("smooth");
  }, [messages.data, localUserMessage, isAtBottom]);

  async function refreshConversation(id: string) {
    setConversationId(id);
    setLocalUserMessage(undefined);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["planner", "conversations"] }),
      queryClient.invalidateQueries({ queryKey: ["planner", "messages", id] }),
      queryClient.invalidateQueries({ queryKey: ["ai", "context"] }),
    ]);
  }

  function sendPlannerText(message: string) {
    if (!message || isWorking) return;
    setLocalUserMessage(message);
    chat.mutate(
      { message, conversationId: activeConversationId ?? undefined },
      { onSuccess: (result) => void refreshConversation(result.conversationId) },
    );
  }

  function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isWorking) return;
    setDraft("");
    sendPlannerText(message);
  }

  function handleStarterPrompt(prompt: string) {
    if (isWorking) return;
    setDraft("");
    sendPlannerText(prompt);
  }

  function runPlanAnalysis() {
    analyze.mutate(
      { conversationId: activeConversationId ?? undefined },
      {
        onSuccess: (result) => {
          setDismissedProposalIds(new Set());
          void refreshConversation(result.conversationId);
        },
      },
    );
  }

  function retryDisplayedError() {
    if (conversations.error) {
      void conversations.refetch();
    } else if (messages.error) {
      void messages.refetch();
    } else if (chat.error && localUserMessage) {
      sendPlannerText(localUserMessage);
    } else if (analyze.error) {
      runPlanAnalysis();
    }
  }

  function selectConversation(next: PlannerConversation) {
    setConversationId(next.id);
    setLocalUserMessage(undefined);
    setIsHistoryOpen(false);
  }

  function startNewConversation() {
    setConversationId(null);
    setLocalUserMessage(undefined);
    setDraft("");
    setDismissedProposalIds(new Set());
  }

  function handleDismissProposal(id: string) {
    setDismissedProposalIds((previous) => new Set([...previous, id]));
  }

  function handleConfirmStage(options: { name: string }) {
    if (!reviewingProposal) return;
    const selected = reviewingProposal;
    stageProposal.mutate(
      {
        proposal: selected.proposal,
        options: { name: options.name },
      },
      {
        onSuccess: ({ scenario }) => {
          setStagedNotification(
            `Scenario "${scenario.name}" was staged and verified by the financial engine. Your live plan was not changed.`,
          );
          setDismissedProposalIds((previous) => new Set([...previous, selected.id]));
          setReviewingProposal(null);
          void queryClient.invalidateQueries({ queryKey: ["scenarios"] });
        },
      },
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-70px)] lg:h-[calc(100dvh-40px)] min-h-[580px] max-w-[1440px] mx-auto overflow-hidden">
      <header className="shrink-0 mb-2 flex items-center justify-between gap-2 px-3 py-2 rounded-2xl border border-[#E8E1D6] bg-white shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-xl bg-[#5E55C9]/10 border border-[#5E55C9]/20 flex items-center justify-center shrink-0">
            <Sparkles className="size-4 text-[#5E55C9]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-base sm:text-lg font-normal text-[#1A2238] truncate tracking-tight">
                {isChatActive && activeConversation?.title ? activeConversation.title : "AI planner"}
              </h1>
              {isChatActive ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1E7E34]/10 text-[10px] font-semibold text-[#1E7E34] border border-[#1E7E34]/20 shrink-0">
                  <span className="size-1.5 rounded-full bg-[#1E7E34]" />
                  Active conversation
                </span>
              ) : (
                <span className="rounded-full bg-[#5E55C9]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5E55C9] border border-[#5E55C9]/20 shrink-0">
                  {activePlanTag}
                </span>
              )}
            </div>
            {!isChatActive && (
              <p className="text-[11px] text-[#475467] truncate hidden sm:block">
                Ask questions about your saved financial picture and review engine-evaluated scenarios before acting.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="inline-flex min-h-8 items-center justify-center rounded-xl border border-[#E8E1D6] bg-[#FAF8F5] px-2.5 py-1 text-xs font-semibold text-[#1A2238] shadow-2xs hover:bg-white hover:border-[#5E55C9] transition-colors cursor-pointer"
            aria-label={isHistoryOpen ? "Close history" : "Recent chats"}
          >
            {isHistoryOpen ? <PanelLeftClose className="size-3.5 text-[#5E55C9] mr-1" /> : <PanelLeftOpen className="size-3.5 text-[#5E55C9] mr-1" />}
            <span className="hidden sm:inline">Recent chats</span>
          </button>

          {isChatActive && (
            <button
              type="button"
              className={cn(
                "inline-flex min-h-8 items-center justify-center rounded-xl border px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors cursor-pointer",
                showContextSidebar
                  ? "border-[#5E55C9] bg-[#5E55C9]/10 text-[#5E55C9]"
                  : "border-[#E8E1D6] bg-[#FAF8F5] text-[#1A2238] hover:bg-white hover:border-[#5E55C9]",
              )}
              onClick={() => setShowContextSidebar(!showContextSidebar)}
            >
              <SlidersHorizontal className="size-3.5 text-[#5E55C9] mr-1" />
              <span className="hidden sm:inline">Financial context</span>
            </button>
          )}

          {isChatActive && (
            <button
              type="button"
              className="inline-flex min-h-8 items-center justify-center rounded-xl bg-white border border-[#E8E1D6] px-2.5 py-1 text-xs font-semibold text-[#1A2238] shadow-2xs hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              onClick={startNewConversation}
            >
              <Plus className="size-3.5 text-[#5E55C9] mr-1" />
              <span className="hidden md:inline">Start fresh</span>
            </button>
          )}

          <button
            type="button"
            className="inline-flex min-h-8 items-center justify-center rounded-xl bg-[#5E55C9] text-white px-3 py-1 text-xs font-semibold shadow-2xs hover:bg-[#4d45b5] transition-colors disabled:opacity-50 cursor-pointer"
            onClick={runPlanAnalysis}
            disabled={isWorking || !currentPlan.data}
          >
            <Sparkles className="mr-1 size-3.5" />
            <span className="hidden md:inline">Analyze plan</span>
          </button>
        </div>
      </header>

      <div className="shrink-0 mb-2 px-2 flex items-center justify-between text-[11px] text-[#667085]" role="note">
        <div className="flex items-center gap-1.5 min-w-0">
          <ShieldCheck className="size-3.5 text-[#3B5B8C] shrink-0" />
          <p className="text-xs text-[#1A2238] font-medium truncate">
            AI explains your plan; deterministic financial calculations run on the backend engine. Nothing is applied automatically.
          </p>
        </div>
      </div>

      <ErrorNotice error={displayedError} retry={retryDisplayedError} />

      {stagedNotification && (
        <div role="status" className="shrink-0 mb-2 flex items-start justify-between gap-3 rounded-2xl border border-[#1E7E34]/30 bg-[#EDF7ED] p-3 text-xs sm:text-sm text-[#1E4620] shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[#1E7E34] shrink-0" />
            <span>{stagedNotification}</span>
          </div>
          <button type="button" onClick={() => setStagedNotification(null)} className="text-[#1E7E34] hover:opacity-70 cursor-pointer" aria-label="Dismiss status notification">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="relative flex flex-1 min-h-0 rounded-3xl border border-[#E8E1D6] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_-4px_rgba(31,42,68,0.03)] overflow-hidden">
        <aside
          className={cn(
            "shrink-0 flex flex-col justify-between border-r border-[#E8E1D6] bg-[#FFFCF8] p-4 transition-all duration-300 z-20 overflow-y-auto custom-scrollbar",
            isHistoryOpen ? "w-64" : "hidden",
          )}
          aria-label="AI conversations"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D6]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#667085]">Recent conversations</h2>
              <button type="button" onClick={() => setIsHistoryOpen(false)} className="text-[#667085] hover:text-[#1A2238] p-1 rounded-lg cursor-pointer" aria-label="Close sidebar">
                <X className="size-3.5" />
              </button>
            </div>
            <button type="button" className="mt-3 w-full inline-flex min-h-9 items-center justify-center rounded-xl bg-white border border-[#E8E1D6] px-3 py-1.5 text-xs font-semibold text-[#1A2238] shadow-2xs hover:bg-[#FAF8F5] transition-colors cursor-pointer" onClick={startNewConversation}>
              <Plus className="mr-1.5 size-3.5 text-[#5E55C9]" />
              New conversation
            </button>
            <div className="mt-3 space-y-1">
              {conversations.isLoading ? <Loading /> : null}
              {conversations.data?.data.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectConversation(item)}
                  aria-pressed={item.id === activeConversationId}
                  className={cn(
                    "w-full text-left rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer",
                    item.id === activeConversationId
                      ? "bg-white font-semibold text-[#1A2238] border border-[#E8E1D6] shadow-2xs"
                      : "text-[#475467] hover:bg-white/60",
                  )}
                >
                  <span className="block truncate">{item.title}</span>
                  <span className="block text-[10px] text-[#667085] mt-0.5">{new Date(item.updatedAt).toLocaleDateString("en-IN")}</span>
                </button>
              ))}
              {conversations.data?.data.length === 0 && <p className="px-2 py-4 text-xs text-[#667085]">No conversations yet.</p>}
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-[#E8E1D6] bg-white p-3 text-xs text-[#475467]">
            <div className="flex items-center gap-1.5 font-semibold text-[#1A2238]">
              <Lock className="size-3.5 text-[#3B5B8C]" />
              <span>Data stays yours</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#667085]">Used for your planning experience and never to auto-execute financial actions.</p>
          </div>
        </aside>

        <div className="flex flex-1 flex-col min-w-0 h-full relative">
          {!isChatActive ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-8">
              <section className="relative overflow-hidden rounded-3xl bg-[#FAF8F5] border border-[#EAE5DE] p-6 sm:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-3 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5E55C9]/10 border border-[#5E55C9]/20 text-[#5E55C9] text-xs font-semibold">
                      <Sparkles className="size-3.5" />
                      <span>Engine-backed planning copilot</span>
                    </div>
                    <h2 className="font-serif text-3xl sm:text-4xl text-[#1A2238] leading-tight font-normal">Your AI copilot for a brighter tomorrow.</h2>
                    <p className="text-sm sm:text-base text-[#475467] leading-relaxed">
                      Ask questions about your saved plan. When a quantified scenario is needed, the backend financial engine evaluates it before it is shown to you.
                    </p>
                  </div>
                  <div className="relative size-32 sm:size-40 rounded-2xl overflow-hidden shadow-sm border border-[#E8E1D6] bg-white shrink-0">
                    <Image src="/Assets/Characters/woman_with_laptop.png" alt="AI Copilot assistance" fill className="object-cover object-top" priority />
                  </div>
                </div>

                <form onSubmit={sendMessage} className="mt-8 relative max-w-2xl">
                  <label htmlFor="hero-planner-message" className="sr-only">Ask anything about your finances</label>
                  <div className="relative flex items-center">
                    <input
                      id="hero-planner-message"
                      type="text"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Ask anything about your finances, goals, or loans…"
                      className="w-full rounded-2xl border border-[#E8E1D6] bg-white pl-4 pr-12 py-3.5 text-sm text-[#1A2238] shadow-sm outline-none placeholder:text-[#667085] focus-visible:ring-2 focus-visible:ring-[#5E55C9]"
                      disabled={isWorking}
                    />
                    <button type="submit" disabled={!draft.trim() || isWorking} className="absolute right-2 p-2 rounded-xl bg-[#5E55C9] text-white hover:bg-[#4d45b5] disabled:opacity-40 transition-colors cursor-pointer" aria-label="Send query">
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[#667085]">
                    <span className="font-medium text-[#1A2238]">Try:</span>
                    {TRY_STARTER_CHIPS.map((chip) => (
                      <button key={chip} type="button" onClick={() => handleStarterPrompt(chip)} disabled={isWorking} className="rounded-full bg-white border border-[#E8E1D6] px-2.5 py-0.5 text-xs text-[#475467] hover:border-[#5E55C9] hover:text-[#5E55C9] transition-colors cursor-pointer">
                        {chip}
                      </button>
                    ))}
                  </div>
                </form>
              </section>

              <section className="space-y-3">
                <div>
                  <h3 className="font-serif text-xl font-normal text-[#1A2238]">Not sure where to start?</h3>
                  <p className="text-xs text-[#475467] mt-0.5">Try a planning question. The backend decides when a deterministic scenario calculation is required.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {suggestedPrompts.map((card) => {
                    const Icon = card.icon;
                    return (
                      <button key={card.category} type="button" onClick={() => handleStarterPrompt(card.prompt)} disabled={isWorking} className="group flex flex-col justify-between rounded-2xl border border-[#E8E1D6] bg-white p-5 text-left transition-all hover:border-[#5E55C9] hover:shadow-xs cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-[#5E55C9]/10 text-[#5E55C9]"><Icon className="size-4" /></span>
                          <ChevronRight className="size-4 text-[#667085] transition-transform group-hover:translate-x-0.5 group-hover:text-[#5E55C9]" />
                        </div>
                        <div className="mt-4">
                          <span className="text-[11px] font-semibold text-[#5E55C9] uppercase tracking-wider block">{card.category}</span>
                          <p className="mt-1 text-sm font-semibold text-[#1A2238]">&quot;{card.prompt}&quot;</p>
                          <p className="mt-1 text-xs text-[#475467] leading-relaxed">{card.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {proposals.length > 0 && (
                <section className="space-y-3 pt-2">
                  <div>
                    <h3 className="font-serif text-xl font-normal text-[#1A2238]">Engine-evaluated scenario drafts</h3>
                    <p className="text-xs text-[#667085] mt-0.5">These came from AI tool calls and were calculated against the saved plan on the backend.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {proposals.map((proposal) => (
                      <ProposalPreviewCard key={proposal.id} proposal={proposal} onReview={() => setReviewingProposal(proposal)} onDismiss={() => handleDismissProposal(proposal.id)} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col min-h-0 h-full">
              <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6" aria-live="polite" aria-busy={isWorking}>
                <div className="max-w-3xl mx-auto space-y-6 pb-2">
                  {messages.isLoading ? <Loading /> : null}
                  {messages.data?.map((message) => <MessageCard key={message.id} message={message} />)}
                  {localUserMessage ? (
                    <MessageCard message={{ id: "pending-user", sender: "user", content: localUserMessage, citations: [], metadata: undefined }} />
                  ) : null}
                  {isWorking ? (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#FBF9FE] border border-[#E5E0F8] text-xs text-[#1F2A44] max-w-sm shadow-2xs">
                      <div className="relative size-8 shrink-0 rounded-full border border-[#5E55C9]/20 bg-[#F4F1FD] p-1 overflow-hidden">
                        <Image src="/Assets/Characters/ai_assistant_orb.png" alt="AI Assistant" fill className="object-contain animate-spin" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#5E55C9]">Reviewing your financial context…</p>
                        <p className="text-[11px] text-[#667085]">Financial calculations, if needed, run on the backend engine.</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {showScrollBottomBtn && (
                <button type="button" onClick={() => scrollToBottom("smooth")} className="absolute bottom-32 right-6 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#1F2A44] px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-[#2A3755] transition-all cursor-pointer">
                  <ChevronDown className="size-3.5 text-[#E6B46A]" />
                  Latest messages
                </button>
              )}

              <div className="shrink-0 border-t border-[#E8E1D6]/70 bg-[#FAF8F5]/80 px-3 py-1 sm:px-4">
                <div className="max-w-3xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs text-[#475467]">
                  <span className="shrink-0 font-medium text-[11px] text-[#1A2238] flex items-center gap-1"><Sparkles className="size-3 text-[#5E55C9]" />Try:</span>
                  {QUICK_STARTER_PILLS.map((pill) => (
                    <button key={pill} type="button" onClick={() => handleStarterPrompt(pill)} disabled={isWorking} className="shrink-0 rounded-full border border-[#E8E1D6] bg-white px-2.5 py-0.5 text-[11px] text-[#1A2238] hover:border-[#5E55C9] hover:bg-[#5E55C9]/5 hover:text-[#5E55C9] transition-all shadow-2xs disabled:opacity-50 cursor-pointer">
                      {pill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={sendMessage} className="shrink-0 border-t border-[#E8E1D6] bg-white px-3 py-2 sm:px-4">
            <div className="max-w-3xl mx-auto">
              <label htmlFor="planner-message" className="sr-only">Ask the AI planner</label>
              <div className="relative flex items-center gap-2 rounded-2xl border border-[#E8E1D6] bg-[#FAF8F5] p-1.5 focus-within:border-[#5E55C9] focus-within:ring-2 focus-within:ring-[#5E55C9]/20 transition-all">
                <textarea
                  id="planner-message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      const message = draft.trim();
                      if (message && !isWorking) {
                        setDraft("");
                        sendPlannerText(message);
                      }
                    }
                  }}
                  maxLength={4000}
                  rows={1}
                  placeholder="Ask about your plan, goals, loans, or assumptions…"
                  className="flex-1 min-h-[36px] max-h-[120px] resize-none border-0 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-[#1A2238] outline-none placeholder:text-[#98A2B3]"
                  disabled={isWorking}
                />
                <button type="submit" className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-xl bg-[#5E55C9] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#4d45b5] transition-colors disabled:opacity-40 cursor-pointer" disabled={!draft.trim() || isWorking}>
                  {isWorking ? <><Sparkles className="mr-1.5 size-3.5 animate-spin" />Analyzing…</> : <><ArrowRight className="mr-1.5 size-3.5" />Send question</>}
                </button>
              </div>
              <div className="flex items-center justify-end px-1 mt-1 text-[10px] text-[#667085]">AI-assisted narrative · Backend financial engine · Explicit scenario staging</div>
            </div>
          </form>
        </div>

        {isChatActive && showContextSidebar && (
          <>
            <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-xs" onClick={() => setShowContextSidebar(false)} aria-hidden="true" />
            <aside className="fixed top-0 right-0 bottom-0 z-50 w-88 max-w-[90vw] bg-[#FFFCF8] border-l border-[#E8E1D6] shadow-2xl flex flex-col justify-between overflow-y-auto custom-scrollbar p-5" aria-label="Financial context sidebar">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D6]">
                  <div>
                    <h3 className="font-serif text-base font-normal text-[#1A2238]">Your Financial Context</h3>
                    <p className="text-[11px] text-[#667085]">Real server data only</p>
                  </div>
                  <button type="button" onClick={() => setShowContextSidebar(false)} className="p-1 rounded-lg text-[#667085] hover:bg-[#FAF8F5] cursor-pointer" aria-label="Close context sidebar"><X className="size-4" /></button>
                </div>

                {contextError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                    Financial context could not be loaded. No demo data has been substituted.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contextMetrics.map((metric) => (
                      <div key={metric.label} className="rounded-xl border border-[#E8E1D6] bg-white p-2.5 text-xs shadow-2xs">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#667085]">{metric.label}</p>
                        <p className="mt-0.5 font-sans font-bold text-sm text-[#1A2238] tabular-nums">{metric.value}</p>
                        <p className="mt-0.5 text-[10px] text-[#475467]">{metric.note}</p>
                      </div>
                    ))}
                  </div>
                )}

                {proposals.length > 0 && (
                  <div className="pt-2 border-t border-[#E8E1D6]/80">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] block mb-2">Evaluated Drafts</span>
                    <div className="space-y-2">
                      {proposals.slice(0, 2).map((proposal) => (
                        <div key={proposal.id} className="rounded-xl border border-[#E8E1D6] bg-white p-2.5 text-xs hover:border-[#5E55C9]/40 transition-colors">
                          <p className="font-semibold text-[#1A2238]">{proposal.title}</p>
                          <p className="mt-0.5 text-[10px] text-[#475467] line-clamp-2">{proposal.summary}</p>
                          <button type="button" onClick={() => setReviewingProposal(proposal)} className="mt-2 text-[11px] font-semibold text-[#5E55C9] hover:underline inline-flex items-center gap-1 cursor-pointer">
                            Review scenario <ChevronRight className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-[#5E55C9]/20 bg-[#5E55C9]/5 p-3 text-xs text-[#1A2238]">
                <div className="flex items-center gap-1.5 font-semibold text-[#5E55C9]"><Lock className="size-3.5" /><span>Your data stays yours</span></div>
                <p className="mt-1 text-[10px] leading-relaxed text-[#475467]">This panel never replaces unavailable server data with a demo household.</p>
              </div>
            </aside>
          </>
        )}
      </div>

      {reviewingProposal && (
        <ProposalReviewModal
          proposal={reviewingProposal}
          onClose={() => setReviewingProposal(null)}
          onConfirm={handleConfirmStage}
          isSubmitting={stageProposal.isPending}
        />
      )}
    </div>
  );
}
