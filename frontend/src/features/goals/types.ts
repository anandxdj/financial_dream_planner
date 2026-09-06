import type { Goal } from "@/features/planner/planning-queries";

export type GoalCardState = "not_started" | "in_progress" | "completed";

export type GoalFilterTab = "all" | "in_progress" | "not_started" | "completed";

export interface GoalContributionRecord {
  id: string;
  goalId: string;
  amount: string;
  date: string;
  note?: string;
  type?: "sip" | "adhoc" | "initial";
}

export interface MilestoneItem {
  step: number;
  amountFormatted: string;
  label: string;
  date: string;
  state: "done" | "current" | "upcoming";
}

export interface AddGoalWizardState {
  category: Goal["category"];
  name: string;
  targetAmount: string;
  targetDate: string;
  currentSavings: string;
  monthlyContribution: string;
  notes?: string;
}
