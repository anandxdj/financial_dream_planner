import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  CashFlowRequestSchema,
  CashFlowResponseSchema as FinancialEngineCashFlowOutputSchema,
  EmergencyFundRequestSchema,
  EmergencyFundResponseSchema as FinancialEngineEmergencyFundOutputSchema,
  GoalFundingRequestSchema,
  GoalFundingResponseSchema as FinancialEngineGoalFundingOutputSchema,
  InvestmentProjectionRequestSchema,
  InvestmentProjectionResponseSchema as FinancialEngineInvestmentProjectionOutputSchema,
  LoanRequestSchema,
  LoanResponseSchema as FinancialEngineLoanOutputSchema,
  NetWorthRequestSchema,
  NetWorthResponseSchema as FinancialEngineNetWorthOutputSchema,
  ScenarioEvaluationRequestSchema,
  ScenarioEvaluationResponseSchema as FinancialEngineScenarioEvaluationOutputSchema,
} from "./modules/financial-engine/model";
import {
  CurrentPlanResponseSchema,
  FinancialSnapshotSchema,
  PlanHistoryResponseSchema,
  PlanSchema,
  PlanVersionSchema,
  RecalculatePlanRequestSchema,
} from "./modules/plans/model";
import {
  ApplyScenarioResponseSchema,
  CompareScenariosRequestSchema,
  CompareScenariosResponseSchema,
  CreateScenarioRequestSchema,
  RunScenarioResponseSchema,
  ScenarioListResponseSchema,
  ScenarioResponseSchema,
  ScenarioSchema,
} from "./modules/scenarios/model";
import {
  CitationSchema,
  PlannerAnalyzeRequestSchema,
  PlannerChatRequestSchema,
  PlannerChatResponseSchema,
  PlannerConversationSchema,
  PlannerConversationsResponseSchema,
  PlannerMessageSchema,
  PlannerMessagesResponseSchema,
} from "./modules/planner/model";
import {
  CreateResearchRequestSchema,
  CreateResearchResponseSchema,
  EvidenceListResponseSchema,
  EvidenceSchema,
  ResearchRunResponseSchema,
  ResearchRunSchema,
} from "./modules/research/model";

extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();

const ErrorResponseSchema = registry.register(
  "ErrorResponse",
  z.object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
      requestId: z.string(),
    }),
  }),
);

const JobRunSchema = registry.register(
  "JobRun",
  z.object({
    id: z.string().uuid(),
    kind: z.string(),
    status: z.enum(["queued", "running", "completed", "failed", "cancelled"]),
    input: z.record(z.string(), z.unknown()),
    result: z.record(z.string(), z.unknown()).nullable(),
    error: z.record(z.string(), z.unknown()).nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

const RunResponseSchema = registry.register("RunResponse", z.object({ data: JobRunSchema }));
const RunIdParamsSchema = z.object({ id: z.string().uuid() });
const IdParamsSchema = z.object({ id: z.string().uuid() });
const json = (schema: z.ZodType) => ({ "application/json": { schema } });

const AuthUserSchema = registry.register(
  "AuthUser",
  z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string(),
    avatarUrl: z.string().nullable(),
    status: z.string(),
    emailVerified: z.boolean(),
    roles: z.array(z.string()),
    createdAt: z.string(),
  }),
);

const AuthSessionSchema = registry.register("AuthSession", z.object({ user: AuthUserSchema }));
const RegisterSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128), displayName: z.string().min(1).max(80) });
const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const OidcStartSchema = z.object({ redirectUri: z.string().url(), clientId: z.string(), mode: z.enum(["browser", "mobile"]), appChallenge: z.string().optional() });
const OidcBridgeSchema = z.object({ code: z.string(), verifier: z.string(), redirectUri: z.string().url(), clientId: z.string() });

// --- Accounts ---
const AccountTypeEnum = z.enum(["SAVINGS", "CURRENT", "CREDIT_CARD", "WALLET", "BROKERAGE", "LOAN", "CASH", "OTHER"]);
const AccountSchema = registry.register(
  "Account",
  z.object({
    id: z.string().uuid(),
    householdId: z.string().uuid(),
    name: z.string(),
    type: AccountTypeEnum,
    currency: z.string(),
    institutionName: z.string().nullable(),
    maskedNumber: z.string().nullable(),
    currentBalance: z.string().nullable(),
    balanceUpdatedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

const CreateAccountSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: AccountTypeEnum.optional(),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).optional(),
  institutionName: z.string().trim().max(100).optional(),
  maskedNumber: z.string().trim().max(20).optional(),
  currentBalance: z.string().regex(/^-?\d+(?:\.\d{1,2})?$/).optional(),
});

const UpdateAccountSchema = CreateAccountSchema.partial();
const AccountResponseSchema = registry.register("AccountResponse", z.object({ data: AccountSchema }));
const AccountListResponseSchema = registry.register("AccountListResponse", z.object({ data: z.array(AccountSchema) }));

// --- Categories ---
const CategoryTypeEnum = z.enum(["EXPENSE", "INCOME", "TRANSFER", "OTHER"]);
const CategorySchema = registry.register(
  "Category",
  z.object({
    id: z.string().uuid(),
    householdId: z.string().uuid().nullable(),
    name: z.string(),
    slug: z.string().nullable(),
    categoryType: CategoryTypeEnum,
    isSystem: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

const CreateCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().max(100).optional(),
  categoryType: CategoryTypeEnum.optional(),
});

const UpdateCategorySchema = CreateCategorySchema.partial();
const CategoryResponseSchema = registry.register("CategoryResponse", z.object({ data: CategorySchema }));
const CategoryListResponseSchema = registry.register("CategoryListResponse", z.object({ data: z.array(CategorySchema) }));

// --- Transactions ---
const TransactionDirectionEnum = z.enum(["DEBIT", "CREDIT"]);
const TransactionStatusEnum = z.enum(["verified", "needs_review", "pending"]);

const TransactionSourceSchema = registry.register(
  "TransactionSource",
  z.object({
    id: z.string().uuid(),
    householdId: z.string().uuid(),
    transactionId: z.string().uuid(),
    sourceType: z.string(),
    clientId: z.string().nullable(),
    externalReference: z.string().nullable(),
    sourceMetadataJson: z.record(z.string(), z.unknown()).nullable(),
    confidence: z.string().nullable(),
    importedAt: z.string().datetime(),
    createdAt: z.string().datetime(),
  }),
);

const TransactionSchema = registry.register(
  "Transaction",
  z.object({
    id: z.string().uuid(),
    householdId: z.string().uuid(),
    accountId: z.string().uuid().nullable(),
    categoryId: z.string().uuid().nullable(),
    amount: z.string(),
    currency: z.string(),
    direction: TransactionDirectionEnum,
    merchantName: z.string().nullable(),
    merchantNormalized: z.string().nullable(),
    occurredAt: z.string().datetime(),
    paymentMethod: z.string().nullable(),
    description: z.string().nullable(),
    externalReference: z.string().nullable(),
    status: TransactionStatusEnum,
    parserConfidence: z.string().nullable(),
    fallbackFingerprint: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

const TransactionWithProvenanceSchema = registry.register(
  "TransactionWithProvenance",
  TransactionSchema.extend({
    provenance: z.array(TransactionSourceSchema),
  }),
);

const TransactionResponseSchema = registry.register("TransactionResponse", z.object({ data: TransactionSchema }));
const TransactionWithProvenanceResponseSchema = registry.register("TransactionWithProvenanceResponse", z.object({ data: TransactionWithProvenanceSchema }));
const TransactionListResponseSchema = registry.register("TransactionListResponse", z.object({ data: z.array(TransactionSchema), nextCursor: z.string().optional() }));

const SyncTransactionItemSchema = z.object({
  clientId: z.string().trim().min(1).max(128),
  amount: z.string().trim().regex(/^(?!0+(?:\.0{1,2})?$)\d+(?:\.\d{1,2})?$/),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).optional(),
  direction: TransactionDirectionEnum,
  merchantName: z.string().trim().max(255).optional(),
  accountId: z.string().uuid().optional(),
  accountLast4: z.string().trim().max(10).optional(),
  paymentMethod: z.string().trim().max(50).optional(),
  occurredAt: z.string().datetime(),
  balanceAfter: z.union([z.string(), z.number()]).optional(),
  externalReference: z.string().trim().max(255).optional(),
  sourceType: z.string().trim().max(50).optional(),
  parserConfidence: z.number().min(0).max(1).optional(),
}).strict();

const SyncTransactionsRequestSchema = z.object({
  syncId: z.string().trim().min(1).max(128),
  transactions: z.array(SyncTransactionItemSchema),
}).strict();

const SyncTransactionsResponseSchema = registry.register(
  "SyncTransactionsResponse",
  z.object({
    syncId: z.string(),
    created: z.number(),
    duplicates: z.number(),
    needsReview: z.number(),
  }),
);

const CreateTransactionSchema = z.object({
  amount: z.string().trim().regex(/^(?!0+(?:\.0{1,2})?$)\d+(?:\.\d{1,2})?$/),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).optional(),
  direction: TransactionDirectionEnum,
  merchantName: z.string().trim().max(255).optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  occurredAt: z.string().datetime().optional(),
  paymentMethod: z.string().trim().max(50).optional(),
  description: z.string().trim().max(500).optional(),
  externalReference: z.string().trim().max(255).optional(),
});

const UpdateTransactionSchema = z.object({
  accountId: z.string().uuid().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  merchantName: z.string().trim().max(255).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  status: TransactionStatusEnum.optional(),
});

const CashFlowSnapshotSchema = registry.register(
  "CashFlowSnapshot",
  z.object({
    totalIncome: z.string().nullable(),
    totalExpenses: z.string().nullable(),
    netCashFlow: z.string().nullable(),
    currency: z.string(),
    transactionCount: z.number(),
    hasData: z.boolean(),
  }),
);

const CashFlowResponseSchema = registry.register("CashFlowResponse", z.object({ data: CashFlowSnapshotSchema }));

// --- Platform / Runs ---
registry.registerPath({ method: "get", path: "/api/v1/runs/{id}", request: { params: RunIdParamsSchema }, responses: { 200: { description: "Run", content: json(RunResponseSchema) }, 404: { description: "Missing", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "post", path: "/api/v1/runs/{id}/cancel", request: { params: RunIdParamsSchema }, responses: { 200: { description: "Cancelled run", content: json(RunResponseSchema) } } });
registry.registerPath({ method: "get", path: "/api/v1/runs/{id}/events", request: { params: RunIdParamsSchema, headers: z.object({ "Last-Event-ID": z.string().uuid().optional() }) }, responses: { 200: { description: "Server-sent run events", content: { "text/event-stream": { schema: z.string() } } } } });

// --- Auth ---
registry.registerPath({ method: "post", path: "/api/v1/auth/register", request: { body: { content: json(RegisterSchema) } }, responses: { 201: { description: "Registered", content: json(AuthSessionSchema) }, 409: { description: "Email exists", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "post", path: "/api/v1/auth/login", request: { body: { content: json(LoginSchema) } }, responses: { 200: { description: "Authenticated", content: json(AuthSessionSchema) }, 401: { description: "Invalid credentials", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "post", path: "/api/v1/auth/refresh", responses: { 200: { description: "Rotated session", content: json(AuthSessionSchema) }, 401: { description: "Invalid or reused refresh", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "post", path: "/api/v1/auth/oidc/start", request: { body: { content: json(OidcStartSchema) } }, responses: { 200: { description: "Central OIDC authorization URL", content: json(z.object({ authorizationUrl: z.string().url() })) } } });
registry.registerPath({ method: "get", path: "/api/v1/auth/oidc/callback", request: { query: z.object({ code: z.string(), state: z.string() }) }, responses: { 302: { description: "Browser callback or short-lived mobile bridge redirect" } } });
registry.registerPath({ method: "post", path: "/api/v1/auth/oidc/bridge/exchange", request: { body: { content: json(OidcBridgeSchema) } }, responses: { 200: { description: "Application token exchange", content: json(z.object({ accessToken: z.string(), refreshToken: z.string(), user: AuthUserSchema })) } } });
registry.registerPath({ method: "get", path: "/api/v1/users/me", responses: { 200: { description: "Current tenant-scoped user", content: json(AuthSessionSchema) }, 401: { description: "Inactive session", content: json(ErrorResponseSchema) } } });

// --- Accounts Routes ---
registry.registerPath({ method: "get", path: "/api/v1/accounts", responses: { 200: { description: "List of accounts for household", content: json(AccountListResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "post", path: "/api/v1/accounts", request: { body: { content: json(CreateAccountSchema) } }, responses: { 201: { description: "Account created", content: json(AccountResponseSchema) }, 400: { description: "Invalid input", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "get", path: "/api/v1/accounts/{id}", request: { params: IdParamsSchema }, responses: { 200: { description: "Account details", content: json(AccountResponseSchema) }, 404: { description: "Account not found", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "patch", path: "/api/v1/accounts/{id}", request: { params: IdParamsSchema, body: { content: json(UpdateAccountSchema) } }, responses: { 200: { description: "Updated account", content: json(AccountResponseSchema) }, 404: { description: "Account not found", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "delete", path: "/api/v1/accounts/{id}", request: { params: IdParamsSchema }, responses: { 204: { description: "Account deleted" }, 409: { description: "Account has ledger history", content: json(ErrorResponseSchema) }, 404: { description: "Account not found", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });

// --- Categories Routes ---
registry.registerPath({ method: "get", path: "/api/v1/categories", responses: { 200: { description: "List of categories", content: json(CategoryListResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "post", path: "/api/v1/categories", request: { body: { content: json(CreateCategorySchema) } }, responses: { 201: { description: "Category created", content: json(CategoryResponseSchema) }, 400: { description: "Invalid input", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "get", path: "/api/v1/categories/{id}", request: { params: IdParamsSchema }, responses: { 200: { description: "Category details", content: json(CategoryResponseSchema) }, 404: { description: "Category not found", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "patch", path: "/api/v1/categories/{id}", request: { params: IdParamsSchema, body: { content: json(UpdateCategorySchema) } }, responses: { 200: { description: "Updated category", content: json(CategoryResponseSchema) }, 403: { description: "System category cannot be updated", content: json(ErrorResponseSchema) }, 404: { description: "Category not found", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "delete", path: "/api/v1/categories/{id}", request: { params: IdParamsSchema }, responses: { 204: { description: "Category deleted" }, 403: { description: "System category cannot be deleted", content: json(ErrorResponseSchema) }, 404: { description: "Category not found", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });

// --- Financial Engine Schemas ---
const FinancialEngineCashFlowResponseSchema = registry.register(
  "FinancialEngineCashFlowResponse",
  z.object({ data: FinancialEngineCashFlowOutputSchema }),
);
const FinancialEngineEmergencyFundResponseSchema = registry.register(
  "FinancialEngineEmergencyFundResponse",
  z.object({ data: FinancialEngineEmergencyFundOutputSchema }),
);
const FinancialEngineLoanResponseSchema = registry.register(
  "FinancialEngineLoanResponse",
  z.object({ data: FinancialEngineLoanOutputSchema }),
);
const FinancialEngineInvestmentProjectionResponseSchema = registry.register(
  "FinancialEngineInvestmentProjectionResponse",
  z.object({ data: FinancialEngineInvestmentProjectionOutputSchema }),
);
const FinancialEngineGoalFundingResponseSchema = registry.register(
  "FinancialEngineGoalFundingResponse",
  z.object({ data: FinancialEngineGoalFundingOutputSchema }),
);
const FinancialEngineNetWorthResponseSchema = registry.register(
  "FinancialEngineNetWorthResponse",
  z.object({ data: FinancialEngineNetWorthOutputSchema }),
);
const FinancialEngineScenarioResponseSchema = registry.register(
  "FinancialEngineScenarioResponse",
  z.object({ data: FinancialEngineScenarioEvaluationOutputSchema }),
);

// --- Transactions Routes ---
registry.registerPath({ method: "post", path: "/api/v1/transactions/sync", request: { body: { content: json(SyncTransactionsRequestSchema) } }, responses: { 200: { description: "Sync batch result", content: json(SyncTransactionsResponseSchema) }, 400: { description: "Invalid input", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "get", path: "/api/v1/transactions/cash-flow", request: { query: z.object({ startDate: z.string().datetime().optional(), endDate: z.string().datetime().optional(), accountId: z.string().uuid().optional(), currency: z.string().length(3).optional() }) }, responses: { 200: { description: "Single-currency cash flow snapshot (defaults to INR)", content: json(CashFlowResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "get", path: "/api/v1/transactions", request: { query: z.object({ cursor: z.string().optional(), limit: z.coerce.number().optional(), accountId: z.string().uuid().optional(), categoryId: z.string().uuid().optional(), direction: TransactionDirectionEnum.optional(), status: TransactionStatusEnum.optional(), startDate: z.string().datetime().optional(), endDate: z.string().datetime().optional() }) }, responses: { 200: { description: "List transactions", content: json(TransactionListResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "post", path: "/api/v1/transactions", request: { body: { content: json(CreateTransactionSchema) } }, responses: { 201: { description: "Transaction created", content: json(TransactionResponseSchema) }, 400: { description: "Invalid input", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "get", path: "/api/v1/transactions/{id}", request: { params: IdParamsSchema }, responses: { 200: { description: "Transaction details with provenance", content: json(TransactionWithProvenanceResponseSchema) }, 404: { description: "Transaction not found", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "patch", path: "/api/v1/transactions/{id}", request: { params: IdParamsSchema, body: { content: json(UpdateTransactionSchema) } }, responses: { 200: { description: "Updated transaction", content: json(TransactionResponseSchema) }, 404: { description: "Transaction not found", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "delete", path: "/api/v1/transactions/{id}", request: { params: IdParamsSchema }, responses: { 204: { description: "Transaction deleted" }, 404: { description: "Transaction not found", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });

// --- Financial Engine Routes ---
registry.registerPath({
  method: "post",
  path: "/api/v1/financial-engine/cash-flow",
  request: { body: { content: json(CashFlowRequestSchema) } },
  responses: {
    200: { description: "Cash flow calculation result", content: json(FinancialEngineCashFlowResponseSchema) },
    400: { description: "Invalid input", content: json(ErrorResponseSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/financial-engine/emergency-fund",
  request: { body: { content: json(EmergencyFundRequestSchema) } },
  responses: {
    200: { description: "Emergency fund calculation result", content: json(FinancialEngineEmergencyFundResponseSchema) },
    400: { description: "Invalid input", content: json(ErrorResponseSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/financial-engine/loan",
  request: { body: { content: json(LoanRequestSchema) } },
  responses: {
    200: { description: "Loan and amortization calculation result", content: json(FinancialEngineLoanResponseSchema) },
    400: { description: "Invalid input", content: json(ErrorResponseSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/financial-engine/investment-projection",
  request: { body: { content: json(InvestmentProjectionRequestSchema) } },
  responses: {
    200: { description: "Investment projection calculation result", content: json(FinancialEngineInvestmentProjectionResponseSchema) },
    400: { description: "Invalid input", content: json(ErrorResponseSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/financial-engine/goal-funding",
  request: { body: { content: json(GoalFundingRequestSchema) } },
  responses: {
    200: { description: "Goal funding calculation result", content: json(FinancialEngineGoalFundingResponseSchema) },
    400: { description: "Invalid input", content: json(ErrorResponseSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/financial-engine/net-worth",
  request: { body: { content: json(NetWorthRequestSchema) } },
  responses: {
    200: { description: "Net worth calculation result", content: json(FinancialEngineNetWorthResponseSchema) },
    400: { description: "Invalid input", content: json(ErrorResponseSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/financial-engine/scenario",
  request: { body: { content: json(ScenarioEvaluationRequestSchema) } },
  responses: {
    200: { description: "Scenario evaluation result", content: json(FinancialEngineScenarioResponseSchema) },
    400: { description: "Invalid input", content: json(ErrorResponseSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
  },
});

// --- Plans Schemas ---
registry.register("FinancialSnapshot", FinancialSnapshotSchema);
registry.register("PlanVersion", PlanVersionSchema);
registry.register("Plan", PlanSchema);
const CurrentPlanResponseApiSchema = registry.register("CurrentPlanResponse", CurrentPlanResponseSchema);
const PlanHistoryResponseApiSchema = registry.register("PlanHistoryResponse", PlanHistoryResponseSchema);

// --- Scenarios Schemas ---
registry.register("Scenario", ScenarioSchema);
const ScenarioResponseApiSchema = registry.register("ScenarioResponse", ScenarioResponseSchema);
const ScenarioListResponseApiSchema = registry.register("ScenarioListResponse", ScenarioListResponseSchema);
const CompareScenariosResponseApiSchema = registry.register("CompareScenariosResponse", CompareScenariosResponseSchema);
const RunScenarioResponseApiSchema = registry.register("RunScenarioResponse", RunScenarioResponseSchema);
const ApplyScenarioResponseApiSchema = registry.register("ApplyScenarioResponse", ApplyScenarioResponseSchema);

// --- Plans Routes ---
registry.registerPath({
  method: "post",
  path: "/api/v1/plans/recalculate",
  request: { body: { content: json(RecalculatePlanRequestSchema) } },
  responses: {
    200: { description: "Plan recalculation result with new snapshot and version", content: json(CurrentPlanResponseApiSchema) },
    400: { description: "Invalid input", content: json(ErrorResponseSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/plans/current",
  responses: {
    200: { description: "Current household plan, version, and snapshot", content: json(CurrentPlanResponseApiSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
    404: { description: "Plan not found", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/plans/history",
  request: {
    query: z.object({
      cursor: z.string().optional(),
      limit: z.coerce.number().optional(),
    }),
  },
  responses: {
    200: { description: "Household plan version history", content: json(PlanHistoryResponseApiSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
  },
});

// --- Scenarios Routes ---
registry.registerPath({
  method: "post",
  path: "/api/v1/scenarios",
  request: { body: { content: json(CreateScenarioRequestSchema) } },
  responses: {
    201: { description: "Scenario draft created", content: json(ScenarioResponseApiSchema) },
    400: { description: "Invalid input or no current plan", content: json(ErrorResponseSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/scenarios",
  responses: {
    200: { description: "List of household scenarios", content: json(ScenarioListResponseApiSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/scenarios/compare",
  request: { body: { content: json(CompareScenariosRequestSchema) } },
  responses: {
    200: { description: "Scenario comparison results", content: json(CompareScenariosResponseApiSchema) },
    400: { description: "Invalid scenario count or mixed baselines", content: json(ErrorResponseSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
    404: { description: "One or more scenarios not found", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/scenarios/{id}",
  request: { params: IdParamsSchema },
  responses: {
    200: { description: "Scenario details", content: json(ScenarioResponseApiSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
    404: { description: "Scenario not found", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/scenarios/{id}/run",
  request: { params: IdParamsSchema },
  responses: {
    200: { description: "Scenario run output against baseline without persistence side effects", content: json(RunScenarioResponseApiSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
    404: { description: "Scenario not found", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/scenarios/{id}/apply",
  request: { params: IdParamsSchema },
  responses: {
    200: { description: "Scenario applied; returns updated plan, new version, and snapshot", content: json(ApplyScenarioResponseApiSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
    404: { description: "Scenario or plan not found", content: json(ErrorResponseSchema) },
    409: { description: "Scenario baseline is stale", content: json(ErrorResponseSchema) },
  },
});

// --- Planner Schemas ---
registry.register("Citation", CitationSchema);
registry.register("PlannerConversation", PlannerConversationSchema);
registry.register("PlannerMessage", PlannerMessageSchema);
const PlannerChatResponseApiSchema = registry.register("PlannerChatResponse", PlannerChatResponseSchema);
const PlannerConversationsResponseApiSchema = registry.register("PlannerConversationsResponse", PlannerConversationsResponseSchema);
const PlannerMessagesResponseApiSchema = registry.register("PlannerMessagesResponse", PlannerMessagesResponseSchema);

// --- Research Schemas ---
registry.register("Evidence", EvidenceSchema);
registry.register("ResearchRun", ResearchRunSchema);
const CreateResearchResponseApiSchema = registry.register("CreateResearchResponse", CreateResearchResponseSchema);
const ResearchRunResponseApiSchema = registry.register("ResearchRunResponse", ResearchRunResponseSchema);
const EvidenceListResponseApiSchema = registry.register("EvidenceListResponse", EvidenceListResponseSchema);

// --- Planner Routes ---
registry.registerPath({
  method: "post",
  path: "/api/v1/planner/chat",
  request: { body: { content: json(PlannerChatRequestSchema) } },
  responses: {
    200: { description: "Planner chat response with citations", content: json(PlannerChatResponseApiSchema) },
    400: { description: "Invalid input or prompt injection", content: json(ErrorResponseSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
    404: { description: "Conversation not found", content: json(ErrorResponseSchema) },
    422: { description: "Risk or critic validation failed", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/planner/analyze",
  request: { body: { content: json(PlannerAnalyzeRequestSchema) } },
  responses: {
    200: { description: "Plan analysis response with citations", content: json(PlannerChatResponseApiSchema) },
    400: { description: "Missing active plan", content: json(ErrorResponseSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
    404: { description: "Conversation not found", content: json(ErrorResponseSchema) },
    422: { description: "Risk or critic validation failed", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/planner/conversations",
  request: {
    query: z.object({
      cursor: z.string().optional(),
      limit: z.coerce.number().optional(),
    }),
  },
  responses: {
    200: { description: "List of conversations", content: json(PlannerConversationsResponseApiSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/planner/conversations/{id}/messages",
  request: { params: IdParamsSchema },
  responses: {
    200: { description: "List of conversation messages", content: json(PlannerMessagesResponseApiSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
    404: { description: "Conversation not found", content: json(ErrorResponseSchema) },
  },
});

// --- Research Routes ---
registry.registerPath({
  method: "post",
  path: "/api/v1/research",
  request: { body: { content: json(CreateResearchRequestSchema) } },
  responses: {
    200: { description: "Research run result with evidence", content: json(CreateResearchResponseApiSchema) },
    400: { description: "Invalid input or unsafe search query", content: json(ErrorResponseSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
    502: { description: "Research or search fetch failure", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/research/{id}",
  request: { params: IdParamsSchema },
  responses: {
    200: { description: "Research run details", content: json(ResearchRunResponseApiSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
    404: { description: "Research run not found", content: json(ErrorResponseSchema) },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/research/{id}/evidence",
  request: { params: IdParamsSchema },
  responses: {
    200: { description: "List of evidence for research run", content: json(EvidenceListResponseApiSchema) },
    401: { description: "Unauthorized", content: json(ErrorResponseSchema) },
    404: { description: "Research run not found", content: json(ErrorResponseSchema) },
  },
});

export function generateOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: { title: "Living Financial Plan API", version: "1.0.0" },
    servers: [{ url: "http://localhost:4000" }],
  });
}
