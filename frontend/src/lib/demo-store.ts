/**
 * Client-Side Demo State Store with LocalStorage Persistence
 * Strictly typed against OpenAPI contracts.
 */

import {
  DEMO_ACCOUNTS,
  DEMO_ACCOUNTS_ROHIT,
  DEMO_CATEGORIES,
  DEMO_CATEGORIES_ROHIT,
  DEMO_CURRENT_PLAN,
  DEMO_CURRENT_PLAN_ROHIT,
  DEMO_FEASIBILITY,
  DEMO_FEASIBILITY_ROHIT,
  DEMO_GOALS,
  DEMO_GOALS_ROHIT,
  DEMO_LOANS,
  DEMO_LOANS_ROHIT,
  DEMO_PLANNING,
  DEMO_PLANNING_ROHIT,
  DEMO_RECORDED_CASH_FLOW,
  DEMO_RECORDED_CASH_FLOW_ROHIT,
  DEMO_SCENARIOS,
  DEMO_SCENARIOS_ROHIT,
  DEMO_TRANSACTIONS,
  DEMO_TRANSACTIONS_ROHIT,
  DEMO_USER,
  DEMO_USER_ROHIT,
  type Account,
  type CurrentPlanData,
  type DemoCategory,
  type DemoTransactionItem,
  type DemoUser,
  type FeasibilityData,
  type Loan,
  type LoanCalculationData,
  type PlanningData,
  type PlanningGoal,
  type RunScenarioData,
  type Scenario,
} from "./demo-data";
import type { GoalContributionRecord } from "@/features/goals/types";

const BASE_STORAGE_KEY = "fdp_demo_store_v4";
const ACTIVE_PERSONA_KEY = "fdp_demo_active_persona";
const DEMO_MODE_ACTIVE_KEY = "fdp_demo_mode_active";

const INITIAL_GOAL_CONTRIBUTIONS_ANAND: GoalContributionRecord[] = [
  { id: "gcon_1", goalId: "goal_emergency", amount: "10000.00", date: "2026-08-05", note: "Monthly SIP", type: "sip" },
  { id: "gcon_2", goalId: "goal_emergency", amount: "10000.00", date: "2026-07-05", note: "Monthly SIP", type: "sip" },
  { id: "gcon_3", goalId: "goal_emergency", amount: "15000.00", date: "2026-06-05", note: "Bonus Allocation", type: "adhoc" },
  { id: "gcon_4", goalId: "goal_emergency", amount: "10000.00", date: "2026-05-05", note: "Monthly SIP", type: "sip" },
  { id: "gcon_5", goalId: "goal_emergency", amount: "10000.00", date: "2026-04-05", note: "Monthly SIP", type: "sip" },
  { id: "gcon_6", goalId: "goal_emergency", amount: "10000.00", date: "2026-03-05", note: "Monthly SIP", type: "sip" },

  { id: "gcon_7", goalId: "goal_home_blr", amount: "20000.00", date: "2026-08-05", note: "Monthly SIP", type: "sip" },
  { id: "gcon_8", goalId: "goal_home_blr", amount: "20000.00", date: "2026-07-05", note: "Monthly SIP", type: "sip" },
  { id: "gcon_9", goalId: "goal_home_blr", amount: "25000.00", date: "2026-06-05", note: "Extra savings", type: "adhoc" },
  { id: "gcon_10", goalId: "goal_home_blr", amount: "20000.00", date: "2026-05-05", note: "Monthly SIP", type: "sip" },
  { id: "gcon_11", goalId: "goal_home_blr", amount: "20000.00", date: "2026-04-05", note: "Monthly SIP", type: "sip" },
  { id: "gcon_12", goalId: "goal_home_blr", amount: "20000.00", date: "2026-03-05", note: "Monthly SIP", type: "sip" },

  { id: "gcon_13", goalId: "goal_child_edu", amount: "8000.00", date: "2026-08-05", note: "Monthly SIP", type: "sip" },
  { id: "gcon_14", goalId: "goal_child_edu", amount: "8000.00", date: "2026-07-05", note: "Monthly SIP", type: "sip" },
  { id: "gcon_15", goalId: "goal_child_edu", amount: "8000.00", date: "2026-06-05", note: "Monthly SIP", type: "sip" },
];

const INITIAL_GOAL_CONTRIBUTIONS_ROHIT: GoalContributionRecord[] = [
  { id: "gcon_r1", goalId: "goal_rohit_house", amount: "2000.00", date: "2026-08-05", note: "Monthly SIP", type: "sip" },
  { id: "gcon_r2", goalId: "goal_rohit_house", amount: "2000.00", date: "2026-07-05", note: "Monthly SIP", type: "sip" },
  { id: "gcon_r3", goalId: "goal_rohit_house", amount: "2000.00", date: "2026-06-05", note: "Monthly SIP", type: "sip" },
  { id: "gcon_r4", goalId: "goal_rohit_bullet", amount: "5000.00", date: "2026-06-15", note: "Freelance gig savings", type: "adhoc" },
];

export interface DemoStoreState {
  user: DemoUser;
  accounts: Account[];
  categories: DemoCategory[];
  transactions: DemoTransactionItem[];
  goals: PlanningGoal[];
  goalContributions: GoalContributionRecord[];
  loans: Loan[];
  scenarios: Scenario[];
  planning: PlanningData;
  currentPlan: CurrentPlanData;
}

function getInitialState(personaId: "anand" | "rohit" = "anand"): DemoStoreState {
  if (personaId === "rohit") {
    return {
      user: { ...DEMO_USER_ROHIT },
      accounts: [...DEMO_ACCOUNTS_ROHIT],
      categories: [...DEMO_CATEGORIES_ROHIT],
      transactions: [...DEMO_TRANSACTIONS_ROHIT],
      goals: [...DEMO_GOALS_ROHIT],
      goalContributions: [...INITIAL_GOAL_CONTRIBUTIONS_ROHIT],
      loans: [...DEMO_LOANS_ROHIT],
      scenarios: [...DEMO_SCENARIOS_ROHIT],
      planning: JSON.parse(JSON.stringify(DEMO_PLANNING_ROHIT)),
      currentPlan: JSON.parse(JSON.stringify(DEMO_CURRENT_PLAN_ROHIT)),
    };
  }

  return {
    user: { ...DEMO_USER },
    accounts: [...DEMO_ACCOUNTS],
    categories: [...DEMO_CATEGORIES],
    transactions: [...DEMO_TRANSACTIONS],
    goals: [...DEMO_GOALS],
    goalContributions: [...INITIAL_GOAL_CONTRIBUTIONS_ANAND],
    loans: [...DEMO_LOANS],
    scenarios: [...DEMO_SCENARIOS],
    planning: JSON.parse(JSON.stringify(DEMO_PLANNING)),
    currentPlan: JSON.parse(JSON.stringify(DEMO_CURRENT_PLAN)),
  };
}

class DemoStore {
  private currentPersonaId: "anand" | "rohit" = "anand";
  private state: DemoStoreState;
  private listeners: Set<() => void> = new Set();
  private isClient = typeof window !== "undefined";

  constructor() {
    if (this.isClient) {
      const savedPersona = localStorage.getItem(ACTIVE_PERSONA_KEY);
      if (savedPersona === "rohit" || savedPersona === "anand") {
        this.currentPersonaId = savedPersona;
      }
    }
    this.state = this.loadState(this.currentPersonaId);
  }

  private getStorageKey(personaId: "anand" | "rohit"): string {
    return `${BASE_STORAGE_KEY}_${personaId}`;
  }

  private loadState(personaId: "anand" | "rohit"): DemoStoreState {
    if (!this.isClient) return getInitialState(personaId);
    try {
      const key = this.getStorageKey(personaId);
      let raw = localStorage.getItem(key);
      if (!raw && personaId === "anand") {
        raw = localStorage.getItem(BASE_STORAGE_KEY);
      }
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DemoStoreState>;
        const initial = getInitialState(personaId);
        return {
          user: parsed.user ?? initial.user,
          accounts: parsed.accounts ?? initial.accounts,
          categories: parsed.categories ?? initial.categories,
          transactions: parsed.transactions ?? initial.transactions,
          goals: parsed.goals ?? initial.goals,
          goalContributions: parsed.goalContributions ?? initial.goalContributions,
          loans: parsed.loans ?? initial.loans,
          scenarios: parsed.scenarios ?? initial.scenarios,
          planning: parsed.planning ?? initial.planning,
          currentPlan: parsed.currentPlan ?? initial.currentPlan,
        };
      }
    } catch {
      // Ignore parse/storage errors
    }
    return getInitialState(personaId);
  }

  private saveState(): void {
    if (!this.isClient) return;
    try {
      const key = this.getStorageKey(this.currentPersonaId);
      localStorage.setItem(key, JSON.stringify(this.state));
    } catch {
      // Ignore storage errors
    }
    this.notify();
  }

  public getActivePersonaId(): "anand" | "rohit" {
    return this.currentPersonaId;
  }

  public setActivePersonaId(personaId: "anand" | "rohit"): void {
    if (this.currentPersonaId === personaId) return;
    this.currentPersonaId = personaId;
    if (this.isClient) {
      localStorage.setItem(ACTIVE_PERSONA_KEY, personaId);
    }
    this.state = this.loadState(personaId);
    this.notify();
  }

  public getAvailablePersonas() {
    return [
      {
        id: "anand" as const,
        name: "Anand Sharma",
        title: "Tech Professional (Bengaluru)",
        incomeText: "₹1.5L/mo",
        badge: "HDFC/ICICI · ₹45L Home Loan",
        highlight: "₹1.5L/mo Tech Salary · Bengaluru Home Down Payment · ₹45L Loan",
      },
      {
        id: "rohit" as const,
        name: "Rohit Verma",
        title: "Junior Associate / Early Career",
        incomeText: "₹30k/mo",
        badge: "SBI/Groww · Bullet 350 · ₹10k Phone EMI",
        highlight: "₹30k/mo Junior Associate · Royal Enfield Bullet 350 · ₹10k Phone EMI",
      },
    ];
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  public reset(): void {
    this.state = getInitialState(this.currentPersonaId);
    if (this.isClient) {
      localStorage.removeItem(this.getStorageKey(this.currentPersonaId));
      if (this.currentPersonaId === "anand") {
        localStorage.removeItem(BASE_STORAGE_KEY);
      }
    }
    this.notify();
  }

  public isDemoMode(): boolean {
    if (!this.isClient) return true;
    const active = localStorage.getItem(DEMO_MODE_ACTIVE_KEY);
    return active !== "false";
  }

  public setDemoMode(active: boolean): void {
    if (!this.isClient) return;
    localStorage.setItem(DEMO_MODE_ACTIVE_KEY, active ? "true" : "false");
    this.notify();
  }

  // --- USER ---
  public getUser(): DemoUser {
    return { ...this.state.user };
  }

  // --- ACCOUNTS ---
  public getAccounts(): Account[] {
    return [...this.state.accounts];
  }

  public addAccount(account: {
    name: string;
    type?: Account["type"];
    currency?: string;
    currentBalance?: string;
    institutionName?: string;
    maskedNumber?: string;
  }): Account {
    const now = new Date().toISOString();
    const newAccount: Account = {
      id: `acc_${Date.now()}`,
      householdId: this.state.user.householdId,
      name: account.name,
      type: account.type || "SAVINGS",
      currency: account.currency || "INR",
      currentBalance: account.currentBalance || "0.00",
      institutionName: account.institutionName || null,
      maskedNumber: account.maskedNumber || "1234",
      balanceUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.state.accounts = [newAccount, ...this.state.accounts];
    this.saveState();
    return newAccount;
  }

  public updateAccount(id: string, updates: Partial<Account>): Account | null {
    const idx = this.state.accounts.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.state.accounts[idx] = { ...this.state.accounts[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveState();
    return this.state.accounts[idx];
  }

  public deleteAccount(id: string): boolean {
    const prevLen = this.state.accounts.length;
    this.state.accounts = this.state.accounts.filter((a) => a.id !== id);
    if (this.state.accounts.length !== prevLen) {
      this.saveState();
      return true;
    }
    return false;
  }

  // --- CATEGORIES ---
  public getCategories(): DemoCategory[] {
    return [...this.state.categories];
  }

  // --- TRANSACTIONS ---
  public getTransactions(params?: {
    limit?: number;
    cursor?: string;
    direction?: "DEBIT" | "CREDIT";
    status?: string;
    accountId?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }): { data: DemoTransactionItem[]; nextCursor?: string } {
    let list = [...this.state.transactions];

    if (params?.direction) {
      list = list.filter((t) => t.direction === params.direction);
    }
    if (params?.accountId) {
      list = list.filter((t) => t.accountId === params.accountId);
    }
    if (params?.categoryId) {
      list = list.filter((t) => t.categoryId === params.categoryId);
    }
    if (params?.startDate) {
      const start = new Date(params.startDate).getTime();
      list = list.filter((t) => new Date(t.occurredAt).getTime() >= start);
    }
    if (params?.endDate) {
      const end = new Date(params.endDate).getTime();
      list = list.filter((t) => new Date(t.occurredAt).getTime() <= end);
    }

    list.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

    const limit = params?.limit ?? 50;
    const paginated = list.slice(0, limit);
    return { data: paginated };
  }

  public addTransaction(tx: {
    amount: string;
    direction: "DEBIT" | "CREDIT";
    currency?: string;
    occurredAt?: string;
    merchantName?: string;
    description?: string;
    accountId?: string;
    categoryId?: string;
  }): DemoTransactionItem {
    const newTx: DemoTransactionItem = {
      id: `tx_${Date.now()}`,
      amount: tx.amount,
      direction: tx.direction,
      currency: tx.currency || "INR",
      occurredAt: tx.occurredAt || new Date().toISOString(),
      merchantName: tx.merchantName || "Manual Transaction",
      description: tx.description || tx.merchantName || "Manual Transaction",
      status: "verified",
      accountId: tx.accountId || "acc_hdfc_salary",
      categoryId: tx.categoryId || "cat_groceries",
    };
    this.state.transactions = [newTx, ...this.state.transactions];

    if (newTx.accountId) {
      const acc = this.state.accounts.find((a) => a.id === newTx.accountId);
      if (acc) {
        const delta = Number(newTx.amount) * (newTx.direction === "CREDIT" ? 1 : -1);
        const nextBal = (Number(acc.currentBalance || 0) + delta).toFixed(2);
        acc.currentBalance = nextBal;
        acc.balanceUpdatedAt = new Date().toISOString();
      }
    }

    this.saveState();
    return newTx;
  }

  public deleteTransaction(id: string): boolean {
    const prevLen = this.state.transactions.length;
    this.state.transactions = this.state.transactions.filter((t) => t.id !== id);
    if (this.state.transactions.length !== prevLen) {
      this.saveState();
      return true;
    }
    return false;
  }

  public updateTransaction(id: string, updates: Partial<DemoTransactionItem>): DemoTransactionItem | null {
    const idx = this.state.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.state.transactions[idx] = {
      ...this.state.transactions[idx],
      ...updates,
    };
    this.saveState();
    return this.state.transactions[idx];
  }

  // --- GOALS ---
  public getGoals(): PlanningGoal[] {
    return [...this.state.goals];
  }

  public addGoal(goal: {
    name: string;
    category?: PlanningGoal["category"];
    targetAmount?: string;
    targetDate?: string;
    currentSavings?: string;
    monthlyContribution?: string;
  }): PlanningGoal {
    const now = new Date().toISOString();
    const newGoal: PlanningGoal = {
      id: `goal_${Date.now()}`,
      householdId: this.state.user.householdId,
      name: goal.name,
      category: goal.category || "custom",
      targetAmount: goal.targetAmount || "100000.00",
      targetDate: goal.targetDate || "2030-01-01",
      currentSavings: goal.currentSavings || "0.00",
      monthlyContribution: goal.monthlyContribution || "5000.00",
      horizonMonths: 36,
      status: "active",
      revision: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.state.goals = [...this.state.goals, newGoal];
    this.saveState();
    return newGoal;
  }

  public updateGoal(id: string, updates: Partial<PlanningGoal>): PlanningGoal | null {
    const idx = this.state.goals.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    this.state.goals[idx] = {
      ...this.state.goals[idx],
      ...updates,
      revision: this.state.goals[idx].revision + 1,
      updatedAt: new Date().toISOString(),
    };
    this.saveState();
    return this.state.goals[idx];
  }

  public deleteGoal(id: string): boolean {
    const prevLen = this.state.goals.length;
    this.state.goals = this.state.goals.filter((g) => g.id !== id);
    if (this.state.goals.length !== prevLen) {
      this.saveState();
      return true;
    }
    return false;
  }

  public getGoalContributions(goalId: string): GoalContributionRecord[] {
    const list = this.state.goalContributions ?? [];
    return list
      .filter((c) => c.goalId === goalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public addGoalContribution(params: {
    goalId: string;
    amount: string;
    date?: string;
    note?: string;
    type?: "sip" | "adhoc";
  }): GoalContributionRecord {
    const newRecord: GoalContributionRecord = {
      id: `gcon_${Date.now()}`,
      goalId: params.goalId,
      amount: params.amount,
      date: params.date || new Date().toISOString().slice(0, 10),
      note: params.note || (params.type === "sip" ? "Monthly SIP" : "Direct Contribution"),
      type: params.type || "adhoc",
    };

    const contributions = this.state.goalContributions ?? [];
    this.state.goalContributions = [newRecord, ...contributions];

    // Update the goal's currentSavings
    const goalIdx = this.state.goals.findIndex((g) => g.id === params.goalId);
    if (goalIdx !== -1) {
      const current = Number(this.state.goals[goalIdx].currentSavings || 0);
      const added = Number(params.amount || 0);
      this.state.goals[goalIdx] = {
        ...this.state.goals[goalIdx],
        currentSavings: (current + added).toFixed(2),
        revision: this.state.goals[goalIdx].revision + 1,
        updatedAt: new Date().toISOString(),
      };
    }

    this.saveState();
    return newRecord;
  }

  // --- PLANNING & CASH FLOW ---
  public getPlanning(): PlanningData {
    return this.state.planning;
  }

  public getCurrentPlan(): CurrentPlanData {
    return this.state.currentPlan;
  }

  public getFeasibility(): FeasibilityData {
    const base = this.currentPersonaId === "rohit" ? DEMO_FEASIBILITY_ROHIT : DEMO_FEASIBILITY;
    const activeGoalIds = new Set(this.state.goals.map((g) => g.id));
    const baseExistingIds = new Set(base.goals.map((g) => g.id));

    // Extra goals added dynamically
    const extraGoals = this.state.goals
      .filter((g) => !baseExistingIds.has(g.id))
      .map((g) => ({
        id: g.id,
        monthlyContribution: g.monthlyContribution || "0.00",
        result: {
          goalName: g.name,
          goalCategory: (["home", "car", "travel", "savings", "education", "medical", "retirement", "custom"].includes(g.category)
            ? g.category
            : "custom") as any,
          targetAmountToday: g.targetAmount,
          futureGoalCost: g.targetAmount,
          currentSavings: g.currentSavings,
          currentSavingsFutureValue: g.currentSavings,
          fundingRatio: Number(g.targetAmount) > 0 ? (Number(g.currentSavings) / Number(g.targetAmount)).toFixed(2) : "0.00",
          shortfall: Math.max(0, Number(g.targetAmount) - Number(g.currentSavings)).toFixed(2),
          requiredSip: g.monthlyContribution || "5000.00",
          requiredLumpSum: g.targetAmount,
          availableMonthlyCapacity: base.availableMonthlyCapacity,
          feasibility: "feasible" as const,
          horizonMonths: g.horizonMonths,
          annualInflationUsed: "6.0",
          expectedReturnUsed: "8.0",
          completeness: { status: "complete" as const, missing: [], warnings: [] },
          policyVersion: "2026.1",
          resolvedAssumptions: DEMO_FEASIBILITY.goals[0]?.result?.resolvedAssumptions,
        },
      }));

    const mergedGoals = [
      ...base.goals.filter((bg) => activeGoalIds.has(bg.id)),
      ...extraGoals,
    ];

    const combinedMonthlyContribution = mergedGoals
      .reduce((sum, g) => sum + (Number(g.monthlyContribution) || 0), 0)
      .toFixed(2);
    const capacityNum = Number(base.availableMonthlyCapacity) || 0;
    const overAllocated = Number(combinedMonthlyContribution) > capacityNum;

    return {
      ...base,
      goals: mergedGoals,
      combinedMonthlyContribution,
      overAllocated,
    };
  }

  public getRecordedCashFlow() {
    const fallback = this.currentPersonaId === "rohit" ? DEMO_RECORDED_CASH_FLOW_ROHIT : DEMO_RECORDED_CASH_FLOW;
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const thisMonthTxs = this.state.transactions.filter(
      (t) => new Date(t.occurredAt).getTime() >= firstDay
    );

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransfers = 0;

    for (const t of thisMonthTxs) {
      const amt = Number(t.amount) || 0;
      if (t.direction === "CREDIT") {
        totalIncome += amt;
      } else {
        totalExpenses += amt;
        if (t.categoryId === "cat_investment" || t.categoryId === "cat_r_sip") {
          totalTransfers += amt;
        }
      }
    }

    return {
      hasData: true,
      totalIncome: totalIncome > 0 ? totalIncome.toFixed(2) : fallback.totalIncome,
      totalExpenses: totalExpenses > 0 ? totalExpenses.toFixed(2) : fallback.totalExpenses,
      totalTransfers: totalTransfers > 0 ? totalTransfers.toFixed(2) : fallback.totalTransfers,
      netSurplus: (totalIncome - totalExpenses).toFixed(2),
      transactionCount: thisMonthTxs.length,
    };
  }

  // --- LOANS ---
  public getLoans(): Loan[] {
    return [...this.state.loans];
  }

  public calculateLoan(params: {
    principal: string;
    annualRate: string;
    tenureMonths: number;
    prepayments?: { month: number; amount: string }[];
    prepaymentStrategy?: "reduce_tenure" | "reduce_emi";
  }): LoanCalculationData {
    const P = Number(params.principal) || 4500000;
    const annualRate = Number(params.annualRate) || 8.5;
    const r = annualRate / (12 * 100);
    const n = Number(params.tenureMonths) || 240;

    const factor = Math.pow(1 + r, n);
    const emi = (P * r * factor) / (factor - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

    let remaining = P;
    const schedule: { month: number; payment: string; principal: string; interest: string; remainingBalance: string }[] = [];
    for (let m = 1; m <= Math.min(n, 24); m++) {
      const interestPayment = remaining * r;
      const principalPayment = emi - interestPayment;
      remaining = Math.max(0, remaining - principalPayment);
      schedule.push({
        month: m,
        payment: emi.toFixed(2),
        principal: principalPayment.toFixed(2),
        interest: interestPayment.toFixed(2),
        remainingBalance: remaining.toFixed(2),
      });
    }

    const prepayAmount = params.prepayments?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) ?? 0;
    const interestSaved = prepayAmount > 0 ? (totalInterest * 0.18).toFixed(2) : "0.00";
    const monthsSaved = prepayAmount > 0 ? Math.round(n * 0.15) : 0;

    return {
      monthlyEmi: emi.toFixed(2),
      totalPrincipal: P.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      totalPayment: totalPayment.toFixed(2),
      tenureMonths: n,
      annualRate: annualRate.toFixed(2),
      monthlyRate: r.toFixed(6),
      schedule,
      prepaymentComparison: {
        originalTotalInterest: totalInterest.toFixed(2),
        revisedTotalInterest: (totalInterest - Number(interestSaved)).toFixed(2),
        interestSaved,
        originalTenureMonths: n,
        revisedTenureMonths: n - monthsSaved,
        monthsSaved,
        revisedMonthlyEmi: emi.toFixed(2),
        schedule: [],
      },
      refinancingComparison: {
        currentRemainingInterest: totalInterest.toFixed(2),
        newMonthlyEmi: (emi * 0.94).toFixed(2),
        newTotalInterest: (totalInterest * 0.88).toFixed(2),
        processingFee: "5000.00",
        netSavings: (totalInterest * 0.12 - 5000).toFixed(2),
        isBeneficial: true,
      },
      completeness: { status: "complete", missing: [], warnings: [] },
      policyVersion: "2026.1",
      resolvedAssumptions: {
        policyVersion: "2026.1",
        generalInflation: "6.0",
        educationInflation: "8.5",
        medicalInflation: "10.0",
        returns: { conservative: "7.0", expected: "12.0", optimistic: "14.5" },
        annualStepUp: "10.0",
        emergencyReserveMonths: { stable: 6, variable: 9, irregular: 12 },
      },
    };
  }


  // --- SCENARIOS ---
  public getScenarios(): Scenario[] {
    return [...this.state.scenarios];
  }

  public runScenario(id: string): RunScenarioData {
    const scen = this.state.scenarios.find((s) => s.id === id);
    const baseline = this.state.currentPlan.snapshot.calculatedOutput;
    return {
      name: scen?.name || "Scenario Run",
      description: scen?.description || null,
      baseline,
      overlay: scen?.overlay || {},
      policyVersion: "2026.1",
      resolvedAssumptions: {
        policyVersion: "2026.1",
        generalInflation: "6.0",
        educationInflation: "8.5",
        medicalInflation: "10.0",
        returns: { conservative: "7.0", expected: "12.0", optimistic: "14.5" },
        annualStepUp: "10.0",
        emergencyReserveMonths: { stable: 6, variable: 9, irregular: 12 },
      },
      delta: {
        cashFlow: { monthlySurplusDelta: "12500.00", savingsRateDelta: "4.5" },
        emergencyFund: { runwayMonthsDelta: "1.2", reserveGapDelta: "-50000.00" },
      },
    } as unknown as RunScenarioData;
  }
}

export const demoStore = new DemoStore();
