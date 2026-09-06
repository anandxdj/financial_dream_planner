import { eq } from "drizzle-orm";
import { connectDb, db, disconnectDb } from "../src/database/client";
import { env } from "../src/config/env";
import { hashPassword } from "../src/utils/crypto";
import {
  users,
  authIdentities,
  households,
  householdMembers,
  accounts,
  categories,
  transactions,
  planningGoals,
  loans,
  householdPlanning,
} from "../src/database/schema";
import { logger } from "../src/shared/logger/logger";

async function seedPersonaAnand() {
  const demoEmail = "demo@example.com";
  const demoPassword = "Password123!";

  // 1. Create or Find User
  let [user] = await db.select().from(users).where(eq(users.email, demoEmail));
  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        email: demoEmail,
        displayName: "Anand Sharma",
        status: "active",
        emailVerifiedAt: new Date(),
        roles: ["user"],
      })
      .returning();
    logger.info("Created demo user", { userId: user.id });
  } else {
    logger.info("Demo user exists", { userId: user.id });
  }

  // 2. Create or Find Auth Identity
  const [existingIdentity] = await db
    .select()
    .from(authIdentities)
    .where(eq(authIdentities.userId, user.id));

  if (!existingIdentity) {
    const passwordHash = await hashPassword(demoPassword);
    await db.insert(authIdentities).values({
      userId: user.id,
      provider: "password",
      providerUserId: demoEmail,
      passwordHash,
      email: demoEmail,
      emailVerified: true,
    });
    logger.info("Created auth identity for demo user");
  }

  // 3. Create or Find Household
  let [membership] = await db
    .select()
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id));

  let householdId: string;
  if (!membership) {
    const [household] = await db
      .insert(households)
      .values({
        name: "Sharma Household",
      })
      .returning();

    [membership] = await db
      .insert(householdMembers)
      .values({
        householdId: household.id,
        userId: user.id,
        role: "owner",
        isPrimary: true,
      })
      .returning();

    householdId = household.id;
    logger.info("Created household and membership", { householdId });
  } else {
    householdId = membership.householdId;
    logger.info("Using existing household", { householdId });
  }

  // 4. Accounts
  const existingAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.householdId, householdId));

  const accountsMap = new Map<string, typeof accounts.$inferSelect>();
  for (const acc of existingAccounts) {
    accountsMap.set(acc.name, acc);
  }

  const accountDefs = [
    {
      name: "HDFC Salary Account",
      type: "SAVINGS" as const,
      currency: "INR",
      institutionName: "HDFC Bank",
      maskedNumber: "4182",
      currentBalance: "185000.0000",
    },
    {
      name: "ICICI Savings Account",
      type: "SAVINGS" as const,
      currency: "INR",
      institutionName: "ICICI Bank",
      maskedNumber: "8819",
      currentBalance: "240000.0000",
    },
    {
      name: "SBI SimplyCLICK Credit Card",
      type: "CREDIT_CARD" as const,
      currency: "INR",
      institutionName: "State Bank of India",
      maskedNumber: "1042",
      currentBalance: "12450.0000",
    },
    {
      name: "Zerodha Demat Account",
      type: "BROKERAGE" as const,
      currency: "INR",
      institutionName: "Zerodha",
      maskedNumber: "9921",
      currentBalance: "850000.0000",
    },
  ];

  for (const def of accountDefs) {
    if (!accountsMap.has(def.name)) {
      const [inserted] = await db
        .insert(accounts)
        .values({
          householdId,
          name: def.name,
          type: def.type,
          currency: def.currency,
          institutionName: def.institutionName,
          maskedNumber: def.maskedNumber,
          currentBalance: def.currentBalance,
          balanceUpdatedAt: new Date(),
        })
        .returning();
      accountsMap.set(def.name, inserted);
    }
  }
  logger.info("Ensured accounts", { count: accountsMap.size });

  // 5. Categories
  const existingCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.householdId, householdId));

  const categoriesMap = new Map<string, typeof categories.$inferSelect>();
  for (const cat of existingCategories) {
    categoriesMap.set(cat.slug || cat.name, cat);
  }

  const categoryDefs = [
    { name: "Salary / Income", slug: "income", categoryType: "INCOME" as const },
    { name: "Groceries", slug: "groceries", categoryType: "EXPENSE" as const },
    { name: "Dining & Food", slug: "dining", categoryType: "EXPENSE" as const },
    { name: "Utilities & Bills", slug: "utilities", categoryType: "EXPENSE" as const },
    { name: "Housing & Rent", slug: "housing", categoryType: "EXPENSE" as const },
    { name: "Investments & SIP", slug: "investments", categoryType: "EXPENSE" as const },
    { name: "Shopping", slug: "shopping", categoryType: "EXPENSE" as const },
    { name: "Subscriptions", slug: "subscriptions", categoryType: "EXPENSE" as const },
    { name: "Transfers", slug: "transfers", categoryType: "TRANSFER" as const },
  ];

  for (const def of categoryDefs) {
    if (!categoriesMap.has(def.slug)) {
      const [inserted] = await db
        .insert(categories)
        .values({
          householdId,
          name: def.name,
          slug: def.slug,
          categoryType: def.categoryType,
          isSystem: true,
        })
        .returning();
      categoriesMap.set(def.slug, inserted);
    }
  }
  logger.info("Ensured categories", { count: categoriesMap.size });

  // 6. Transactions
  const existingTxCount = (
    await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.householdId, householdId))
  ).length;

  if (existingTxCount === 0) {
    const hdfcAcc = accountsMap.get("HDFC Salary Account");
    const iciciAcc = accountsMap.get("ICICI Savings Account");
    const sbiAcc = accountsMap.get("SBI SimplyCLICK Credit Card");

    const txDefs = [
      {
        merchantName: "Salary Credit - Infosys Technologies",
        amount: "150000.0000",
        direction: "CREDIT" as const,
        occurredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        accountId: hdfcAcc?.id,
        categoryId: categoriesMap.get("income")?.id,
        description: "Monthly salary take-home credit",
      },
      {
        merchantName: "Zerodha Broking SIP",
        amount: "25000.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        accountId: hdfcAcc?.id,
        categoryId: categoriesMap.get("investments")?.id,
        description: "Nifty 50 Index Fund SIP",
      },
      {
        merchantName: "Swiggy Bangalore",
        amount: "680.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("dining")?.id,
        description: "Dinner order delivery",
      },
      {
        merchantName: "Reliance Fresh Groceries",
        amount: "3450.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        accountId: iciciAcc?.id,
        categoryId: categoriesMap.get("groceries")?.id,
        description: "Monthly pantry staples and vegetables",
      },
      {
        merchantName: "BESCOM Electricity Bill",
        amount: "2380.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        accountId: hdfcAcc?.id,
        categoryId: categoriesMap.get("utilities")?.id,
        description: "Bangalore electricity bill payment",
      },
      {
        merchantName: "Netflix India",
        amount: "649.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("subscriptions")?.id,
        description: "Monthly 4K premium streaming subscription",
      },
      {
        merchantName: "Urban Company Home Clean",
        amount: "1200.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        accountId: iciciAcc?.id,
        categoryId: categoriesMap.get("utilities")?.id,
        description: "Deep home cleaning service",
      },
      {
        merchantName: "Indian Oil Petrol Pump",
        amount: "2500.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("shopping")?.id,
        description: "Vehicle fuel refill",
      },
      {
        merchantName: "Amazon India",
        amount: "4290.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("shopping")?.id,
        description: "Ergonomic work desk accessory",
      },
      {
        merchantName: "Zomato Dine-in Koramangala",
        amount: "1450.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("dining")?.id,
        description: "Weekend family restaurant lunch",
      },
      {
        merchantName: "ICICI Fixed Deposit Transfer",
        amount: "20000.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        accountId: hdfcAcc?.id,
        categoryId: categoriesMap.get("transfers")?.id,
        description: "Emergency reserve recurring deposit",
      },
      {
        merchantName: "Parag Parikh Flexi Cap SIP",
        amount: "10000.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        accountId: hdfcAcc?.id,
        categoryId: categoriesMap.get("investments")?.id,
        description: "Mutual fund long term equity SIP",
      },
      {
        merchantName: "Tech Consulting Retainer",
        amount: "25000.0000",
        direction: "CREDIT" as const,
        occurredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        accountId: iciciAcc?.id,
        categoryId: categoriesMap.get("income")?.id,
        description: "Weekend cloud architecture advisory fee",
      },
      {
        merchantName: "Airtel Fiber Broadband",
        amount: "1180.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
        accountId: hdfcAcc?.id,
        categoryId: categoriesMap.get("utilities")?.id,
        description: "300 Mbps home wifi bill",
      },
      {
        merchantName: "Cult.fit Fitness Membership",
        amount: "1750.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("subscriptions")?.id,
        description: "Monthly fitness center access",
      },
    ];

    for (const tx of txDefs) {
      await db.insert(transactions).values({
        householdId,
        accountId: tx.accountId,
        categoryId: tx.categoryId,
        amount: tx.amount,
        currency: "INR",
        direction: tx.direction,
        merchantName: tx.merchantName,
        description: tx.description,
        status: "verified",
        occurredAt: tx.occurredAt,
      });
    }
    logger.info("Inserted 15 demo transactions");
  }

  // 7. Planning Goals
  const existingGoals = await db
    .select({ id: planningGoals.id })
    .from(planningGoals)
    .where(eq(planningGoals.householdId, householdId));

  if (existingGoals.length === 0) {
    const goalsList = [
      {
        name: "Bengaluru Home Down Payment",
        category: "home",
        targetAmount: "2000000.0000",
        currentSavings: "650000.0000",
        monthlyContribution: "45000.0000",
        targetDate: "2028-12-31",
        horizonMonths: 28,
        status: "active",
      },
      {
        name: "6-Month Emergency Fund",
        category: "savings",
        targetAmount: "600000.0000",
        currentSavings: "450000.0000",
        monthlyContribution: "25000.0000",
        targetDate: "2027-06-30",
        horizonMonths: 10,
        status: "active",
      },
      {
        name: "Electric Car Down Payment",
        category: "car",
        targetAmount: "500000.0000",
        currentSavings: "150000.0000",
        monthlyContribution: "15000.0000",
        targetDate: "2027-12-31",
        horizonMonths: 16,
        status: "active",
      },
      {
        name: "Japan Cherry Blossom Trip",
        category: "travel",
        targetAmount: "350000.0000",
        currentSavings: "120000.0000",
        monthlyContribution: "15000.0000",
        targetDate: "2027-03-31",
        horizonMonths: 7,
        status: "active",
      },
    ];

    for (const g of goalsList) {
      await db.insert(planningGoals).values({
        householdId,
        name: g.name,
        category: g.category,
        targetAmount: g.targetAmount,
        currentSavings: g.currentSavings,
        monthlyContribution: g.monthlyContribution,
        targetDate: g.targetDate,
        horizonMonths: g.horizonMonths,
        status: g.status,
      });
    }
    logger.info("Inserted planning goals", { count: goalsList.length });
  }

  // 8. Loans
  const existingLoans = await db
    .select({ id: loans.id })
    .from(loans)
    .where(eq(loans.householdId, householdId));

  if (existingLoans.length === 0) {
    const hdfcAcc = accountsMap.get("HDFC Salary Account");
    await db.insert(loans).values({
      householdId,
      name: "HDFC Home Loan",
      type: "home",
      originalPrincipal: "5000000.0000",
      outstandingPrincipal: "4500000.0000",
      interestRate: "8.5500",
      remainingTenureMonths: 180,
      monthlyEmi: "43500.0000",
      nextDueDate: "2026-10-05",
      lenderName: "HDFC Bank",
      accountId: hdfcAcc?.id,
      status: "active",
    });
    logger.info("Inserted HDFC Home Loan");
  }

  // 9. Household Planning inputs
  const [existingPlanning] = await db
    .select()
    .from(householdPlanning)
    .where(eq(householdPlanning.householdId, householdId));

  if (!existingPlanning) {
    await db.insert(householdPlanning).values({
      householdId,
      inputs: {
        cashFlow: {
          income: "150000",
          essentialExpenses: "45000",
          discretionaryExpenses: "15000",
          emis: "43500",
          mandatoryObligations: "0",
          policyVersion: "v1",
        },
        netWorth: {
          liquidSavings: "425000",
          emergencyReserves: "450000",
          investments: "850000",
          cash: "185000",
        },
      },
      completedStep: 3,
      estimates: [],
      revision: 1,
      updatedBy: user.id,
    });
    logger.info("Inserted household planning configuration");
  }

  logger.info("Seeded Anand Sharma (demo@example.com)");
}

async function seedPersonaRohit() {
  const demoEmail = "demo2@example.com";
  const demoPassword = "Password123!";

  // 1. Create or Find User
  let [user] = await db.select().from(users).where(eq(users.email, demoEmail));
  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        email: demoEmail,
        displayName: "Rohit Verma",
        status: "active",
        emailVerifiedAt: new Date(),
        roles: ["user"],
      })
      .returning();
    logger.info("Created demo2 user (Rohit Verma)", { userId: user.id });
  } else {
    logger.info("Demo2 user (Rohit Verma) exists", { userId: user.id });
  }

  // 2. Auth Identity
  const [existingIdentity] = await db
    .select()
    .from(authIdentities)
    .where(eq(authIdentities.userId, user.id));

  if (!existingIdentity) {
    const passwordHash = await hashPassword(demoPassword);
    await db.insert(authIdentities).values({
      userId: user.id,
      provider: "password",
      providerUserId: demoEmail,
      passwordHash,
      email: demoEmail,
      emailVerified: true,
    });
    logger.info("Created auth identity for Rohit Verma");
  }

  // 3. Household
  let [membership] = await db
    .select()
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id));

  let householdId: string;
  if (!membership) {
    const [household] = await db
      .insert(households)
      .values({
        name: "Verma Household",
      })
      .returning();

    [membership] = await db
      .insert(householdMembers)
      .values({
        householdId: household.id,
        userId: user.id,
        role: "owner",
        isPrimary: true,
      })
      .returning();

    householdId = household.id;
    logger.info("Created Verma Household and membership", { householdId });
  } else {
    householdId = membership.householdId;
    logger.info("Using existing Verma Household", { householdId });
  }

  // 4. Accounts
  const existingAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.householdId, householdId));

  const accountsMap = new Map<string, typeof accounts.$inferSelect>();
  for (const acc of existingAccounts) {
    accountsMap.set(acc.name, acc);
  }

  const accountDefs = [
    {
      name: "SBI Salary Account",
      type: "SAVINGS" as const,
      currency: "INR",
      institutionName: "State Bank of India",
      maskedNumber: "6241",
      currentBalance: "22000.0000",
    },
    {
      name: "Groww Mutual Fund & Demat",
      type: "BROKERAGE" as const,
      currency: "INR",
      institutionName: "Groww (Nextbillion Technology)",
      maskedNumber: "8392",
      currentBalance: "48000.0000",
    },
  ];

  for (const def of accountDefs) {
    if (!accountsMap.has(def.name)) {
      const [inserted] = await db
        .insert(accounts)
        .values({
          householdId,
          name: def.name,
          type: def.type,
          currency: def.currency,
          institutionName: def.institutionName,
          maskedNumber: def.maskedNumber,
          currentBalance: def.currentBalance,
          balanceUpdatedAt: new Date(),
        })
        .returning();
      accountsMap.set(def.name, inserted);
    }
  }
  logger.info("Ensured accounts for Rohit Verma", { count: accountsMap.size });

  // 5. Categories
  const existingCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.householdId, householdId));

  const categoriesMap = new Map<string, typeof categories.$inferSelect>();
  for (const cat of existingCategories) {
    categoriesMap.set(cat.slug || cat.name, cat);
  }

  const categoryDefs = [
    { name: "Salary / Income", slug: "income", categoryType: "INCOME" as const },
    { name: "Shared PG & Rent", slug: "housing", categoryType: "EXPENSE" as const },
    { name: "Tiffin & Groceries", slug: "groceries", categoryType: "EXPENSE" as const },
    { name: "Metro & Transit", slug: "travel", categoryType: "EXPENSE" as const },
    { name: "Phone EMI", slug: "emi", categoryType: "EXPENSE" as const },
    { name: "Groww SIP", slug: "investments", categoryType: "EXPENSE" as const },
    { name: "Wifi & Utilities", slug: "utilities", categoryType: "EXPENSE" as const },
    { name: "Dining & Tea", slug: "dining", categoryType: "EXPENSE" as const },
    { name: "Shopping", slug: "shopping", categoryType: "EXPENSE" as const },
    { name: "Transfers", slug: "transfers", categoryType: "TRANSFER" as const },
  ];

  for (const def of categoryDefs) {
    if (!categoriesMap.has(def.slug)) {
      const [inserted] = await db
        .insert(categories)
        .values({
          householdId,
          name: def.name,
          slug: def.slug,
          categoryType: def.categoryType,
          isSystem: true,
        })
        .returning();
      categoriesMap.set(def.slug, inserted);
    }
  }
  logger.info("Ensured categories for Rohit Verma", { count: categoriesMap.size });

  // 6. Transactions
  const existingTxCount = (
    await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.householdId, householdId))
  ).length;

  if (existingTxCount === 0) {
    const sbiAcc = accountsMap.get("SBI Salary Account");

    const txDefs = [
      {
        merchantName: "Salary Credit - Tech Innovators Pvt Ltd",
        amount: "30000.0000",
        direction: "CREDIT" as const,
        occurredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("income")?.id,
        description: "Monthly salary credit - Junior Associate",
      },
      {
        merchantName: "Bajaj Finserv Phone EMI Auto-Debit",
        amount: "10000.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("emi")?.id,
        description: "iPhone 16 Pro No-Cost EMI installment (2/12)",
      },
      {
        merchantName: "Shared PG Monthly Rent via UPI",
        amount: "7500.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("housing")?.id,
        description: "Twin sharing PG rent with food included",
      },
      {
        merchantName: "Groww Mutual Fund SIP",
        amount: "2000.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("investments")?.id,
        description: "Parag Parikh Flexi Cap Fund monthly SIP",
      },
      {
        merchantName: "Namma Metro Smart Card Recharge",
        amount: "1500.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("travel")?.id,
        description: "Monthly office commute metro pass",
      },
      {
        merchantName: "Daily Tiffin Service Mess Bill",
        amount: "3200.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("groceries")?.id,
        description: "Monthly lunch dabba delivery subscription",
      },
      {
        merchantName: "Auto & Rapido Rides",
        amount: "1500.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("travel")?.id,
        description: "Last-mile commute from metro to PG",
      },
      {
        merchantName: "Jio Fiber & Mobile Recharge",
        amount: "1499.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("utilities")?.id,
        description: "PG WiFi contribution and 3-month mobile recharge",
      },
      {
        merchantName: "Blinkit Essentials & Fruits",
        amount: "1300.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("groceries")?.id,
        description: "Evening snacks, milk, and seasonal fruits",
      },
      {
        merchantName: "Weekend Biryani Dine-out",
        amount: "850.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("dining")?.id,
        description: "Sunday lunch with college colleagues",
      },
      {
        merchantName: "Chai Point & Snacks UPI",
        amount: "650.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("dining")?.id,
        description: "Office tea and evening puff treats",
      },
      {
        merchantName: "Decathlon Sports Gear",
        amount: "800.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("shopping")?.id,
        description: "Running shoes and sports water bottle",
      },
      {
        merchantName: "Freelance Graphic Design Gig",
        amount: "5000.0000",
        direction: "CREDIT" as const,
        occurredAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("income")?.id,
        description: "Side project logo and poster branding freelance income",
      },
      {
        merchantName: "Apollo Pharmacy First Aid",
        amount: "450.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("shopping")?.id,
        description: "Multivitamins and basic first aid",
      },
      {
        merchantName: "Emergency Reserve RD Deposit",
        amount: "2000.0000",
        direction: "DEBIT" as const,
        occurredAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
        accountId: sbiAcc?.id,
        categoryId: categoriesMap.get("transfers")?.id,
        description: "Transfer to emergency recurring deposit buffer",
      },
    ];

    for (const tx of txDefs) {
      await db.insert(transactions).values({
        householdId,
        accountId: tx.accountId,
        categoryId: tx.categoryId,
        amount: tx.amount,
        currency: "INR",
        direction: tx.direction,
        merchantName: tx.merchantName,
        description: tx.description,
        status: "verified",
        occurredAt: tx.occurredAt,
      });
    }
    logger.info("Inserted 15 demo transactions for Rohit Verma");
  }

  // 7. Planning Goals
  const existingGoals = await db
    .select({ id: planningGoals.id })
    .from(planningGoals)
    .where(eq(planningGoals.householdId, householdId));

  if (existingGoals.length === 0) {
    const goalsList = [
      {
        name: "Royal Enfield Bullet 350",
        category: "car",
        targetAmount: "250000.0000",
        currentSavings: "20000.0000",
        monthlyContribution: "0.0000",
        targetDate: "2028-08-31",
        horizonMonths: 24,
        status: "active",
      },
      {
        name: "Starter Home Down Payment",
        category: "home",
        targetAmount: "1000000.0000",
        currentSavings: "50000.0000",
        monthlyContribution: "2000.0000",
        targetDate: "2034-08-31",
        horizonMonths: 96,
        status: "active",
      },
    ];

    for (const g of goalsList) {
      await db.insert(planningGoals).values({
        householdId,
        name: g.name,
        category: g.category,
        targetAmount: g.targetAmount,
        currentSavings: g.currentSavings,
        monthlyContribution: g.monthlyContribution,
        targetDate: g.targetDate,
        horizonMonths: g.horizonMonths,
        status: g.status,
      });
    }
    logger.info("Inserted planning goals for Rohit Verma", { count: goalsList.length });
  }

  // 8. Loans
  const existingLoans = await db
    .select({ id: loans.id })
    .from(loans)
    .where(eq(loans.householdId, householdId));

  if (existingLoans.length === 0) {
    const sbiAcc = accountsMap.get("SBI Salary Account");
    await db.insert(loans).values({
      householdId,
      name: "iPhone 16 Pro No-Cost EMI",
      type: "personal",
      originalPrincipal: "120000.0000",
      outstandingPrincipal: "100000.0000",
      interestRate: "0.0000",
      remainingTenureMonths: 10,
      monthlyEmi: "10000.0000",
      nextDueDate: "2026-10-05",
      lenderName: "Bajaj Finserv",
      accountId: sbiAcc?.id,
      status: "active",
    });
    logger.info("Inserted Phone EMI Loan for Rohit Verma");
  }

  // 9. Household Planning inputs
  const [existingPlanning] = await db
    .select()
    .from(householdPlanning)
    .where(eq(householdPlanning.householdId, householdId));

  if (!existingPlanning) {
    await db.insert(householdPlanning).values({
      householdId,
      inputs: {
        cashFlow: {
          income: "30000",
          essentialExpenses: "15000",
          discretionaryExpenses: "3000",
          emis: "10000",
          mandatoryObligations: "0",
          policyVersion: "v1",
        },
        netWorth: {
          liquidSavings: "22000",
          emergencyReserves: "10000",
          investments: "48000",
          cash: "12000",
        },
      },
      completedStep: 3,
      estimates: [],
      revision: 1,
      updatedBy: user.id,
    });
    logger.info("Inserted household planning configuration for Rohit Verma");
  }
}

async function seed() {
  logger.info("Connecting to database for seeding...", { url: env.DATABASE_URL });
  await connectDb(env.DATABASE_URL);

  try {
    logger.info("--- Seeding Persona 1: Anand Sharma (demo@example.com) ---");
    await seedPersonaAnand();

    logger.info("--- Seeding Persona 2: Rohit Verma (demo2@example.com) ---");
    await seedPersonaRohit();

    logger.info("Seeding complete for both personas!");
    logger.info("Persona 1: email = demo@example.com, password = Password123!");
    logger.info("Persona 2: email = demo2@example.com, password = Password123!");
  } finally {
    await disconnectDb();
  }
}

seed().catch(async (err) => {
  logger.error("Seeding failed", { error: err });
  await disconnectDb();
  process.exit(1);
});
