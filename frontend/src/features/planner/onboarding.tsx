"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/sdk";
import { usePlanning, type Planning, type Inputs } from "./planning-queries";
import { unwrap } from "./queries";
import { Goals } from "./goals";
import { action, secondary, control, Panel, PageTitle, ErrorNotice, Loading } from "./ui";
import { trackFunnel } from "./analytics";
import { claimPendingAnonymousDraft, getAnonymousDraft } from "@/services/onboarding-draft";
const steps = ["Goals", "Monthly money", "Balances and details", "Review"];
type Section = "cashFlow" | "emergencyFund" | "loan" | "investment";
export function Onboarding() {
  const query = usePlanning();
  const [pendingDraft, setPendingDraft] = useState(() => Boolean(getAnonymousDraft()));
  const [claimingDraft, setClaimingDraft] = useState(false);
  const [claimError, setClaimError] = useState<unknown>();
  async function retryClaim() {
    setClaimingDraft(true); setClaimError(null);
    try { await claimPendingAnonymousDraft(); setPendingDraft(false); await query.refetch(); }
    catch (error) { setClaimError(error); }
    finally { setClaimingDraft(false); }
  }
  if (query.isPending) return <Loading />;
  if (!query.data) return <ErrorNotice error={query.error} retry={() => void query.refetch()} />;
  return <>{pendingDraft && <div className="mb-5 rounded-xl border border-[#8A531D] p-4"><p>Your affordability inputs are still saved on this device, but have not been added to your plan.</p><ErrorNotice error={claimError} /><button className={`${secondary} mt-3`} disabled={claimingDraft} onClick={() => void retryClaim()}>{claimingDraft ? "Adding saved inputs…" : "Retry adding saved inputs"}</button></div>}<OnboardingEditor initial={query.data} /></>;
}
function OnboardingEditor({ initial }: { initial: Planning }) {
  const router = useRouter(); const client = useQueryClient();
  const [inputs, setInputs] = useState<Inputs>(initial.inputs); const [step, setStep] = useState(initial.completedStep ?? 0); const [estimates, setEstimates] = useState<string[]>(initial.estimates ?? []);
  const [change, setChange] = useState(0); const [savedChange, setSavedChange] = useState(0); const [saving, setSaving] = useState(false); const [error, setError] = useState<unknown>(); const [generating, setGenerating] = useState(false);
  const revision = useRef(initial.revision); const inFlight = useRef<Promise<void> | null>(null); const latest = useRef({ inputs, completedStep: step, estimates, change }); const generationKey = useRef<string | null>(null);
  latest.current = { inputs, completedStep: step, estimates, change };
  async function save() {
    if (inFlight.current) await inFlight.current;
    const snapshot = latest.current;
    if (snapshot.change === savedChange) return;
    setSaving(true); setError(null);
    const pending = (async () => {
      const result = unwrap(await sdk.PUT("/api/v1/households/planning", { body: { inputs: snapshot.inputs, completedStep: snapshot.completedStep, estimates: snapshot.estimates, expectedRevision: revision.current } }));
      revision.current = result.data.revision; setSavedChange(snapshot.change); generationKey.current = null;
      client.setQueryData(["planning"], result.data);
    })();
    inFlight.current = pending;
    try { await pending; } catch (e) { setError(e); throw e; } finally { inFlight.current = null; setSaving(false); }
  }
  const saveRef = useRef(save); saveRef.current = save;
  useEffect(() => { if (!change || change === savedChange || saving || error) return; const timer = setTimeout(() => { void saveRef.current().catch(() => undefined); }, 700); return () => clearTimeout(timer); }, [change, savedChange, saving, error]);
  useEffect(() => { if (change === savedChange) return; const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [change, savedChange]);
  function move(next: number) { setStep(next); setChange(c => c + 1); requestAnimationFrame(() => document.getElementById("step-title")?.focus()); }
  function update(section: Section, key: string, value: string) { setInputs(old => { const part = { ...old[section], [key]: value || undefined }; return { ...old, [section]: part }; }); setChange(c => c + 1); }
  function input(section: Section, key: string, label: string) {
    const value = (inputs[section] as Record<string, unknown> | undefined)?.[key]; const name = `${section}.${key}`;
    return <div key={name} className="space-y-2"><label htmlFor={name} className="block font-semibold">{label}</label><input id={name} name={name} className={control} inputMode="decimal" value={typeof value === "string" ? value : ""} onChange={e => { if (/^\d*(\.\d{0,2})?$/.test(e.target.value)) update(section, key, e.target.value); }} onBlur={e => { if (e.target.value.endsWith(".")) update(section, key, `${e.target.value}00`); }} aria-describedby={`${name}-hint`} /><div className="flex flex-wrap items-center justify-between gap-2"><p id={`${name}-hint`} className="text-sm text-muted-foreground">INR. Leave blank if unknown; enter 0 if none.</p><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={estimates.includes(name)} onChange={e => { setEstimates(old => e.target.checked ? [...old, name] : old.filter(n => n !== name)); setChange(c => c + 1); }} />Estimated</label></div></div>;
  }
  async function generate() {
    setGenerating(true); setError(null);
    try { await save(); generationKey.current ??= crypto.randomUUID(); unwrap(await sdk.POST("/api/v1/households/planning/generate", { params: { header: { "Idempotency-Key": generationKey.current } }, body: { expectedRevision: revision.current } })); await client.invalidateQueries({ queryKey: ["plan"] }); trackFunnel("onboarding_completed"); trackFunnel("first_plan_generated"); router.push("/dashboard/plan?welcome=1"); } catch (e) { setError(e); } finally { setGenerating(false); }
  }
  return <><PageTitle title="Build your plan" description="Start with what you know. You can return to update details later." /><ol aria-label="Onboarding progress" className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-4">{steps.map((name, index) => <li key={name}><button className={`${index === step ? action : secondary} w-full`} aria-current={index === step ? "step" : undefined} onClick={() => move(index)}>{index + 1}. {name}</button></li>)}</ol><div className="mb-4 flex flex-wrap justify-between gap-3"><p role="status" aria-live="polite">{saving ? "Saving…" : error ? "Couldn’t save. Your edits are still here." : change !== savedChange ? "Unsaved changes" : "Saved"}</p><Link href="/dashboard" className="inline-flex min-h-11 items-center underline">Back to overview</Link></div><ErrorNotice error={error} retry={() => void save().catch(() => undefined)} />{error && <button className={`${secondary} mb-4`} onClick={() => { if (window.confirm("Reload the latest saved inputs? Your unsaved edits will be discarded.")) window.location.reload(); }}>Reload saved inputs</button>}<Panel title="Planning details"><h2 id="step-title" tabIndex={-1} className="mb-5 text-2xl">{steps[step]}</h2>{step === 0 && <Goals onboarding />}{step === 1 && <div className="grid gap-5 sm:grid-cols-2">{input("cashFlow", "income", "Monthly take-home income")}{input("cashFlow", "essentialExpenses", "Essential expenses")}{input("cashFlow", "discretionaryExpenses", "Flexible spending")}{input("cashFlow", "emis", "Monthly loan payments")}{input("cashFlow", "mandatoryObligations", "Other recurring obligations")}</div>}{step === 2 && <div className="space-y-6">{input("emergencyFund", "currentReserves", "Liquid savings available for emergencies")}<label className="block space-y-2"><span>Income stability</span><select className={control} value={inputs.emergencyFund?.incomeStability ?? ""} onChange={e => { setInputs(old => ({ ...old, emergencyFund: { ...old.emergencyFund, incomeStability: (e.target.value || undefined) as "stable" | "variable" | "irregular" | undefined } })); setChange(c => c + 1); }}><option value="">Not provided</option><option value="stable">Stable</option><option value="variable">Variable</option><option value="irregular">Irregular</option></select></label><details><summary className="min-h-11 cursor-pointer py-2 font-semibold">I have a loan</summary><div className="mt-4 grid gap-5 sm:grid-cols-2">{input("loan", "principal", "Outstanding principal")}{input("loan", "annualRate", "Annual interest rate (%)")}<label>Remaining months<input className={control} type="number" min={1} value={inputs.loan?.tenureMonths ?? ""} onChange={e => { setInputs(old => ({ ...old, loan: { ...old.loan, tenureMonths: e.target.value ? Number(e.target.value) : undefined } })); setChange(c => c + 1); }} /></label></div></details><details><summary className="min-h-11 cursor-pointer py-2 font-semibold">I have investments</summary><div className="mt-4 grid gap-5 sm:grid-cols-2">{input("investment", "initialLumpSum", "Current investment value")}{input("investment", "monthlySip", "Monthly investment contribution")}</div></details><Link className={secondary} href="/dashboard/accounts">Manage individual accounts</Link></div>}{step === 3 && <div className="space-y-6"><p>Check these inputs before generating. Missing values stay unknown, and your chosen goal contributions are kept.</p>{Object.entries(inputs).map(([section, values]) => <section key={section}><h3 className="font-sans font-semibold">{{ cashFlow: "Monthly money", emergencyFund: "Emergency savings", loan: "Loan details", investment: "Investments" }[section] ?? section}</h3><dl className="mt-3 divide-y divide-border">{Object.entries(values ?? {}).map(([name, value]) => <div key={name} className="flex flex-wrap justify-between gap-2 py-2"><dt>{name.replace(/([A-Z])/g, " $1")}{estimates.includes(`${section}.${name}`) ? " (estimated)" : ""}</dt><dd className="tabular-nums">{value === undefined ? "Not provided" : String(value)}</dd></div>)}</dl><button className={`${secondary} mt-3`} onClick={() => move(section === "cashFlow" ? 1 : 2)}>Edit details</button></section>)}<Goals onboarding /><button className={action} disabled={generating || saving} onClick={() => void generate()}>{generating ? "Generating your plan…" : "Generate my plan"}</button></div>}<div className="mt-8 flex flex-wrap justify-between gap-3">{step > 0 && <button className={secondary} onClick={() => move(step - 1)}>Back</button>}{step < 3 && <button className={action} onClick={() => move(step + 1)}>Continue</button>}</div></Panel></>;
}
