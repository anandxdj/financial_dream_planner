"use client";

import Image from "next/image";
import { BookOpen, ExternalLink, Sparkles } from "lucide-react";
import type { PlannerMessage } from "../services/ai.service";
import { getPlannerMessageMetadata } from "../types";
import { MarkdownContent } from "./markdown-content";

export type DisplayPlannerMessage = Pick<
  PlannerMessage,
  "id" | "sender" | "content" | "citations" | "metadata"
>;

export function MessageCard({ message }: { message: DisplayPlannerMessage }) {
  const isUser = message.sender === "user";
  const metadata = getPlannerMessageMetadata(message.metadata);

  if (isUser) {
    return (
      <article className="ml-auto max-w-[85%] sm:max-w-2xl flex flex-col items-end">
        <div className="mb-1 flex items-center gap-1.5 text-xs text-[#667085]">
          <span className="font-semibold text-[#1A2238]">You</span>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="rounded-2xl rounded-tr-xs border border-[#E8E1D6] bg-[#FFFCF8] px-4 py-3 text-sm text-[#1F2A44] shadow-xs leading-relaxed">
            {message.content}
          </div>
          <div className="size-8 rounded-full bg-[#1F2A44] text-white flex items-center justify-center text-xs font-semibold shrink-0 shadow-2xs mt-0.5">
            You
          </div>
        </div>
      </article>
    );
  }

  const isEngineBacked =
    metadata.grounding === "engine-backed" ||
    metadata.toolExecutions?.some((tool) => tool.kind === "financial_calculation");
  const planLabel = metadata.planVersionNumber ? `Plan v${metadata.planVersionNumber}` : null;
  const asOfLabel = metadata.planAsOf
    ? `As of ${new Date(metadata.planAsOf).toLocaleDateString("en-IN")}`
    : null;

  return (
    <article className="mr-auto max-w-full sm:max-w-3xl w-full flex items-start gap-3">
      <div className="relative size-10 shrink-0 rounded-full border border-[#5E55C9]/20 bg-[#F4F1FD] p-1 overflow-hidden shadow-2xs mt-1">
        <Image
          src="/Assets/Characters/ai_assistant_orb.png"
          alt="AI planner"
          fill
          className="object-contain p-0.5"
        />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-[#1A2238]">AI planner</p>
          <span className="rounded-full bg-[#5E55C9]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5E55C9] border border-[#5E55C9]/20">
            {isEngineBacked ? "Engine-backed" : "AI-assisted"}
          </span>
        </div>

        {(planLabel || asOfLabel || metadata.engineVersion || message.citations.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5" aria-label="Response provenance">
            {planLabel && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#8FA9D6]/40 bg-[#8FA9D6]/15 px-2.5 py-0.5 text-xs font-medium text-[#1A2238]">
                <Sparkles className="size-3 text-[#5E55C9]" aria-hidden="true" />
                {planLabel}
              </span>
            )}
            {asOfLabel && (
              <span className="inline-flex items-center rounded-full border border-[#8FA9D6]/40 bg-[#8FA9D6]/15 px-2.5 py-0.5 text-xs font-medium text-[#1A2238]">
                {asOfLabel}
              </span>
            )}
            {metadata.engineVersion && (
              <span className="inline-flex items-center rounded-full border border-[#E8E1D6] bg-white px-2.5 py-0.5 text-xs font-medium text-[#667085]">
                Engine {metadata.engineVersion}
              </span>
            )}
            {message.citations.map((citation) => (
              <span
                key={citation.evidenceId}
                className="inline-flex items-center gap-1 rounded-full border border-[#E8E1D6] bg-white px-2.5 py-0.5 text-xs font-medium text-[#5E55C9]"
              >
                <BookOpen className="size-3" aria-hidden="true" />
                {citation.publisher}
              </span>
            ))}
          </div>
        )}

        <div className="rounded-2xl rounded-tl-xs border border-[#E5E0F8] bg-[#FBF9FE] p-5 text-sm text-[#1F2A44] shadow-2xs leading-relaxed">
          <MarkdownContent content={message.content} />
        </div>

        {message.citations.length > 0 && (
          <details className="mt-2 rounded-2xl border border-[#EAE5DE] bg-white px-4 py-2 shadow-2xs">
            <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-semibold text-[#1A2238]">
              <BookOpen className="size-4 text-[#5E55C9]" aria-hidden="true" />
              Sources ({message.citations.length})
            </summary>
            <ul className="space-y-2.5 pb-2 pt-1 text-xs">
              {message.citations.map((citation) => (
                <li key={citation.evidenceId} className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-3">
                  <a
                    className="font-semibold text-[#5E55C9] underline underline-offset-2 flex items-center gap-1"
                    href={citation.canonicalSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{citation.publisher}: {citation.topic}</span>
                    <ExternalLink className="size-3" />
                  </a>
                  <p className="mt-1 text-[#475467]">Supports: {citation.claim}</p>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </article>
  );
}
