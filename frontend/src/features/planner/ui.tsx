import Link from "next/link";
import type { ReactNode, InputHTMLAttributes } from "react";

export const control = "min-h-11 w-full rounded-[10px] border border-[#747B88] bg-background px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
export const action = "inline-flex min-h-11 items-center justify-center rounded-[10px] bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
export const secondary = "inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#747B88] px-4 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
export function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6 ${className}`}><h2 className="mb-4 text-2xl">{title}</h2>{children}</section>;
}
export function PageTitle({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return <header className="mb-8 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-[32px] leading-tight">{title}</h1>{description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}</div>{children}</header>;
}
export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = props.id ?? props.name;
  return <div className="space-y-1.5"><label htmlFor={id} className="block font-semibold">{label}</label><input {...props} id={id} className={control} aria-describedby={hint ? `${id}-hint` : undefined} />{hint && <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</p>}</div>;
}
export function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  if (!error) return null;
  return <div role="alert" className="my-3 rounded-xl border border-[#A13F39] p-4 text-[#A13F39]"><p>{error instanceof Error ? error.message : "Couldn’t load this section. Please try again."}</p>{retry && <button type="button" className={`${secondary} mt-3`} onClick={retry}>Try again</button>}</div>;
}
export function Loading() { return <p role="status" className="py-5 text-muted-foreground">Loading your information…</p>; }
export function Empty({ children, href, label }: { children: ReactNode; href?: string; label?: string }) { return <div className="space-y-4 py-4"><p className="text-muted-foreground">{children}</p>{href && <Link className={secondary} href={href}>{label}</Link>}</div>; }
export function money(value: string | null | undefined, currency = "INR") {
  if (value === null || value === undefined || value === "") return "Not provided";
  // Formatting only; all financial calculations are performed by Express.
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value));
}
export function date(value: string | null | undefined) { return value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not provided"; }
