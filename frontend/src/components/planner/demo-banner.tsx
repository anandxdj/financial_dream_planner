"use client";

import { useState, useEffect } from "react";
import { Sparkles, RotateCcw, Check, Users } from "lucide-react";
import { demoStore } from "@/lib/demo-store";
import { useRefreshFinancialViews } from "@/features/planner/queries";

export function DemoBanner() {
  const [visible, setVisible] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [activePersona, setActivePersona] = useState<"anand" | "rohit">("anand");
  const refresh = useRefreshFinancialViews();

  useEffect(() => {
    setActivePersona(demoStore.getActivePersonaId());
    const unsub = demoStore.subscribe(() => {
      setActivePersona(demoStore.getActivePersonaId());
    });
    return unsub;
  }, []);

  if (!visible) return null;

  async function handleSwitchPersona(id: "anand" | "rohit") {
    if (id === activePersona) return;
    demoStore.setActivePersonaId(id);
    await refresh();
  }

  async function handleReset() {
    setResetting(true);
    demoStore.reset();
    await refresh();
    setResetting(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2500);
  }

  const personas = demoStore.getAvailablePersonas();
  const currentPersonaInfo = personas.find((p) => p.id === activePersona) || personas[0];

  return (
    <div
      role="region"
      aria-label="Demo mode status"
      className="relative z-20 border-b border-[#5E55C9]/20 bg-gradient-to-r from-[#5E55C9]/10 via-[#FAF8F5] to-[#ECFDF5] px-4 py-2.5 text-xs text-[#1F2A44] transition-all shadow-2xs"
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5E55C9] px-2.5 py-0.5 font-semibold text-white shadow-2xs">
            <Sparkles className="size-3" />
            <span>Interactive Demo</span>
          </span>

          {/* Persona Switcher Pills */}
          <div className="flex items-center rounded-lg border border-[#5E55C9]/30 bg-white/80 p-0.5 shadow-2xs backdrop-blur-xs">
            <span className="flex items-center gap-1 px-2 text-[11px] font-medium text-[#475467]">
              <Users className="size-3 text-[#5E55C9]" />
              <span className="hidden sm:inline">Persona:</span>
            </span>
            {personas.map((p) => {
              const isSelected = p.id === activePersona;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => void handleSwitchPersona(p.id)}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    isSelected
                      ? "bg-[#5E55C9] text-white shadow-2xs"
                      : "text-[#475467] hover:bg-[#5E55C9]/10 hover:text-[#1F2A44]"
                  }`}
                  title={`Switch to ${p.name} (${p.incomeText})`}
                >
                  <span>{p.name}</span>
                  <span className={`text-[10px] font-normal ${isSelected ? "text-white/80" : "text-[#717680]"}`}>
                    ({p.incomeText})
                  </span>
                </button>
              );
            })}
          </div>

          <span className="hidden xl:inline text-[#475467]">
            Active: <strong className="font-semibold text-[#1F2A44]">{currentPersonaInfo.name}</strong> ({currentPersonaInfo.highlight})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E1D6] bg-white px-2.5 py-1 font-semibold text-[#1F2A44] shadow-2xs transition-colors hover:bg-[#FFF9F0] disabled:opacity-50"
            title={`Reset ${currentPersonaInfo.name}'s accounts, transactions, and goals`}
          >
            {resetDone ? (
              <>
                <Check className="size-3.5 text-[#047857]" />
                <span className="text-[#047857]">Reset Complete</span>
              </>
            ) : (
              <>
                <RotateCcw className={`size-3.5 text-[#5E55C9] ${resetting ? "animate-spin" : ""}`} />
                <span>Reset Data</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-[11px] font-medium text-[#475467] hover:text-[#1F2A44] px-1"
            title="Dismiss banner"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

