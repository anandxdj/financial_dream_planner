import type { GoalCardItem, ExpenseItem, LoanItem, InvestmentItem } from "./types";

export const WIZARD_STEPS = [
  { id: "goals", number: 1, label: "Goals" },
  { id: "income", number: 2, label: "Income" },
  { id: "expenses", number: 3, label: "Expenses" },
  { id: "loans", number: 4, label: "Loans & EMI" },
  { id: "investments", number: 5, label: "Investments" },
  { id: "review", number: 6, label: "Review" },
  { id: "your-plan", number: 7, label: "Your Plan" },
];

export const INITIAL_GOALS: GoalCardItem[] = [
  {
    id: "home",
    name: "Buy a Home",
    category: "home",
    image: "/Assets/Houses/cozy_first_home.png",
    selected: true,
    targetAmount: "7500000",
  },
  {
    id: "car",
    name: "Buy a Car",
    category: "car",
    image: "/Assets/Characters/purple_car_front.png",
    selected: false,
    targetAmount: "1200000",
  },
  {
    id: "education",
    name: "Child's Education",
    category: "education",
    image: "/Assets/Piggy Banks/graduate_piggy_bank.png",
    selected: false,
    targetAmount: "2500000",
  },
  {
    id: "travel",
    name: "Travel the World",
    category: "travel",
    image: "/Assets/Objects/beach_chair_sea.png",
    selected: false,
    targetAmount: "500000",
  },
  {
    id: "retirement",
    name: "Retire Early",
    category: "retirement",
    image: "/Assets/Objects/beach_chair_sea.png",
    selected: false,
    targetAmount: "15000000",
  },
  {
    id: "wealth",
    name: "Build Wealth",
    category: "custom",
    image: "/Assets/Objects/coin_stacks.png",
    selected: false,
    targetAmount: "10000000",
  },
];

export const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: "housing", category: "housing", label: "Housing (Rent / Home)", amount: "22000", isEssential: true },
  { id: "food", category: "food", label: "Food & Dining", amount: "14200", isEssential: true },
  { id: "transport", category: "transport", label: "Transport", amount: "8600", isEssential: false },
  { id: "utilities", category: "utilities", label: "Utilities (Electricity, Internet, etc.)", amount: "4500", isEssential: true },
  { id: "shopping", category: "shopping", label: "Shopping", amount: "7800", isEssential: false },
  { id: "entertainment", category: "entertainment", label: "Entertainment", amount: "6450", isEssential: false },
  { id: "others", category: "others", label: "Others", amount: "5000", isEssential: false },
];

export const INITIAL_LOANS: LoanItem[] = [
  {
    id: "loan-1",
    name: "Home Loan",
    type: "home",
    outstandingAmount: "4500000",
    monthlyEmi: "15750",
    annualRate: "8.5",
    tenureMonths: 240,
  },
  {
    id: "loan-2",
    name: "Car Loan",
    type: "car",
    outstandingAmount: "650000",
    monthlyEmi: "12800",
    annualRate: "9.2",
    tenureMonths: 60,
  },
  {
    id: "loan-3",
    name: "Personal Loan",
    type: "personal",
    outstandingAmount: "120000",
    monthlyEmi: "4200",
    annualRate: "12.5",
    tenureMonths: 36,
  },
];

export const INITIAL_INVESTMENTS: InvestmentItem[] = [
  { id: "inv-1", name: "Savings Account", type: "savings", currentValue: "180000" },
  { id: "inv-2", name: "Mutual Funds", type: "mutual_fund", currentValue: "325000" },
  { id: "inv-3", name: "Stocks / Equity", type: "stocks", currentValue: "150000" },
  { id: "inv-4", name: "Fixed Deposits", type: "fd", currentValue: "200000" },
  { id: "inv-5", name: "PPF", type: "ppf", currentValue: "120000" },
  { id: "inv-6", name: "Other Investments", type: "other", currentValue: "50000" },
];

export const EXPENSE_COLORS = [
  "#5E55C9", // Housing - purple
  "#3B5B8C", // Food - blue
  "#3D5C4A", // Transport - sage green
  "#E6B46A", // Utilities - gold
  "#D97706", // Shopping - amber
  "#8B5CF6", // Entertainment - violet
  "#9CA3AF", // Others - gray
];
