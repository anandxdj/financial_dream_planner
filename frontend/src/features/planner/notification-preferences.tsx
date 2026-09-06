"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PageTitle, Panel, secondary } from "./ui";

export type NotificationFrequency = "realtime" | "weekly" | "monthly";

export type NotificationPreferencesState = {
  planCheckIns: boolean;
  goalMilestones: boolean;
  monthlySummary: boolean;
  driftAlerts: boolean;
  assumptionReview: boolean;
  channelInApp: boolean;
  channelEmail: boolean;
  channelPush: boolean;
  frequency: NotificationFrequency;
};

const initialPreferences: NotificationPreferencesState = {
  planCheckIns: true,
  goalMilestones: true,
  monthlySummary: false,
  driftAlerts: true,
  assumptionReview: false,
  channelInApp: true,
  channelEmail: false,
  channelPush: false,
  frequency: "weekly",
};

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferencesState>(initialPreferences);
  const [status, setStatus] = useState<string | null>(null);

  function toggle(key: keyof Omit<NotificationPreferencesState, "frequency">) {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
    setStatus(null);
  }

  function setFrequency(frequency: NotificationFrequency) {
    setPreferences((current) => ({ ...current, frequency }));
    setStatus(null);
  }

  return (
    <>
      <PageTitle title="Notification preferences" description="Explore how planning reminders could be configured in a future release.">
        <Link className={secondary} href="/dashboard/settings">Back to settings</Link>
      </PageTitle>

      <div role="note" className="mb-6 rounded-xl border border-[#B8AFE8] bg-[#F3F0FF] p-4 text-sm text-[#344054]">
        <div className="flex flex-wrap items-center gap-2"><Badge tone="neutral" size="sm">Demo preview</Badge><strong className="text-[#1F2A44]">Local state only</strong></div>
        <p className="mt-2">Changes stay on this page until it is refreshed. No email, push notification, or account preference is created.</p>
      </div>

      <div className="space-y-6">
        <Panel title="Planning updates">
          <fieldset>
            <legend className="sr-only">Choose demo notification preferences</legend>
            <div className="divide-y divide-[#E8E1D6]">
              <PreferenceRow id="plan-check-ins" title="Plan check-ins" description="A reminder to review saved plan assumptions." checked={preferences.planCheckIns} onChange={() => toggle("planCheckIns")} />
              <PreferenceRow id="goal-milestones" title="Goal milestones" description="A note when sample progress reaches a milestone." checked={preferences.goalMilestones} onChange={() => toggle("goalMilestones")} />
              <PreferenceRow id="monthly-summary" title="Monthly report summary" description="A reminder that a monthly report preview is available." checked={preferences.monthlySummary} onChange={() => toggle("monthlySummary")} />
              <PreferenceRow id="drift-alerts" title="Spending and drift alerts" description="A prompt when actual spending diverges from plan allocations." checked={preferences.driftAlerts} onChange={() => toggle("driftAlerts")} />
              <PreferenceRow id="assumption-review" title="Assumption reviews" description="A check-in when inflation or interest rate benchmarks shift." checked={preferences.assumptionReview} onChange={() => toggle("assumptionReview")} />
            </div>
          </fieldset>
        </Panel>

        <Panel title="Delivery channels (demo)">
          <p className="mb-4 text-sm text-[#475467]">
            Preview how notifications can be routed across devices. In this demo environment, no external services or web push subscriptions are registered.
          </p>
          <fieldset>
            <legend className="sr-only">Choose demo delivery channels</legend>
            <div className="divide-y divide-[#E8E1D6]">
              <PreferenceRow id="channel-in-app" title="In-app notifications" description="Deliver alerts to the planner notifications center." checked={preferences.channelInApp} onChange={() => toggle("channelInApp")} />
              <PreferenceRow id="channel-email" title="Email digest" description="Send periodic planning summaries to your registered email." checked={preferences.channelEmail} onChange={() => toggle("channelEmail")} />
              <PreferenceRow id="channel-push" title="Push notifications" description="Instant alerts on desktop browser or connected companion." checked={preferences.channelPush} onChange={() => toggle("channelPush")} />
            </div>
          </fieldset>
        </Panel>

        <Panel title="Digest frequency">
          <fieldset>
            <legend className="text-sm font-semibold text-[#1F2A44]">How often should planning summaries be delivered?</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { value: "realtime", label: "Real-time", note: "As events occur" },
                { value: "weekly", label: "Weekly digest", note: "Summary once a week" },
                { value: "monthly", label: "Monthly summary", note: "Monthly report cycle" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-colors min-h-11 ${
                    preferences.frequency === option.value
                      ? "border-[#5E55C9] bg-[#F3F0FF]"
                      : "border-[#E8E1D6] bg-[#FFFCF8] hover:bg-[#FFF9F0]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#1F2A44]">{option.label}</span>
                    <input
                      type="radio"
                      name="digest-frequency"
                      value={option.value}
                      checked={preferences.frequency === option.value}
                      onChange={() => setFrequency(option.value as NotificationFrequency)}
                      className="h-4 w-4 accent-[#5E55C9]"
                    />
                  </div>
                  <span className="mt-2 text-xs text-[#475467]">{option.note}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Panel>

        <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" className={`${secondary} w-full sm:w-auto`} onClick={() => setStatus("Demo preferences kept locally for this page only. Nothing was saved to your account.")}>Keep demo choices locally</button>
            <button type="button" className="min-h-11 rounded-lg px-3 font-semibold text-[#475467] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]" onClick={() => { setPreferences(initialPreferences); setStatus("Demo preferences reset to sample defaults."); }}>Reset defaults</button>
          </div>
          {status ? <p role="status" aria-live="polite" className="mt-4 rounded-xl bg-[#3D5C4A]/10 p-3 text-sm font-semibold text-[#3D5C4A]">{status}</p> : null}
        </div>
      </div>
    </>
  );
}

function PreferenceRow({ id, title, description, checked, onChange }: { id: string; title: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="pr-4"><label htmlFor={id} className="font-semibold text-[#1F2A44]">{title}</label><p id={`${id}-description`} className="mt-1 text-sm text-[#475467]">{description}</p></div>
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 self-start sm:self-auto">
        <input id={id} type="checkbox" className="h-5 w-5 accent-[#5E55C9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]" checked={checked} onChange={onChange} aria-describedby={`${id}-description`} />
        <span className="min-w-8 text-sm font-semibold text-[#344054]">{checked ? "On" : "Off"}</span>
      </label>
    </div>
  );
}
