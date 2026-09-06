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
  name: "Anand Sharma",
  email: "demo@example.com",
  householdId: "hh_anand_sharma_01",
};

export const DEMO_CATEGORIES: DemoCategory[] = [
  { id: "cat_salary", householdId: DEMO_USER.householdId, name: "Salary & Professional Income", slug: "salary", categoryType: "INCOME", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_bonus", householdId: DEMO_USER.householdId, name: "Bonus & Consulting", slug: "bonus", categoryType: "INCOME", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_dividend", householdId: DEMO_USER.householdId, name: "Investment Dividends", slug: "dividends", categoryType: "INCOME", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_rent", householdId: DEMO_USER.householdId, name: "Housing & Rent", slug: "rent", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_groceries", householdId: DEMO_USER.householdId, name: "Groceries & Daily Essentials", slug: "groceries", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_utilities", householdId: DEMO_USER.householdId, name: "Utilities & Bills", slug: "utilities", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_dining", householdId: DEMO_USER.householdId, name: "Dining & Food Delivery", slug: "dining", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_shopping", householdId: DEMO_USER.householdId, name: "Shopping & E-Commerce", slug: "shopping", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_travel", householdId: DEMO_USER.householdId, name: "Travel & Transit", slug: "travel", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_subs", householdId: DEMO_USER.householdId, name: "Subscriptions & Media", slug: "subs", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_emi", householdId: DEMO_USER.householdId, name: "Loan EMI", slug: "emi", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_investment", householdId: DEMO_USER.householdId, name: "SIP & Mutual Funds", slug: "investment", categoryType: "TRANSFER", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "cat_health", householdId: DEMO_USER.householdId, name: "Healthcare & Pharmacy", slug: "healthcare", categoryType: "EXPENSE", isSystem: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
];

export const DEMO_ACCOUNTS: Account[] = [
  {
    id: "acc_hdfc_salary",
    householdId: DEMO_USER.householdId,
    name: "HDFC Bank Salary Account",
    type: "SAVINGS",
    currency: "INR",
    currentBalance: "142850.00",
    institutionName: "HDFC Bank",
    maskedNumber: "4321",
    balanceUpdatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "acc_icici_savings",
    householdId: DEMO_USER.householdId,
    name: "ICICI Savings & Emergency Buffer",
    type: "SAVINGS",
    currency: "INR",
    currentBalance: "360000.00",
    institutionName: "ICICI Bank",
    maskedNumber: "7788",
    balanceUpdatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "acc_sbi_card",
    householdId: DEMO_USER.householdId,
    name: "SBI Prime Credit Card",
    type: "CREDIT_CARD",
    currency: "INR",
    currentBalance: "-18420.00",
    institutionName: "State Bank of India",
    maskedNumber: "1122",
    balanceUpdatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "acc_zerodha_demat",
    householdId: DEMO_USER.householdId,
    name: "Zerodha Demat & Mutual Funds",
    type: "BROKERAGE",
    currency: "INR",
    currentBalance: "1480000.00",
    institutionName: "Zerodha Broking",
    maskedNumber: "9901",
    balanceUpdatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEMO_GOALS: PlanningGoal[] = [
  {
    id: "goal_emergency",
    householdId: DEMO_USER.householdId,
    name: "Emergency Reserve",
    category: "savings",
    targetAmount: "450000.00",
    targetDate: "2026-12-31",
    currentSavings: "360000.00",
    monthlyContribution: "10000.00",
    horizonMonths: 12,
    status: "active",
    revision: 1,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "goal_home_blr",
    householdId: DEMO_USER.householdId,
    name: "First Home Down Payment (Bengaluru)",
    category: "home",
    targetAmount: "2500000.00",
    targetDate: "2029-06-30",
    currentSavings: "850000.00",
    monthlyContribution: "20000.00",
    horizonMonths: 42,
    status: "active",
    revision: 1,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_LOANS: Loan[] = [
  {
    id: "loan_home_hdfc",
    householdId: DEMO_USER.householdId,
    name: "HDFC Home Loan - 3BHK HSR",
    type: "home",
    originalPrincipal: "4500000.00",
    outstandingPrincipal: "3820000.00",
    interestRate: "8.50",
    remainingTenureMonths: 198,
    monthlyEmi: "39045.00",
    nextDueDate: "2026-10-05",
    lenderName: "HDFC Bank Ltd",
    accountId: "acc_hdfc_salary",
    prepayments: [],
    status: "active",
    revision: 1,
    createdAt: "2022-10-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "loan_auto_icici",
    householdId: DEMO_USER.householdId,
    name: "ICICI Car Loan - EV Nexon",
    type: "car",
    originalPrincipal: "750000.00",
    outstandingPrincipal: "310000.00",
    interestRate: "8.90",
    remainingTenureMonths: 24,
    monthlyEmi: "15532.00",
    nextDueDate: "2026-10-15",
    lenderName: "ICICI Bank Ltd",
    accountId: "acc_icici_savings",
    prepayments: [],
    status: "active",
    revision: 1,
    createdAt: "2023-09-15T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: "scen_sabbatical",
    householdId: DEMO_USER.householdId,
    baselineVersionId: "ver_anand_03",
    name: "6-Month Tech Sabbatical / Upskilling",
    description: "Pauses salary income for 6 months while maintaining basic living expenses from liquid reserve.",
    status: "draft",
    revision: 1,
    appliedVersionId: null,
    appliedAt: null,
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
    overlay: {
      cashFlow: {
        income: "0.00",
        essentialExpenses: "35000.00",
        discretionaryExpenses: "8000.00",
        policyVersion: "2026.1",
      },
    },
  },
  {
    id: "scen_prepay_home",
    householdId: DEMO_USER.householdId,
    baselineVersionId: "ver_anand_03",
    name: "Aggressive Home Loan Prepayment",
    description: "Applies an extra ₹15,000 monthly surplus directly to principal reduction.",
    status: "draft",
    revision: 1,
    appliedVersionId: null,
    appliedAt: null,
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: new Date().toISOString(),
    overlay: {
      loan: {
        principal: "4500000.00",
        annualRate: "8.50",
        tenureMonths: 240,
        prepayments: [{ month: 1, amount: "15000.00" }],
        prepaymentStrategy: "reduce_tenure",
        policyVersion: "2026.1",
      },
    },
  },
  {
    id: "scen_hike_sip",
    householdId: DEMO_USER.householdId,
    baselineVersionId: "ver_anand_03",
    name: "15% Salary Increment + 10% SIP Step-Up",
    description: "Directs 50% of annual promotion hike straight into equity mutual funds.",
    status: "draft",
    revision: 1,
    appliedVersionId: null,
    appliedAt: null,
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
    overlay: {
      cashFlow: {
        income: "172500.00",
        policyVersion: "2026.1",
      },
      investment: {
        monthlySip: "58000.00",
        annualStepUp: "12.00",
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
  { id: "tx_01", amount: "150000.00", currency: "INR", direction: "CREDIT", merchantName: "Tech Corp India Ltd", description: "Salary Credit for current month", occurredAt: daysAgo(2), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_salary" },
  { id: "tx_02", amount: "28000.00", currency: "INR", direction: "DEBIT", merchantName: "HSR Layout Residency", description: "Monthly Apartment Rent via UPI", occurredAt: daysAgo(3), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_rent" },
  { id: "tx_03", amount: "39045.00", currency: "INR", direction: "DEBIT", merchantName: "HDFC Home Loan Auto-Debit", description: "Home Loan EMI auto-debited", occurredAt: daysAgo(4), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_emi" },
  { id: "tx_04", amount: "20000.00", currency: "INR", direction: "DEBIT", merchantName: "Zerodha Coin", description: "Nifty 50 Index Fund Monthly SIP", occurredAt: daysAgo(5), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_investment" },
  { id: "tx_05", amount: "840.00", currency: "INR", direction: "DEBIT", merchantName: "Swiggy", description: "Lunch Bowls Delivery", occurredAt: daysAgo(1), status: "verified", accountId: "acc_sbi_card", categoryId: "cat_dining" },
  { id: "tx_06", amount: "1450.00", currency: "INR", direction: "DEBIT", merchantName: "Zomato", description: "Weekend Family Dinner", occurredAt: daysAgo(6), status: "verified", accountId: "acc_sbi_card", categoryId: "cat_dining" },
  { id: "tx_07", amount: "3499.00", currency: "INR", direction: "DEBIT", merchantName: "Amazon India", description: "Kindle Paperwhite Case & Books", occurredAt: daysAgo(7), status: "verified", accountId: "acc_sbi_card", categoryId: "cat_shopping" },
  { id: "tx_08", amount: "2340.00", currency: "INR", direction: "DEBIT", merchantName: "BESCOM Bangalore", description: "Electricity Bill for previous month", occurredAt: daysAgo(8), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_utilities" },
  { id: "tx_09", amount: "1179.00", currency: "INR", direction: "DEBIT", merchantName: "Jio Fiber", description: "High-speed Fiber Broadband", occurredAt: daysAgo(9), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_utilities" },
  { id: "tx_10", amount: "15000.00", currency: "INR", direction: "CREDIT", merchantName: "CodeCraft Consulting", description: "Architecture Advisory Retainer", occurredAt: daysAgo(10), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_bonus" },
  { id: "tx_11", amount: "15000.00", currency: "INR", direction: "DEBIT", merchantName: "Zerodha Coin", description: "Parag Parikh Flexi Cap Fund SIP", occurredAt: daysAgo(11), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_investment" },
  { id: "tx_12", amount: "649.00", currency: "INR", direction: "DEBIT", merchantName: "Netflix", description: "Premium UHD Subscription", occurredAt: daysAgo(12), status: "verified", accountId: "acc_sbi_card", categoryId: "cat_subs" },
  { id: "tx_13", amount: "480.00", currency: "INR", direction: "DEBIT", merchantName: "Uber India", description: "Ride to Tech Park", occurredAt: daysAgo(13), status: "verified", accountId: "acc_sbi_card", categoryId: "cat_travel" },
  { id: "tx_14", amount: "1280.00", currency: "INR", direction: "DEBIT", merchantName: "Blinkit", description: "Organic Vegetables & Milk", occurredAt: daysAgo(14), status: "verified", accountId: "acc_sbi_card", categoryId: "cat_groceries" },
  { id: "tx_15", amount: "1850.00", currency: "INR", direction: "CREDIT", merchantName: "TCS & Infosys Dividend", description: "Quarterly Equity Dividend Credit", occurredAt: daysAgo(16), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_dividend" },
  { id: "tx_16", amount: "1150.00", currency: "INR", direction: "DEBIT", merchantName: "Apollo Pharmacy", description: "Monthly Family Vitamins & Meds", occurredAt: daysAgo(18), status: "verified", accountId: "acc_sbi_card", categoryId: "cat_health" },
  { id: "tx_17", amount: "18420.00", currency: "INR", direction: "DEBIT", merchantName: "CRED Payment", description: "SBI Credit Card Full Statement Payment", occurredAt: daysAgo(20), status: "verified", accountId: "acc_hdfc_salary", categoryId: "cat_shopping" },
];

export const DEMO_PLANNING: PlanningData = {
  householdId: DEMO_USER.householdId,
  revision: 3,
  updatedAt: new Date().toISOString(),
  completedStep: 4,
  estimates: [],
  updatedBy: DEMO_USER.id,
  inputs: {
    cashFlow: {
      income: "150000.00",
      essentialExpenses: "45000.00",
      discretionaryExpenses: "18000.00",
      emis: "39045.00",
      mandatoryObligations: "0.00",
      policyVersion: "2026.1",
    },
    emergencyFund: {
      essentialExpenses: "45000.00",
      emis: "39045.00",
      mandatoryObligations: "0.00",
      incomeStability: "stable",
      dependents: 1,
      currentReserves: "360000.00",
      monthlyContribution: "10000.00",
      customReserveMonths: 6,
      policyVersion: "2026.1",
    },
    loan: {
      principal: "4500000.00",
      annualRate: "8.50",
      tenureMonths: 240,
      prepayments: [],
      prepaymentStrategy: "reduce_tenure",
      policyVersion: "2026.1",
    },
    investment: {
      initialLumpSum: "1480000.00",
      monthlySip: "48000.00",
      annualStepUp: "10.00",
      horizonMonths: 240,
      customAnnualRate: "12.00",
      policyVersion: "2026.1",
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
    versionNumber: 3,
    snapshotId: "snap_anand_03",
    assumptions: resolvedAssumptions,
    createdAt: "2026-01-15T00:00:00Z",
    scenarioOutput: {
      name: "Standard Indian Tech Professional Baseline",
      description: "Structured surplus allocation across home down payment, emergency buffer, and equity retirement compounding.",
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
    revision: 3,
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
        monthlyIncome: "150000.00",
        essentialExpenses: "45000.00",
        discretionaryExpenses: "18000.00",
        emis: "39045.00",
        mandatoryObligations: "0.00",
        totalExpenses: "63000.00",
        fixedObligations: "39045.00",
        totalOutflows: "102045.00",
        monthlySurplus: "47955.00",
        savingsRate: "32.0",
        investableCapacity: "47955.00",
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },
      emergencyFund: {
        monthlyNeed: "84045.00",
        baseReserveMonths: 6,
        dependentsUpliftMonths: 0,
        targetReserveMonths: 6,
        targetAmount: "504270.00",
        currentReserves: "360000.00",
        runwayMonths: "4.3",
        shortfall: "144270.00",
        completionMonths: 14,
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },


      loan: {
        monthlyEmi: "39045.00",
        totalPrincipal: "4500000.00",
        totalInterest: "4870800.00",
        totalPayment: "9370800.00",
        tenureMonths: 240,
        annualRate: "8.50",
        monthlyRate: "0.007083",
        schedule: [
          { month: 1, payment: "39045.00", principal: "7170.00", interest: "31875.00", remainingBalance: "4492830.00" },
          { month: 2, payment: "39045.00", principal: "7220.00", interest: "31825.00", remainingBalance: "4485610.00" },
        ],
        prepaymentComparison: {
          originalTotalInterest: "4870800.00",
          revisedTotalInterest: "4125000.00",
          interestSaved: "745800.00",
          originalTenureMonths: 240,
          revisedTenureMonths: 202,
          monthsSaved: 38,
          revisedMonthlyEmi: "39045.00",
          schedule: [],
        },
        refinancingComparison: null,
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },
      investment: {
        initialLumpSum: "1480000.00",
        monthlySip: "48000.00",
        annualStepUp: "10.00",
        horizonMonths: 240,
        scenarios: {
          conservative: {
            scenarioName: "Conservative",
            annualRate: "7.0",
            totalInvested: "11520000.00",
            futureValue: "34800000.00",
            totalGains: "23280000.00",
            milestones: [],
          },
          expected: {
            scenarioName: "Expected",
            annualRate: "12.0",
            totalInvested: "11520000.00",
            futureValue: "52400000.00",
            totalGains: "40880000.00",
            milestones: [],
          },
          optimistic: {
            scenarioName: "Optimistic",
            annualRate: "14.5",
            totalInvested: "11520000.00",
            futureValue: "71200000.00",
            totalGains: "59680000.00",
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
  availableMonthlyCapacity: "47955.00",
  combinedMonthlyContribution: "48000.00",
  goals: [
    {
      id: "goal_emergency",
      monthlyContribution: "10000.00",
      result: {
        goalName: "Emergency Reserve",
        goalCategory: "savings",
        targetAmountToday: "450000.00",
        futureGoalCost: "450000.00",
        currentSavings: "360000.00",
        currentSavingsFutureValue: "378000.00",
        fundingRatio: "0.80",
        shortfall: "72000.00",
        requiredSip: "10000.00",
        requiredLumpSum: "70000.00",
        availableMonthlyCapacity: "47955.00",
        feasibility: "feasible",
        horizonMonths: 12,
        annualInflationUsed: "6.0",
        expectedReturnUsed: "6.5",
        completeness: { status: "complete", missing: [], warnings: [] },
        policyVersion: "2026.1",
        resolvedAssumptions,
      },
    },
    {
      id: "goal_home_blr",
      monthlyContribution: "20000.00",
      result: {
        goalName: "First Home Down Payment (Bengaluru)",
        goalCategory: "home",
        targetAmountToday: "2500000.00",
        futureGoalCost: "2980000.00",
        currentSavings: "850000.00",
        currentSavingsFutureValue: "1150000.00",
        fundingRatio: "0.38",
        shortfall: "1830000.00",
        requiredSip: "20000.00",
        requiredLumpSum: "1400000.00",
        availableMonthlyCapacity: "47955.00",
        feasibility: "feasible",
        horizonMonths: 42,
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
  totalIncome: "166850.00",
  totalExpenses: "58758.00",
  totalTransfers: "48000.00",
  netSurplus: "60092.00",
  transactionCount: 17,
};

// ==========================================
// PERSONA 2: Rohit Verma (Early Career / Junior Associate, ₹30k/mo)
// ==========================================

export const DEMO_USER_ROHIT: DemoUser = {
  id: "usr_rohit_verma_02",
  name: "Rohit Verma",
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
  name: "Anand Sharma",
  title: "Tech Professional (Bengaluru)",
  incomeText: "₹1.5L/mo",
  badge: "HDFC/ICICI · ₹45L Home Loan",
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
  name: "Rohit Verma",
  title: "Junior Associate / Early Career",
  incomeText: "₹30k/mo",
  badge: "SBI/Groww · Bullet 350 · ₹10k Phone EMI",
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

