"use client";

import React, { useMemo } from "react";

function renderFormattedLine(line: string): React.ReactNode {
  const parts = line.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-[#1F2A44]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function MarkdownContent({ content }: { content: string }) {
  const blocks = useMemo(() => {
    const lines = content.split("\n");
    const parsedBlocks: React.ReactNode[] = [];
    let listBuffer: string[] = [];

    const flushList = (keyPrefix: string) => {
      if (listBuffer.length === 0) return;
      parsedBlocks.push(
        <ul key={`${keyPrefix}-list`} className="my-2 space-y-1.5 pl-1">
          {listBuffer.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-[#344054] leading-relaxed">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#5E55C9]" />
              <div>{renderFormattedLine(item)}</div>
            </li>
          ))}
        </ul>,
      );
      listBuffer = [];
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList(`flush-${index}`);
        return;
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        listBuffer.push(trimmed.slice(2));
        return;
      }

      flushList(`flush-${index}`);
      if (trimmed.startsWith("#")) {
        const headingMatch = trimmed.match(/^(#{1,4})\s*(.+)$/);
        if (headingMatch) {
          const headingText = headingMatch[2];
          const stepMatch = headingText.match(/^(\d+)[\.\s]+(.+)$/);
          if (stepMatch) {
            parsedBlocks.push(
              <div key={`heading-${index}`} className="mt-4 mb-2 flex items-center gap-2.5">
                <span className="flex size-6 items-center justify-center rounded-lg bg-[#5E55C9]/15 text-[#5E55C9] font-sans text-xs font-bold shadow-2xs">
                  {stepMatch[1]}
                </span>
                <h3 className="font-serif text-base font-semibold text-[#1F2A44]">{stepMatch[2]}</h3>
              </div>,
            );
          } else {
            parsedBlocks.push(
              <h3 key={`heading-${index}`} className="mt-4 mb-2 font-serif text-base font-semibold text-[#1F2A44] border-b border-[#E8E1D6]/40 pb-1">
                {headingText}
              </h3>,
            );
          }
          return;
        }
      }

      if (trimmed.startsWith("> ")) {
        parsedBlocks.push(
          <blockquote key={`quote-${index}`} className="my-2 rounded-r-xl border-l-3 border-[#5E55C9] bg-[#5E55C9]/5 px-3.5 py-2 text-xs text-[#1F2A44] italic">
            {renderFormattedLine(trimmed.slice(2))}
          </blockquote>,
        );
        return;
      }

      parsedBlocks.push(
        <p key={`p-${index}`} className="my-1.5 text-sm leading-relaxed text-[#344054]">
          {renderFormattedLine(trimmed)}
        </p>,
      );
    });

    flushList("final");
    return parsedBlocks;
  }, [content]);

  return <div className="space-y-1">{blocks}</div>;
}
