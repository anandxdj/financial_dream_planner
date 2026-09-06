"use client";

import Link from "next/link";
import { useState, useId } from "react";
import { useCurrentPlan, useAccounts } from "./queries";
import { usePlanning } from "./planning-queries";
import { useLoanCalculation, useLoans, type LoanRequestBody } from "./decision-queries";
import {
  action,
  secondary,
  control,
  Field,
  Panel,
  PageTitle,
  ErrorNotice,
  Loading,
  Empty,
  money,
} from "./ui";
import { Badge } from "@/components/planner/badge";

export function LoansOverview({
  initialLoan,
}: {
  initialLoan?: { principal?: string; rate?: string; tenure?: number; name?: string };
}) {
  const planQuery = useCurrentPlan();
  const planningQuery = usePlanning();
  const accountsQuery = useAccounts();
  const loansQuery = useLoans();

  const plannedLoan = planningQuery.data?.inputs.loan;
  const initialPrincipal = initialLoan?.principal ?? plannedLoan?.principal ?? "";
  const initialRate = initialLoan?.rate ?? plannedLoan?.annualRate ?? "";
  const initialTenure = initialLoan?.tenure
    ? String(initialLoan.tenure)
    : plannedLoan?.tenureMonths
    ? String(plannedLoan.tenureMonths)
    : "";

  const [principal, setPrincipal] = useState(initialPrincipal);
  const [annualRate, setAnnualRate] = useState(initialRate);
  const [tenureMonths, setTenureMonths] = useState(initialTenure);
  const [formValidation, setFormValidation] = useState<string | null>(null);

  const [hasPrepayment, setHasPrepayment] = useState(false);
  const [prepayMonth, setPrepayMonth] = useState("");
  const [prepayAmount, setPrepayAmount] = useState("");
  const [prepayStrategy, setPrepayStrategy] = useState<"reduce_tenure" | "reduce_emi">("reduce_tenure");

  const [hasRefinancing, setHasRefinancing] = useState(false);
  const [refinanceRate, setRefinanceRate] = useState("");
  const [refinanceTenure, setRefinanceTenure] = useState("");
  const [refinanceFee, setRefinanceFee] = useState("");

  const prepayStrategyId = useId();

  const [activeRequest, setActiveRequest] = useState<LoanRequestBody | null>(() => {
    if (initialPrincipal && initialRate && initialTenure) {
      return {
        principal: initialPrincipal,
        annualRate: initialRate,
        tenureMonths: Number(initialTenure),
      };
    }
    return null;
  });

  const loanQuery = useLoanCalculation(activeRequest);

  const currentPlan = planQuery.data;
  const currentSurplus = currentPlan?.snapshot.calculatedOutput.cashFlow?.monthlySurplus;
  const existingLiabilities = planningQuery.data?.inputs.netWorth?.liabilities ?? [];
  const loanAccounts = accountsQuery.data?.filter((a) => a.type.toLowerCase().includes("loan")) ?? [];
  const recordedLoans = loansQuery.data?.data ?? [];

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setFormValidation(null);

    if (!principal || Number(principal) <= 0) {
      setFormValidation("Please enter a valid loan principal amount.");
      return;
    }
    if (!annualRate || Number(annualRate) <= 0) {
      setFormValidation("Please enter a valid annual interest rate.");
      return;
    }
    if (!tenureMonths || Number(tenureMonths) <= 0) {
      setFormValidation("Please enter a valid loan tenure in months.");
      return;
    }

    const req: LoanRequestBody = {
      principal,
      annualRate,
      tenureMonths: Number(tenureMonths),
    };

    if (hasPrepayment && Number(prepayAmount) > 0) {
      req.prepayments = [{ month: Number(prepayMonth) || 1, amount: prepayAmount }];
      req.prepaymentStrategy = prepayStrategy;
    }

    if (hasRefinancing && Number(refinanceRate) > 0) {
      req.refinancing = {
        newAnnualRate: refinanceRate,
        newTenureMonths: Number(refinanceTenure) || undefined,
        processingFee: refinanceFee || "0",
      };
    }

    setActiveRequest(req);
  }

  const result = loanQuery.data;
  const schedule = result?.schedule ?? [];
  const prepayment = result?.prepaymentComparison;
  const refinancing = result?.refinancingComparison;

  return (
    <>
      <PageTitle
        title="Loan analysis"
        description="Simulate amortizations, evaluate prepayment interest savings, and inspect refinancing trade-offs."
      >
        <Link className={secondary} href="/dashboard/plan">
          View plan
        </Link>
      </PageTitle>

      {/* Mandatory Regulatory & Product Disclosure */}
      <div
        role="note"
        aria-label="Important disclosure"
        className="mb-6 rounded-2xl border border-[#8FA9D6]/40 bg-[#8FA9D6]/10 p-5 text-sm text-[#1F2A44]"
      >
        <div className="flex items-start gap-3">
          <Badge tone="blue" size="sm">
            Disclosure
          </Badge>
          <div className="space-y-1">
            <p className="font-semibold">Educational planning simulation only</p>
            <p className="text-xs text-[#475467] leading-relaxed">
              This loan tool calculates mathematical amortizations and projections based on your inputs. It is not a loan offer, pre-approval, credit quote, or endorsement from any lender. Actual loan terms, interest rates, and approval depend strictly on the financial institution.
            </p>
          </div>
        </div>
      </div>

      <ErrorNotice error={loanQuery.error} retry={() => void loanQuery.refetch()} />
      <ErrorNotice error={planningQuery.error} retry={() => void planningQuery.refetch()} />
      {formValidation && (
        <div role="alert" className="mb-4 rounded-xl border border-[#A13F39] p-4 text-sm text-[#A13F39]">
          {formValidation}
        </div>
      )}

      {/* Existing Household Liabilities, Saved Loans, and Accounts */}
      {(existingLiabilities.length > 0 || loanAccounts.length > 0 || plannedLoan || recordedLoans.length > 0) && (
        <section className="mb-8 space-y-3">
          <h2 className="text-lg font-serif font-normal text-[#1F2A44]">
            Recorded loans & liabilities
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plannedLoan && plannedLoan.principal && (
              <div className="rounded-xl border border-border bg-[#FFFCF8] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#1F2A44]">
                    Planned Loan Input
                  </span>
                  <Badge tone="sage" size="sm">Plan Input</Badge>
                </div>
                <div className="text-xs text-[#475467] space-y-1">
                  <p>Principal: <strong className="text-[#1F2A44]">{money(plannedLoan.principal)}</strong></p>
                  {plannedLoan.annualRate && <p>Interest rate: {plannedLoan.annualRate}% p.a.</p>}
                  {plannedLoan.tenureMonths && <p>Tenure: {plannedLoan.tenureMonths} months</p>}
                </div>
                <button
                  type="button"
                  className={`${secondary} text-xs mt-2 w-full`}
                  onClick={() => {
                    setPrincipal(plannedLoan.principal ?? "");
                    if (plannedLoan.annualRate) setAnnualRate(plannedLoan.annualRate);
                    if (plannedLoan.tenureMonths) setTenureMonths(String(plannedLoan.tenureMonths));
                    if (plannedLoan.principal && plannedLoan.annualRate && plannedLoan.tenureMonths) {
                      setActiveRequest({
                        principal: plannedLoan.principal,
                        annualRate: plannedLoan.annualRate,
                        tenureMonths: plannedLoan.tenureMonths,
                      });
                    }
                  }}
                >
                  Load into calculator
                </button>
              </div>
            )}

            {existingLiabilities.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border bg-[#FFFCF8] p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#1F2A44]">
                    {item.name}
                  </span>
                  <Badge tone="neutral" size="sm">
                    {item.category}
                  </Badge>
                </div>
                <div className="text-xs text-[#475467] space-y-1">
                  <p>Outstanding balance: <strong className="text-[#1F2A44]">{item.value ? money(item.value) : "Not recorded"}</strong></p>
                </div>
                <button
                  type="button"
                  className={`${secondary} text-xs mt-2 w-full`}
                  disabled={!item.value}
                  onClick={() => {
                    if (item.value) {
                      setPrincipal(item.value);
                      if (annualRate && tenureMonths) {
                        setActiveRequest({
                          principal: item.value,
                          annualRate,
                          tenureMonths: Number(tenureMonths),
                        });
                      }
                    }
                  }}
                >
                  {item.value ? "Load into calculator" : "Balance unavailable"}
                </button>
              </div>
            ))}

            {loanAccounts.map((acc) => (
              <div
                key={acc.id}
                className="rounded-xl border border-border bg-[#FFFCF8] p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#1F2A44]">
                    {acc.name}
                  </span>
                  <Badge tone="neutral" size="sm">
                    Account
                  </Badge>
                </div>
                <div className="text-xs text-[#475467] space-y-1">
                  <p>Current balance: <strong className="text-[#1F2A44]">{acc.currentBalance ? money(acc.currentBalance, acc.currency) : "Not recorded"}</strong></p>
                  <p>Institution: {acc.institutionName || "Manual"}</p>
                </div>
                <button
                  type="button"
                  className={`${secondary} text-xs mt-2 w-full`}
                  disabled={!acc.currentBalance}
                  onClick={() => {
                    if (acc.currentBalance) {
                      setPrincipal(acc.currentBalance);
                      if (annualRate && tenureMonths) {
                        setActiveRequest({
                          principal: acc.currentBalance,
                          annualRate,
                          tenureMonths: Number(tenureMonths),
                        });
                      }
                    }
                  }}
                >
                  {acc.currentBalance ? "Load into calculator" : "Balance unavailable"}
                </button>
              </div>
            ))}

            {recordedLoans.map((l) => (
              <div
                key={l.id}
                className="rounded-xl border border-border bg-[#FFFCF8] p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#1F2A44]">
                    {l.name}
                  </span>
                  <Badge tone="purple" size="sm">
                    {l.type}
                  </Badge>
                </div>
                <div className="text-xs text-[#475467] space-y-1">
                  <p>Outstanding: <strong className="text-[#1F2A44]">{l.outstandingPrincipal ? money(l.outstandingPrincipal) : "Not recorded"}</strong></p>
                  {l.interestRate && <p>Interest rate: {l.interestRate}% p.a.</p>}
                  {l.remainingTenureMonths && <p>Remaining: {l.remainingTenureMonths} months</p>}
                  {l.monthlyEmi && <p>EMI: {money(l.monthlyEmi)}</p>}
                </div>
                <button
                  type="button"
                  className={`${secondary} text-xs mt-2 w-full`}
                  disabled={!l.outstandingPrincipal}
                  onClick={() => {
                    if (l.outstandingPrincipal) {
                      setPrincipal(l.outstandingPrincipal);
                      if (l.interestRate) setAnnualRate(l.interestRate);
                      if (l.remainingTenureMonths) setTenureMonths(String(l.remainingTenureMonths));
                      if (l.outstandingPrincipal && l.interestRate && l.remainingTenureMonths) {
                        setActiveRequest({
                          principal: l.outstandingPrincipal,
                          annualRate: l.interestRate,
                          tenureMonths: l.remainingTenureMonths,
                        });
                      }
                    }
                  }}
                >
                  {l.outstandingPrincipal ? "Load into calculator" : "Balance unavailable"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Calculator Form */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleCalculate} className="space-y-6">
            <Panel title="Loan parameters">
              <div className="space-y-4">
                <Field
                  label="Loan principal (INR)"
                  name="principal"
                  required
                  inputMode="decimal"
                  pattern="[0-9]+(\.[0-9]{1,2})?"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  placeholder="Enter loan principal"
                  hint="The total borrowing or remaining principal amount."
                />
                <Field
                  label="Annual interest rate (% p.a.)"
                  name="annualRate"
                  required
                  inputMode="decimal"
                  pattern="[0-9]+(\.[0-9]{1,2})?"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(e.target.value)}
                  placeholder="e.g. 8.5"
                  hint="Annual percentage rate charged by lender."
                />
                <Field
                  label="Tenure (months)"
                  name="tenureMonths"
                  required
                  type="number"
                  min={1}
                  max={600}
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(e.target.value)}
                  placeholder="e.g. 240"
                  hint={tenureMonths ? `${(Number(tenureMonths) / 12).toFixed(1)} years` : "Duration in months"}
                />
              </div>
            </Panel>

            <Panel title="Prepayment simulation (optional)">
              <div className="space-y-4">
                <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#1F2A44] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPrepayment}
                    onChange={(e) => setHasPrepayment(e.target.checked)}
                    className="size-4 rounded accent-[#5E55C9]"
                  />
                  Simulate partial prepayment
                </label>

                {hasPrepayment && (
                  <div className="space-y-4 border-t border-border pt-3">
                    <Field
                      label="Prepayment amount (INR)"
                      name="prepayAmount"
                      inputMode="decimal"
                      pattern="[0-9]+(\.[0-9]{1,2})?"
                      value={prepayAmount}
                      onChange={(e) => setPrepayAmount(e.target.value)}
                      placeholder="e.g. 200000"
                    />
                    <Field
                      label="Occurs in month number"
                      name="prepayMonth"
                      type="number"
                      min={1}
                      max={Number(tenureMonths) || 360}
                      value={prepayMonth}
                      onChange={(e) => setPrepayMonth(e.target.value)}
                      placeholder="e.g. 12"
                    />
                    <div className="space-y-1.5">
                      <label htmlFor={prepayStrategyId} className="block text-sm font-semibold text-[#1F2A44]">
                        Prepayment strategy
                      </label>
                      <select
                        id={prepayStrategyId}
                        className={control}
                        value={prepayStrategy}
                        onChange={(e) =>
                          setPrepayStrategy(e.target.value as "reduce_tenure" | "reduce_emi")
                        }
                      >
                        <option value="reduce_tenure">Reduce Tenure (Keep same EMI, finish sooner)</option>
                        <option value="reduce_emi">Reduce Monthly EMI (Keep same tenure)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            <Panel title="Refinancing analysis (optional)">
              <div className="space-y-4">
                <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#1F2A44] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasRefinancing}
                    onChange={(e) => setHasRefinancing(e.target.checked)}
                    className="size-4 rounded accent-[#5E55C9]"
                  />
                  Simulate refinancing with another lender
                </label>

                {hasRefinancing && (
                  <div className="space-y-4 border-t border-border pt-3">
                    <Field
                      label="New annual rate (% p.a.)"
                      name="refinanceRate"
                      inputMode="decimal"
                      pattern="[0-9]+(\.[0-9]{1,2})?"
                      value={refinanceRate}
                      onChange={(e) => setRefinanceRate(e.target.value)}
                      placeholder="e.g. 7.75"
                    />
                    <Field
                      label="New tenure (months)"
                      name="refinanceTenure"
                      type="number"
                      min={1}
                      max={600}
                      value={refinanceTenure}
                      onChange={(e) => setRefinanceTenure(e.target.value)}
                      placeholder="e.g. 200"
                    />
                    <Field
                      label="Estimated processing fee (INR)"
                      name="refinanceFee"
                      inputMode="decimal"
                      pattern="[0-9]+(\.[0-9]{1,2})?"
                      value={refinanceFee}
                      onChange={(e) => setRefinanceFee(e.target.value)}
                      placeholder="e.g. 10000"
                      hint="Include processing, stamp duty, and administrative fees."
                    />
                  </div>
                )}
              </div>
            </Panel>

            <button type="submit" className={`${action} w-full`} disabled={loanQuery.isPending}>
              {loanQuery.isPending ? "Calculating…" : "Calculate amortization & savings"}
            </button>
          </form>
        </div>

        {/* Results Overview */}
        <div className="lg:col-span-7 space-y-6">
          {loanQuery.isPending && <Loading />}

          {result ? (
            <>
              {/* Primary EMI KPIs */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-[#FFFCF8] p-5">
                  <span className="text-xs uppercase tracking-wider text-[#475467]">
                    Monthly EMI
                  </span>
                  <p className="mt-1 text-3xl font-serif tabular-nums text-[#1F2A44]">
                    {money(result.monthlyEmi)}
                  </p>
                  <span className="mt-1 block text-xs text-[#475467]">
                    {result.tenureMonths} monthly payments
                  </span>
                </div>

                <div className="rounded-2xl border border-border bg-[#FFFCF8] p-5">
                  <span className="text-xs uppercase tracking-wider text-[#475467]">
                    Total Interest
                  </span>
                  <p className="mt-1 text-3xl font-serif tabular-nums text-[#8A531D]">
                    {money(result.totalInterest)}
                  </p>
                  <span className="mt-1 block text-xs text-[#475467]">
                    Total interest cost over tenure
                  </span>
                </div>

                <div className="rounded-2xl border border-border bg-[#FFFCF8] p-5">
                  <span className="text-xs uppercase tracking-wider text-[#475467]">
                    Total Payment
                  </span>
                  <p className="mt-1 text-3xl font-serif tabular-nums text-[#1F2A44]">
                    {money(result.totalPayment)}
                  </p>
                  <span className="mt-1 block text-xs text-[#475467]">
                    Principal + total interest
                  </span>
                </div>
              </div>

              {/* Buffer & Cash Flow Impact */}
              <Panel title="Impact on your monthly cash flow">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-[#475467]">Current planned monthly surplus</span>
                    <span className="font-semibold tabular-nums text-[#1F2A44]">
                      {money(currentSurplus)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-[#475467]">Simulated loan EMI</span>
                    <span className="font-semibold tabular-nums text-[#A13F39]">
                      - {money(result.monthlyEmi)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="font-medium text-[#1F2A44]">Surplus after this EMI</span>
                    <span className="font-bold tabular-nums text-[#1F2A44]">
                      {currentSurplus && result.monthlyEmi
                        ? money(String(Number(currentSurplus) - Number(result.monthlyEmi)))
                        : "Depends on surplus"}
                    </span>
                  </div>
                </div>
              </Panel>

              {/* Prepayment Analysis Result */}
              {prepayment && (
                <Panel title="Prepayment impact analysis">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-[#FFF9F0] p-4">
                      <span className="text-xs uppercase tracking-wider text-[#475467]">
                        Interest Saved
                      </span>
                      <p className="mt-1 text-2xl font-serif tabular-nums text-[#3D5C4A]">
                        {money(prepayment.interestSaved)}
                      </p>
                      <p className="mt-1 text-xs text-[#475467]">
                        Original interest: {money(prepayment.originalTotalInterest)} → Revised: {money(prepayment.revisedTotalInterest)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-[#FFF9F0] p-4">
                      <span className="text-xs uppercase tracking-wider text-[#475467]">
                        {prepayStrategy === "reduce_tenure" ? "Tenure Saved" : "Revised EMI"}
                      </span>
                      <p className="mt-1 text-2xl font-serif tabular-nums text-[#1F2A44]">
                        {prepayStrategy === "reduce_tenure"
                          ? `${prepayment.monthsSaved} months`
                          : money(prepayment.revisedMonthlyEmi)}
                      </p>
                      <p className="mt-1 text-xs text-[#475467]">
                        {prepayStrategy === "reduce_tenure"
                          ? `Loan ends in ${prepayment.revisedTenureMonths} months instead of ${prepayment.originalTenureMonths}`
                          : `Monthly payment reduced by ${money(String(Number(result.monthlyEmi) - Number(prepayment.revisedMonthlyEmi)))}`}
                      </p>
                    </div>
                  </div>
                </Panel>
              )}

              {/* Refinancing Analysis Result */}
              {refinancing && (
                <Panel title="Refinancing feasibility">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge tone={refinancing.isBeneficial ? "sage" : "warning"}>
                        {refinancing.isBeneficial ? "Beneficial to Refinance" : "Not Beneficial After Fees"}
                      </Badge>
                      <span className="text-xs text-[#475467]">
                        Accounting for {money(refinancing.processingFee)} processing fee
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-border p-3 text-xs">
                        <span className="text-[#475467]">New monthly EMI</span>
                        <p className="text-base font-semibold tabular-nums mt-0.5">
                          {money(refinancing.newMonthlyEmi)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-3 text-xs">
                        <span className="text-[#475467]">New total interest</span>
                        <p className="text-base font-semibold tabular-nums mt-0.5">
                          {money(refinancing.newTotalInterest)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-3 text-xs">
                        <span className="text-[#475467]">Net savings after fees</span>
                        <p className="text-base font-semibold tabular-nums text-[#3D5C4A] mt-0.5">
                          {money(refinancing.netSavings)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Panel>
              )}

              {/* Accessible Amortization Schedule */}
              <Panel title="Amortization schedule (accessible table)">
                <div className="mb-3 text-xs text-[#475467]">
                  Showing initial {Math.min(schedule.length, 36)} months of amortization schedule. Principal component increases over time.
                </div>
                <div className="max-h-96 overflow-y-auto border border-border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <caption className="sr-only">
                      Monthly loan amortization schedule showing principal and interest split
                    </caption>
                    <thead className="bg-[#FFF9F0] sticky top-0 border-b border-border text-[#475467]">
                      <tr>
                        <th scope="col" className="p-2.5">Month</th>
                        <th scope="col" className="p-2.5">Payment</th>
                        <th scope="col" className="p-2.5">Principal</th>
                        <th scope="col" className="p-2.5">Interest</th>
                        <th scope="col" className="p-2.5">Remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {schedule.slice(0, 36).map((row) => (
                        <tr key={row.month} className="hover:bg-[#FFF9F0]/40">
                          <th scope="row" className="p-2.5 font-normal text-[#475467]">
                            Month {row.month}
                          </th>
                          <td className="p-2.5 tabular-nums">{money(row.payment)}</td>
                          <td className="p-2.5 tabular-nums text-[#3D5C4A]">{money(row.principal)}</td>
                          <td className="p-2.5 tabular-nums text-[#8A531D]">{money(row.interest)}</td>
                          <td className="p-2.5 tabular-nums font-medium">{money(row.remainingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </>
          ) : (
            !loanQuery.isPending && (
              <Empty>
                No loan calculated yet. Enter your loan principal, interest rate, and tenure or select an existing liability above to calculate amortization.
              </Empty>
            )
          )}
        </div>
      </div>
    </>
  );
}

export function LoanDetail({ id }: { id: string }) {
  const planningQuery = usePlanning();
  const accountsQuery = useAccounts();
  const loansQuery = useLoans();

  const liabilities = planningQuery.data?.inputs.netWorth?.liabilities ?? [];
  const loanAccounts = accountsQuery.data?.filter((a) => a.type.toLowerCase().includes("loan")) ?? [];
  const recordedLoans = loansQuery.data?.data ?? [];

  const foundLiability = liabilities.find((_, idx) => `item-${idx}` === id);
  const foundAccount = loanAccounts.find((a) => a.id === id);
  const foundRecordedLoan = recordedLoans.find((l) => l.id === id);

  const initialLoan = foundRecordedLoan
    ? {
        principal: foundRecordedLoan.outstandingPrincipal,
        rate: foundRecordedLoan.interestRate ?? undefined,
        tenure: foundRecordedLoan.remainingTenureMonths ?? undefined,
        name: foundRecordedLoan.name,
      }
    : foundLiability
    ? { principal: foundLiability.value || undefined, name: foundLiability.name }
    : foundAccount
    ? { principal: foundAccount.currentBalance || undefined, name: foundAccount.name }
    : undefined;

  const hasMissingBalance =
    (foundAccount && !foundAccount.currentBalance) ||
    (foundLiability && !foundLiability.value) ||
    (foundRecordedLoan && !foundRecordedLoan.outstandingPrincipal);

  return (
    <>
      <div className="mb-4">
        <Link className={secondary} href="/dashboard/loans">
          ← Back to all loans
        </Link>
      </div>

      {hasMissingBalance && (
        <div role="note" className="mb-6 rounded-xl border border-[#8A531D] bg-[#E6B46A]/15 p-4 text-sm text-[#1F2A44]">
          <p className="font-semibold">Recorded balance unavailable</p>
          <p className="text-xs text-[#475467] mt-1">
            This account or liability does not have a recorded current balance. Enter your loan details below to perform amortization analysis.
          </p>
        </div>
      )}

      <LoansOverview initialLoan={initialLoan} />
    </>
  );
}
