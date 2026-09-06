"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PageTitle, Panel, secondary } from "./ui";

export type ReportMetric = {
  label: string;
  value: string;
  note: string;
};

export type CashFlowItem = {
  category: string;
  amount: string;
  type: "inflow" | "outflow";
  classification: "saved" | "estimated" | "calculated";
};

export type GoalSnapshot = {
  name: string;
  target: string;
  current: string;
  status: string;
  targetDate: string;
};

export type ReportAssumption = {
  label: string;
  value: string;
  nature: "estimated" | "manual" | "unknown";
};

export type SampleReport = {
  id: string;
  title: string;
  period: string;
  generatedOn: string;
  version: { id: string; number: number; savedOn: string };
  summary: string;
  metrics: ReportMetric[];
  cashFlow: CashFlowItem[];
  goals: GoalSnapshot[];
  assumptions: ReportAssumption[];
  recommendations: string[];
};

export const sampleReports: readonly SampleReport[] = [
  {
    id: "monthly-plan-sep-2026",
    title: "September plan summary",
    period: "September 2026",
    generatedOn: "6 Sep 2026",
    version: { id: "sample-v3", number: 3, savedOn: "5 Sep 2026" },
    summary: "A stable monthly surplus supports the current emergency-fund and home goals.",
    metrics: [
      { label: "Monthly income", value: "₹1,50,000", note: "Saved planning input" },
      { label: "Planned outflows", value: "₹90,000", note: "Expenses, EMIs and allocations" },
      { label: "Monthly surplus", value: "₹60,000", note: "Before any unplanned activity" },
      { label: "Emergency runway", value: "4 months", note: "From saved reserves" },
    ],
    cashFlow: [
      { category: "Base take-home salary", amount: "₹1,30,000", type: "inflow", classification: "saved" },
      { category: "Consulting / bonus", amount: "₹20,000", type: "inflow", classification: "saved" },
      { category: "Fixed living necessities", amount: "₹45,000", type: "outflow", classification: "saved" },
      { category: "Discretionary lifestyle", amount: "₹20,000", type: "outflow", classification: "saved" },
      { category: "Home loan EMI", amount: "₹15,000", type: "outflow", classification: "saved" },
      { category: "Goal SIP allocations", amount: "₹10,000", type: "outflow", classification: "calculated" },
    ],
    goals: [
      { name: "Emergency Reserve", target: "₹3,60,000", current: "₹2,40,000", status: "On track", targetDate: "March 2027" },
      { name: "First Home Down Payment", target: "₹25,00,000", current: "₹6,50,000", status: "On track", targetDate: "December 2029" },
    ],
    assumptions: [
      { label: "General annual inflation", value: "6.0% p.a.", nature: "estimated" },
      { label: "Equity portfolio return", value: "12.0% p.a.", nature: "estimated" },
      { label: "Fixed deposit / liquid return", value: "6.5% p.a.", nature: "estimated" },
      { label: "Planned retirement age", value: "60 years", nature: "manual" },
      { label: "Tax optimization deductions", value: "Not provided", nature: "unknown" },
    ],
    recommendations: [
      "Maintain the ₹10,000 monthly SIP allocation to reach your 6-month runway milestone by March 2027.",
      "Review discretionary expenses if floating home loan interest rates rise by more than 0.5%.",
    ],
  },
  {
    id: "quarterly-check-in-jun-2026",
    title: "Quarterly plan check-in",
    period: "April–June 2026",
    generatedOn: "1 Jul 2026",
    version: { id: "sample-v2", number: 2, savedOn: "30 Jun 2026" },
    summary: "Goal contributions increased while the plan retained a positive monthly buffer.",
    metrics: [
      { label: "Monthly income", value: "₹1,42,000", note: "Saved planning input" },
      { label: "Planned outflows", value: "₹88,000", note: "Expenses, EMIs and allocations" },
      { label: "Monthly surplus", value: "₹54,000", note: "Before any unplanned activity" },
      { label: "Emergency runway", value: "3.6 months", note: "From saved reserves" },
    ],
    cashFlow: [
      { category: "Base take-home pay", amount: "₹1,25,000", type: "inflow", classification: "saved" },
      { category: "Variable bonus payout", amount: "₹17,000", type: "inflow", classification: "saved" },
      { category: "Fixed living necessities", amount: "₹44,000", type: "outflow", classification: "saved" },
      { category: "Discretionary lifestyle", amount: "₹21,000", type: "outflow", classification: "saved" },
      { category: "Home loan EMI", amount: "₹15,000", type: "outflow", classification: "saved" },
      { category: "Goal SIP allocations", amount: "₹8,000", type: "outflow", classification: "calculated" },
    ],
    goals: [
      { name: "Emergency Reserve", target: "₹3,60,000", current: "₹2,00,000", status: "On track", targetDate: "May 2027" },
      { name: "First Home Down Payment", target: "₹25,00,000", current: "₹5,20,000", status: "On track", targetDate: "December 2029" },
    ],
    assumptions: [
      { label: "General annual inflation", value: "6.0% p.a.", nature: "estimated" },
      { label: "Equity portfolio return", value: "12.0% p.a.", nature: "estimated" },
      { label: "Planned retirement age", value: "60 years", nature: "manual" },
      { label: "Employer bonus expectation", value: "Not provided", nature: "unknown" },
    ],
    recommendations: [
      "Surplus was reallocated toward emergency reserve, improving runway from 3.0 to 3.6 months.",
      "Consider stepping up home down payment SIP once emergency runway reaches 4 months.",
    ],
  },
] as const;

function DemoNotice() {
  return (
    <div role="note" className="mb-6 rounded-xl border border-[#B8AFE8] bg-[#F3F0FF] p-4 text-sm text-[#344054]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral" size="sm">Demo preview</Badge>
        <strong className="text-[#1F2A44]">Sample data only</strong>
      </div>
      <p className="mt-2">Reports are local previews. They do not create files, contact a server, or change a saved plan.</p>
    </div>
  );
}

export function Reports() {
  const [reportsList, setReportsList] = useState<SampleReport[]>(() => [...sampleReports]);
  const [selectedVersion, setSelectedVersion] = useState<string>("all");

  const versions = useMemo(() => {
    const set = new Set(sampleReports.map((r) => r.version.number.toString()));
    return ["all", ...Array.from(set)];
  }, []);

  const visibleReports = useMemo(() => {
    return reportsList.filter((r) => {
      if (selectedVersion === "all") return true;
      return r.version.number.toString() === selectedVersion;
    });
  }, [reportsList, selectedVersion]);

  function restoreReports() {
    setReportsList([...sampleReports]);
    setSelectedVersion("all");
  }

  return (
    <>
      <PageTitle title="Reports" description="Preview sample summaries tied to an immutable saved plan version." />
      <DemoNotice />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="version-filter" className="text-sm font-semibold text-[#344054]">
            Plan version:
          </label>
          <select
            id="version-filter"
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="min-h-11 rounded-lg border border-[#E8E1D6] bg-[#FFFCF8] px-3 py-1.5 text-sm text-[#1F2A44] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]"
          >
            <option value="all">All versions ({reportsList.length})</option>
            {versions.filter((v) => v !== "all").map((v) => (
              <option key={v} value={v}>Version {v}</option>
            ))}
          </select>
        </div>
        {reportsList.length > 0 && (
          <button
            type="button"
            className="min-h-11 self-start sm:self-auto text-sm font-semibold text-[#475467] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]"
            onClick={() => setReportsList([])}
          >
            Clear demo list
          </button>
        )}
      </div>

      {visibleReports.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {visibleReports.map((report) => (
            <Panel key={report.id} title={report.title}>
              <div className="flex flex-wrap gap-2 text-xs text-[#475467]">
                <span>{report.period}</span>
                <span aria-hidden="true">·</span>
                <span>Previewed {report.generatedOn}</span>
              </div>
              <div className="mt-4 rounded-xl border border-[#E8E1D6] bg-[#FFF9F0] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#475467]">Immutable sample source</p>
                <p className="mt-1 font-semibold text-[#1F2A44]">Plan version {report.version.number}</p>
                <p className="text-xs text-[#475467]">{report.version.id} · saved {report.version.savedOn}</p>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#475467]">{report.summary}</p>
              <Link
                className={`${secondary} mt-5 w-full sm:w-auto`}
                href={`/dashboard/reports/${report.id}`}
                aria-label={`Open demo preview for ${report.title}`}
              >
                Open demo preview
              </Link>
            </Panel>
          ))}
        </div>
      ) : (
        <section
          className="rounded-2xl border border-dashed border-[#B8AFE8] bg-[#FFFCF8] px-5 py-10 text-center"
          aria-labelledby="empty-reports-title"
        >
          <h2 id="empty-reports-title" className="text-2xl font-serif text-[#1F2A44]">
            {reportsList.length === 0 ? "No report previews available" : "No reports for selected version"}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[#475467]">
            {reportsList.length === 0
              ? "All demo report previews have been cleared. Restore the sample set to continue previewing saved plan summaries."
              : "Choose 'All versions' or restore the full list to explore sample reports."}
          </p>
          <div className="mt-5 flex justify-center">
            {reportsList.length === 0 ? (
              <button type="button" className={secondary} onClick={restoreReports}>
                Restore sample reports
              </button>
            ) : (
              <button type="button" className={secondary} onClick={() => setSelectedVersion("all")}>
                Show all versions
              </button>
            )}
          </div>
        </section>
      )}
    </>
  );
}

export function ReportDetail({ id }: { id: string }) {
  const report = sampleReports.find((item) => item.id === id);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [simulatedError, setSimulatedError] = useState<string | null>(null);

  if (!report) {
    return (
      <>
        <PageTitle title="Report not found" description="This demo preview does not include that sample report." />
        <Link className={secondary} href="/dashboard/reports">Back to reports</Link>
      </>
    );
  }

  function handleDemoExport(format: "summary" | "csv") {
    setSimulatedError(null);
    const formatLabel = format === "csv" ? "CSV figures" : "summary";
    setExportMessage(
      `Demo only — no file was created. This preview remains bound to plan version ${report!.version.number} (${report!.version.id}). Format: ${formatLabel}.`
    );
  }

  function handleSimulateError() {
    setExportMessage(null);
    setSimulatedError("Demo simulated failure: Unable to generate report export. This is a recoverable preview error.");
  }

  function handleRetryExport() {
    setSimulatedError(null);
    setExportMessage(
      `Recovered export preview: Demo only — no file was created. This preview remains bound to plan version ${report!.version.number} (${report!.version.id}).`
    );
  }

  return (
    <>
      <PageTitle title={report.title} description={`${report.period} · Demo preview`}>
        <Link className={secondary} href="/dashboard/reports">Back to reports</Link>
      </PageTitle>
      <DemoNotice />
      <section aria-labelledby="report-source" className="mb-6 rounded-2xl border-2 border-[#5E55C9] bg-[#FFFCF8] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="report-source" className="text-xl font-serif text-[#1F2A44]">Preview source: Plan version {report.version.number}</h2>
            <p className="mt-1 text-sm text-[#475467]">Immutable sample {report.version.id} · saved {report.version.savedOn}</p>
          </div>
          <Badge tone="neutral" size="sm">Read-only snapshot</Badge>
        </div>
        <p className="mt-4 text-sm text-[#344054]">Every figure below belongs to this selected sample version. Switching reports never updates or recalculates it.</p>
      </section>

      <div className="space-y-6">
        {/* Core Plan Snapshot */}
        <Panel title="Plan snapshot">
          <dl className="grid gap-4 sm:grid-cols-2">
            {report.metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-[#E8E1D6] bg-[#FFF9F0]/60 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-[#475467]">{metric.label}</dt>
                <dd className="mt-1 text-2xl tabular-nums text-[#1F2A44]">{metric.value}</dd>
                <dd className="mt-1 text-xs text-[#475467]">{metric.note}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-sm text-[#344054]">{report.summary}</p>
        </Panel>

        {/* Monthly Cash Flow Breakdown */}
        {report.cashFlow && report.cashFlow.length > 0 && (
          <Panel title="Monthly cash flow allocation">
            <p className="mb-4 text-sm text-[#475467]">
              Planned cash allocation locked to version {report.version.number} baseline inputs.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" aria-label="Cash flow allocation table">
                <thead>
                  <tr className="border-b border-[#E8E1D6] text-xs font-semibold uppercase tracking-wider text-[#475467]">
                    <th scope="col" className="pb-3 pr-4">Category</th>
                    <th scope="col" className="pb-3 pr-4">Type</th>
                    <th scope="col" className="pb-3 pr-4 text-right">Amount</th>
                    <th scope="col" className="pb-3 text-right">Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E1D6]">
                  {report.cashFlow.map((row) => (
                    <tr key={row.category} className="hover:bg-[#FFF9F0]/50">
                      <td className="py-3 pr-4 font-medium text-[#1F2A44]">{row.category}</td>
                      <td className="py-3 pr-4 text-xs text-[#475467]">
                        <span className={`capitalize ${row.type === "inflow" ? "font-semibold text-[#3D5C4A]" : "text-[#344054]"}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums text-[#1F2A44]">{row.amount}</td>
                      <td className="py-3 text-right text-xs">
                        <Badge tone={row.classification === "calculated" ? "blue" : "neutral"} size="sm">
                          {row.classification === "calculated" ? "Calculated" : "Saved input"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {/* Goals Snapshot */}
        {report.goals && report.goals.length > 0 && (
          <Panel title="Goals snapshot in this version">
            <div className="grid gap-4 sm:grid-cols-2">
              {report.goals.map((g) => (
                <div key={g.name} className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[#1F2A44]">{g.name}</h3>
                    <Badge tone="sage" size="sm">{g.status}</Badge>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between text-sm">
                    <span className="text-[#475467]">Current / Target</span>
                    <span className="font-mono tabular-nums font-semibold text-[#1F2A44]">
                      {g.current} / {g.target}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#475467]">Target completion: {g.targetDate}</p>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Assumptions & Unknown/Estimated Disclosures */}
        {report.assumptions && report.assumptions.length > 0 && (
          <Panel title="Assumptions and data disclosures">
            <p className="mb-4 text-sm text-[#475467]">
              Mathematical assumptions and source completeness recorded for this plan version. Unknown and estimated values are labeled explicitly.
            </p>
            <div className="divide-y divide-[#E8E1D6]">
              {report.assumptions.map((item) => (
                <div key={item.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#1F2A44]">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="font-mono tabular-nums text-sm text-[#344054]">{item.value}</span>
                    {item.nature === "estimated" && (
                      <Badge tone="warning" size="sm">Estimated assumption</Badge>
                    )}
                    {item.nature === "unknown" && (
                      <Badge tone="neutral" size="sm">Unknown</Badge>
                    )}
                    {item.nature === "manual" && (
                      <Badge tone="sage" size="sm">Saved input</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Strategic Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <Panel title="Recommendations">
            <ul className="space-y-2 list-disc pl-5 text-sm leading-relaxed text-[#344054]">
              {report.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </Panel>
        )}

        {/* Export Actions Panel */}
        <section aria-labelledby="export-heading" className="rounded-xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 sm:p-6 shadow-xs">
          <h2 id="export-heading" className="text-xl font-serif text-[#1F2A44]">Demo report export controls</h2>
          <p className="mt-1 text-sm text-[#475467]">
            Test preview export actions. Exports are tied to Plan version {report.version.number} ({report.version.id}) and never queue background server jobs in demo mode.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className={secondary}
              onClick={() => handleDemoExport("summary")}
            >
              Try demo export
            </button>
            <button
              type="button"
              className={secondary}
              onClick={() => handleDemoExport("csv")}
            >
              Try demo CSV export
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg px-3 text-sm font-semibold text-[#A13F39] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E55C9]"
              onClick={handleSimulateError}
            >
              Simulate export error
            </button>
          </div>

          {simulatedError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-[#A13F39]/40 bg-[#A13F39]/10 p-4 text-sm text-[#A13F39]"
            >
              <p className="font-semibold">{simulatedError}</p>
              <p className="mt-1 text-xs text-[#344054]">Report failures are recoverable without corrupting the selected version.</p>
              <button
                type="button"
                className={`${secondary} mt-3 text-sm`}
                onClick={handleRetryExport}
              >
                Retry export
              </button>
            </div>
          )}

          {exportMessage && (
            <p
              role="status"
              aria-live="polite"
              className="mt-4 rounded-xl bg-[#FFF9F0] border border-[#E6B46A]/60 p-3 text-sm font-semibold text-[#8A531D]"
            >
              {exportMessage}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
