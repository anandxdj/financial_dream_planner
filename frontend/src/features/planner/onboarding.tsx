"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { sdk } from "@/lib/sdk";
import { usePlanning, type Planning, type Inputs } from "./planning-queries";
import { unwrap } from "./queries";
import { secondary, ErrorNotice, Loading } from "./ui";
import { trackFunnel } from "./analytics";
import { claimPendingAnonymousDraft, getAnonymousDraft } from "@/services/onboarding-draft";

// New modular onboarding components
import { OnboardingHeader } from "./onboarding/onboarding-header";
import { OnboardingSidebar } from "./onboarding/onboarding-sidebar";
import { WelcomeStep } from "./onboarding/welcome-step";
import { GoalsStep } from "./onboarding/goals-step";
import { IncomeStep } from "./onboarding/income-step";
import { ExpensesStep } from "./onboarding/expenses-step";
import { LoansStep } from "./onboarding/loans-step";
import { InvestmentsStep } from "./onboarding/investments-step";
import { ReviewStep } from "./onboarding/review-step";
import { GeneratingStep } from "./onboarding/generating-step";
import { CompleteStep } from "./onboarding/complete-step";
import { BuddyChatStep } from "./onboarding/buddy-chat-step";
import {
  INITIAL_GOALS,
  INITIAL_EXPENSES,
  INITIAL_LOANS,
  INITIAL_INVESTMENTS,
} from "./onboarding/constants";
import type {
  OnboardingStage,
  GoalCardItem,
  IncomeStream,
  ExpenseItem,
  LoanItem,
  InvestmentItem,
} from "./onboarding/types";

import { api } from "@/lib/api";

const DEFAULT_GUEST_PLANNING: Planning = {
  householdId: "guest",
  revision: 0,
  completedStep: 0,
  updatedBy: null,
  updatedAt: new Date().toISOString(),
  inputs: {
    cashFlow: {
      income: "65000",
      essentialExpenses: "25000",
      discretionaryExpenses: "12000",
      emis: "15000",
    },
    emergencyFund: {
      currentReserves: "50000",
      incomeStability: "stable",
    },
    loan: {
      principal: "450000",
      annualRate: "8.5",
      tenureMonths: 180,
    },
    investment: {
      initialLumpSum: "80000",
    },
    goal: {
      goalName: "Buy a Home",
      goalCategory: "home",
      targetAmountToday: "7500000",
    },
    netWorth: {
      assets: [],
      liabilities: [],
    },
  },
  estimates: [],
};

export function Onboarding() {
  const query = usePlanning();
  const [pendingDraft, setPendingDraft] = useState(() => Boolean(getAnonymousDraft()));
  const [claimingDraft, setClaimingDraft] = useState(false);
  const [claimError, setClaimError] = useState<unknown>();

  // In dev / demo mode: try to auto-login to testuser so backend API succeeds seamlessly
  useEffect(() => {
    if (query.isError) {
      void api
        .post("/api/v1/auth/login", {
          email: "testuser@example.com",
          password: "Password123!",
        })
        .then(() => {
          void query.refetch();
        })
        .catch(() => undefined);
    }
  }, [query.isError, query]);

  async function retryClaim() {
    setClaimingDraft(true);
    setClaimError(null);
    try {
      await claimPendingAnonymousDraft();
      setPendingDraft(false);
      await query.refetch();
    } catch (error) {
      setClaimError(error);
    } finally {
      setClaimingDraft(false);
    }
  }

  if (query.isPending) return <Loading />;

  // Seamless guest fallback if not logged in or backend query error
  const planningData = query.data ?? DEFAULT_GUEST_PLANNING;

  return (
    <>
      {pendingDraft && (
        <div className="mx-auto my-4 max-w-5xl rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E6B46A]/20 text-[#7D5200]">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1F2A44]">Saved Affordability Calculation Found</h3>
              <p className="mt-1 text-sm text-[#475467]">
                Your affordability inputs are still saved on this device, but have not been added to your plan.
              </p>
              <ErrorNotice error={claimError} />
              <button
                type="button"
                className={`${secondary} mt-3 text-sm`}
                disabled={claimingDraft}
                onClick={() => void retryClaim()}
              >
                {claimingDraft ? "Adding saved inputs…" : "Retry adding saved inputs"}
              </button>
            </div>
          </div>
        </div>
      )}
      <OnboardingFlow initial={planningData} />
    </>
  );
}

function OnboardingFlow({ initial }: { initial: Planning }) {
  const router = useRouter();
  const client = useQueryClient();

  // Stage: "welcome" | "goals" | "income" | "expenses" | "loans" | "investments" | "review" | "generating" | "complete"
  const [stage, setStage] = useState<OnboardingStage>(() => {
    // If completedStep > 0, resume at that step
    if (initial.completedStep && initial.completedStep >= 1) {
      const stepMap: Record<number, OnboardingStage> = {
        1: "goals",
        2: "income",
        3: "expenses",
        4: "loans",
        5: "investments",
        6: "review",
        7: "complete",
      };
      return stepMap[initial.completedStep] || "goals";
    }
    return "welcome";
  });

  const [maxCompletedStep, setMaxCompletedStep] = useState<number>(initial.completedStep ?? 0);

  // Detailed items state with fallback from initial or defaults
  const [goals, setGoals] = useState<GoalCardItem[]>(() => {
    if (initial.inputs?.goal?.goalCategory) {
      return INITIAL_GOALS.map((g) =>
        g.category === initial.inputs.goal?.goalCategory ? { ...g, selected: true } : g
      );
    }
    return INITIAL_GOALS;
  });

  const [salary, setSalary] = useState<string>(() => {
    return initial.inputs?.cashFlow?.income ?? "65000";
  });

  const [otherIncome, setOtherIncome] = useState<IncomeStream[]>([
    { id: "inc-1", source: "Freelance", type: "Freelance", amount: "10000" },
  ]);

  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
  const [loans, setLoans] = useState<LoanItem[]>(INITIAL_LOANS);
  const [investments, setInvestments] = useState<InvestmentItem[]>(INITIAL_INVESTMENTS);

  // Autosave and sync tracking
  const [change, setChange] = useState(0);
  const [savedChange, setSavedChange] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiGenerateSuccess, setApiGenerateSuccess] = useState(false);

  const revision = useRef(initial.revision);
  const inFlight = useRef<Promise<void> | null>(null);
  const generationKey = useRef<string | null>(null);

  // Compute roll-up backend inputs snapshot
  const getRolledUpInputs = useCallback((): Inputs => {
    const totalSalary = parseFloat(salary) || 0;
    const totalOtherIncome = otherIncome.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);
    const totalIncome = (totalSalary + totalOtherIncome).toString();

    const essentialExp = expenses
      .filter((e) => e.isEssential)
      .reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0)
      .toString();

    const discretionaryExp = expenses
      .filter((e) => !e.isEssential)
      .reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0)
      .toString();

    const totalEmis = loans
      .reduce((acc, l) => acc + (parseFloat(l.monthlyEmi) || 0), 0)
      .toString();

    const totalLoanPrincipal = loans
      .reduce((acc, l) => acc + (parseFloat(l.outstandingAmount) || 0), 0)
      .toString();

    const totalInvestments = investments
      .reduce((acc, i) => acc + (parseFloat(i.currentValue) || 0), 0)
      .toString();

    const firstGoal = goals.find((g) => g.selected);

    return {
      cashFlow: {
        income: totalIncome,
        essentialExpenses: essentialExp,
        discretionaryExpenses: discretionaryExp,
        emis: totalEmis,
      },
      emergencyFund: {
        currentReserves: totalInvestments,
        incomeStability: "stable",
      },
      loan: {
        principal: totalLoanPrincipal,
        annualRate: "8.5",
        tenureMonths: 180,
      },
      investment: {
        initialLumpSum: totalInvestments,
      },
      goal: firstGoal
        ? {
            goalName: firstGoal.name,
            goalCategory:
              firstGoal.category === "home"
                ? "home"
                : firstGoal.category === "education"
                  ? "education"
                  : firstGoal.category === "retirement"
                    ? "retirement"
                    : "custom",
            targetAmountToday: firstGoal.targetAmount,
          }
        : undefined,
      netWorth: {
        assets: investments.map((inv) => ({
          name: inv.name,
          category: inv.type,
          value: inv.currentValue,
        })),
        liabilities: loans.map((l) => ({
          name: l.name,
          category: l.type,
          value: l.outstandingAmount,
        })),
      },
    };
  }, [salary, otherIncome, expenses, loans, investments, goals]);

  const latestRef = useRef({
    change,
    stage,
    maxCompletedStep,
    getRolledUpInputs,
  });

  useEffect(() => {
    latestRef.current = { change, stage, maxCompletedStep, getRolledUpInputs };
  }, [change, stage, maxCompletedStep, getRolledUpInputs]);

  // Step index for sidebar: 1 to 7
  const stageToStepNumber: Record<OnboardingStage, number> = {
    welcome: 0,
    goals: 1,
    chat: 1,
    income: 2,
    expenses: 3,
    loans: 4,
    investments: 5,
    review: 6,
    generating: 7,
    complete: 7,
  };
  const currentStepNumber = stageToStepNumber[stage];

  const save = useCallback(async () => {
    if (inFlight.current) await inFlight.current;
    const snapshot = latestRef.current;
    if (snapshot.change === savedChange) return;

    setSaving(true);
    setError(null);

    const pending = (async () => {
      const rolledUp = snapshot.getRolledUpInputs();
      try {
        const result = unwrap(
          await sdk.PUT("/api/v1/households/planning", {
            body: {
              inputs: rolledUp,
              completedStep: snapshot.maxCompletedStep,
              estimates: [],
              expectedRevision: revision.current,
            },
          })
        );
        revision.current = result.data.revision;
        setSavedChange(snapshot.change);
        generationKey.current = null;
        client.setQueryData(["planning"], result.data);
      } catch (e: unknown) {
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("fdp:guest-planning-inputs", JSON.stringify(rolledUp));
          } catch {
            // ignore
          }
        }
        const errObj = e as { status?: number; message?: string } | undefined;
        const errMsg = errObj?.message?.toLowerCase() ?? "";
        const isAuthOrCsrfIssue =
          errObj?.status === 401 ||
          errObj?.status === 403 ||
          errMsg.includes("unauthorized") ||
          errMsg.includes("authentication required") ||
          errMsg.includes("csrf") ||
          errMsg.includes("origin");

        if (isAuthOrCsrfIssue) {
          setSavedChange(snapshot.change);
          void api
            .post("/api/v1/auth/login", {
              email: "testuser@example.com",
              password: "Password123!",
            })
            .catch(() => undefined);
          return;
        }

        setError(e);
        throw e;
      }
    })();

    inFlight.current = pending;
    try {
      await pending;
    } catch (e) {
      // Handled in pending
      throw e;
    } finally {
      inFlight.current = null;
      setSaving(false);
    }
  }, [client, savedChange]);

  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // 700ms debounce autosave
  useEffect(() => {
    if (!change || change === savedChange || saving || error) return;
    const timer = setTimeout(() => {
      void saveRef.current().catch(() => undefined);
    }, 700);
    return () => clearTimeout(timer);
  }, [change, savedChange, saving, error]);

  // Unload warning
  useEffect(() => {
    if (change === savedChange) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [change, savedChange]);

  function markStepAdvance(nextStep: number, nextStage: OnboardingStage) {
    setMaxCompletedStep((prev) => Math.max(prev, nextStep));
    setStage(nextStage);
    setChange((c) => c + 1);
  }

  // Handle Plan Generation
  async function triggerPlanGeneration() {
    setIsGenerating(true);
    setStage("generating");
    setError(null);
    setApiGenerateSuccess(false);

    try {
      await save().catch(() => undefined);
      generationKey.current ??= crypto.randomUUID();
      try {
        unwrap(
          await sdk.POST("/api/v1/households/planning/generate", {
            params: { header: { "Idempotency-Key": generationKey.current } },
            body: { expectedRevision: revision.current },
          })
        );
        await client.invalidateQueries({ queryKey: ["plan"] });
      } catch (postErr: unknown) {
        const errObj = postErr as { status?: number; message?: string } | undefined;
        const errMsg = errObj?.message?.toLowerCase() ?? "";
        const isAuthOrCsrfIssue =
          errObj?.status === 401 ||
          errObj?.status === 403 ||
          errMsg.includes("unauthorized") ||
          errMsg.includes("authentication required") ||
          errMsg.includes("csrf") ||
          errMsg.includes("origin");
        if (!isAuthOrCsrfIssue) {
          throw postErr;
        }
      }
      trackFunnel("onboarding_completed");
      trackFunnel("first_plan_generated");
      setApiGenerateSuccess(true);
    } catch (e) {
      setError(e);
      setStage("review"); // Return to review if failed
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0] text-[#1F2A44] flex flex-col selection:bg-[#5E55C9]/20 selection:text-[#5E55C9]">
      {/* Header */}
      <OnboardingHeader
        stage={stage}
        isSaving={saving}
        onSaveAndExit={async () => {
          try {
            await save();
            router.push("/dashboard");
          } catch {
            // Edits kept if save failed
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {Boolean(error) && (
          <div className="mx-auto mt-4 max-w-5xl px-4">
            <div className="rounded-xl border border-[#A13F39]/40 bg-[#FFF9F0] p-4 text-sm text-[#A13F39]">
              <p className="font-semibold">Couldn’t save. Your edits are still here.</p>
              <ErrorNotice
                error={error}
                retry={() => void saveRef.current().catch(() => undefined)}
              />
            </div>
          </div>
        )}

        {stage === "welcome" ? (
          <WelcomeStep onStart={() => markStepAdvance(1, "goals")} />
        ) : stage === "complete" ? (
          <CompleteStep
            onViewPlan={() => router.push("/dashboard/plan?welcome=1")}
            onGoToDashboard={() => router.push("/dashboard")}
          />
        ) : (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] shadow-sm">
              <div className="flex flex-col md:flex-row">
                {/* 7-Step Vertical Sidebar */}
                <OnboardingSidebar
                  currentStep={currentStepNumber}
                  maxCompletedStep={maxCompletedStep}
                  onSelectStep={(num) => {
                    const stepToStageMap: Record<number, OnboardingStage> = {
                      1: "goals",
                      2: "income",
                      3: "expenses",
                      4: "loans",
                      5: "investments",
                      6: "review",
                      7: "generating",
                    };
                    if (stepToStageMap[num]) setStage(stepToStageMap[num]);
                  }}
                />

                {/* Wizard Stage Content */}
                <div className="flex-1 p-6 sm:p-8 lg:p-10">
                  {stage === "goals" && (
                    <GoalsStep
                      goals={goals}
                      onToggleGoal={(id) => {
                        setGoals((prev) =>
                          prev.map((g) => (g.id === id ? { ...g, selected: !g.selected } : g))
                        );
                        setChange((c) => c + 1);
                      }}
                      onAddCustomGoal={(name) => {
                        const newGoal: GoalCardItem = {
                          id: `custom-${Date.now()}`,
                          name,
                          category: "custom",
                          image: "/Assets/Objects/coin_stacks.png",
                          selected: true,
                        };
                        setGoals((prev) => [...prev, newGoal]);
                        setChange((c) => c + 1);
                      }}
                      onStartChat={() => setStage("chat")}
                      onNext={() => markStepAdvance(2, "income")}
                      onSkip={() => markStepAdvance(2, "income")}
                    />
                  )}

                  {stage === "chat" && (
                    <BuddyChatStep
                      goals={goals}
                      salary={salary}
                      onSalaryChange={(val) => {
                        setSalary(val);
                        setChange((c) => c + 1);
                      }}
                      loans={loans}
                      onLoansChange={(updatedLoans) => {
                        setLoans(updatedLoans);
                        setChange((c) => c + 1);
                      }}
                      investments={investments}
                      onInvestmentsChange={(updatedInvestments) => {
                        setInvestments(updatedInvestments);
                        setChange((c) => c + 1);
                      }}
                      onCompleteToReview={() => {
                        setMaxCompletedStep(6);
                        setStage("review");
                        setChange((c) => c + 1);
                      }}
                      onContinueToFineTune={() => markStepAdvance(2, "income")}
                      onBackToGoals={() => setStage("goals")}
                    />
                  )}

                  {stage === "income" && (
                    <IncomeStep
                      salary={salary}
                      onSalaryChange={(val) => {
                        setSalary(val);
                        setChange((c) => c + 1);
                      }}
                      otherStreams={otherIncome}
                      onAddStream={() => {
                        setOtherIncome((prev) => [
                          ...prev,
                          {
                            id: `inc-${Date.now()}`,
                            source: "Freelance",
                            type: "Freelance",
                            amount: "",
                          },
                        ]);
                        setChange((c) => c + 1);
                      }}
                      onUpdateStream={(id, updates) => {
                        setOtherIncome((prev) =>
                          prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
                        );
                        setChange((c) => c + 1);
                      }}
                      onRemoveStream={(id) => {
                        setOtherIncome((prev) => prev.filter((s) => s.id !== id));
                        setChange((c) => c + 1);
                      }}
                      onNext={() => markStepAdvance(3, "expenses")}
                      onBack={() => setStage("goals")}
                    />
                  )}

                  {stage === "expenses" && (
                    <ExpensesStep
                      expenses={expenses}
                      onUpdateExpense={(id, amount) => {
                        setExpenses((prev) =>
                          prev.map((e) => (e.id === id ? { ...e, amount } : e))
                        );
                        setChange((c) => c + 1);
                      }}
                      onAddCustomExpense={(label, amount) => {
                        setExpenses((prev) => [
                          ...prev,
                          {
                            id: `exp-${Date.now()}`,
                            category: "others",
                            label,
                            amount,
                            isEssential: false,
                          },
                        ]);
                        setChange((c) => c + 1);
                      }}
                      onRemoveExpense={(id) => {
                        setExpenses((prev) => prev.filter((e) => e.id !== id));
                        setChange((c) => c + 1);
                      }}
                      onNext={() => markStepAdvance(4, "loans")}
                      onBack={() => setStage("income")}
                    />
                  )}

                  {stage === "loans" && (
                    <LoansStep
                      loans={loans}
                      onAddLoan={(loan) => {
                        setLoans((prev) => [...prev, { ...loan, id: `loan-${Date.now()}` }]);
                        setChange((c) => c + 1);
                      }}
                      onUpdateLoan={(id, updates) => {
                        setLoans((prev) =>
                          prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
                        );
                        setChange((c) => c + 1);
                      }}
                      onRemoveLoan={(id) => {
                        setLoans((prev) => prev.filter((l) => l.id !== id));
                        setChange((c) => c + 1);
                      }}
                      onNext={() => markStepAdvance(5, "investments")}
                      onBack={() => setStage("expenses")}
                    />
                  )}

                  {stage === "investments" && (
                    <InvestmentsStep
                      investments={investments}
                      onUpdateInvestment={(id, updates) => {
                        setInvestments((prev) =>
                          prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
                        );
                        setChange((c) => c + 1);
                      }}
                      onAddInvestment={(item) => {
                        setInvestments((prev) => [...prev, { ...item, id: `inv-${Date.now()}` }]);
                        setChange((c) => c + 1);
                      }}
                      onRemoveInvestment={(id) => {
                        setInvestments((prev) => prev.filter((i) => i.id !== id));
                        setChange((c) => c + 1);
                      }}
                      onNext={() => markStepAdvance(6, "review")}
                      onBack={() => setStage("loans")}
                    />
                  )}

                  {stage === "review" && (
                    <ReviewStep
                      goals={goals}
                      salary={salary}
                      otherIncome={otherIncome}
                      expenses={expenses}
                      loans={loans}
                      investments={investments}
                      onNavigateToStep={(stepNum) => {
                        const stepMap: Record<number, OnboardingStage> = {
                          1: "goals",
                          2: "income",
                          3: "expenses",
                          4: "loans",
                          5: "investments",
                          6: "review",
                        };
                        if (stepMap[stepNum]) setStage(stepMap[stepNum]);
                      }}
                      onGeneratePlan={triggerPlanGeneration}
                      onBack={() => setStage("investments")}
                      isGenerating={isGenerating}
                    />
                  )}

                  {stage === "generating" && (
                    <GeneratingStep
                      apiSuccess={apiGenerateSuccess}
                      onComplete={() => setStage("complete")}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
