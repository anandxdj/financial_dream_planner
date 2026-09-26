/**
 * Unified Indian Financial Dataset - Persona: Anand Sharma (Tech Professional, Bengaluru)
 * Typed strictly against OpenAPI generated contract components.
 */

import type { components } from "../../../sdk/src/generated/schema";

export type Account = components["schemas"]["Account"];
export type PlanningGoal = components["schemas"]["PlanningGoal"];
export type Loan = components["schemas"]["Loan"];
export type Scenario = components["schemas"]["Scenario"];
export type RunScenarioData = components["schemas"]["RunScenarioResponse"]["data"];
export type LoanCalculationData = components["schemas"]["FinancialEngineLoanResponse"]["data"];
export type PlanningData = components["schemas"]["PlanningResponse"]["data"];
export type CurrentPlanData = components["schemas"]["CurrentPlanResponse"]["data"];
export type FeasibilityData = components["schemas"]["PlanningGoalFeasibilityResponse"]["data"];

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  householdId: string;
}

export interface DemoCategory {
  id: string;
  householdId: string;
  name: string;
  slug: string;
  categoryType: "INCOME" | "EXPENSE" | "TRANSFER" | "OTHER";
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoTransactionItem {
  id: string;
  amount: string;
  currency: string;
  direction: "DEBIT" | "CREDIT";
  merchantName: string;
  description: string;
  occurredAt: string;
  status: "verified" | "needs_review" | "pending";
  accountId: string;
  categoryId: string;
}

export const DEMO_USER: DemoUser = {
  id: "usr_anand_sharma_01",
  name: "User",
  email: "demo@example.com",
  householdId: "hh_anand_sharma_01",
};

export const DEMO_CATEGORIES: DemoCategory[] = [
  { id: "cat_salary", householdId: DEMO_USER.householdId, name: "Salary & Income", slug: "salary", categoryType: "INCOME", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_rent", householdId: DEMO_USER.householdId, name: "Housing (Rent / Home)", slug: "rent", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_food", householdId: DEMO_USER.householdId, name: "Food & Dining", slug: "food", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_transport", householdId: DEMO_USER.householdId, name: "Transport", slug: "transport", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_utilities", householdId: DEMO_USER.householdId, name: "Utilities (Electricity, Internet, etc.)", slug: "utilities", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_shopping", householdId: DEMO_USER.householdId, name: "Shopping", slug: "shopping", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_entertainment", householdId: DEMO_USER.householdId, name: "Entertainment", slug: "entertainment", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_others", householdId: DEMO_USER.householdId, name: "Others", slug: "others", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_investment", householdId: DEMO_USER.householdId, name: "SIP & Investments", slug: "investment", categoryType: "TRANSFER", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
];

export const DEMO_ACCOUNTS: Account[] = [
  {
    id: "acc_hdfc_salary",
    householdId: DEMO_USER.householdId,
    name: "Savings Account (HDFC)",
    type: "SAVINGS",
    currency: "INR",
    currentBalance: "180000.00",
    institutionName: "HDFC Bank",
    maskedNumber: "4321",
    balanceUpdatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "acc_icici_fd",
    householdId: DEMO_USER.householdId,
    name: "Fixed Deposits (ICICI)",
    type: "SAVINGS",
    currency: "INR",
    currentBalance: "200000.00",
    institutionName: "ICICI Bank",
    maskedNumber: "7788",
    balanceUpdatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "acc_zerodha_demat",
    householdId: DEMO_USER.householdId,
    name: "Mutual Funds & Stocks (Zerodha)",
    type: "BROKERAGE",
    currency: "INR",
    currentBalance: "475000.00",
    institutionName: "Zerodha Broking",
    maskedNumber: "9901",
    balanceUpdatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "acc_sbi_ppf",
    householdId: DEMO_USER.householdId,
    name: "Public Provident Fund (PPF)",
    type: "SAVINGS",
    currency: "INR",
    currentBalance: "120000.00",
    institutionName: "State Bank of India",
    maskedNumber: "5512",
    balanceUpdatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "acc_other_inv",
    householdId: DEMO_USER.householdId,
    name: "Other Liquid Reserves",
    type: "SAVINGS",
    currency: "INR",
    currentBalance: "50000.00",
    institutionName: "Liquid Reserve",
    maskedNumber: "3391",
    balanceUpdatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEMO_GOALS: PlanningGoal[] = [
  {
    id: "goal_home",
    householdId: DEMO_USER.householdId,
    name: "Buy a Home",
    category: "home",
    targetAmount: "7500000.00",
    targetDate: "2031-12-31",
    currentSavings: "475000.00",
    monthlyContribution: "20000.00",
    horizonMonths: 60,
    status: "active",
    revision: 1,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "goal_education",
    householdId: DEMO_USER.householdId,
    name: "Child's Education",
    category: "education",
    targetAmount: "2500000.00",
    targetDate: "2036-06-30",
    currentSavings: "120000.00",
    monthlyContribution: "5000.00",
    horizonMonths: 120,
    status: "active",
    revision: 1,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_LOANS: Loan[] = [];

export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: "scen_career_hike",
    householdId: DEMO_USER.householdId,
    baselineVersionId: "ver_anand_03",
    name: "20% Salary Increment + ₹10,000 Extra SIP",
    description: "Appraisal from ₹65,000 to ₹78,000 monthly take-home, accelerating the Buy a Home goal.",
    status: "draft",
    revision: 1,
    appliedVersionId: null,
    appliedAt: null,
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
    overlay: {
      cashFlow: {
        income: "78000.00",
        policyVersion: "2026.1",
      },
      investment: {
        monthlySip: "30000.00",
        policyVersion: "2026.1",
      },
    },
  },
  {
    id: "scen_freelance_boost",
    householdId: DEMO_USER.householdId,
    baselineVersionId: "ver_anand_03",
    name: "Freelance Consulting Income (₹15,000/mo)",
    description: "Adds side project income dedicated 100% to liquid savings and home down payment fund.",
    status: "draft",
    revision: 1,
    appliedVersionId: null,
    appliedAt: null,
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: new Date().toISOString(),
    overlay: {
      cashFlow: {
        income: "80000.00",
        policyVersion: "2026.1",
      },
    },
  },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const DEMO_TRANSACTIONS: DemoTransactionItem[] = [
  { id: "tx_01", amount: "65000.00", currency: "INR", direction: "CREDIT", merchantName: "Tech Solutions Pvt Ltd", description: "Monthly Salary Credit", occurredAt: daysAgo(2), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_salary" },
  { id: "tx_02", amount: "16000.00", currency: "INR", direction: "DEBIT", merchantName: "House Owner", description: "Monthly Apartment Rent", occurredAt: daysAgo(3), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_rent" },
  { id: "tx_03", amount: "9000.00", currency: "INR", direction: "DEBIT", merchantName: "Supermarket & Groceries", description: "Monthly Food & Groceries", occurredAt: daysAgo(5), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_food" },
  { id: "tx_04", amount: "3500.00", currency: "INR", direction: "DEBIT", merchantName: "Fuel & Metro Transit", description: "Monthly Transport & Commute", occurredAt: daysAgo(7), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_transport" },
  { id: "tx_05", amount: "3000.00", currency: "INR", direction: "DEBIT", merchantName: "Electricity & Fiber Internet", description: "Monthly Utilities Bill", occurredAt: daysAgo(8), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_utilities" },
  { id: "tx_06", amount: "3000.00", currency: "INR", direction: "DEBIT", merchantName: "Amazon / Flipkart", description: "Shopping & Personal Items", occurredAt: daysAgo(10), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_shopping" },
  { id: "tx_07", amount: "2500.00", currency: "INR", direction: "DEBIT", merchantName: "Dining & Entertainment", description: "Weekend Outing & Streaming", occurredAt: daysAgo(12), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_entertainment" },
  { id: "tx_08", amount: "1500.00", currency: "INR", direction: "DEBIT", merchantName: "Miscellaneous Expenses", description: "Other household sundries", occurredAt: daysAgo(14), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_others" },
  { id: "tx_09", amount: "15000.00", currency: "INR", direction: "DEBIT", merchantName: "Zerodha Coin", description: "Index Mutual Fund Monthly SIP", occurredAt: daysAgo(4), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_investment" },
];

export const DEMO_PLANNING: PlanningData = {
  householdId: DEMO_USER.householdId,
  revision: 1,
  updatedAt: new Date().toISOString(),
  completedStep: 4,
  estimates: [],
  updatedBy: DEMO_USER.id,
  inputs: {
    cashFlow: {
      income: "65000.00",
      essentialExpenses: "28000.00",
      discretionaryExpenses: "10500.00",
      emis: "0.00",
      mandatoryObligations: "0.00",
      policyVersion: "2026.1",
    },
    emergencyFund: {
      essentialExpenses: "28000.00",
      emis: "0.00",
      mandatoryObligations: "0.00",
      incomeStability: "stable",
      dependents: 0,
      currentReserves: "380000.00",
      monthlyContribution: "5000.00",
      customReserveMonths: 6,
      policyVersion: "2026.1",
    },
    goal: {
      goalName: "Buy a Home",
      goalCategory: "home",
      targetAmountToday: "7500000.00",
    },
    investment: {
      initialLumpSum: "1025000.00",
      monthlySip: "20000.00",
      annualStepUp: "10.00",
      horizonMonths: 60,
      customAnnualRate: "12.00",
      policyVersion: "2026.1",
    },
    netWorth: {
      assets: [
        { name: "Savings Account", category: "savings", value: "180000.00" },
        { name: "Mutual Funds", category: "mutual_fund", value: "325000.00" },
        { name: "Stocks / Equity", category: "stocks", value: "150000.00" },
        { name: "Fixed Deposits", category: "fd", value: "200000.00" },
        { name: "PPF", category: "ppf", value: "120000.00" },
        { name: "Other Investments", category: "other", value: "50000.00" },
      ],
      liabilities: [],
    },
  },
};

const resolvedAssumptions = {
  policyVersion: "2026.1",
  generalInflation: "6.0",
  educationInflation: "8.5",
  medicalInflation: "10.0",
  returns: { conservative: "7.0", expected: "12.0", optimistic: "14.5" },
  annualStepUp: "10.0",
  emergencyReserveMonths: { stable: 6, variable: 9, irregular: 12 },
};

export const DEMO_CURRENT_PLAN: CurrentPlanData = {
  plan: {
    id: "plan_anand_01",
    householdId: DEMO_USER.householdId,
    status: "active",
    currentVersionId: "ver_anand_03",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  currentVersion: {
    id: "ver_anand_03",
    householdId: DEMO_USER.householdId,
    planId: "plan_anand_01",
    versionNumber: 1,
    snapshotId: "snap_anand_03",
    assumptions: resolvedAssumptions,
    createdAt: "2026-01-15T00:00:00Z",
    scenarioOutput: {
      name: "Standard Onboarding Baseline",
      description: "Balanced surplus allocation across home down payment, liquid emergency buffer, and wealth accumulation.",
      baseline: {},
      scenario: {},
      deltas: {},
      completeness: { status: "complete", missing: [], warnings: [] },
      policyVersion: "2026.1",
      resolvedAssumptions,
    },
  },
  snapshot: {
    id: "snap_anand_03",
    householdId: DEMO_USER.householdId,
    asOf: new Date().toISOString(),
    revision: 1,
    engineVersion: "2.1.0",
    policyVersion: "2026.1",
    resolvedAssumptions,
    inputHash: "hash_demo_input_03",
    outputHash: "hash_demo_output_03",
    inputs: DEMO_PLANNING.inputs,
    completeness: { status: "complete", missing: [], warnings: [] },
    createdAt: new Date().toISOString(),
    calculatedOutput: {
      cashFlow: {
        monthlyIncome: "65000.00",
        essentialExpenses: "28000.00",
        discretionaryExpenses: "10500.00",
        emis: "0.00",
        mandatoryObligations: "0.00",
        totalExpenses: "38500.00",
        fixedObligations: "0.00",
        totalOutflows: "38500.00",
        monthlySurplus: "26500.00",
        savingsRate: "40.8",
        investableCapacity: "26500.00",
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },
      emergencyFund: {
        monthlyNeed: "28000.00",
        baseReserveMonths: 6,
        dependentsUpliftMonths: 0,
        targetReserveMonths: 6,
        targetAmount: "168000.00",
        currentReserves: "380000.00",
        runwayMonths: "13.6",
        shortfall: "0.00",
        completionMonths: 0,
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },
      investment: {
        initialLumpSum: "1025000.00",
        monthlySip: "20000.00",
        annualStepUp: "10.00",
        horizonMonths: 60,
        scenarios: {
          conservative: {
            scenarioName: "Conservative",
            annualRate: "7.0",
            totalInvested: "2225000.00",
            futureValue: "3150000.00",
            totalGains: "925000.00",
            milestones: [],
          },
          expected: {
            scenarioName: "Expected",
            annualRate: "12.0",
            totalInvested: "2225000.00",
            futureValue: "3920000.00",
            totalGains: "1695000.00",
            milestones: [],
          },
          optimistic: {
            scenarioName: "Optimistic",
            annualRate: "14.5",
            totalInvested: "2225000.00",
            futureValue: "4410000.00",
            totalGains: "2185000.00",
            milestones: [],
          },
        },
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },
    },
  },
};

export const DEMO_FEASIBILITY: FeasibilityData = {
  overAllocated: false,
  availableMonthlyCapacity: "26500.00",
  combinedMonthlyContribution: "25000.00",
  goals: [
    {
      id: "goal_home",
      monthlyContribution: "20000.00",
      result: {
        goalName: "Buy a Home",
        goalCategory: "home",
        targetAmountToday: "7500000.00",
        futureGoalCost: "9500000.00",
        currentSavings: "475000.00",
        currentSavingsFutureValue: "837000.00",
        fundingRatio: "0.35",
        shortfall: "6147000.00",
        requiredSip: "65000.00",
        requiredLumpSum: "3850000.00",
        availableMonthlyCapacity: "26500.00",
        feasibility: "infeasible",
        horizonMonths: 60,
        annualInflationUsed: "6.0",
        expectedReturnUsed: "12.0",
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },
    },
    {
      id: "goal_education",
      monthlyContribution: "5000.00",
      result: {
        goalName: "Child's Education",
        goalCategory: "education",
        targetAmountToday: "2500000.00",
        futureGoalCost: "3400000.00",
        currentSavings: "120000.00",
        currentSavingsFutureValue: "375000.00",
        fundingRatio: "0.45",
        shortfall: "1870000.00",
        requiredSip: "6500.00",
        requiredLumpSum: "850000.00",
        availableMonthlyCapacity: "26500.00",
        feasibility: "feasible",
        horizonMonths: 120,
        annualInflationUsed: "6.0",
        expectedReturnUsed: "12.0",
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },
    },
  ],
};

export const DEMO_RECORDED_CASH_FLOW = {
  hasData: true,
  totalIncome: "65000.00",
  totalExpenses: "38500.00",
  totalTransfers: "15000.00",
  netSurplus: "11500.00",
  transactionCount: 9,
};

// ==========================================
// PERSONA 2: Rohit Verma (Early Career / Junior Associate, ₹30k/mo)
// ==========================================

export const DEMO_USER_ROHIT: DemoUser = {
  id: "usr_rohit_verma_02",
  name: "User",
  email: "demo2@example.com",
  householdId: "hh_rohit_verma_02",
};

export const DEMO_CATEGORIES_ROHIT: DemoCategory[] = [
  { id: "cat_r_salary", householdId: DEMO_USER_ROHIT.householdId, name: "Salary & Income", slug: "salary", categoryType: "INCOME", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_r_freelance", householdId: DEMO_USER_ROHIT.householdId, name: "Freelance & Gigs", slug: "freelance", categoryType: "INCOME", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_r_rent", householdId: DEMO_USER_ROHIT.householdId, name: "Shared PG & Rent", slug: "rent", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_r_groceries", householdId: DEMO_USER_ROHIT.householdId, name: "Tiffin & Groceries", slug: "groceries", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_r_utilities", householdId: DEMO_USER_ROHIT.householdId, name: "Wifi & Mobile", slug: "utilities", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_r_dining", householdId: DEMO_USER_ROHIT.householdId, name: "Dining & Tea", slug: "dining", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_r_shopping", householdId: DEMO_USER_ROHIT.householdId, name: "Personal Shopping", slug: "shopping", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_r_travel", householdId: DEMO_USER_ROHIT.householdId, name: "Metro & Transit", slug: "travel", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_r_emi", householdId: DEMO_USER_ROHIT.householdId, name: "Phone EMI", slug: "emi", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_r_sip", householdId: DEMO_USER_ROHIT.householdId, name: "Groww Mutual Fund SIP", slug: "investment", categoryType: "TRANSFER", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_r_transfer", householdId: DEMO_USER_ROHIT.householdId, name: "Emergency Buffer Transfer", slug: "transfers", categoryType: "TRANSFER", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
];

export const DEMO_ACCOUNTS_ROHIT: Account[] = [
  {
    id: "acc_rohit_sbi_salary",
    householdId: DEMO_USER_ROHIT.householdId,
    name: "SBI Salary Account",
    type: "SAVINGS",
    currency: "INR",
    currentBalance: "22000.00",
    institutionName: "State Bank of India",
    maskedNumber: "6241",
    balanceUpdatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "acc_rohit_groww",
    householdId: DEMO_USER_ROHIT.householdId,
    name: "Groww Mutual Fund & Demat",
    type: "BROKERAGE",
    currency: "INR",
    currentBalance: "48000.00",
    institutionName: "Groww (Nextbillion)",
    maskedNumber: "8392",
    balanceUpdatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

export const DEMO_GOALS_ROHIT: PlanningGoal[] = [
  {
    id: "goal_rohit_bullet",
    householdId: DEMO_USER_ROHIT.householdId,
    name: "Royal Enfield Bullet 350",
    category: "car",
    targetAmount: "250000.00",
    targetDate: "2028-08-31",
    currentSavings: "20000.00",
    monthlyContribution: "0.00",
    horizonMonths: 24,
    status: "active",
    revision: 1,
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "goal_rohit_house",
    householdId: DEMO_USER_ROHIT.householdId,
    name: "Starter Home Down Payment",
    category: "home",
    targetAmount: "1000000.00",
    targetDate: "2034-08-31",
    currentSavings: "50000.00",
    monthlyContribution: "2000.00",
    horizonMonths: 96,
    status: "active",
    revision: 1,
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_LOANS_ROHIT: Loan[] = [
  {
    id: "loan_rohit_phone_emi",
    householdId: DEMO_USER_ROHIT.householdId,
    name: "iPhone 16 Pro No-Cost EMI",
    type: "personal",
    originalPrincipal: "120000.00",
    outstandingPrincipal: "100000.00",
    interestRate: "0.00",
    remainingTenureMonths: 10,
    monthlyEmi: "10000.00",
    nextDueDate: "2026-10-05",
    lenderName: "Bajaj Finserv",
    accountId: "acc_rohit_sbi_salary",
    prepayments: [],
    status: "active",
    revision: 1,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_SCENARIOS_ROHIT: Scenario[] = [
  {
    id: "scen_rohit_post_emi",
    householdId: DEMO_USER_ROHIT.householdId,
    baselineVersionId: "ver_rohit_01",
    name: "Post-Phone EMI Acceleration",
    description: "In 10 months when ₹10k phone EMI concludes, redirect ₹8,000 to Bullet 350 fund and ₹2,000 to SIP.",
    status: "draft",
    revision: 1,
    appliedVersionId: null,
    appliedAt: null,
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
    overlay: {
      cashFlow: {
        income: "30000.00",
        essentialExpenses: "15000.00",
        discretionaryExpenses: "3000.00",
        emis: "0.00",
        policyVersion: "2026.1",
      },
    },
  },
  {
    id: "scen_rohit_increment",
    householdId: DEMO_USER_ROHIT.householdId,
    baselineVersionId: "ver_rohit_01",
    name: "Career 20% Salary Increment",
    description: "Models appraisal from ₹30,000 to ₹36,000 monthly take-home.",
    status: "draft",
    revision: 1,
    appliedVersionId: null,
    appliedAt: null,
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
    overlay: {
      cashFlow: {
        income: "36000.00",
        policyVersion: "2026.1",
      },
    },
  },
];

function dateInMonth(monthsAgo: number, dayOfMonth: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, dayOfMonth, 12, 0, 0);
  return d.toISOString();
}

export const DEMO_TRANSACTIONS_ROHIT: DemoTransactionItem[] = [
  // --- Current Month (Month 2 / e.g. September 2026) ---
  { id: "tx_r01", amount: "30000.00", currency: "INR", direction: "CREDIT", merchantName: "Tech Innovators Pvt Ltd", description: "Monthly salary credit - Junior Associate", occurredAt: dateInMonth(0, 1), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_salary" },
  { id: "tx_r02", amount: "10000.00", currency: "INR", direction: "DEBIT", merchantName: "Bajaj Finserv Auto-Debit", description: "iPhone 16 Pro No-Cost EMI installment (2/12)", occurredAt: dateInMonth(0, 5), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_emi" },
  { id: "tx_r03", amount: "7500.00", currency: "INR", direction: "DEBIT", merchantName: "Twin Sharing PG via UPI", description: "Monthly PG rent with food included", occurredAt: dateInMonth(0, 5), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_rent" },
  { id: "tx_r04", amount: "1500.00", currency: "INR", direction: "DEBIT", merchantName: "Namma Metro Smart Card", description: "Monthly office commute metro pass recharge", occurredAt: dateInMonth(0, 7), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_travel" },
  { id: "tx_r05", amount: "2000.00", currency: "INR", direction: "DEBIT", merchantName: "Groww Mutual Fund SIP", description: "Parag Parikh Flexi Cap Fund monthly SIP", occurredAt: dateInMonth(0, 10), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_sip" },
  { id: "tx_r06", amount: "3200.00", currency: "INR", direction: "DEBIT", merchantName: "Daily Tiffin Mess Service", description: "Monthly lunch dabba delivery subscription", occurredAt: dateInMonth(0, 12), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_groceries" },
  { id: "tx_r07", amount: "1500.00", currency: "INR", direction: "DEBIT", merchantName: "Rapido & Auto Rides", description: "Last-mile commute from metro to PG", occurredAt: dateInMonth(0, 14), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_travel" },
  { id: "tx_r08", amount: "1499.00", currency: "INR", direction: "DEBIT", merchantName: "Jio Fiber & Mobile Recharge", description: "Room WiFi contribution and mobile recharge", occurredAt: dateInMonth(0, 16), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_utilities" },
  { id: "tx_r09", amount: "1300.00", currency: "INR", direction: "DEBIT", merchantName: "Blinkit Essentials", description: "Evening snacks, fruits, and milk", occurredAt: dateInMonth(0, 18), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_groceries" },
  { id: "tx_r10", amount: "1500.00", currency: "INR", direction: "DEBIT", merchantName: "Weekend Biryani Dine-out", description: "Team lunch and weekend social", occurredAt: dateInMonth(0, 20), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_dining" },

  // --- Previous Month (Month 1 / e.g. August 2026) ---
  { id: "tx_r11", amount: "30000.00", currency: "INR", direction: "CREDIT", merchantName: "Tech Innovators Pvt Ltd", description: "First monthly salary credit - Junior Associate", occurredAt: dateInMonth(1, 1), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_salary" },
  { id: "tx_r12", amount: "10000.00", currency: "INR", direction: "DEBIT", merchantName: "Bajaj Finserv Auto-Debit", description: "iPhone 16 Pro No-Cost EMI installment (1/12)", occurredAt: dateInMonth(1, 5), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_emi" },
  { id: "tx_r13", amount: "7500.00", currency: "INR", direction: "DEBIT", merchantName: "Twin Sharing PG via UPI", description: "Monthly PG rent with food included", occurredAt: dateInMonth(1, 5), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_rent" },
  { id: "tx_r14", amount: "1500.00", currency: "INR", direction: "DEBIT", merchantName: "Namma Metro Smart Card", description: "Monthly office commute metro pass recharge", occurredAt: dateInMonth(1, 7), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_travel" },
  { id: "tx_r15", amount: "2000.00", currency: "INR", direction: "DEBIT", merchantName: "Groww Mutual Fund SIP", description: "Parag Parikh Flexi Cap Fund monthly SIP", occurredAt: dateInMonth(1, 10), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_sip" },
  { id: "tx_r16", amount: "3200.00", currency: "INR", direction: "DEBIT", merchantName: "Daily Tiffin Mess Service", description: "Monthly lunch dabba delivery subscription", occurredAt: dateInMonth(1, 12), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_groceries" },
  { id: "tx_r17", amount: "1500.00", currency: "INR", direction: "DEBIT", merchantName: "Rapido & Auto Rides", description: "Last-mile commute from metro to PG", occurredAt: dateInMonth(1, 14), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_travel" },
  { id: "tx_r18", amount: "1499.00", currency: "INR", direction: "DEBIT", merchantName: "Jio Fiber & Mobile Recharge", description: "Room WiFi contribution and mobile recharge", occurredAt: dateInMonth(1, 16), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_utilities" },
  { id: "tx_r19", amount: "1300.00", currency: "INR", direction: "DEBIT", merchantName: "Blinkit Essentials", description: "Evening snacks, fruits, and milk", occurredAt: dateInMonth(1, 18), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_groceries" },
  { id: "tx_r20", amount: "1500.00", currency: "INR", direction: "DEBIT", merchantName: "Weekend Biryani Dine-out", description: "Team lunch and weekend social", occurredAt: dateInMonth(1, 20), status: "verified", accountId: "acc_rohit_sbi_salary", categoryId: "cat_r_dining" },
];

export const DEMO_PLANNING_ROHIT: PlanningData = {
  householdId: DEMO_USER_ROHIT.householdId,
  revision: 1,
  updatedAt: new Date().toISOString(),
  completedStep: 4,
  estimates: [],
  updatedBy: DEMO_USER_ROHIT.id,
  inputs: {
    cashFlow: {
      income: "30000.00",
      essentialExpenses: "15000.00",
      discretionaryExpenses: "3000.00",
      emis: "10000.00",
      mandatoryObligations: "0.00",
      policyVersion: "2026.1",
    },
    emergencyFund: {
      essentialExpenses: "15000.00",
      emis: "10000.00",
      mandatoryObligations: "0.00",
      incomeStability: "stable",
      dependents: 0,
      currentReserves: "12000.00",
      monthlyContribution: "0.00",
      customReserveMonths: 6,
      policyVersion: "2026.1",
    },
    loan: {
      principal: "100000.00",
      annualRate: "0.00",
      tenureMonths: 10,
      prepayments: [],
      prepaymentStrategy: "reduce_tenure",
      policyVersion: "2026.1",
    },
    investment: {
      initialLumpSum: "48000.00",
      monthlySip: "2000.00",
      annualStepUp: "10.00",
      horizonMonths: 96,
      customAnnualRate: "12.00",
      policyVersion: "2026.1",
    },
  },
};

export const DEMO_CURRENT_PLAN_ROHIT: CurrentPlanData = {
  plan: {
    id: "plan_rohit_01",
    householdId: DEMO_USER_ROHIT.householdId,
    status: "active",
    currentVersionId: "ver_rohit_01",
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  currentVersion: {
    id: "ver_rohit_01",
    householdId: DEMO_USER_ROHIT.householdId,
    planId: "plan_rohit_01",
    versionNumber: 1,
    snapshotId: "snap_rohit_01",
    assumptions: resolvedAssumptions,
    createdAt: "2026-02-01T00:00:00Z",
    scenarioOutput: {
      name: "Early Career Disciplined Starter Plan",
      description: "Tightly balanced cashflow prioritizing ₹10k phone EMI payoff while maintaining ₹2k SIP toward long-term down payment.",
      baseline: {},
      scenario: {},
      deltas: {},
      completeness: { status: "complete", missing: [], warnings: [] },
      policyVersion: "2026.1",
      resolvedAssumptions,
    },
  },
  snapshot: {
    id: "snap_rohit_01",
    householdId: DEMO_USER_ROHIT.householdId,
    asOf: new Date().toISOString(),
    revision: 1,
    engineVersion: "2.1.0",
    policyVersion: "2026.1",
    resolvedAssumptions,
    inputHash: "hash_demo_rohit_01",
    outputHash: "hash_demo_rohit_out_01",
    inputs: DEMO_PLANNING_ROHIT.inputs,
    completeness: { status: "complete", missing: [], warnings: [] },
    createdAt: new Date().toISOString(),
    calculatedOutput: {
      cashFlow: {
        monthlyIncome: "30000.00",
        essentialExpenses: "15000.00",
        discretionaryExpenses: "3000.00",
        emis: "10000.00",
        mandatoryObligations: "0.00",
        totalExpenses: "18000.00",
        fixedObligations: "10000.00",
        totalOutflows: "28000.00",
        monthlySurplus: "2000.00",
        savingsRate: "6.7",
        investableCapacity: "2000.00",
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },
      emergencyFund: {
        monthlyNeed: "25000.00",
        baseReserveMonths: 6,
        dependentsUpliftMonths: 0,
        targetReserveMonths: 6,
        targetAmount: "150000.00",
        currentReserves: "12000.00",
        runwayMonths: "0.5",
        shortfall: "138000.00",
        completionMonths: 36,
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },
      loan: {
        monthlyEmi: "10000.00",
        totalPrincipal: "100000.00",
        totalInterest: "0.00",
        totalPayment: "100000.00",
        tenureMonths: 10,
        annualRate: "0.00",
        monthlyRate: "0.000000",
        schedule: [
          { month: 1, payment: "10000.00", principal: "10000.00", interest: "0.00", remainingBalance: "90000.00" },
          { month: 2, payment: "10000.00", principal: "10000.00", interest: "0.00", remainingBalance: "80000.00" },
        ],
        prepaymentComparison: {
          originalTotalInterest: "0.00",
          revisedTotalInterest: "0.00",
          interestSaved: "0.00",
          originalTenureMonths: 10,
          revisedTenureMonths: 10,
          monthsSaved: 0,
          revisedMonthlyEmi: "10000.00",
          schedule: [],
        },
        refinancingComparison: null,
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },
      investment: {
        initialLumpSum: "48000.00",
        monthlySip: "2000.00",
        annualStepUp: "10.00",
        horizonMonths: 96,
        scenarios: {
          conservative: {
            scenarioName: "Conservative",
            annualRate: "7.0",
            totalInvested: "325000.00",
            futureValue: "490000.00",
            totalGains: "165000.00",
            milestones: [],
          },
          expected: {
            scenarioName: "Expected",
            annualRate: "12.0",
            totalInvested: "325000.00",
            futureValue: "685000.00",
            totalGains: "360000.00",
            milestones: [],
          },
          optimistic: {
            scenarioName: "Optimistic",
            annualRate: "14.5",
            totalInvested: "325000.00",
            futureValue: "815000.00",
            totalGains: "490000.00",
            milestones: [],
          },
        },
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },
    },
  },
};

export const DEMO_FEASIBILITY_ROHIT: FeasibilityData = {
  overAllocated: false,
  availableMonthlyCapacity: "2000.00",
  combinedMonthlyContribution: "2000.00",
  goals: [
    {
      id: "goal_rohit_bullet",
      monthlyContribution: "0.00",
      result: {
        goalName: "Royal Enfield Bullet 350",
        goalCategory: "car",
        targetAmountToday: "250000.00",
        futureGoalCost: "265000.00",
        currentSavings: "20000.00",
        currentSavingsFutureValue: "22000.00",
        fundingRatio: "0.08",
        shortfall: "243000.00",
        requiredSip: "9500.00",
        requiredLumpSum: "220000.00",
        availableMonthlyCapacity: "0.00",
        feasibility: "infeasible",
        horizonMonths: 24,
        annualInflationUsed: "5.0",
        expectedReturnUsed: "7.0",
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },
    },
    {
      id: "goal_rohit_house",
      monthlyContribution: "2000.00",
      result: {
        goalName: "Starter Home Down Payment",
        goalCategory: "home",
        targetAmountToday: "1000000.00",
        futureGoalCost: "1400000.00",
        currentSavings: "50000.00",
        currentSavingsFutureValue: "125000.00",
        fundingRatio: "0.25",
        shortfall: "1275000.00",
        requiredSip: "5500.00",
        requiredLumpSum: "500000.00",
        availableMonthlyCapacity: "2000.00",
        feasibility: "feasible",
        horizonMonths: 96,
        annualInflationUsed: "6.0",
        expectedReturnUsed: "12.0",
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },
    },
  ],
};

export const DEMO_RECORDED_CASH_FLOW_ROHIT = {
  hasData: true,
  totalIncome: "30000.00",
  totalExpenses: "28000.00",
  totalTransfers: "2000.00",
  netSurplus: "2000.00",
  transactionCount: 10,
};

export interface DemoPersonaBundle {
  id: "anand" | "rohit";
  name: string;
  title: string;
  incomeText: string;
  badge: string;
  user: DemoUser;
  categories: DemoCategory[];
  accounts: Account[];
  goals: PlanningGoal[];
  loans: Loan[];
  scenarios: Scenario[];
  transactions: DemoTransactionItem[];
  planning: PlanningData;
  currentPlan: CurrentPlanData;
  feasibility: FeasibilityData;
  recordedCashFlow: typeof DEMO_RECORDED_CASH_FLOW;
}

export const PERSONA_ANAND: DemoPersonaBundle = {
  id: "anand",
  name: "Onboarded Plan",
  title: "Onboarding Profile",
  incomeText: "₹65k/mo",
  badge: "Onboarding Profile · Buy a Home",
  user: DEMO_USER,
  categories: DEMO_CATEGORIES,
  accounts: DEMO_ACCOUNTS,
  goals: DEMO_GOALS,
  loans: DEMO_LOANS,
  scenarios: DEMO_SCENARIOS,
  transactions: DEMO_TRANSACTIONS,
  planning: DEMO_PLANNING,
  currentPlan: DEMO_CURRENT_PLAN,
  feasibility: DEMO_FEASIBILITY,
  recordedCashFlow: DEMO_RECORDED_CASH_FLOW,
};

export const PERSONA_ROHIT: DemoPersonaBundle = {
  id: "rohit",
  name: "Alternative Scenario",
  title: "Alternative Scenario",
  incomeText: "₹30k/mo",
  badge: "Alternative Scenario · ₹30k/mo",
  user: DEMO_USER_ROHIT,
  categories: DEMO_CATEGORIES_ROHIT,
  accounts: DEMO_ACCOUNTS_ROHIT,
  goals: DEMO_GOALS_ROHIT,
  loans: DEMO_LOANS_ROHIT,
  scenarios: DEMO_SCENARIOS_ROHIT,
  transactions: DEMO_TRANSACTIONS_ROHIT,
  planning: DEMO_PLANNING_ROHIT,
  currentPlan: DEMO_CURRENT_PLAN_ROHIT,
  feasibility: DEMO_FEASIBILITY_ROHIT,
  recordedCashFlow: DEMO_RECORDED_CASH_FLOW_ROHIT,
};

export const ALL_PERSONAS: Record<"anand" | "rohit", DemoPersonaBundle> = {
  anand: PERSONA_ANAND,
  rohit: PERSONA_ROHIT,
};

