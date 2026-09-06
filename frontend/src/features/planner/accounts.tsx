"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { sdk } from "@/lib/sdk";
import { useAccounts, unwrap, useRefreshFinancialViews } from "./queries";
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

const schema = z.object({
  name: z.string().trim().min(1, "Enter an account name").max(100),
  type: z.enum([
    "SAVINGS",
    "CURRENT",
    "CREDIT_CARD",
    "WALLET",
    "BROKERAGE",
    "LOAN",
    "CASH",
    "OTHER",
  ]),
  currentBalance: z
    .string()
    .regex(/^$|^-?\d+(?:\.\d{1,2})?$/, "Use a decimal amount with up to two places"),
});

type Values = z.infer<typeof schema>;

export function Accounts() {
  const query = useAccounts();
  const refresh = useRefreshFinancialViews();
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<unknown>();
  const [saved, setSaved] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: "SAVINGS", currentBalance: "" },
  });

  async function submit(values: Values) {
    setError(null);
    setSaved(false);
    try {
      const body = {
        ...values,
        currency: "INR",
        currentBalance: values.currentBalance || undefined,
      };
      if (editing) {
        unwrap(
          await sdk.PATCH("/api/v1/accounts/{id}", {
            params: { path: { id: editing } },
            body,
          })
        );
      } else {
        unwrap(await sdk.POST("/api/v1/accounts", { body }));
      }
      await refresh();
      setEditing(null);
      form.reset();
      setSaved(true);
    } catch (e) {
      setError(e);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      unwrap(await sdk.DELETE("/api/v1/accounts/{id}", { params: { path: { id } } }));
      await refresh();
      setDeleting(null);
      document.getElementById("account-name")?.focus();
    } catch (e) {
      setError(e);
    }
  }

  return (
    <>
      <PageTitle
        title="Accounts"
        description="Keep balances and their last update visible. Your saved planning assumptions change only when you review them."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left Column: Account List */}
        <Panel title="Your accounts">
          <ErrorNotice error={query.error} retry={() => void query.refetch()} />
          {query.isPending && <Loading />}
          {query.data?.length === 0 && (
            <Empty>Add your first account using the form. A balance can be left unknown.</Empty>
          )}

          <ul className="divide-y divide-[#E8E1D6]/60">
            {query.data?.map((account) => (
              <li
                key={account.id}
                className="flex flex-wrap items-start justify-between gap-4 py-5"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans text-lg font-semibold text-[#1F2A44]">
                      {account.name}
                    </h3>
                    <Badge tone="neutral" size="sm">
                      {account.type.replaceAll("_", " ").toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#475467]">
                    {account.type.replaceAll("_", " ").toLowerCase()} · {account.currency}
                  </p>
                  <p className="pt-1 text-2xl font-serif tabular-nums text-[#1F2A44]">
                    {money(account.currentBalance, account.currency)}
                  </p>
                  <p className="text-xs text-[#475467]">
                    Balance updated {date(account.balanceUpdatedAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={`${secondary} text-xs font-semibold`}
                    onClick={() => {
                      setEditing(account.id);
                      form.reset({
                        name: account.name,
                        type: account.type as Values["type"],
                        currentBalance: account.currentBalance ?? "",
                      });
                      setSaved(false);
                      document.getElementById("account-name")?.focus();
                    }}
                  >
                    Edit<span className="sr-only"> {account.name}</span>
                  </button>

                  {deleting === account.id ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        id={`confirm-delete-${account.id}`}
                        className={cn(
                          secondary,
                          "border-[#A13F39]/40 text-xs font-semibold text-[#A13F39] hover:bg-[#A13F39]/10"
                        )}
                        onClick={() => void remove(account.id)}
                      >
                        Confirm delete<span className="sr-only"> {account.name}</span>
                      </button>
                      <button
                        type="button"
                        className={`${secondary} text-xs font-semibold`}
                        onClick={() => {
                          setDeleting(null);
                          requestAnimationFrame(() =>
                            document.getElementById(`delete-${account.id}`)?.focus()
                          );
                        }}
                      >
                        Keep account
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id={`delete-${account.id}`}
                      className={cn(
                        secondary,
                        "border-[#A13F39]/30 text-xs font-semibold text-[#A13F39] hover:bg-[#A13F39]/10"
                      )}
                      onClick={() => {
                        setDeleting(account.id);
                        requestAnimationFrame(() =>
                          document.getElementById(`confirm-delete-${account.id}`)?.focus()
                        );
                      }}
                    >
                      Delete<span className="sr-only"> {account.name}</span>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Right Column: Account Form */}
        <Panel title={editing ? "Edit account" : "Add an account"}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <Field
              id="account-name"
              label="Account name"
              {...form.register("name")}
              autoComplete="off"
            />

            <div className="space-y-1.5">
              <label htmlFor="account-type-select" className="block text-sm font-semibold text-[#1F2A44]">
                Account type
              </label>
              <select
                id="account-type-select"
                className={cn(control, "bg-[#FFFCF8] text-base capitalize")}
                {...form.register("type")}
              >
                {schema.shape.type.options.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ").toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <Field
              label="Current balance (INR)"
              inputMode="decimal"
              hint="Leave blank if unknown. An entered balance is a manual observation."
              {...form.register("currentBalance")}
            />

            {Object.values(form.formState.errors).map((e, i) => (
              <p role="alert" className="text-xs font-medium text-[#A13F39]" key={i}>
                {e.message}
              </p>
            ))}

            <ErrorNotice error={error} />

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className={action}
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Saving…" : "Save account"}
              </button>

              {editing && (
                <button
                  type="button"
                  className={secondary}
                  onClick={() => {
                    setEditing(null);
                    form.reset({ name: "", type: "SAVINGS", currentBalance: "" });
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>

            {saved && (
              <p role="status" className="pt-2 text-xs font-semibold text-[#3D5C4A]">
                Account saved.
              </p>
            )}
          </form>
        </Panel>
      </div>
    </>
  );
}
