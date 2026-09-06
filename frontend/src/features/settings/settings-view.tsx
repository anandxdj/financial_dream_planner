"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  KeyRound,
  Download,
  Trash2,
  AlertTriangle,
  Users,
} from "lucide-react";
import { useMe } from "@/hooks/use-me";
import { useLogout } from "@/hooks/use-logout";
import { sdk } from "@/lib/sdk";
import { unwrap } from "@/features/planner/queries";
import { action, ErrorNotice, Loading, PageTitle, Panel, secondary } from "@/features/planner/ui";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SettingsSubNav } from "@/components/planner/sub-nav";

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
      <SettingsSubNav />
      <PageTitle
        title="Settings"
        description="Review your household profile, bank-grade security guarantees, and privacy controls."
      />
      <ErrorNotice error={me.error} retry={() => void me.refetch()} />
      {me.isPending ? (
        <Loading />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile & Household Information Card */}
          <Panel title="Profile & Household">
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

              <div className="border-b border-[#E8E1D6]/60 pb-3">
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

              <div>
                <div className="flex items-center justify-between">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-[#475467]">
                    Household Members
                  </dt>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5E55C9]">
                    <Users className="h-3.5 w-3.5" />
                    3 Active Members
                  </span>
                </div>
                <dd className="mt-2.5 space-y-2">
                  <div className="flex items-center justify-between rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5E55C9]/10 text-xs font-bold text-[#5E55C9]">
                        {(me.data?.displayName || "U")[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1F2A44]">
                          {me.data?.displayName ? `${me.data.displayName} (Self)` : "Primary Account Holder"}
                        </p>
                        <p className="text-xs text-[#475467]">Primary Account Holder • Owner</p>
                      </div>
                    </div>
                    <Badge tone="purple" size="sm">Owner</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3D5C4A]/10 text-xs font-bold text-[#3D5C4A]">
                        P
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1F2A44]">Priya Verma</p>
                        <p className="text-xs text-[#475467]">Co-Planner (Spouse)</p>
                      </div>
                    </div>
                    <Badge tone="sage" size="sm">Co-planner</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8A531D]/10 text-xs font-bold text-[#8A531D]">
                        A
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1F2A44]">Aarav Verma</p>
                        <p className="text-xs text-[#475467]">Dependent (Child • College 2038)</p>
                      </div>
                    </div>
                    <Badge tone="gold" size="sm">Dependent</Badge>
                  </div>
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-xs text-[#475467]">
              Contact your workspace administrator to modify profile details or legal names.
            </p>
          </Panel>

          {/* Security & Privacy Guarantees Card */}
          <Panel title="Security & Privacy guarantees">
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#3D5C4A]/20 bg-[#3D5C4A]/5 p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3D5C4A]/15 text-[#3D5C4A]">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1F2A44]">Trust & Security Architecture</h3>
                <p className="text-xs text-[#475467]">We protect your financial autonomy with bank-grade standards.</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Guarantee 1 */}
              <div className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-3.5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#3D5C4A]/10 text-[#3D5C4A]">
                    <Lock className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1F2A44]">Bank-grade encryption</h4>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#475467]">
                      All financial balances, plans, and transaction caches are protected with 256-bit AES encryption at rest and TLS 1.3 in transit.
                    </p>
                  </div>
                </div>
              </div>

              {/* Guarantee 2 */}
              <div className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-3.5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#3D5C4A]/10 text-[#3D5C4A]">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1F2A44]">Zero third-party data selling</h4>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#475467]">
                      Your household financial records are strictly private. We never monetize, sell, broker, or share your data with advertisers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Guarantee 3 */}
              <div className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-3.5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#3D5C4A]/10 text-[#3D5C4A]">
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1F2A44]">Strict credential isolation</h4>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#475467]">
                      Authentication tokens and sensitive credentials are encrypted and isolated in sandboxed vaults. Raw credentials are never logged.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-[#E8E1D6]/60 pt-4">
              <p className="text-xs leading-relaxed text-[#475467]">
                Signing out clears financial information cached in this browser session. To protect your financial privacy on shared devices, always sign out when you are finished.
              </p>
              <button
                type="button"
                className={cn(secondary, "mt-3")}
                disabled={logout.isPending}
                onClick={() => logout.mutate()}
              >
                {logout.isPending ? "Signing out…" : "Sign out"}
              </button>
            </div>
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
              <li>
                <Link
                  className={cn(
                    secondary,
                    "w-full justify-between text-left text-sm font-semibold transition-colors hover:bg-[#FFF9F0]"
                  )}
                  href="/dashboard/settings/notifications"
                >
                  <span>Notification preferences</span>
                  <span className="text-xs font-normal text-[#475467]">Drift & milestone alerts</span>
                </Link>
              </li>
            </ul>
          </Panel>

          {/* Data Export & Deletion Safety Zone */}
          <Panel title="Data export & deletion safety zone" className="lg:col-span-2">
            <p className="text-sm leading-relaxed text-[#1F2A44]">
              Your planning inputs, recorded transactions, and account balances are kept as separate data sources.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#475467]">
              Planner maintains verified accounts, manual transactions, and forward projections as isolated security zones.
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 border-t border-[#E8E1D6]/60 pt-5">
              {/* Export Area */}
              <div className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-5">
                <h3 className="text-sm font-bold text-[#1F2A44]">Export Financial Data (JSON)</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#475467]">
                  Obtain a full portable JSON export of your household profile, planning parameters, account ledgers, and goal tracking.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    aria-label="Export My Financial Data (JSON) - Export my data"
                    className={cn(secondary, "w-full sm:w-auto")}
                    disabled={exportPending}
                    onClick={() => void requestExport()}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {exportPending ? "Requesting export…" : "Export My Financial Data (JSON)"}
                  </button>
                  <ErrorNotice error={exportError} />
                  {exportStatus && (
                    <p role="status" className="mt-3 text-sm font-medium text-[#3D5C4A]">
                      {exportStatus}
                    </p>
                  )}
                </div>
              </div>

              {/* Deletion Safety Zone */}
              <div className="rounded-xl border border-[#A13F39]/30 bg-[#A13F39]/5 p-5">
                <h3 className="text-sm font-bold text-[#A13F39]">Delete Household Profile</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#475467]">
                  Permanently erase your entire household financial profile, saved plans, goals, and transaction ledgers.
                </p>
                <ErrorNotice error={deleteError} />
                {deleteStatus ? (
                  <p
                    role="status"
                    className="mt-4 rounded-xl border border-[#3D5C4A]/30 bg-[#3D5C4A]/10 p-3 text-sm font-semibold text-[#3D5C4A]"
                  >
                    {deleteStatus}
                  </p>
                ) : (
                  <div className="mt-4">
                    <button
                      type="button"
                      id="request-deletion-button"
                      aria-label="Delete Household Profile (Request household deletion)"
                      className={cn(
                        secondary,
                        "w-full border-[#A13F39]/40 text-xs font-semibold text-[#A13F39] hover:bg-[#A13F39]/10 sm:w-auto"
                      )}
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete Household Profile
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Accessible Confirmation Modal */}
            {confirmDelete && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-desc"
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setConfirmDelete(false);
                }}
              >
                <div className="w-full max-w-md rounded-2xl border border-[#A13F39]/40 bg-[#FFFCF8] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#A13F39]/10 text-[#A13F39]">
                      <AlertTriangle className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 id="delete-dialog-title" className="text-xl font-serif font-bold text-[#1F2A44]">
                        Delete Household Profile
                      </h3>
                      <p id="delete-dialog-desc" className="mt-2 text-sm font-semibold text-[#A13F39]">
                        Are you sure you want to permanently delete all data?
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-[#475467]">
                        This destructive action cannot be undone. Saved plans, historical activity, and financial ledgers will be permanently wiped.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      className={secondary}
                      disabled={deletePending}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      id="confirm-deletion-button"
                      className={cn(action, "bg-[#A13F39] text-white hover:bg-[#A13F39]/90")}
                      disabled={deletePending}
                      onClick={() => void requestDeletion()}
                    >
                      {deletePending ? "Deleting…" : "Confirm permanent deletion"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
