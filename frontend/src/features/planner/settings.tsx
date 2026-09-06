"use client";
import Link from "next/link";
import { useState } from "react";
import { useMe } from "@/hooks/use-me";
import { useLogout } from "@/hooks/use-logout";
import { sdk } from "@/lib/sdk";
import { unwrap } from "./queries";
import { action, ErrorNotice, Loading, PageTitle, Panel, secondary } from "./ui";

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
      await unwrap(await sdk.POST("/api/v1/privacy/exports", { body: { idempotencyKey: crypto.randomUUID() } }));
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
      await unwrap(await sdk.POST("/api/v1/privacy/deletions", { body: { idempotencyKey: crypto.randomUUID() } }));
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
      <PageTitle title="Settings" description="Review your profile, privacy boundaries and account security." />
      <ErrorNotice error={me.error} retry={() => void me.refetch()} />
      {me.isPending ? (
        <Loading />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Profile">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-muted-foreground">Name</dt>
                <dd className="font-semibold">{me.data?.displayName ?? "Not available"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="font-semibold">{me.data?.email ?? "Not available"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Email verification</dt>
                <dd>{me.data?.emailVerifiedAt ? "Verified" : "Not verified"}</dd>
              </div>
            </dl>
            <p className="mt-5 text-sm text-muted-foreground">Profile editing is not available in this release.</p>
          </Panel>

          <Panel title="Saved financial data">
            <p className="text-muted-foreground">Manage your manually maintained financial records:</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link className={`${secondary} inline-block`} href="/onboarding">
                  Review planning inputs
                </Link>
              </li>
              <li>
                <Link className={`${secondary} inline-block`} href="/dashboard/accounts">
                  Manage accounts
                </Link>
              </li>
              <li>
                <Link className={`${secondary} inline-block`} href="/dashboard/goals">
                  Review goals
                </Link>
              </li>
              <li>
                <Link className={`${secondary} inline-block`} href="/dashboard/plan">
                  View saved plan
                </Link>
              </li>
            </ul>
          </Panel>

          <Panel title="Privacy & Data Export">
            <p>Your planning inputs, recorded transactions, and account balances are kept as separate data sources.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This release supports manually maintained financial data. It does not connect to a bank or change planned amounts from recorded activity.
            </p>
            <div className="mt-5">
              <button
                className={secondary}
                disabled={exportPending}
                onClick={() => void requestExport()}
              >
                {exportPending ? "Requesting export…" : "Export my data"}
              </button>
              <ErrorNotice error={exportError} />
              {exportStatus && <p role="status" className="mt-3 text-sm text-[#3D5C4A]">{exportStatus}</p>}
            </div>
          </Panel>

          <Panel title="Security">
            <p>Signing out clears financial information cached in this browser session.</p>
            <button
              className={`${secondary} mt-5`}
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? "Signing out…" : "Sign out"}
            </button>
          </Panel>

          <Panel title="Delete household data" className="lg:col-span-2">
            <p className="text-[#8A531D]">
              Permanently delete your household planning data, including saved inputs, plans, goals, accounts, and recorded transactions.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              This destructive action cannot be undone. Saved versions and historical activity will be permanently wiped.
            </p>
            <ErrorNotice error={deleteError} />
            {deleteStatus ? (
              <p role="status" className="mt-4 text-[#3D5C4A]">{deleteStatus}</p>
            ) : confirmDelete ? (
              <div className="mt-4 space-y-3 rounded-xl border border-[#A13F39] p-4">
                <p className="font-semibold text-[#A13F39]">Are you sure you want to permanently delete all data?</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    id="confirm-deletion-button"
                    className={action}
                    disabled={deletePending}
                    onClick={() => void requestDeletion()}
                  >
                    {deletePending ? "Deleting…" : "Confirm permanent deletion"}
                  </button>
                  <button
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
                id="request-deletion-button"
                className={`${secondary} mt-4 text-[#A13F39]`}
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
