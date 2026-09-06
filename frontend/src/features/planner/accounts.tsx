"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { sdk } from "@/lib/sdk";
import { useAccounts, unwrap, useRefreshFinancialViews } from "./queries";
import { action, secondary, control, Field, Panel, PageTitle, Loading, ErrorNotice, Empty, money, date } from "./ui";

const schema = z.object({ name: z.string().trim().min(1, "Enter an account name").max(100), type: z.enum(["SAVINGS", "CURRENT", "CREDIT_CARD", "WALLET", "BROKERAGE", "LOAN", "CASH", "OTHER"]), currentBalance: z.string().regex(/^$|^-?\d+(?:\.\d{1,2})?$/, "Use a decimal amount with up to two places") });
type Values = z.infer<typeof schema>;
export function Accounts() {
  const query = useAccounts(); const refresh = useRefreshFinancialViews();
  const [editing, setEditing] = useState<string | null>(null); const [deleting, setDeleting] = useState<string | null>(null); const [error, setError] = useState<unknown>(); const [saved, setSaved] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", type: "SAVINGS", currentBalance: "" } });
  async function submit(values: Values) {
    setError(null); setSaved(false);
    try {
      const body = { ...values, currency: "INR", currentBalance: values.currentBalance || undefined };
      if (editing) unwrap(await sdk.PATCH("/api/v1/accounts/{id}", { params: { path: { id: editing } }, body }));
      else unwrap(await sdk.POST("/api/v1/accounts", { body }));
      await refresh(); setEditing(null); form.reset(); setSaved(true);
    } catch (e) { setError(e); }
  }
  async function remove(id: string) {
    setError(null);
    try { unwrap(await sdk.DELETE("/api/v1/accounts/{id}", { params: { path: { id } } })); await refresh(); setDeleting(null); document.getElementById("account-name")?.focus(); }
    catch (e) { setError(e); }
  }
  return <><PageTitle title="Accounts" description="Keep balances and their last update visible. Your saved planning assumptions change only when you review them." /><div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"><Panel title="Your accounts"><ErrorNotice error={query.error} retry={() => void query.refetch()} />{query.isPending && <Loading />}{query.data?.length === 0 && <Empty>Add your first account using the form. A balance can be left unknown.</Empty>}<ul className="divide-y divide-border">{query.data?.map(account => <li key={account.id} className="flex flex-wrap justify-between gap-3 py-5"><div><h3 className="font-sans text-lg font-semibold">{account.name}</h3><p className="text-sm text-muted-foreground">{account.type.replaceAll("_", " ").toLowerCase()} · {account.currency}</p><p className="mt-2 text-2xl tabular-nums">{money(account.currentBalance, account.currency)}</p><p className="text-sm text-muted-foreground">Balance updated {date(account.balanceUpdatedAt)}</p></div><div className="flex flex-wrap items-start gap-2"><button className={secondary} onClick={() => { setEditing(account.id); form.reset({ name: account.name, type: account.type as Values["type"], currentBalance: account.currentBalance ?? "" }); setSaved(false); document.getElementById("account-name")?.focus(); }}>Edit<span className="sr-only"> {account.name}</span></button>{deleting === account.id ? <><button id={`confirm-delete-${account.id}`} className={secondary} onClick={() => void remove(account.id)}>Confirm delete<span className="sr-only"> {account.name}</span></button><button className={secondary} onClick={() => { setDeleting(null); requestAnimationFrame(() => document.getElementById(`delete-${account.id}`)?.focus()); }}>Keep account</button></> : <button id={`delete-${account.id}`} className={secondary} onClick={() => { setDeleting(account.id); requestAnimationFrame(() => document.getElementById(`confirm-delete-${account.id}`)?.focus()); }}>Delete<span className="sr-only"> {account.name}</span></button>}</div></li>)}</ul></Panel><Panel title={editing ? "Edit account" : "Add an account"}><form onSubmit={form.handleSubmit(submit)} className="space-y-4"><Field id="account-name" label="Account name" {...form.register("name")} autoComplete="off" /><label className="block space-y-2"><span className="font-semibold">Account type</span><select className={control} {...form.register("type")}>{schema.shape.type.options.map(type => <option key={type} value={type}>{type.replaceAll("_", " ").toLowerCase()}</option>)}</select></label><Field label="Current balance (INR)" inputMode="decimal" hint="Leave blank if unknown. An entered balance is a manual observation." {...form.register("currentBalance")} />{Object.values(form.formState.errors).map((e, i) => <p role="alert" className="text-[#A13F39]" key={i}>{e.message}</p>)}<ErrorNotice error={error} /><div className="flex flex-wrap gap-3"><button className={action} disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving…" : "Save account"}</button>{editing && <button type="button" className={secondary} onClick={() => { setEditing(null); form.reset({ name: "", type: "SAVINGS", currentBalance: "" }); }}>Cancel edit</button>}</div>{saved && <p role="status">Account saved.</p>}</form></Panel></div></>;
}
