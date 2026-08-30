import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

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

// --- Transactions Routes ---
registry.registerPath({ method: "post", path: "/api/v1/transactions/sync", request: { body: { content: json(SyncTransactionsRequestSchema) } }, responses: { 200: { description: "Sync batch result", content: json(SyncTransactionsResponseSchema) }, 400: { description: "Invalid input", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "get", path: "/api/v1/transactions/cash-flow", request: { query: z.object({ startDate: z.string().datetime().optional(), endDate: z.string().datetime().optional(), accountId: z.string().uuid().optional(), currency: z.string().length(3).optional() }) }, responses: { 200: { description: "Single-currency cash flow snapshot (defaults to INR)", content: json(CashFlowResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "get", path: "/api/v1/transactions", request: { query: z.object({ cursor: z.string().optional(), limit: z.coerce.number().optional(), accountId: z.string().uuid().optional(), categoryId: z.string().uuid().optional(), direction: TransactionDirectionEnum.optional(), status: TransactionStatusEnum.optional(), startDate: z.string().datetime().optional(), endDate: z.string().datetime().optional() }) }, responses: { 200: { description: "List transactions", content: json(TransactionListResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "post", path: "/api/v1/transactions", request: { body: { content: json(CreateTransactionSchema) } }, responses: { 201: { description: "Transaction created", content: json(TransactionResponseSchema) }, 400: { description: "Invalid input", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "get", path: "/api/v1/transactions/{id}", request: { params: IdParamsSchema }, responses: { 200: { description: "Transaction details with provenance", content: json(TransactionWithProvenanceResponseSchema) }, 404: { description: "Transaction not found", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "patch", path: "/api/v1/transactions/{id}", request: { params: IdParamsSchema, body: { content: json(UpdateTransactionSchema) } }, responses: { 200: { description: "Updated transaction", content: json(TransactionResponseSchema) }, 404: { description: "Transaction not found", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "delete", path: "/api/v1/transactions/{id}", request: { params: IdParamsSchema }, responses: { 204: { description: "Transaction deleted" }, 404: { description: "Transaction not found", content: json(ErrorResponseSchema) }, 401: { description: "Unauthorized", content: json(ErrorResponseSchema) } } });

export function generateOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: { title: "Living Financial Plan API", version: "1.0.0" },
    servers: [{ url: "http://localhost:4000" }],
  });
}
