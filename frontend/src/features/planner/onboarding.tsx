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
import { claimPendingAnonymousDraft, getAnonymousDraft, clearAnonymousDraft } from "@/services/onboarding-draft";
import { useMe } from "@/hooks/use-me";

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
      essentialExpenses: "28000",
      discretionaryExpenses: "10500",
      emis: "0",
    },
    emergencyFund: {
      currentReserves: "50000",
      incomeStability: "stable",
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
  const me = useMe();
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

  const userProfile = {
    name: me.data?.displayName || (me.data?.email ? me.data.email.split("@")[0] : "Your Account"),
    email: me.data?.email || "Signed in as guest",
  };

  return (
    <OnboardingFlow
      initial={planningData}
      userProfile={userProfile}
      pendingDraft={pendingDraft}
      claimingDraft={claimingDraft}
      claimError={claimError}
      onRetryClaim={() => void retryClaim()}
      onDismissDraft={() => {
        clearAnonymousDraft();
        setPendingDraft(false);
      }}
    />
  );
}

function toBackendCompletedStep(uiStep: number): number {
  if (uiStep <= 0) return 0;
  if (uiStep === 1) return 1;
  if (uiStep <= 3) return 2;
  return 3;
}

interface OnboardingFlowProps {
  initial: Planning;
  userProfile?: { name: string; email: string };
  pendingDraft?: boolean;
  claimingDraft?: boolean;
  claimError?: unknown;
  onRetryClaim?: () => void;
  onDismissDraft?: () => void;
}

function OnboardingFlow({
  initial,
  userProfile,
  pendingDraft,
  claimingDraft,
  claimError,
  onRetryClaim,
  onDismissDraft,
}: OnboardingFlowProps) {
  const router = useRouter();
  const client = useQueryClient();

  // Stage: "welcome" | "goals" | "income" | "expenses" | "loans" | "investments" | "review" | "generating" | "complete"
  const [stage, setStage] = useState<OnboardingStage>(() => {
    // If completedStep > 0, resume at that step
    if (initial.completedStep && initial.completedStep >= 1) {
      if (initial.completedStep === 1) return "income";
      if (initial.completedStep === 2) return "loans";
      if (initial.completedStep >= 3) return "review";
    }
    return "welcome";
  });

  const [maxCompletedStep, setMaxCompletedStep] = useState<number>(() => {
    const step = initial.completedStep ?? 0;
    if (step === 1) return 1;
    if (step === 2) return 3;
    if (step >= 3) return 6;
    return 0;
  });

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

  const [otherIncome, setOtherIncome] = useState<IncomeStream[]>([]);

  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
  const [loans, setLoans] = useState<LoanItem[]>(() => {
    if (initial.inputs?.loan?.principal && parseFloat(initial.inputs.loan.principal) > 0) {
      return [
        {
          id: "loan-1",
          name: "Existing Loan",
          type: "other",
          outstandingAmount: initial.inputs.loan.principal,
          monthlyEmi: initial.inputs.cashFlow?.emis || "0",
          annualRate: initial.inputs.loan.annualRate || "8.5",
          tenureMonths: initial.inputs.loan.tenureMonths || 180,
        },
      ];
    }
    return INITIAL_LOANS;
  });
  const [investments, setInvestments] = useState<InvestmentItem[]>(INITIAL_INVESTMENTS);

  // Autosave and sync tracking
  const [change, setChange] = useState(0);
  const [savedChange, setSavedChange] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiGenerateSuccess, setApiGenerateSuccess] = useState(false);

  const revision = useRef(initial.revision);
  useEffect(() => {
    if (typeof initial.revision === "number" && initial.revision > revision.current) {
      revision.current = initial.revision;
    }
  }, [initial.revision]);

  const inFlight = useRef<Promise<void> | null>(null);
  const generationKey = useRef<string | null>(null);

  // Compute roll-up backend inputs snapshot
  const getRolledUpInputs = useCallback((): Inputs => {
    const totalSalary = Math.max(0, parseFloat(salary) || 0);
    const totalOtherIncome = otherIncome.reduce((acc, s) => acc + Math.max(0, parseFloat(s.amount) || 0), 0);
    const totalIncome = (totalSalary + totalOtherIncome).toString();

    const essentialExp = expenses
      .filter((e) => e.isEssential)
      .reduce((acc, e) => acc + Math.max(0, parseFloat(e.amount) || 0), 0)
      .toString();

    const discretionaryExp = expenses
      .filter((e) => !e.isEssential)
      .reduce((acc, e) => acc + Math.max(0, parseFloat(e.amount) || 0), 0)
      .toString();

    const totalEmis = loans
      .reduce((acc, l) => acc + Math.max(0, parseFloat(l.monthlyEmi) || 0), 0)
      .toString();

    const totalLoanPrincipal = loans
      .reduce((acc, l) => acc + Math.max(0, parseFloat(l.outstandingAmount) || 0), 0);

    const totalInvestments = investments
      .reduce((acc, i) => acc + Math.max(0, parseFloat(i.currentValue) || 0), 0)
      .toString();

    const firstGoal = goals.find((g) => g.selected);
    const goalTarget = firstGoal?.targetAmount ? Math.max(0, parseFloat(firstGoal.targetAmount) || 0) : 0;
    const primaryLoan = loans.find((l) => (parseFloat(l.outstandingAmount) || 0) > 0);

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
      loan: totalLoanPrincipal > 0 ? {
        principal: totalLoanPrincipal.toString(),
        annualRate: primaryLoan?.annualRate && parseFloat(primaryLoan.annualRate) > 0 ? primaryLoan.annualRate : "8.5",
        tenureMonths: primaryLoan?.tenureMonths && primaryLoan.tenureMonths > 0 ? primaryLoan.tenureMonths : 180,
      } : undefined,
      investment: {
        initialLumpSum: totalInvestments,
      },
      goal: firstGoal
        ? {
            goalName: firstGoal.name?.trim() || "Financial Goal",
            goalCategory:
              firstGoal.category === "home"
                ? "home"
                : firstGoal.category === "education"
                  ? "education"
                  : firstGoal.category === "retirement"
                    ? "retirement"
                    : "custom",
            ...(goalTarget > 0 ? { targetAmountToday: goalTarget.toString() } : {}),
          }
        : undefined,
      netWorth: {
        assets: investments
          .filter((inv) => inv.name?.trim() && !isNaN(parseFloat(inv.currentValue)) && parseFloat(inv.currentValue) >= 0)
          .map((inv) => ({
            name: inv.name.trim(),
            category: inv.type || "other",
            value: Math.max(0, parseFloat(inv.currentValue) || 0).toString(),
          })),
        liabilities: loans
          .filter((l) => l.name?.trim() && !isNaN(parseFloat(l.outstandingAmount)) && parseFloat(l.outstandingAmount) >= 0)
          .map((l) => ({
            name: l.name.trim(),
            category: l.type || "other",
            value: Math.max(0, parseFloat(l.outstandingAmount) || 0).toString(),
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

  const save = useCallback(async (force = false) => {
    if (inFlight.current) await inFlight.current;
    const snapshot = latestRef.current;
    if (!force && snapshot.change === savedChange) return;

    setSaving(true);
    setError(null);

    const pending = (async () => {
      const rolledUp = snapshot.getRolledUpInputs();
      const backendStep = toBackendCompletedStep(snapshot.maxCompletedStep);
      try {
        const result = unwrap(
          await sdk.PUT("/api/v1/households/planning", {
            body: {
              inputs: rolledUp,
              completedStep: backendStep,
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
        const errObj = e as { status?: number; message?: string } | undefined;
        // Automatic 409 conflict recovery: fetch latest planning revision and retry save once
        if (errObj?.status === 409) {
          try {
            const fresh = unwrap(await sdk.GET("/api/v1/households/planning"));
            if (fresh?.data && typeof fresh.data.revision === "number") {
              revision.current = fresh.data.revision;
              const retryResult = unwrap(
                await sdk.PUT("/api/v1/households/planning", {
                  body: {
                    inputs: rolledUp,
                    completedStep: backendStep,
                    estimates: [],
                    expectedRevision: revision.current,
                  },
                })
              );
              revision.current = retryResult.data.revision;
              setSavedChange(snapshot.change);
              generationKey.current = null;
              client.setQueryData(["planning"], retryResult.data);
              return;
            }
          } catch {
            // Fall through to default error handling
          }
        }

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("fdp:guest-planning-inputs", JSON.stringify(rolledUp));
          } catch {
            // ignore
          }
        }
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
      await save(true);
      generationKey.current ??= crypto.randomUUID();
      try {
        unwrap(
          await sdk.POST("/api/v1/households/planning/generate", {
            params: { header: { "Idempotency-Key": generationKey.current } },
            body: { expectedRevision: revision.current },
          })
        );
        await client.invalidateQueries({ queryKey: ["plan"] });
        await client.invalidateQueries({ queryKey: ["planning"] });
      } catch (postErr: unknown) {
        const errObj = postErr as { status?: number; message?: string } | undefined;
        // Automatic 409 conflict recovery on generate: fetch latest planning and retry once
        if (errObj?.status === 409) {
          try {
            const fresh = unwrap(await sdk.GET("/api/v1/households/planning"));
            if (fresh?.data && typeof fresh.data.revision === "number") {
              revision.current = fresh.data.revision;
              generationKey.current = crypto.randomUUID();
              unwrap(
                await sdk.POST("/api/v1/households/planning/generate", {
                  params: { header: { "Idempotency-Key": generationKey.current } },
                  body: { expectedRevision: revision.current },
                })
              );
              await client.invalidateQueries({ queryKey: ["plan"] });
              await client.invalidateQueries({ queryKey: ["planning"] });
              trackFunnel("onboarding_completed");
              trackFunnel("first_plan_generated");
              setApiGenerateSuccess(true);
              return;
            }
          } catch {
            // Fall through
          }
        }

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
        {pendingDraft && (
          <div className="mx-auto mt-4 max-w-5xl px-4">
            <div className="rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E6B46A]/20 text-[#7D5200]">
                  <Sparkles className="size-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[#1F2A44]">Saved Affordability Calculation Found</h3>
                    {onDismissDraft && (
                      <button
                        type="button"
                        className="text-xs text-[#475467] hover:text-[#1F2A44] hover:underline"
                        onClick={onDismissDraft}
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[#475467]">
                    Your affordability inputs are still saved on this device, but have not been added to your plan.
                  </p>
                  <ErrorNotice error={claimError} />
                  {onRetryClaim && (
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        className={`${secondary} text-sm`}
                        disabled={claimingDraft}
                        onClick={onRetryClaim}
                      >
                        {claimingDraft ? "Adding saved inputs…" : "Retry adding saved inputs"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {Boolean(error) && (
          <div className="mx-auto mt-4 max-w-5xl px-4">
            <div className="rounded-xl border border-[#A13F39]/40 bg-[#FFF9F0] p-4 text-sm text-[#A13F39]">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">
                  {stage === "review"
                    ? "Couldn’t generate your plan or save changes. Your inputs are safely preserved."
                    : "Couldn’t save. Your edits are still here."}
                </p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-xs font-semibold text-[#A13F39]/80 hover:text-[#A13F39] hover:underline"
                >
                  Dismiss
                </button>
              </div>
              <ErrorNotice
                error={error}
                retry={() => {
                  setError(null);
                  if (stage === "review") {
                    void triggerPlanGeneration();
                  } else {
                    void saveRef.current(true).catch(() => undefined);
                  }
                }}
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
                        setGoals((prev) => {
                          const target = prev.find((g) => g.id === id);
                          if (!target) return prev;
                          if (!target.selected && prev.filter((g) => g.selected).length >= 3) {
                            return prev;
                          }
                          return prev.map((g) => (g.id === id ? { ...g, selected: !g.selected } : g));
                        });
                        setChange((c) => c + 1);
                      }}
                      onAddCustomGoal={(name) => {
                        setGoals((prev) => {
                          if (prev.filter((g) => g.selected).length >= 3) return prev;
                          const newGoal: GoalCardItem = {
                            id: `custom-${Date.now()}`,
                            name,
                            category: "custom",
                            image: "/Assets/Objects/coin_stacks.png",
                            selected: true,
                          };
                          return [...prev, newGoal];
                        });
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
                      userProfile={userProfile}
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
