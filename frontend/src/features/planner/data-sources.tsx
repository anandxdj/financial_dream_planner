"use client";

import { Check, Clock3, Info, MessageSquareText, ShieldCheck, Smartphone } from "lucide-react";
import { useState } from "react";
import { PageTitle } from "./ui";

export function DataSources() {
  const [connected, setConnected] = useState(false);

  return (
    <>
      <PageTitle
        title="Data sources"
        description="See where your financial activity comes from and how recently it was refreshed."
      />

      <section aria-labelledby="android-source" className="overflow-hidden rounded-3xl border border-[#E8E1D6] bg-white shadow-xs">
        <div className="border-b border-[#E8E1D6] bg-[#FFFCF8] p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#5E55C9]/10 text-[#5E55C9]">
                <Smartphone aria-hidden="true" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="android-source" className="font-serif text-xl font-semibold text-[#1F2A44]">Android companion</h2>
                  <span className="rounded-full bg-[#E6B46A]/20 px-2.5 py-1 text-xs font-semibold text-[#7D5200]">Optional</span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#475467]">
                  Hand off transaction-message access to a companion app on your Android phone, then review suggested entries here.
                </p>
              </div>
            </div>
            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${connected ? "bg-[#3D5C4A]/10 text-[#3D5C4A]" : "bg-[#E8E1D6]/60 text-[#475467]"}`}
              role="status"
            >
              <span className={`size-2 rounded-full ${connected ? "bg-[#3D5C4A]" : "bg-[#98A2B3]"}`} aria-hidden="true" />
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
          <div className="p-5 sm:p-7">
            {connected ? (
              <div aria-live="polite">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric icon={<Clock3 />} label="Last synced" value="Today, 10:42 AM" detail="Fresh 3 minutes ago" />
                  <Metric icon={<Check />} label="Imported" value="18 transactions" detail="Entries verified" />
                  <Metric icon={<MessageSquareText />} label="Needs review" value="3 transactions" detail="Merchant or category unclear" />
                </div>
                <p className="mt-5 rounded-xl bg-[#3D5C4A]/8 p-4 text-sm leading-6 text-[#344054]">
                  Companion sync active. Suggested transactions remain reviewable before they affect your records.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#D0C7BA] bg-[#FFF9F0]/45 p-5 sm:p-6" aria-live="polite">
                <h3 className="font-semibold text-[#1F2A44]">No Android companion connected</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#475467]">
                  Your planner still works with manual entries. Connecting a phone is optional and can be turned off at any time.
                </p>
              </div>
            )}

            <button
              type="button"
              aria-pressed={connected}
              onClick={() => setConnected((value) => !value)}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#5E55C9] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#4E45B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:ring-offset-2 sm:w-auto"
            >
              {connected ? "Disconnect companion" : "Connect companion"}
            </button>
          </div>

          <aside className="border-t border-[#E8E1D6] bg-[#FFF9F0]/55 p-5 sm:p-7 lg:border-l lg:border-t-0" aria-labelledby="provenance-title">
            <div className="flex items-center gap-2 text-[#3D5C4A]">
              <ShieldCheck className="size-5" aria-hidden="true" />
              <h3 id="provenance-title" className="font-semibold">Where entries come from</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#475467]">
              The Android companion would read eligible transaction messages only after you grant permission on your phone. It would send structured suggestions with source and sync time attached.
            </p>
            <p className="mt-3 text-sm font-medium leading-6 text-[#1F2A44]">
              This browser cannot read your SMS messages.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-4">
      <span className="flex size-8 items-center justify-center rounded-lg bg-[#5E55C9]/10 text-[#5E55C9] [&>svg]:size-4" aria-hidden="true">{icon}</span>
      <p className="mt-4 text-xs font-semibold text-[#667085]">{label}</p>
      <p className="mt-1 font-semibold tabular-nums text-[#1F2A44]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#667085]">{detail}</p>
    </div>
  );
}
