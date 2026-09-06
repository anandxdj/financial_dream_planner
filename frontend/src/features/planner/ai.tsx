"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, MessageCircleMore, ShieldCheck, Sparkles } from "lucide-react";
import { sdk } from "@/lib/sdk";
import { action, secondary, ErrorNotice, Loading, PageTitle } from "./ui";
import { unwrap } from "./queries";

type Conversation = Awaited<ReturnType<typeof getConversations>>["data"][number];
type PlannerMessage = Awaited<ReturnType<typeof getMessages>>[number];
type DisplayMessage = Pick<PlannerMessage, "id" | "sender" | "content" | "citations">;

async function getConversations() {
  const response = await sdk.GET("/api/v1/planner/conversations", {
    params: { query: { limit: 30 } },
  });
  return unwrap(response);
}

async function getMessages(conversationId: string) {
  const response = await sdk.GET("/api/v1/planner/conversations/{id}/messages", {
    params: { path: { id: conversationId } },
  });
  return unwrap(response).data;
}

export function AiPlanner() {
  const queryClient = useQueryClient();
  // undefined means history has not been initialized; null is an intentional new conversation.
  const [conversationId, setConversationId] = useState<string | null>();
  const [draft, setDraft] = useState("");
  const [localUserMessage, setLocalUserMessage] = useState<string>();
  const messageEndRef = useRef<HTMLDivElement>(null);

  const conversations = useQuery({
    queryKey: ["planner", "conversations"],
    queryFn: getConversations,
  });
  const activeConversationId =
    conversationId === undefined ? conversations.data?.data[0]?.id : conversationId;
  const messages = useQuery({
    queryKey: ["planner", "messages", activeConversationId],
    queryFn: () => getMessages(activeConversationId!),
    enabled: Boolean(activeConversationId),
  });

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.data, localUserMessage]);

  async function refreshConversation(id: string) {
    setConversationId(id);
    setLocalUserMessage(undefined);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["planner", "conversations"] }),
      queryClient.invalidateQueries({ queryKey: ["planner", "messages", id] }),
    ]);
  }

  const chat = useMutation({
    mutationFn: async (message: string) => {
      const response = await sdk.POST("/api/v1/planner/chat", {
        body: activeConversationId ? { message, conversationId: activeConversationId } : { message },
      });
      return unwrap(response).data;
    },
    onSuccess: (result) => void refreshConversation(result.conversationId),
  });

  const analyze = useMutation({
    mutationFn: async () => {
      const response = await sdk.POST("/api/v1/planner/analyze", {
        body: activeConversationId ? { conversationId: activeConversationId } : {},
      });
      return unwrap(response).data;
    },
    onSuccess: (result) => void refreshConversation(result.conversationId),
  });

  const isWorking = chat.isPending || analyze.isPending;
  const requestError = chat.error ?? analyze.error;
  const displayedError = conversations.error ?? messages.error ?? requestError;

  function retryDisplayedError() {
    if (conversations.error) {
      void conversations.refetch();
    } else if (messages.error) {
      void messages.refetch();
    } else if (chat.error && localUserMessage) {
      chat.mutate(localUserMessage);
    } else if (analyze.error) {
      analyze.mutate();
    }
  }

  function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isWorking) return;
    setDraft("");
    setLocalUserMessage(message);
    chat.mutate(message);
  }

  function selectConversation(next: Conversation) {
    setConversationId(next.id);
    setLocalUserMessage(undefined);
  }

  return (
    <>
      <PageTitle
        title="AI planner"
        description="Ask questions about your saved financial picture and review evidence before acting."
      >
        <button
          type="button"
          className={secondary}
          onClick={() => analyze.mutate()}
          disabled={isWorking}
        >
          <Sparkles className="mr-2 size-4" aria-hidden="true" />
          Analyze my plan
        </button>
      </PageTitle>

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#8FA9D6]/50 bg-[#8FA9D6]/10 p-4 text-sm text-[#1F2A44]" role="note">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#3B5B8C]" aria-hidden="true" />
        <p>
          Suggestions are educational and never change your plan automatically. Review assumptions and sources, then use the relevant planning tool to make a change.
        </p>
      </div>

      <ErrorNotice error={displayedError} retry={retryDisplayedError} />

      <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-[#E8E1D6] bg-[#FFF9F0]/60 p-4 lg:border-b-0 lg:border-r" aria-label="AI conversations">
          <button
            type="button"
            className={`${secondary} w-full`}
            onClick={() => { setConversationId(null); setLocalUserMessage(undefined); }}
          >
            New conversation
          </button>
          <h2 className="mt-6 px-2 text-sm font-semibold text-[#1F2A44]">Recent conversations</h2>
          {conversations.isLoading ? <Loading /> : (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible">
              {conversations.data?.data.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation)}
                  aria-pressed={conversation.id === activeConversationId}
                  className={`min-h-11 min-w-48 rounded-[10px] px-3 py-2 text-left text-sm lg:w-full lg:min-w-0 ${conversation.id === activeConversationId ? "bg-[#E8E1D6]/70 font-semibold text-[#1F2A44]" : "text-[#475467] hover:bg-[#FFF9F0]"}`}
                >
                  <span className="block truncate">{conversation.title}</span>
                  <span className="block text-xs font-normal">{new Date(conversation.updatedAt).toLocaleDateString("en-IN")}</span>
                </button>
              ))}
              {conversations.data?.data.length === 0 ? <p className="px-2 py-3 text-sm text-[#475467]">No conversations yet.</p> : null}
            </div>
          )}
        </aside>

        <section className="flex min-w-0 flex-col" aria-label="Conversation">
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite" aria-busy={isWorking}>
            {!activeConversationId && !localUserMessage ? (
              <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center">
                <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-[#E8E1D6]/70 text-[#5E55C9]"><MessageCircleMore aria-hidden="true" /></span>
                <h2 className="font-serif text-2xl text-[#1F2A44]">Start with a planning question</h2>
                <p className="mt-2 text-[#475467]">Try asking how a goal affects your monthly surplus, or request a review of your current plan.</p>
              </div>
            ) : null}
            {messages.isLoading ? <Loading /> : null}
            {messages.data?.map((message) => <MessageCard key={message.id} message={message} />)}
            {localUserMessage ? <MessageCard message={{ id: "pending-user", sender: "user", content: localUserMessage, citations: [] }} /> : null}
            {isWorking ? <p role="status" className="rounded-xl bg-[#FFF9F0] p-4 text-sm text-[#475467]">Reviewing your financial context…</p> : null}
            <div ref={messageEndRef} />
          </div>

          <form onSubmit={sendMessage} className="border-t border-[#E8E1D6] p-4 sm:p-5">
            <label htmlFor="planner-message" className="sr-only">Ask the AI planner</label>
            <textarea
              id="planner-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={4000}
              rows={3}
              placeholder="Ask about your plan, goals, loans, or investment assumptions…"
              className="w-full resize-none rounded-xl border border-[#E8E1D6] bg-white px-4 py-3 text-base text-[#1F2A44] outline-none placeholder:text-[#475467] focus-visible:ring-2 focus-visible:ring-[#5E55C9]"
              disabled={isWorking}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-[#475467]">Do not share passwords, card numbers, or account credentials.</p>
              <button type="submit" className={action} disabled={!draft.trim() || isWorking}>Send question</button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}

function MessageCard({ message }: { message: DisplayMessage }) {
  const isUser = message.sender === "user";
  return (
    <article className={`max-w-3xl ${isUser ? "ml-auto" : "mr-auto"}`}>
      <p className="mb-1 text-xs font-semibold text-[#475467]">{isUser ? "You" : "AI planner"}</p>
      <div className={`whitespace-pre-wrap rounded-2xl px-4 py-3 leading-7 ${isUser ? "bg-[#1F2A44] text-white" : "border border-[#E8E1D6] bg-[#FFF9F0] text-[#344054]"}`}>
        {message.content}
      </div>
      {!isUser && message.citations.length > 0 ? (
        <details className="mt-2 rounded-xl border border-[#E8E1D6] px-4 py-2">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-semibold text-[#1F2A44]"><BookOpen className="size-4" aria-hidden="true" />Sources ({message.citations.length})</summary>
          <ul className="space-y-3 pb-3 text-sm">
            {message.citations.map((citation) => (
              <li key={citation.evidenceId}>
                <a className="font-semibold text-[#5448C8] underline underline-offset-2" href={citation.canonicalSourceUrl} target="_blank" rel="noreferrer">{citation.publisher}: {citation.topic}</a>
                <p className="mt-1 text-[#475467]">Supports: {citation.claim}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </article>
  );
}
