export type OnboardingStage = "welcome" | "goals" | "money" | "details" | "review" | "complete";

export type GoalCategory =
  | "home"
  | "car"
  | "travel"
  | "savings"
  | "education"
  | "medical"
  | "retirement"
  | "custom";

export interface OnboardingGoalDraft {
  clientId: string;
  serverId?: string;
  revision?: number;
  name: string;
  category: GoalCategory;
  targetAmount: string;
  currentSavings: string;
  monthlyContribution: string;
  targetDate: string;
}

export interface OnboardingMoneyDraft {
  income: string;
  essentialExpenses: string;
  discretionaryExpenses: string;
  emis: string;
  mandatoryObligations: string;
}

export interface OnboardingDetailsDraft {
  currentReserves: string;
  incomeStability: "" | "stable" | "variable" | "irregular";
  dependents: string;
  emergencyMonthlyContribution: string;
  loanPrincipal: string;
  loanAnnualRate: string;
  loanTenureMonths: string;
  investmentLumpSum: string;
  investmentMonthlySip: string;
  investmentHorizonMonths: string;
}

export interface OnboardingDraftState {
  goals: OnboardingGoalDraft[];
  money: OnboardingMoneyDraft;
  details: OnboardingDetailsDraft;
}
