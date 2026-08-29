Yes. At this point we have enough backend decisions locked to write the **backend-only PRD** without guessing about the frontend.

The starter we're basing it on is specifically the standalone REST PostgreSQL variant: Express 5 + Next.js + PostgreSQL + Drizzle, with independent frontend/backend projects and the custom auth system we decided to extend for mobile.

Copy this directly into something like `BACKEND_PRD.md`:

````md
# Living Financial Plan — Backend PRD

**Version:** 1.0  
**Status:** Architecture Locked / Ready for Implementation  
**Scope:** Backend only  
**Primary Client:** Expo / React Native mobile application  
**Secondary Client:** Next.js web application later  
**Primary Market:** India  
**Architecture:** Standalone Modular Monolith

---

# 1. Product Definition

Living Financial Plan is a continuously evolving personal-finance planning system.

The backend maintains a structured representation of the user's financial life and uses it to answer:

> Given everything we know about the user's financial state, goals, obligations and current external reality, what should they do next?

The system combines:

- financial transaction data
- income
- expenses
- loans
- EMIs
- savings
- investments
- insurance
- financial goals
- household responsibilities
- current market/research information
- deterministic financial models
- AI reasoning

The backend is the authoritative source of financial truth.

---

# 2. Core Architecture Principle

```text
Backend owns financial truth.

Clients collect/display information.

Financial Engine performs calculations.

Agents reason and orchestrate.

Research services retrieve current reality.

PostgreSQL stores canonical financial state.
````

An LLM must never become the authoritative calculator for financial numbers.

---

# 3. Locked Technology Stack

| Layer                    | Technology                        |
| ------------------------ | --------------------------------- |
| Language                 | TypeScript                        |
| Runtime                  | Node.js                           |
| Backend framework        | Express 5                         |
| API                      | REST                              |
| Validation               | Zod                               |
| API documentation        | OpenAPI                           |
| Client generation        | OpenAPI-generated TS SDK          |
| Primary database         | PostgreSQL                        |
| ORM                      | Drizzle                           |
| PostgreSQL provider      | Neon                              |
| Queue/cache              | Redis                             |
| Background jobs          | BullMQ                            |
| Agent orchestration      | LangGraph JS                      |
| Primary LLM              | Custom OpenAI-compatible endpoint |
| Fallback LLM             | Gemini                            |
| Web search               | Tavily                            |
| File-storage interface   | S3-compatible                     |
| Initial storage provider | Cloudflare R2                     |
| Hosting                  | Existing VPS                      |
| Containerization         | Docker Compose                    |
| Reverse proxy            | Traefik                           |
| Streaming                | SSE                               |
| Main financial engine    | TypeScript                        |

---

# 4. Starter Project

Start from:

```text
rest/standalone/drizzle-postgres
```

Do not use:

```text
Turborepo
pnpm workspaces
tRPC
FastAPI
NestJS
```

for the initial backend architecture.

The backend and frontend remain separate applications.

---

# 5. Backend Architecture

```text
                    ┌──────────────────┐
                    │   Expo Mobile    │
                    └────────┬─────────┘
                             │
                         REST + SSE
                             │
                    ┌────────▼─────────┐
                    │    Express 5     │
                    │ Node + TypeScript│
                    └────────┬─────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
       ▼                     ▼                     ▼
 Financial Domains     Financial Engine         AI Layer
       │                     │                     │
       │                     │                 LangGraph
       │                     │                     │
       ▼                     ▼                     ▼
 PostgreSQL             Deterministic        LLM Router
    Neon                Calculations           │
                                          ┌─────┴──────┐
                                          ▼            ▼
                                    Custom AI       Gemini


                  BACKGROUND PROCESSING

Express / Agents
       │
       ▼
     Redis
       │
       ▼
     BullMQ
       │
       ▼
    Workers


                       RESEARCH

Research Agent
      │
      ▼
Research Provider Layer
      │
      ├── Tavily
      ├── Official sources
      └── Structured finance APIs


                        FILES

Storage Interface
      │
      ▼
S3-compatible layer
      │
      ▼
Cloudflare R2
```

---

# 6. Architecture Style

Use a:

> **Modular Monolith**

Do not begin with microservices.

The application remains one backend but is organized into independent domains.

Example:

```text
backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── worker.ts
│   │
│   ├── config/
│   ├── database/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── households/
│   │   ├── members/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── categories/
│   │   ├── merchant-rules/
│   │   ├── income/
│   │   ├── expenses/
│   │   ├── loans/
│   │   ├── investments/
│   │   ├── insurance/
│   │   ├── goals/
│   │   ├── snapshots/
│   │   ├── plans/
│   │   ├── scenarios/
│   │   ├── drift/
│   │   ├── research/
│   │   ├── documents/
│   │   └── audit/
│   │
│   ├── financial-engine/
│   ├── agents/
│   ├── llm/
│   ├── research/
│   ├── storage/
│   ├── queues/
│   ├── openapi/
│   └── shared/
│
├── tests/
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

# 7. API Architecture

Base API path:

```text
/api/v1
```

The API contract is defined using:

```text
Zod
 ↓
OpenAPI
 ↓
Generated TypeScript SDK
 ↓
Expo / Next.js
```

We do not need shared packages or a monorepo to share API types.

---

# 8. Standard API Error

All backend errors use a consistent structure.

```json
{
  "error": {
    "code": "INSUFFICIENT_FINANCIAL_STATE",
    "message": "Emergency fund cannot be calculated.",
    "details": {
      "missing": [
        "monthly_essential_expenses"
      ]
    }
  }
}
```

---

# 9. Authentication

Use the custom authentication system already provided by the starter.

Keep:

* email/password
* Google OAuth
* access token
* rotating refresh token
* token-family reuse detection
* email verification
* password reset
* Argon2id
* rate limiting
* session management

---

# 10. Web Authentication

Web clients use:

```text
httpOnly access cookie
+
httpOnly refresh cookie
```

---

# 11. Mobile Authentication

Expo uses:

```text
Bearer access token
+
refresh token stored securely on device
```

The same backend users and sessions are used by both mobile and web.

Extend the session model:

```ts
Session {
  id
  userId

  refreshTokenHash
  tokenFamily

  clientType
  deviceId?
  deviceName?
  platform?

  createdAt
  lastUsedAt
  expiresAt
  revokedAt?
}
```

Possible:

```text
WEB
MOBILE
```

---

# 12. Household Architecture

The household is the root financial entity.

V1:

```text
User
  ↓
Household
  ↓
Primary Member
```

The user sees a normal individual financial application.

Internally we prepare for:

```text
Household
├── User
├── Spouse
├── Child
└── Parent
```

Most financial objects belong to:

```text
household_id
```

---

# 13. Core PostgreSQL Tables

Initial domain model:

```text
users
auth_identities
sessions
auth_challenges

households
household_members

accounts

transactions
transaction_sources

categories
subcategories

merchant_rules
user_merchant_rules

income_sources
recurring_expenses

loans
loan_payments

investment_accounts
investment_positions

insurance_policies

goals

financial_snapshots

plans
plan_versions

scenarios

plan_drift_events

evidence

documents

audit_events
```

The data should remain normalized.

---

# 14. JSONB Usage

PostgreSQL JSONB is allowed for:

```text
provider metadata
external-source metadata
flexible goal configuration
research metadata
agent metadata
snapshot metadata
```

Do not build the entire financial state as one large JSON document.

---

# 15. Account Model

```ts
Account {
  id
  householdId
  ownerMemberId?

  institutionName?

  type

  maskedNumber?
  currency

  currentBalance?
  balanceUpdatedAt?

  source

  createdAt
  updatedAt
}
```

Account types:

```text
SAVINGS
CURRENT
CREDIT_CARD
WALLET
BROKERAGE
LOAN
CASH
OTHER
```

---

# 16. Canonical Transaction Ledger

All transaction sources ultimately feed one ledger.

```ts
Transaction {
  id

  householdId
  accountId?

  amount
  currency

  direction

  merchantName?
  merchantNormalized?

  categoryId?
  subcategoryId?

  occurredAt

  paymentMethod?

  description?

  externalReference?

  verificationStatus

  parserConfidence?

  createdAt
  updatedAt
}
```

Directions:

```text
DEBIT
CREDIT
```

---

# 17. Transaction Sources

Possible sources:

```text
SMS
MANUAL
PDF
BANK_PROVIDER
ACCOUNT_AGGREGATOR
BROKER
IMPORT
```

---

# 18. Transaction Provenance

One transaction can be observed through multiple sources.

Use:

```text
transactions
+
transaction_sources
```

Example:

```ts
TransactionSource {
  id

  transactionId

  sourceType

  externalReference?

  sourceMetadataJson?

  confidence?

  importedAt
}
```

Example:

```text
₹650
Swiggy

Sources:
✓ SMS
✓ Bank
```

It remains one transaction.

---

# 19. Duplicate Detection

Reference ID is the strongest duplicate signal.

Possible identifiers:

```text
UTR
RRN
transaction ID
bank reference
payment reference
card reference
```

Flow:

```text
Incoming transaction
       ↓
Has external reference?
       │
       ├── YES
       │     ↓
       │  Does reference already exist?
       │     │
       │     ├── YES → duplicate
       │     └── NO → create
       │
       └── NO
             ↓
       fallback fingerprint
```

---

# 20. Duplicate Fingerprint

When no reliable reference exists:

```text
account
+
amount
+
direction
+
merchant
+
timestamp window
```

Example:

```ts
fingerprint = hash(
  accountId +
  amount +
  direction +
  merchantNormalized +
  timestampBucket
)
```

Fingerprint matching must remain conservative.

Two identical ₹100 transactions occurring close together may still be valid independent transactions.

---

# 21. SMS Transaction Architecture

SMS sync is an MVP-critical feature.

The mobile side:

```text
Android SMS
    ↓
small native Expo/Kotlin SMS reader
    ↓
Expo TypeScript
    ↓
financial message parser
    ↓
normalized transaction
```

The backend does not read SMS directly.

---

# 22. SMS Synchronization Strategy

SMS synchronization happens when:

```text
app opens
or
app resumes
or
user manually presses Sync
```

We deliberately avoid always-running background synchronization in V1.

Reasons:

```text
battery efficiency
lower complexity
less Android background processing
simpler native module
easier debugging
```

---

# 23. SMS Sync Flow

```text
App opened
    ↓
Read lastSmsScanAt
    ↓
Read messages newer than timestamp
    ↓
Parse financial SMS locally
    ↓
Normalize transactions
    ↓
Store locally
    ↓
Batch upload
    ↓
Express backend
    ↓
Deduplicate
    ↓
Save canonical transactions
```

---

# 24. Transaction Batch Endpoint

```http
POST /api/v1/transactions/sync
```

Example:

```json
{
  "syncId": "sync_123",
  "transactions": [
    {
      "clientId": "sms_local_101",

      "amount": 650,
      "currency": "INR",

      "direction": "DEBIT",

      "merchantName": "SWIGGY",

      "accountLast4": "3812",

      "paymentMethod": "UPI",

      "occurredAt": "2026-08-29T18:30:00+05:30",

      "balanceAfter": 18331.23,

      "externalReference": "9283818282",

      "sourceType": "SMS",

      "parserConfidence": 0.98
    }
  ]
}
```

Response:

```json
{
  "created": 14,
  "duplicates": 4,
  "needsReview": 2
}
```

---

# 25. Transaction Categorization

Categorization priority:

```text
User override
     ↓
User merchant rule
     ↓
System merchant rule
     ↓
AI categorization
     ↓
Uncategorized
```

---

# 26. Merchant Rules

Examples:

```text
SWIGGY
→ Food & Dining

ZOMATO
→ Food & Dining

UBER
→ Transport

NETFLIX
→ Subscriptions
```

User rules override system rules.

---

# 27. Batched AI Categorization

AI should not classify every individual transaction.

Suppose:

```text
32 new transactions
```

Rules categorize:

```text
25
```

Remaining:

```text
7 transactions
```

Those 7 may represent:

```text
4 unique merchants
```

Only those four merchants are sent to AI.

Example:

```json
[
  {
    "merchant": "ABC MART KOL",
    "sampleAmounts": [
      120,
      350
    ]
  },
  {
    "merchant": "CAFE 17",
    "sampleAmounts": [
      280
    ]
  }
]
```

AI returns structured data:

```json
[
  {
    "merchant": "ABC MART KOL",
    "category": "GROCERIES",
    "confidence": 0.88
  },
  {
    "merchant": "CAFE 17",
    "category": "FOOD_DINING",
    "confidence": 0.94
  }
]
```

Mappings are saved.

Future transactions from those merchants usually require no AI.

---

# 28. User Corrections

Example:

```text
AI:

ABC MART → Shopping

User:

ABC MART → Groceries
```

Backend stores:

```text
user merchant rule
```

From then on:

```text
ABC MART → Groceries
```

The user always outranks AI categorization.

---

# 29. Initial Expense Categories

```text
Food & Dining
Groceries
Transport
Housing
Utilities
Shopping
Subscriptions
Healthcare
Education
Entertainment
Travel
Insurance
Loan / EMI
Investment
Salary
Transfer
Refund
Tax
Fees
Cash Withdrawal
Other
```

---

# 30. Income Model

```ts
IncomeSource {
  id

  householdId
  ownerMemberId?

  type
  name

  expectedAmount

  frequency

  active

  createdAt
}
```

Types:

```text
SALARY
FREELANCE
BUSINESS
RENTAL
INTEREST
DIVIDEND
OTHER
```

Transactions can later validate expected salary/income.

---

# 31. Planned Expense Model

```ts
RecurringExpense {
  id

  householdId

  categoryId

  label

  expectedAmount

  frequency

  essential

  createdAt
}
```

Important distinction:

```text
PLANNED SPENDING
vs
OBSERVED SPENDING
```

---

# 32. Loans

```ts
Loan {
  id

  householdId
  ownerMemberId?

  name
  loanType

  principal

  currentOutstanding

  annualInterestRate

  emiAmount

  startDate?
  endDate?

  remainingTenureMonths?
}
```

Support:

```text
PERSONAL
HOME
VEHICLE
EDUCATION
CREDIT_CARD
OTHER
```

---

# 33. Investments

```ts
InvestmentAccount {
  id
  householdId
  ownerMemberId?
  type
  provider?
}
```

```ts
InvestmentPosition {
  id

  investmentAccountId

  instrumentType

  symbol?

  name

  units?

  investedAmount

  currentValue?
}
```

Types:

```text
MUTUAL_FUND
STOCK
ETF
FD
RD
PPF
EPF
NPS
GOLD
BOND
OTHER
```

---

# 34. Insurance

```ts
InsurancePolicy {
  id

  householdId
  ownerMemberId?

  type

  provider?

  coverAmount

  premiumAmount?

  renewalDate?
}
```

Initial:

```text
HEALTH
TERM_LIFE
VEHICLE
OTHER
```

---

# 35. Goal System

Support:

```text
Goal Templates
+
Custom Goals
```

Initial templates:

```text
Buy Home
Buy Vehicle
Emergency Fund
Marriage
Travel
Education
Retirement
Clear Debt
Build Wealth
```

---

# 36. Goal Schema

```ts
Goal {
  id

  householdId
  ownerMemberId?

  templateType?

  title

  targetAmount?

  targetDate?

  currentFunding?

  priority

  flexibility

  status

  metadataJson?
}
```

Priority:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

Flexibility:

```text
FIXED
DATE_FLEXIBLE
AMOUNT_FLEXIBLE
FULLY_FLEXIBLE
```

---

# 37. Hybrid Onboarding Support

The backend must support progressive onboarding.

```text
Create account
     ↓
Choose financial goals
     ↓
Enter minimum financial information
     ↓
Generate first snapshot
     ↓
Enable SMS sync
     ↓
Observed spending enriches profile
     ↓
AI asks targeted missing questions
```

Profile completeness can be returned as:

```json
{
  "overallCompleteness": 0.68,

  "missing": [
    "emergency_savings",
    "essential_monthly_expenses"
  ]
}
```

---

# 38. Financial Snapshot

Normalized database tables are the source of truth.

Derived financial state becomes:

```ts
FinancialSnapshot {
  id

  householdId

  monthlyIncome

  monthlyEssentialSpend

  monthlyDiscretionarySpend

  monthlyDebtPayments

  monthlySurplus

  savingsRate

  netWorth

  totalDebt

  totalInvestments

  emergencyRunwayMonths

  financialHealthScore?

  generatedAt
}
```

---

# 39. Deterministic Financial Engine

Financial calculations are implemented in TypeScript.

```ts
financialEngine.cashFlow()

financialEngine.calculateEmi()

financialEngine.amortization()

financialEngine.projectSip()

financialEngine.calculateGoalFunding()

financialEngine.calculateEmergencyFund()

financialEngine.netWorth()

financialEngine.evaluateFeasibility()

financialEngine.compareScenarios()

financialEngine.runSimulation()
```

---

# 40. Financial Engine Modules

```text
financial-engine/
├── cashflow.ts
├── emergency-fund.ts
├── emi.ts
├── amortization.ts
├── sip.ts
├── goals.ts
├── net-worth.ts
├── allocation.ts
├── feasibility.ts
├── scenarios.ts
├── simulation.ts
└── tax/
```

---

# 41. Cash Flow

Calculate:

```text
income
-
essential expenses
-
discretionary expenses
-
EMIs
-
mandatory obligations
=
monthly surplus
```

Outputs:

```text
monthly income
monthly spending
fixed obligations
surplus
savings rate
investable capacity
```

---

# 42. Emergency Fund

Inputs:

```text
essential expenses
EMIs
dependents
income stability
existing reserves
```

Outputs:

```text
recommended target
current reserve
runway months
shortfall
estimated completion
```

---

# 43. Loan Engine

Support:

```text
EMI calculation
amortization schedule
total interest
remaining principal
prepayment
tenure comparison
rate changes
refinancing comparison
```

---

# 44. Investment Projection

Support:

```text
SIP
step-up SIP
lump sum
periodic contribution
```

Projection modes:

```text
Conservative
Expected
Optimistic
```

---

# 45. Goal Funding

Calculate:

```text
future goal cost
current funding ratio
required SIP
required lump sum
shortfall
feasibility
```

---

# 46. Scenario Engine

A what-if scenario never modifies the baseline automatically.

```text
Baseline
├── Scenario A
├── Scenario B
└── Scenario C
```

Examples:

```text
Salary becomes ₹80,000

Add ₹10,000 EMI

Increase SIP by ₹5,000

Delay home purchase by 2 years
```

Only:

```text
Apply Scenario
```

changes the baseline.

---

# 47. Plan

```ts
Plan {
  id
  householdId
  status
  currentVersionId
}
```

---

# 48. Plan Versions

```ts
PlanVersion {
  id

  planId

  versionNumber

  financialSnapshotId

  assumptionsJson

  recommendationsJson?

  generatedAt
}
```

Never overwrite historical plans.

---

# 49. Plan Drift

Compare:

```text
actual_state
vs
planned_state
```

Example:

```text
Food budget
₹6,000

Actual recurring spending
₹9,500
```

Backend automatically:

```text
detects change
calculates impact
finds affected goals
generates drift event
```

But does not automatically alter the baseline.

---

# 50. Drift User Actions

Client presents:

```text
Accept new baseline

Keep existing baseline

Review transactions
```

Only:

```text
Accept new baseline
```

creates a new baseline plan version.

---

# 51. Plan Drift Event

```ts
PlanDriftEvent {
  id

  householdId

  type

  severity

  baselineValue

  observedValue

  impactJson

  status

  createdAt
}
```

Status:

```text
OPEN
ACCEPTED
DISMISSED
REVIEWED
```

---

# 52. Audit System

We use:

```text
normal relational state
+
financial snapshots
+
plan versions
+
audit log
```

No full event sourcing.

```ts
AuditEvent {
  id

  householdId

  actorType
  actorId?

  action

  entityType
  entityId

  beforeJson?
  afterJson?

  createdAt
}
```

---

# 53. AI Architecture

Complex AI workflows use LangGraph JS.

```text
                 Supervisor
                     │
      ┌──────────────┼───────────────┐
      │              │               │
      ▼              ▼               ▼
Financial State    Planner        Research
                                     │
                          ┌──────────┼─────────┐
                          ▼          ▼         ▼
                     Investment    Tax       Other
                          │
                          ▼
                         Risk
                          │
                          ▼
                        Critic
```

---

# 54. Supervisor Agent

Responsibilities:

```text
understand user intent
select workflow
select tools
invoke specialist agents
coordinate final response
```

---

# 55. Financial State Agent

Responsibilities:

```text
read financial state
identify missing data
prepare safe AI context
find conflicting information
```

---

# 56. Planner Agent

Responsibilities:

```text
interpret user goals
build possible strategies
call financial tools
compare scenarios
explain recommendations
```

Planner does not perform authoritative financial calculations itself.

---

# 57. Research Agent

Researches current external information.

Examples:

```text
tax changes
RBI rates
SEBI regulations
loan rates
government schemes
current market data
```

---

# 58. Investment Research Agent

Handles:

```text
IPOs
stocks
mutual funds
ETFs
bonds
FDs
market conditions
company information
risk factors
```

---

# 59. Risk Agent

Checks:

```text
emergency liquidity
negative cash flow
debt burden
portfolio concentration
speculative exposure
goal conflicts
```

May reject proposed actions.

---

# 60. Critic Agent

Final verification layer.

Checks:

```text
Was deterministic math used?

Are sources valid?

Are sources fresh?

Are assumptions unsupported?

Does recommendation conflict with risk rules?

Does recommendation conflict with financial state?
```

---

# 61. LLM Provider Abstraction

```ts
interface LLMProvider {
  generate(...)
  stream(...)
  structured(...)
  withTools(...)
}
```

Router:

```text
Primary
→ Custom OpenAI-compatible API

Failure
→ Gemini fallback
```

Fallback triggers:

```text
timeout
provider error
model unavailable
structured output failure
```

---

# 62. Research Architecture

Search-provider abstraction:

```ts
interface SearchProvider {
  search(query, options)
}
```

Initial:

```text
Tavily
```

Future free/free-tier providers can be added.

---

# 63. Research Source Priority

```text
1. Government / regulator
2. Exchange / official filing
3. Official provider
4. Structured financial API
5. Reputable financial/news publication
6. Community data
```

Examples:

```text
SEBI
RBI
Income Tax
NSE
BSE
company filings
```

---

# 64. Evidence

```ts
Evidence {
  id

  topic
  claim

  sourceUrl
  publisher

  sourceType

  publishedAt?
  effectiveAt?
  retrievedAt

  confidence?

  freshnessTtl?
}
```

Research-backed recommendations should maintain evidence references.

---

# 65. Redis + BullMQ

Redis initially runs on the VPS.

Use for:

```text
BullMQ
temporary cache
job state
workflow state
rate limiting if useful
```

Do not use Redis for canonical financial state.

---

# 66. Queues

Initial BullMQ queues:

```text
ai

research

transaction-categorization

simulation

documents

reports

drift

notifications
```

---

# 67. API and Worker

Use the same Docker image.

API:

```bash
node dist/server.js
```

Worker:

```bash
node dist/worker.js
```

---

# 68. SSE

Use SSE for:

```text
AI token streaming
LangGraph progress
research progress
simulation progress
```

Example:

```text
Reading financial state...

Running calculations...

Researching current information...

Running risk checks...

Generating recommendation...
```

Do not add Socket.IO/WebSockets unless required later.

---

# 69. File Storage

Use an abstraction:

```ts
interface ObjectStorage {
  upload(...)
  download(...)
  delete(...)
  getSignedUrl(...)
  exists(...)
}
```

First implementation:

```text
Cloudflare R2
```

PostgreSQL only stores metadata.

---

# 70. Main API Routes

## Auth

```http
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/google
GET    /api/v1/auth/google/callback
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/verify-email

GET    /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/:id
```

## Accounts

```http
GET    /api/v1/accounts
POST   /api/v1/accounts
GET    /api/v1/accounts/:id
PATCH  /api/v1/accounts/:id
DELETE /api/v1/accounts/:id
```

## Transactions

```http
GET    /api/v1/transactions

POST   /api/v1/transactions

POST   /api/v1/transactions/sync

PATCH  /api/v1/transactions/:id

DELETE /api/v1/transactions/:id

POST   /api/v1/transactions/reconcile
```

## Income

```http
GET    /api/v1/income-sources
POST   /api/v1/income-sources
PATCH  /api/v1/income-sources/:id
DELETE /api/v1/income-sources/:id
```

## Expenses

```http
GET    /api/v1/recurring-expenses
POST   /api/v1/recurring-expenses
PATCH  /api/v1/recurring-expenses/:id
DELETE /api/v1/recurring-expenses/:id
```

## Loans

```http
GET    /api/v1/loans
POST   /api/v1/loans
PATCH  /api/v1/loans/:id
DELETE /api/v1/loans/:id

POST   /api/v1/loans/:id/calculate

POST   /api/v1/loans/:id/prepayment-scenario
```

## Goals

```http
GET    /api/v1/goals
POST   /api/v1/goals
PATCH  /api/v1/goals/:id
DELETE /api/v1/goals/:id

GET    /api/v1/goal-templates

POST   /api/v1/goals/:id/recalculate
```

## Financial State

```http
GET /api/v1/financial-state

GET /api/v1/financial-state/completeness

GET /api/v1/financial-state/snapshots
```

## Plans

```http
GET /api/v1/plans/current

POST /api/v1/plans/recalculate

GET /api/v1/plans/history
```

## Scenarios

```http
POST /api/v1/scenarios

GET /api/v1/scenarios

POST /api/v1/scenarios/:id/run

POST /api/v1/scenarios/:id/apply

POST /api/v1/scenarios/compare
```

## Drift

```http
GET /api/v1/drift

POST /api/v1/drift/:id/accept

POST /api/v1/drift/:id/dismiss

POST /api/v1/drift/:id/review
```

## AI

```http
POST /api/v1/planner/chat

POST /api/v1/planner/analyze

GET /api/v1/planner/stream/:runId
```

## Research

```http
POST /api/v1/research

GET /api/v1/research/:id

GET /api/v1/research/:id/evidence
```

---

# 71. Security Requirements

Minimum:

```text
HTTPS

Zod validation

Argon2id

hashed refresh tokens

refresh rotation

session revocation

rate limiting

secure headers

household authorization

signed R2 URLs

no secrets in logs

Redis private network only

audit trail

least-privilege database credentials
```

---

# 72. Testing

## Financial Engine

Golden tests for:

```text
EMI
amortization
SIP
future value
goal funding
cash flow
emergency fund
```

## Transaction System

Test:

```text
SMS batches
reference duplicates
fingerprint duplicates
repeated merchants
refunds
credits
debits
user corrections
```

## Auth

Test:

```text
mobile login
web login
refresh rotation
token reuse
session revocation
Google OAuth
```

## Agents

Test:

```text
incorrect tool selection
missing data
prompt injection
unsupported assumptions
stale research
provider failure
Gemini fallback
risk veto
```

---

# 73. VPS Deployment

```text
VPS
│
├── Traefik
│
├── backend
│    Express
│
├── worker
│    BullMQ
│    LangGraph
│
└── redis
```

External:

```text
Neon
Cloudflare R2
Tavily
Custom AI endpoint
Gemini
```

---

# 74. Docker Compose

Conceptual:

```yaml
services:

  backend:
    build: .
    command: node dist/server.js
    restart: unless-stopped

  worker:
    build: .
    command: node dist/worker.js
    restart: unless-stopped

  redis:
    image: redis:alpine
    restart: unless-stopped
```

Backend and worker use the same source/image.

---

# 75. MVP Backend Scope

The MVP backend includes:

```text
Authentication

Mobile authentication support

Households

Accounts

SMS transaction ingestion

Batch transaction synchronization

Reference duplicate detection

Fingerprint duplicate fallback

Transaction categorization

Merchant learning

AI batch categorization

Income

Expenses

Loans

EMIs

Investments

Insurance basics

Goal templates

Custom goals

Financial snapshots

Cash flow

Emergency fund

SIP calculations

Loan calculations

Goal funding

Net worth

Plan generation

Plan versions

What-if scenarios

Plan drift

User-confirmed baseline updates

LangGraph AI Planner

Custom AI provider

Gemini fallback

Tavily research

Risk Agent

Critic

Redis

BullMQ

SSE

R2 storage

Audit logs
```

---

# 76. Not MVP

Do not initially build:

```text
Microservices

Kubernetes

FastAPI

Python financial service

tRPC

WebSockets

Socket.IO

Full event sourcing

Autonomous investing

Stock trading

Broker execution

Payment execution

Tax filing

Always-running SMS background service

Automatic baseline mutation
```

---

# 77. Implementation Order

## Phase 1 — Infrastructure

```text
starter project

Neon

Drizzle

auth

mobile auth adaptation

Zod

OpenAPI

Docker

Traefik
```

## Phase 2 — Financial Data

```text
household

accounts

transactions

categories

merchant rules

income

expenses

audit
```

## Phase 3 — SMS Backend

```text
transaction batch endpoint

reference deduplication

fingerprint fallback

provenance

categorization

user overrides
```

## Phase 4 — Financial Engine

```text
cash flow

emergency fund

EMI

loan schedule

SIP

net worth

goal funding

feasibility
```

## Phase 5 — Planning

```text
goals

snapshots

baseline plan

plan versions

scenarios
```

## Phase 6 — AI

```text
LLM abstraction

custom AI provider

Gemini fallback

LangGraph

Supervisor

Planner

Risk

Critic
```

## Phase 7 — Research

```text
Tavily

official-source lookup

evidence

investment research

tax research
```

## Phase 8 — Living Plan

```text
plan drift

impact calculations

user confirmation

baseline updates
```

## Phase 9 — Reliability

```text
Redis

BullMQ

workers

retries

SSE

observability
```

---

# 78. Critical MVP Questions the Backend Must Answer

The backend is ready when it can reliably answer:

```text
What is this user's current monthly surplus?

What is their emergency runway?

How much can they safely invest?

How much debt are they carrying?

Can they afford their current goals?

Which goals conflict?

What happens if they take another EMI?

How much SIP is needed for a goal?

What changed in their spending?

Has their real financial behavior drifted from their plan?

What goals are affected by that drift?

What is their safest next financial action?
```

---

# 79. Final Architecture Definition

> **Living Financial Plan Backend is a standalone Express 5 + TypeScript modular monolith backed by Neon PostgreSQL and Drizzle, maintaining a normalized household financial state and canonical transaction ledger. It accepts locally parsed SMS transaction batches from the Expo application, performs deterministic financial calculations, versions plans and scenarios, detects financial drift, uses LangGraph for agent orchestration, Tavily and primary sources for research, Redis/BullMQ for asynchronous workloads, Cloudflare R2 for file storage, and exposes its capabilities through REST + SSE.**

---

# 80. First Engineering Task

Clone:

```text
rest/standalone/drizzle-postgres
```

Then get this chain working before anything else:

```text
User
 ↓
Authentication
 ↓
Household
 ↓
Account
 ↓
Transaction
 ↓
SMS batch sync
 ↓
Deduplication
 ↓
Categorization
 ↓
PostgreSQL
 ↓
Cash-flow calculation
 ↓
Financial snapshot
```

Once that pipeline is reliable:

```text
Goals
→ Plans
→ Scenarios
→ LangGraph
→ Research
→ Drift
```

Do **not** start by building the agents.

The transaction ledger and deterministic financial engine should exist first.

```

This version deliberately leaves the **frontend/mobile UI architecture out** except where the backend needs to define a contract with Expo, particularly SMS sync and mobile authentication.
```
