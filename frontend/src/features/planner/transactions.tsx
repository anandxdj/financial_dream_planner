"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { sdk } from "@/lib/sdk";
import { useAccounts, useCategories, useRefreshFinancialViews, unwrap } from "./queries";
import {
  action,
  secondary,
  control,
  Field,
  Panel,
  PageTitle,
  Loading,
  ErrorNotice,
  Empty,
  money,
  date,
} from "./ui";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Transactions() {
  const params = useSearchParams();
  const router = useRouter();
  const direction = params.get("direction") as "DEBIT" | "CREDIT" | null;
  const status = params.get("status") as "verified" | "needs_review" | "pending" | null;
  const accountId = params.get("accountId") || undefined;
  const categoryId = params.get("categoryId") || undefined;
  const startDate = params.get("startDate") || undefined;
  const endDate = params.get("endDate") || undefined;

  const query = useQuery({
    queryKey: ["transactions", params.toString()],
    queryFn: async () =>
      unwrap(
        await sdk.GET("/api/v1/transactions", {
          params: {
            query: {
              limit: 25,
              cursor: params.get("cursor") || undefined,
              direction: direction || undefined,
              status: status || undefined,
              accountId,
              categoryId,
              startDate,
              endDate,
            },
          },
        })
      ),
  });

  const accounts = useAccounts();
  const categories = useCategories();

  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.delete("cursor");
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/dashboard/transactions?${next}`);
  }

  return (
    <>
      <PageTitle
        title="Transactions"
        description="Recorded activity is separate from the monthly amounts in your plan."
      >
        <Link className={action} href="/dashboard/transactions/new">
          Add transaction
        </Link>
      </PageTitle>

      <Panel title="Recorded activity">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block space-y-1.5 text-sm font-semibold text-[#1F2A44]">
            Direction
            <select
              className={cn(control, "mt-1 font-sans text-sm font-normal text-[#344054]")}
              value={direction ?? ""}
              onChange={(e) => filter("direction", e.target.value)}
            >
              <option value="">All directions</option>
              <option value="DEBIT">Money out</option>
              <option value="CREDIT">Money in</option>
            </select>
          </label>

          <label className="block space-y-1.5 text-sm font-semibold text-[#1F2A44]">
            Status
            <select
              className={cn(control, "mt-1 font-sans text-sm font-normal text-[#344054]")}
              value={status ?? ""}
              onChange={(e) => filter("status", e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="needs_review">Needs review</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </label>

          <label className="block space-y-1.5 text-sm font-semibold text-[#1F2A44]">
            Account
            <select
              className={cn(control, "mt-1 font-sans text-sm font-normal text-[#344054]")}
              value={accountId ?? ""}
              onChange={(e) => filter("accountId", e.target.value)}
            >
              <option value="">All accounts</option>
              {accounts.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5 text-sm font-semibold text-[#1F2A44]">
            Category
            <select
              className={cn(control, "mt-1 font-sans text-sm font-normal text-[#344054]")}
              value={categoryId ?? ""}
              onChange={(e) => filter("categoryId", e.target.value)}
            >
              <option value="">All categories</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5 text-sm font-semibold text-[#1F2A44]">
            From date
            <input
              type="date"
              className={cn(control, "mt-1 font-sans text-sm font-normal text-[#344054]")}
              value={startDate ?? ""}
              onChange={(e) => filter("startDate", e.target.value)}
            />
          </label>

          <label className="block space-y-1.5 text-sm font-semibold text-[#1F2A44]">
            To date
            <input
              type="date"
              className={cn(control, "mt-1 font-sans text-sm font-normal text-[#344054]")}
              value={endDate ?? ""}
              onChange={(e) => filter("endDate", e.target.value)}
            />
          </label>
        </div>

        <ErrorNotice error={query.error} retry={() => void query.refetch()} />
        {query.isPending && <Loading />}
        {query.data?.data.length === 0 && (
          <Empty>No transactions match these filters. Add a manual transaction or change the filters.</Empty>
        )}

        <ul className="divide-y divide-[#E8E1D6]/60">
          {query.data?.data.map((t) => {
            const tone =
              t.status === "verified"
                ? "sage"
                : t.status === "needs_review"
                  ? "gold"
                  : "neutral";
            return (
              <li key={t.id}>
                <Link
                  href={`/dashboard/transactions/${t.id}`}
                  className="group flex min-h-20 flex-wrap items-center justify-between gap-3 rounded-xl px-2 py-4 transition-colors hover:bg-[#FFF9F0] focus-visible:outline-2 focus-visible:outline-[#5E55C9]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-sans font-semibold text-[#1F2A44] transition-colors group-hover:text-[#5E55C9]">
                        {t.merchantName || t.description || "Manual transaction"}
                      </p>
                      <Badge tone={tone} size="sm">
                        {t.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#475467]">
                      {date(t.occurredAt)} · {t.status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-lg font-semibold tabular-nums text-[#1F2A44]">
                      {money(t.amount, t.currency)}
                    </p>
                    <p
                      className={cn(
                        "text-xs font-medium",
                        t.direction === "DEBIT" ? "text-[#475467]" : "text-[#3D5C4A]"
                      )}
                    >
                      {t.direction === "DEBIT" ? "Money out" : "Money in"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {(params.has("cursor") || query.data?.nextCursor) && (
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#E8E1D6]/60 pt-4">
            {params.has("cursor") && (
              <button
                type="button"
                className={secondary}
                onClick={() => filter("cursor", "")}
              >
                First page
              </button>
            )}
            {query.data?.nextCursor && (
              <button
                type="button"
                className={secondary}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set("cursor", query.data!.nextCursor!);
                  router.push(`/dashboard/transactions?${next}`);
                }}
              >
                Next page
              </button>
            )}
          </div>
        )}
      </Panel>
    </>
  );
}

export function TransactionEditor({ id }: { id?: string }) {
  const accounts = useAccounts();
  const categories = useCategories();
  const refresh = useRefreshFinancialViews();
  const router = useRouter();
  const [error, setError] = useState<unknown>();
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const query = useQuery({
    queryKey: ["transactions", id],
    enabled: !!id,
    queryFn: async () =>
      unwrap(
        await sdk.GET("/api/v1/transactions/{id}", {
          params: { path: { id: id! } },
        })
      ).data,
  });

  async function submit(form: FormData) {
    setPending(true);
    setError(null);
    const get = (key: string) => String(form.get(key) ?? "");
    try {
      const common = {
        merchantName: get("merchantName"),
        description: get("description"),
        accountId: get("accountId") || undefined,
        categoryId: get("categoryId") || undefined,
      };
      if (id) {
        unwrap(
          await sdk.PATCH("/api/v1/transactions/{id}", {
            params: { path: { id } },
            body: {
              ...common,
              accountId: get("accountId") || null,
              categoryId: get("categoryId") || null,
              status: get("status") as "verified" | "needs_review" | "pending",
            },
          })
        );
      } else {
        unwrap(
          await sdk.POST("/api/v1/transactions", {
            body: {
              ...common,
              amount: get("amount"),
              direction: get("direction") as "DEBIT" | "CREDIT",
              currency: "INR",
              occurredAt: new Date(get("occurredAt")).toISOString(),
            },
          })
        );
      }
      await refresh();
      router.push("/dashboard/transactions");
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!id) return;
    setPending(true);
    setError(null);
    try {
      unwrap(
        await sdk.DELETE("/api/v1/transactions/{id}", {
          params: { path: { id } },
        })
      );
      await refresh();
      router.push("/dashboard/transactions");
    } catch (e) {
      setError(e);
      setPending(false);
    }
  }

  if (id && query.isPending) return <Loading />;

  return (
    <>
      <PageTitle
        title={id ? "Review transaction" : "Add transaction"}
        description={
          id
            ? "Review the merchant, account, category, description and status."
            : "Record an observation without changing your monthly plan."
        }
      />
      <div className="max-w-2xl space-y-6">
        <Panel title={id ? "Transaction details" : "Manual entry"}>
          <ErrorNotice error={query.error} retry={() => void query.refetch()} />
          {(!id || query.data) && (
            <form action={submit} className="space-y-4">
              {id ? (
                <div className="rounded-xl border border-[#E8E1D6] bg-[#FFF9F0]/60 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#475467]">
                    Recorded observation
                  </p>
                  <p className="font-serif text-xl font-semibold tabular-nums text-[#1F2A44]">
                    {money(query.data?.amount, query.data?.currency)} · {date(query.data?.occurredAt)} · {query.data?.direction === "DEBIT" ? "Money out" : "Money in"}
                  </p>
                  <p className="mt-1 text-xs text-[#475467]">
                    Amount and timestamp are preserved from the original record to protect audit integrity.
                  </p>
                </div>
              ) : (
                <>
                  <Field
                    label="Amount (INR)"
                    name="amount"
                    required
                    inputMode="decimal"
                    pattern="[0-9]+(\.[0-9]{1,2})?"
                    hint="Numeric amount with up to two decimal places"
                  />
                  <div className="space-y-1.5">
                    <label htmlFor="tx-direction" className="block text-sm font-semibold text-[#1F2A44]">
                      Direction
                    </label>
                    <select id="tx-direction" name="direction" className={control}>
                      <option value="DEBIT">Money out</option>
                      <option value="CREDIT">Money in</option>
                    </select>
                  </div>
                  <Field
                    label="Date and time"
                    name="occurredAt"
                    type="datetime-local"
                    required
                    hint="The date and time when this activity occurred"
                  />
                </>
              )}

              <Field
                label="Merchant"
                name="merchantName"
                maxLength={255}
                defaultValue={query.data?.merchantName ?? ""}
                placeholder="e.g. Grocery store, Utility bill, Rent"
              />

              <Field
                label="Description"
                name="description"
                maxLength={500}
                defaultValue={query.data?.description ?? ""}
                placeholder="Optional context note"
              />

              <div className="space-y-1.5">
                <label htmlFor="tx-account" className="block text-sm font-semibold text-[#1F2A44]">
                  Account
                </label>
                <select
                  id="tx-account"
                  name="accountId"
                  className={control}
                  defaultValue={query.data?.accountId ?? ""}
                >
                  <option value="">Unassigned</option>
                  {accounts.data?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tx-category" className="block text-sm font-semibold text-[#1F2A44]">
                  Category
                </label>
                <select
                  id="tx-category"
                  name="categoryId"
                  className={control}
                  defaultValue={query.data?.categoryId ?? ""}
                >
                  <option value="">Uncategorized</option>
                  {categories.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {id && (
                <div className="space-y-1.5">
                  <label htmlFor="tx-review-status" className="block text-sm font-semibold text-[#1F2A44]">
                    Review status
                  </label>
                  <select
                    id="tx-review-status"
                    name="status"
                    className={control}
                    defaultValue={query.data?.status}
                  >
                    <option value="verified">Verified</option>
                    <option value="needs_review">Needs review</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              )}

              <ErrorNotice error={error} />

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" className={action} disabled={pending}>
                  {pending ? "Saving…" : "Save transaction"}
                </button>
                <Link className={secondary} href="/dashboard/transactions">
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </Panel>

        {id && (
          <Panel title="Delete transaction">
            <p className="mb-4 text-sm text-[#475467]">
              Remove this transaction from your recorded ledger. This action cannot be undone.
            </p>
            {confirmDelete ? (
              <div className="space-y-3 rounded-xl border border-[#A13F39]/40 bg-[#A13F39]/5 p-4">
                <p className="text-sm font-semibold text-[#A13F39]">
                  Delete this recorded transaction? This cannot be undone.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    id="confirm-transaction-delete"
                    className={cn(
                      secondary,
                      "border-[#A13F39]/40 text-xs font-semibold text-[#A13F39] hover:bg-[#A13F39]/10"
                    )}
                    disabled={pending}
                    onClick={() => void remove()}
                  >
                    {pending ? "Deleting…" : "Confirm delete"}
                  </button>
                  <button
                    type="button"
                    className={`${secondary} text-xs font-semibold`}
                    disabled={pending}
                    onClick={() => {
                      setConfirmDelete(false);
                      requestAnimationFrame(() =>
                        document.getElementById("delete-transaction")?.focus()
                      );
                    }}
                  >
                    Keep transaction
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                id="delete-transaction"
                className={cn(
                  secondary,
                  "border-[#A13F39]/30 text-xs font-semibold text-[#A13F39] hover:bg-[#A13F39]/10"
                )}
                onClick={() => {
                  setConfirmDelete(true);
                  requestAnimationFrame(() =>
                    document.getElementById("confirm-transaction-delete")?.focus()
                  );
                }}
              >
                Delete transaction
              </button>
            )}
          </Panel>
        )}
      </div>
    </>
  );
}
