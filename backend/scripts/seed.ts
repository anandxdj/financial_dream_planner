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
        displayName: "",
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
        name: "Primary Household",
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

  await db.update(households).set({ name: "Primary Household" }).where(eq(households.id, householdId));
  await db.update(users).set({ displayName: "" }).where(eq(users.id, user.id));

  await seedHouseholdOnboardingData(householdId, user.id);
  logger.info("Seeded primary user (demo@example.com) with onboarding data");
}

async function seedHouseholdOnboardingData(householdId: string, userId: string) {
  // Clear existing items for this household so seeding is clean & deterministic
  await db.delete(transactions).where(eq(transactions.householdId, householdId));
  await db.delete(planningGoals).where(eq(planningGoals.householdId, householdId));
  await db.delete(loans).where(eq(loans.householdId, householdId));
  await db.delete(accounts).where(eq(accounts.householdId, householdId));
  await db.delete(householdPlanning).where(eq(householdPlanning.householdId, householdId));

  // 1. Accounts matching canonical onboarding investment breakdown (Total ₹10,25,000)
  const accountDefs = [
    {
      name: "Savings Account (HDFC)",
      type: "SAVINGS" as const,
      currency: "INR",
      institutionName: "HDFC Bank",
      maskedNumber: "4321",
      currentBalance: "180000.0000",
    },
    {
      name: "Fixed Deposits (ICICI)",
      type: "SAVINGS" as const,
      currency: "INR",
      institutionName: "ICICI Bank",
      maskedNumber: "7788",
      currentBalance: "200000.0000",
    },
    {
      name: "Mutual Funds & Stocks (Zerodha)",
      type: "BROKERAGE" as const,
      currency: "INR",
      institutionName: "Zerodha",
      maskedNumber: "9901",
      currentBalance: "475000.0000",
    },
    {
      name: "Public Provident Fund (PPF)",
      type: "SAVINGS" as const,
      currency: "INR",
      institutionName: "State Bank of India",
      maskedNumber: "5512",
      currentBalance: "120000.0000",
    },
    {
      name: "Other Liquid Reserves",
      type: "SAVINGS" as const,
      currency: "INR",
      institutionName: "Liquid Reserve",
      maskedNumber: "3391",
      currentBalance: "50000.0000",
    },
  ];

  const accountsMap = new Map<string, typeof accounts.$inferSelect>();
  for (const def of accountDefs) {
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
  logger.info("Ensured accounts matching onboarding investments", { count: accountsMap.size });

  // 2. Categories
  const existingCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.householdId, householdId));

  const categoriesMap = new Map<string, typeof categories.$inferSelect>();
  for (const cat of existingCategories) {
    categoriesMap.set(cat.slug || cat.name, cat);
  }

  const categoryDefs = [
    { name: "Salary / Income", slug: "salary", categoryType: "INCOME" as const },
    { name: "Housing (Rent / Home)", slug: "rent", categoryType: "EXPENSE" as const },
    { name: "Food & Dining", slug: "food", categoryType: "EXPENSE" as const },
    { name: "Transport", slug: "transport", categoryType: "EXPENSE" as const },
    { name: "Utilities & Bills", slug: "utilities", categoryType: "EXPENSE" as const },
    { name: "Shopping", slug: "shopping", categoryType: "EXPENSE" as const },
    { name: "Entertainment", slug: "entertainment", categoryType: "EXPENSE" as const },
    { name: "Others", slug: "others", categoryType: "EXPENSE" as const },
    { name: "SIP & Investments", slug: "investment", categoryType: "TRANSFER" as const },
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

  // 3. Transactions matching onboarding monthly breakdown (Total ₹38,500 expenses + ₹65,000 income + ₹15,000 SIP)
  const salaryAcc = accountsMap.get("Savings Account (HDFC)");
  const txDefs = [
    {
      merchantName: "Tech Solutions Pvt Ltd",
      amount: "65000.0000",
      direction: "CREDIT" as const,
      occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      accountId: salaryAcc?.id,
      categoryId: categoriesMap.get("salary")?.id,
      description: "Monthly Salary Credit",
    },
    {
      merchantName: "House Owner",
      amount: "16000.0000",
      direction: "DEBIT" as const,
      occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      accountId: salaryAcc?.id,
      categoryId: categoriesMap.get("rent")?.id,
      description: "Monthly Apartment Rent",
    },
    {
      merchantName: "Supermarket & Groceries",
      amount: "9000.0000",
      direction: "DEBIT" as const,
      occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      accountId: salaryAcc?.id,
      categoryId: categoriesMap.get("food")?.id,
      description: "Monthly Food & Groceries",
    },
    {
      merchantName: "Fuel & Metro Transit",
      amount: "3500.0000",
      direction: "DEBIT" as const,
      occurredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      accountId: salaryAcc?.id,
      categoryId: categoriesMap.get("transport")?.id,
      description: "Monthly Transport & Commute",
    },
    {
      merchantName: "Electricity & Fiber Internet",
      amount: "3000.0000",
      direction: "DEBIT" as const,
      occurredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      accountId: salaryAcc?.id,
      categoryId: categoriesMap.get("utilities")?.id,
      description: "Monthly Utilities Bill",
    },
    {
      merchantName: "Amazon / Flipkart",
      amount: "3000.0000",
      direction: "DEBIT" as const,
      occurredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      accountId: salaryAcc?.id,
      categoryId: categoriesMap.get("shopping")?.id,
      description: "Shopping & Personal Items",
    },
    {
      merchantName: "Dining & Entertainment",
      amount: "2500.0000",
      direction: "DEBIT" as const,
      occurredAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      accountId: salaryAcc?.id,
      categoryId: categoriesMap.get("entertainment")?.id,
      description: "Weekend Outing & Streaming",
    },
    {
      merchantName: "Miscellaneous Expenses",
      amount: "1500.0000",
      direction: "DEBIT" as const,
      occurredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      accountId: salaryAcc?.id,
      categoryId: categoriesMap.get("others")?.id,
      description: "Other household sundries",
    },
    {
      merchantName: "Zerodha Coin",
      amount: "15000.0000",
      direction: "DEBIT" as const,
      occurredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      accountId: salaryAcc?.id,
      categoryId: categoriesMap.get("investment")?.id,
      description: "Index Mutual Fund Monthly SIP",
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
  logger.info("Inserted 9 transactions matching onboarding cash flow");

  // 4. Planning Goals
  const goalsList = [
    {
      name: "Buy a Home",
      category: "home",
      targetAmount: "7500000.0000",
      currentSavings: "475000.0000",
      monthlyContribution: "20000.0000",
      targetDate: "2031-12-31",
      horizonMonths: 60,
      status: "active",
    },
    {
      name: "Child's Education",
      category: "education",
      targetAmount: "2500000.0000",
      currentSavings: "120000.0000",
      monthlyContribution: "5000.0000",
      targetDate: "2036-06-30",
      horizonMonths: 120,
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
  logger.info("Inserted planning goals matching onboarding", { count: goalsList.length });

  // 5. Loans: none (INITIAL_LOANS is empty)

  // 6. Household Planning configuration matching onboarding inputs
  await db.insert(householdPlanning).values({
    householdId,
    inputs: {
      cashFlow: {
        income: "65000",
        essentialExpenses: "28000",
        discretionaryExpenses: "10500",
        emis: "0",
        mandatoryObligations: "0",
        policyVersion: "v1",
      },
      emergencyFund: {
        currentReserves: "380000",
        incomeStability: "stable",
      },
      investment: {
        initialLumpSum: "1025000",
      },
      goal: {
        goalName: "Buy a Home",
        goalCategory: "home",
        targetAmountToday: "7500000",
      },
      netWorth: {
        assets: [
          { name: "Savings Account", category: "savings", value: "180000" },
          { name: "Mutual Funds", category: "mutual_fund", value: "325000" },
          { name: "Stocks / Equity", category: "stocks", value: "150000" },
          { name: "Fixed Deposits", category: "fd", value: "200000" },
          { name: "PPF", category: "ppf", value: "120000" },
          { name: "Other Investments", category: "other", value: "50000" },
        ],
        liabilities: [],
      },
    },
    completedStep: 3,
    estimates: [],
    revision: 1,
    updatedBy: userId,
  });
  logger.info("Inserted household planning configuration matching onboarding");
}

async function seedPersonaTestUser() {
  const testEmail = "testuser@example.com";
  const testPassword = "Password123!";

  let [user] = await db.select().from(users).where(eq(users.email, testEmail));
  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        displayName: "Test User",
        status: "active",
        emailVerifiedAt: new Date(),
        roles: ["user"],
      })
      .returning();
    logger.info("Created test user", { userId: user.id });
  }

  const [existingIdentity] = await db
    .select()
    .from(authIdentities)
    .where(eq(authIdentities.userId, user.id));

  if (!existingIdentity) {
    const passwordHash = await hashPassword(testPassword);
    await db.insert(authIdentities).values({
      userId: user.id,
      provider: "password",
      providerUserId: testEmail,
      passwordHash,
      email: testEmail,
      emailVerified: true,
    });
    logger.info("Created auth identity for test user");
  }

  let [membership] = await db
    .select()
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id));

  let householdId: string;
  if (!membership) {
    const [household] = await db
      .insert(households)
      .values({
        name: "Test User Household",
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
  } else {
    householdId = membership.householdId;
  }

  await seedHouseholdOnboardingData(householdId, user.id);
  logger.info("Seeded Test User (testuser@example.com) with onboarding data");
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
        displayName: "",
        status: "active",
        emailVerifiedAt: new Date(),
        roles: ["user"],
      })
      .returning();
    logger.info("Created demo2 user", { userId: user.id });
  } else {
    logger.info("Demo2 user exists", { userId: user.id });
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
    logger.info("Created auth identity for demo2 user");
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
        name: "Secondary Household",
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
    logger.info("Created Secondary Household and membership", { householdId });
  } else {
    householdId = membership.householdId;
    logger.info("Using existing Secondary Household", { householdId });
  }

  await db.update(households).set({ name: "Secondary Household" }).where(eq(households.id, householdId));
  await db.update(users).set({ displayName: "" }).where(eq(users.id, user.id));

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
    logger.info("--- Seeding Primary Plan (demo@example.com) ---");
    await seedPersonaAnand();

    logger.info("--- Seeding Test User (testuser@example.com) ---");
    await seedPersonaTestUser();

    logger.info("--- Seeding Secondary Plan (demo2@example.com) ---");
    await seedPersonaRohit();

    logger.info("Seeding complete!");
    logger.info("Primary User: email = demo@example.com, password = Password123!");
    logger.info("Test User: email = testuser@example.com, password = Password123!");
    logger.info("Secondary User: email = demo2@example.com, password = Password123!");
  } finally {
    await disconnectDb();
  }
}

seed().catch(async (err) => {
  logger.error("Seeding failed", { error: err });
  await disconnectDb();
  process.exit(1);
});
