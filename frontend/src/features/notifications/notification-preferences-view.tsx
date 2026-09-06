"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Phone, MessageCircle, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageTitle, Panel, secondary } from "@/features/planner/ui";
import { SettingsSubNav } from "@/components/planner/sub-nav";

export type NotificationFrequency = "realtime" | "weekly" | "monthly";

export type ChannelAlertMatrix = {
  driftAlerts: { email: boolean; sms: boolean; whatsapp: boolean };
  monthlySummary: { email: boolean; sms: boolean; whatsapp: boolean };
  goalMilestones: { email: boolean; sms: boolean; whatsapp: boolean };
};

export type NotificationPreferencesState = {
  planCheckIns: boolean;
  goalMilestones: boolean;
  monthlySummary: boolean;
  driftAlerts: boolean;
  assumptionReview: boolean;
  channelInApp: boolean;
  channelEmail: boolean;
  channelSms: boolean;
  channelWhatsApp: boolean;
  channelPush: boolean;
  frequency: NotificationFrequency;
  matrix: ChannelAlertMatrix;
};

const initialPreferences: NotificationPreferencesState = {
  planCheckIns: true,
  goalMilestones: true,
  monthlySummary: false,
  driftAlerts: true,
  assumptionReview: false,
  channelInApp: true,
  channelEmail: false,
  channelSms: false,
  channelWhatsApp: false,
  channelPush: false,
  frequency: "weekly",
  matrix: {
    driftAlerts: { email: true, sms: true, whatsapp: false },
    monthlySummary: { email: true, sms: false, whatsapp: false },
    goalMilestones: { email: true, sms: false, whatsapp: true },
  },
};

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferencesState>(initialPreferences);
  const [status, setStatus] = useState<string | null>(null);

  function toggle(key: keyof Omit<NotificationPreferencesState, "frequency" | "matrix">) {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
    setStatus(null);
  }

  function toggleMatrix(category: keyof ChannelAlertMatrix, channel: "email" | "sms" | "whatsapp") {
    setPreferences((current) => ({
      ...current,
      matrix: {
        ...current.matrix,
        [category]: {
          ...current.matrix[category],
          [channel]: !current.matrix[category][channel],
        },
      },
    }));
    setStatus(null);
  }

  function setFrequency(frequency: NotificationFrequency) {
    setPreferences((current) => ({ ...current, frequency }));
    setStatus(null);
  }

  return (
    <>
      <SettingsSubNav />
      <PageTitle
        title="Notification preferences"
        description="Configure Plan Drift alerts, Monthly budget summaries, and Goal celebrations across Email, SMS, and WhatsApp."
      >
        <Link className={secondary} href="/dashboard/settings">
          Back to settings
        </Link>
      </PageTitle>

      <div className="space-y-6">
        {/* Core Planning Alerts */}
        <Panel title="Planning updates">
          <fieldset>
            <legend className="sr-only">Choose notification preferences</legend>
            <div className="divide-y divide-[#E8E1D6]">
              <PreferenceRow
                id="plan-check-ins"
                title="Plan check-ins"
                description="A reminder to review saved plan assumptions."
                checked={preferences.planCheckIns}
                onChange={() => toggle("planCheckIns")}
              />
              <PreferenceRow
                id="goal-milestones"
                title="Goal milestone celebrations"
                tag="Goal milestones"
                description="Receive an alert when goal progress reaches a milestone."
                checked={preferences.goalMilestones}
                onChange={() => toggle("goalMilestones")}
              />
              <PreferenceRow
                id="monthly-summary"
                title="Monthly budget summaries"
                tag="Monthly report summary"
                description="A monthly briefing summarizing spending and plan progress."
                checked={preferences.monthlySummary}
                onChange={() => toggle("monthlySummary")}
              />
              <PreferenceRow
                id="drift-alerts"
                title="Plan Drift alerts"
                tag="Spending and drift alerts"
                description="A prompt when actual spending diverges from plan allocations."
                checked={preferences.driftAlerts}
                onChange={() => toggle("driftAlerts")}
              />
              <PreferenceRow
                id="assumption-review"
                title="Assumption reviews"
                description="A check-in when inflation or interest rate benchmarks shift."
                checked={preferences.assumptionReview}
                onChange={() => toggle("assumptionReview")}
              />
            </div>
          </fieldset>
        </Panel>

        {/* Multi-channel matrix for Email, SMS, WhatsApp */}
        <Panel title="Channel alerts matrix (Email, SMS & WhatsApp)">
          <p className="mb-4 text-sm text-[#475467]">
            Select which communication channels receive Plan Drift alerts, Monthly budget summaries, and Goal milestone celebrations:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse" role="table">
              <thead>
                <tr className="border-b border-[#E8E1D6]">
                  <th scope="col" className="pb-3 text-xs font-semibold uppercase tracking-wider text-[#475467]">
                    Notification Event
                  </th>
                  <th scope="col" className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-[#475467]">
                    <span className="inline-flex items-center gap-1 justify-center">
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Email
                    </span>
                  </th>
                  <th scope="col" className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-[#475467]">
                    <span className="inline-flex items-center gap-1 justify-center">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" /> SMS
                    </span>
                  </th>
                  <th scope="col" className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-[#475467]">
                    <span className="inline-flex items-center gap-1 justify-center">
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> WhatsApp
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D6]/60">
                {[
                  {
                    key: "driftAlerts" as const,
                    name: "Plan Drift alerts",
                    note: "Spending shifts and budget divergence prompts",
                  },
                  {
                    key: "monthlySummary" as const,
                    name: "Monthly budget summaries",
                    note: "Monthly budget wrap-up and savings report digests",
                  },
                  {
                    key: "goalMilestones" as const,
                    name: "Goal milestone celebrations",
                    note: "Celebrations when reaching 25%, 50%, 75% or 100% of targets",
                  },
                ].map((item) => (
                  <tr key={item.key} className="hover:bg-[#FFF9F0]/40 transition-colors">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-[#1F2A44]">{item.name}</p>
                      <p className="text-xs text-[#475467]">{item.note}</p>
                    </td>
                    {(["email", "sms", "whatsapp"] as const).map((channel) => {
                      const checked = preferences.matrix[item.key][channel];
                      const channelLabel =
                        channel === "email" ? "Email" : channel === "sms" ? "SMS" : "WhatsApp";
                      return (
                        <td key={channel} className="py-4 text-center">
                          <label className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center">
                            <input
                              type="checkbox"
                              aria-label={`${item.name} via ${channelLabel}`}
                              className="h-5 w-5 accent-[#5E55C9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]"
                              checked={checked}
                              onChange={() => toggleMatrix(item.key, channel)}
                            />
                            <span className="sr-only">
                              {item.name} via {channelLabel} {checked ? "enabled" : "disabled"}
                            </span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Global Delivery channels */}
        <Panel title="Delivery channels">
          <p className="mb-4 text-sm text-[#475467]">
            Configure how notifications are routed across your verified devices and channels.
          </p>
          <fieldset>
            <legend className="sr-only">Choose delivery channels</legend>
            <div className="divide-y divide-[#E8E1D6]">
              <PreferenceRow
                id="channel-in-app"
                title="In-app notifications"
                description="Deliver alerts to the planner notifications center."
                checked={preferences.channelInApp}
                onChange={() => toggle("channelInApp")}
              />
              <PreferenceRow
                id="channel-email"
                title="Email digest"
                description="Send periodic planning summaries to your registered email."
                checked={preferences.channelEmail}
                onChange={() => toggle("channelEmail")}
              />
              <PreferenceRow
                id="channel-sms"
                title="SMS notifications"
                description="Urgent budget and drift notifications to your registered mobile."
                checked={preferences.channelSms}
                onChange={() => toggle("channelSms")}
              />
              <PreferenceRow
                id="channel-whatsapp"
                title="WhatsApp notifications"
                description="Instant interactive milestone updates and monthly digests."
                checked={preferences.channelWhatsApp}
                onChange={() => toggle("channelWhatsApp")}
              />
              <PreferenceRow
                id="channel-push"
                title="Push notifications"
                description="Instant alerts on desktop browser or connected companion."
                checked={preferences.channelPush}
                onChange={() => toggle("channelPush")}
              />
            </div>
          </fieldset>
        </Panel>

        {/* Digest Frequency */}
        <Panel title="Digest frequency">
          <fieldset>
            <legend className="text-sm font-semibold text-[#1F2A44]">
              How often should planning summaries be delivered?
            </legend>
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

        {/* Bottom Actions */}
        <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className={`${secondary} w-full sm:w-auto`}
              onClick={() =>
                setStatus(
                  "Preferences saved successfully."
                )
              }
            >
              Save preferences
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg px-3 font-semibold text-[#475467] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]"
              onClick={() => {
                setPreferences(initialPreferences);
                setStatus("Preferences reset to defaults.");
              }}
            >
              Reset defaults
            </button>
          </div>
          {status ? (
            <p
              role="status"
              aria-live="polite"
              className="mt-4 rounded-xl bg-[#3D5C4A]/10 p-3 text-sm font-semibold text-[#3D5C4A]"
            >
              {status}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

function PreferenceRow({
  id,
  title,
  tag,
  description,
  checked,
  onChange,
}: {
  id: string;
  title: string;
  tag?: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="pr-4">
        <label htmlFor={id} className="font-semibold text-[#1F2A44] inline-flex flex-wrap items-center gap-2">
          <span>{title}</span>
          {tag && <span className="text-xs font-normal text-[#475467]">({tag})</span>}
        </label>
        <p id={`${id}-description`} className="mt-1 text-sm text-[#475467]">
          {description}
        </p>
      </div>
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 self-start sm:self-auto">
        <input
          id={id}
          type="checkbox"
          className="h-5 w-5 accent-[#5E55C9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]"
          checked={checked}
          onChange={onChange}
          aria-describedby={`${id}-description`}
        />
        <span className="min-w-8 text-sm font-semibold text-[#344054]">{checked ? "On" : "Off"}</span>
      </label>
    </div>
  );
}

