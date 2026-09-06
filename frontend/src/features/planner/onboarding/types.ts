export type OnboardingStage =
  | "welcome" // Screen 01
  | "goals" // Screen 02 (Step 1)
  | "chat" // Screen 02.5 Conversational AI Buddy Chat
  | "income" // Screen 03 (Step 2)
  | "expenses" // Screen 04 (Step 3)
  | "loans" // Screen 05 (Step 4)
  | "investments" // Screen 06 (Step 5)
  | "review" // Screen 07 (Step 6)
  | "generating" // Screen 08 (Step 7)
  | "complete"; // Screen 09

export interface GoalCardItem {
  id: string;
  name: string;
  category: "home" | "car" | "education" | "travel" | "retirement" | "custom";
  description?: string;
  image: string;
  selected: boolean;
  targetAmount?: string;
}

export interface IncomeStream {
  id: string;
  source: string;
  type: string;
  amount: string;
}

export interface ExpenseItem {
  id: string;
  category: string;
  label: string;
  amount: string;
  isEssential: boolean;
}

export interface LoanItem {
  id: string;
  name: string;
  type: string;
  outstandingAmount: string;
  monthlyEmi: string;
  annualRate?: string;
  tenureMonths?: number;
}

export interface InvestmentItem {
  id: string;
  name: string;
  type: string;
  currentValue: string;
}
