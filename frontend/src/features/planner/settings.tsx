"use client";

import Link from "next/link";
import { useState } from "react";
import { useMe } from "@/hooks/use-me";
import { useLogout } from "@/hooks/use-logout";
import { sdk } from "@/lib/sdk";
import { unwrap } from "./queries";
import { action, ErrorNotice, Loading, PageTitle, Panel, secondary } from "./ui";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Settings() {
  const me = useMe();
  const logout = useLogout();
  const [exportPending, setExportPending] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportError, setExportError] = useState<unknown>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<unknown>();

  async function requestExport() {
    setExportPending(true);
    setExportError(null);
    setExportStatus(null);
    try {
      await unwrap(
        await sdk.POST("/api/v1/privacy/exports", {
          body: { idempotencyKey: crypto.randomUUID() },
        })
      );
      setExportStatus("Data export requested. You will receive an update when your archive is ready.");
    } catch (e) {
      setExportError(e);
    } finally {
      setExportPending(false);
    }
  }

  async function requestDeletion() {
    setDeletePending(true);
    setDeleteError(null);
    try {
      await unwrap(
        await sdk.POST("/api/v1/privacy/deletions", {
          body: { idempotencyKey: crypto.randomUUID() },
        })
      );
      setDeleteStatus("Household deletion initiated. Your data is queued for permanent removal.");
      setConfirmDelete(false);
    } catch (e) {
      setDeleteError(e);
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <>
      <PageTitle
        title="Settings"
        description="Review your profile, privacy boundaries and account security."
      />
      <ErrorNotice error={me.error} retry={() => void me.refetch()} />
      {me.isPending ? (
        <Loading />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Card */}
          <Panel title="Profile">
            <dl className="space-y-4">
              <div className="border-b border-[#E8E1D6]/60 pb-3">
                <dt className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                  Name
                </dt>
                <dd className="mt-1 font-sans text-base font-semibold text-[#1F2A44]">
                  {me.data?.displayName ?? "Not available"}
                </dd>
              </div>
              <div className="border-b border-[#E8E1D6]/60 pb-3">
                <dt className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                  Email
                </dt>
                <dd className="mt-1 font-sans text-base font-semibold text-[#1F2A44]">
                  {me.data?.email ?? "Not available"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                  Email verification
                </dt>
                <dd className="mt-1.5">
                  {me.data?.emailVerifiedAt ? (
                    <Badge tone="sage" size="sm" dot>
                      Verified
                    </Badge>
                  ) : (
                    <Badge tone="gold" size="sm">
                      Not verified
                    </Badge>
                  )}
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-xs text-[#475467]">
              Profile editing is not available in this release.
            </p>
          </Panel>

          {/* Saved Financial Data */}
          <Panel title="Saved financial data">
            <p className="text-sm text-[#475467]">
              Manage your manually maintained financial records:
            </p>
            <ul className="mt-5 space-y-3">
              <li>
                <Link
                  className={cn(
                    secondary,
                    "w-full justify-between text-left text-sm font-semibold transition-colors hover:bg-[#FFF9F0]"
                  )}
                  href="/onboarding"
                >
                  <span>Review planning inputs</span>
                  <span className="text-xs font-normal text-[#475467]">Baseline numbers</span>
                </Link>
              </li>
              <li>
                <Link
                  className={cn(
                    secondary,
                    "w-full justify-between text-left text-sm font-semibold transition-colors hover:bg-[#FFF9F0]"
                  )}
                  href="/dashboard/accounts"
                >
                  <span>Manage accounts</span>
                  <span className="text-xs font-normal text-[#475467]">Balances & types</span>
                </Link>
              </li>
              <li>
                <Link
                  className={cn(
                    secondary,
                    "w-full justify-between text-left text-sm font-semibold transition-colors hover:bg-[#FFF9F0]"
                  )}
                  href="/dashboard/goals"
                >
                  <span>Review goals</span>
                  <span className="text-xs font-normal text-[#475467]">Targets & allocations</span>
                </Link>
              </li>
              <li>
                <Link
                  className={cn(
                    secondary,
                    "w-full justify-between text-left text-sm font-semibold transition-colors hover:bg-[#FFF9F0]"
                  )}
                  href="/dashboard/plan"
                >
                  <span>View saved plan</span>
                  <span className="text-xs font-normal text-[#475467]">Saved recommendations</span>
                </Link>
              </li>
            </ul>
          </Panel>

          {/* Privacy & Data Export */}
          <Panel title="Privacy & Data Export">
            <p className="text-sm leading-relaxed text-[#1F2A44]">
              Your planning inputs, recorded transactions, and account balances are kept as separate data sources.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#475467]">
              This release supports manually maintained financial data. It does not connect to a bank or change planned amounts from recorded activity.
            </p>
            <div className="mt-6">
              <button
                type="button"
                className={secondary}
                disabled={exportPending}
                onClick={() => void requestExport()}
              >
                {exportPending ? "Requesting export…" : "Export my data"}
              </button>
              <ErrorNotice error={exportError} />
              {exportStatus && (
                <p role="status" className="mt-3 text-sm font-medium text-[#3D5C4A]">
                  {exportStatus}
                </p>
              )}
            </div>
          </Panel>

          {/* Security */}
          <Panel title="Security">
            <p className="text-sm leading-relaxed text-[#1F2A44]">
              Signing out clears financial information cached in this browser session.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#475467]">
              To protect your financial privacy on shared devices, always sign out when you are finished.
            </p>
            <button
              type="button"
              className={cn(secondary, "mt-6")}
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? "Signing out…" : "Sign out"}
            </button>
          </Panel>

          {/* Delete Household Data (Destructive Action) */}
          <Panel title="Delete household data" className="lg:col-span-2">
            <p className="text-sm font-medium text-[#8A531D]">
              Permanently delete your household planning data, including saved inputs, plans, goals, accounts, and recorded transactions.
            </p>
            <p className="mt-2 text-xs text-[#475467]">
              This destructive action cannot be undone. Saved versions and historical activity will be permanently wiped.
            </p>
            <ErrorNotice error={deleteError} />
            {deleteStatus ? (
              <p
                role="status"
                className="mt-4 rounded-xl border border-[#3D5C4A]/30 bg-[#3D5C4A]/10 p-4 text-sm font-semibold text-[#3D5C4A]"
              >
                {deleteStatus}
              </p>
            ) : confirmDelete ? (
              <div className="mt-4 space-y-3 rounded-xl border border-[#A13F39]/40 bg-[#A13F39]/5 p-5">
                <p className="text-sm font-semibold text-[#A13F39]">
                  Are you sure you want to permanently delete all data?
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    id="confirm-deletion-button"
                    className={cn(action, "bg-[#A13F39] text-white hover:bg-[#A13F39]/90")}
                    disabled={deletePending}
                    onClick={() => void requestDeletion()}
                  >
                    {deletePending ? "Deleting…" : "Confirm permanent deletion"}
                  </button>
                  <button
                    type="button"
                    className={secondary}
                    disabled={deletePending}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                id="request-deletion-button"
                className={cn(
                  secondary,
                  "mt-4 border-[#A13F39]/30 text-xs font-semibold text-[#A13F39] hover:bg-[#A13F39]/10"
                )}
                onClick={() => setConfirmDelete(true)}
              >
                Request household deletion
              </button>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
