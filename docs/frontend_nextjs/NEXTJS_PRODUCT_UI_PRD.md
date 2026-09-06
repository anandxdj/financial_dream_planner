---
title: "Financial Dream Planner — Next.js Product and UI PRD"
subtitle: "Try · Plan · Automate"
author: "Product specification"
date: "2026-09-06"
geometry: margin=0.75in
fontsize: 10pt
mainfont: "DejaVu Sans"
monofont: "DejaVu Sans Mono"
colorlinks: true
toc: true
toc-depth: 3
---

# 1. Executive summary

Financial Dream Planner is a calm, India-first financial planning workspace. Its product loop is **Try → Plan → Automate**:

1. **Try:** a visitor gets a real, useful affordability answer before signup.
2. **Plan:** an authenticated user builds a saved financial picture and plan on the web, without Android.
3. **Automate:** an optional Android connection supplies fresher, normalized transaction data from financial SMS.

The web app is not a marketing-only site, a bank portal, or a browser clone of Android. It is a complete planning product with a public acquisition layer, anonymous affordability, authentication continuity, four-step persistent onboarding, a saved plan, overview, accounts, transactions, up to three goals, and essential settings in Release 1. Scenarios, loan analysis, and investment planning follow in Release 2; AI, Android connection, and notifications in Release 3; reports and remaining preferences in Release 4.

The product must never invent a health score. It presents deterministic measures, statuses, assumptions, confidence, freshness, and recommendations with enough explanation for a user to understand what changed and what to do next.

> A financial plan that grows with you.

# 2. Product direction and principles

## 2.1 Promise

Help a person understand where their money stands, decide what is affordable, turn priorities into a plan, and keep that plan current as life changes.

## 2.2 Principles

- Outcome before account: demonstrate value before requiring signup where possible.
- Plan before automation: Android is an optional freshness and capture upgrade, never a Release 1 gate.
- Real state, explicit actions: saved inputs and plan versions are canonical; regeneration and applying changes require an explicit user action.
- Deterministic finance, explainable assistance: the backend owns calculations; AI can explain or draft, but cannot silently mutate financial state.
- Provenance is visible: distinguish confirmed, estimated, manual, Android-derived, and stale data.
- Calm and direct: one primary next action, clear caveats, no anxiety-inducing gamification.
- Progressive disclosure: summary first, assumptions and tables on demand.
- Accessible by default: keyboard, screen reader, reduced motion, contrast, and non-color chart alternatives are release requirements.

## 2.3 Goals

- Convert a visitor through useful anonymous decision support.
- Let a web-only user reach and maintain a first plan.
- Make saved planning inputs, revision state, freshness, and regeneration unambiguous.
- Make desktop genuinely useful for tables, comparisons, plans, and reports.
- Give Android a credible automation role without overstating capabilities.
- Keep privacy, security, and analytics proportionate to sensitive financial data.

## 2.4 Non-goals

The web product is not a brokerage, trading terminal, tax-filing service, bank-account aggregator, lender offer, crypto dashboard, or execution surface. It does not read SMS directly in the browser, fabricate holdings, or promise unsupported imports, push notifications, session lists, or real-time calculations.

# 3. Users and journeys

## 3.1 Visitor

`Landing → Can I afford this? → genuine result → signup → prefilled onboarding`

The visitor can enter a purchase amount, income, obligations, and liquid savings. The result is returned before account creation and contains a backend verdict, surplus, buffer impact, time-to-afford estimate, and Buy now versus Wait comparison. Finance values never appear in URL query parameters or analytics payloads.

## 3.2 New web user

`Signup → four-step onboarding → Review → Generate my plan → saved reveal → Overview`

The user can leave and resume. Unknown optional values remain unknown; estimates are labeled. Autosave is durable and failure preserves edits.

## 3.3 Returning user

`Login → Overview → next action → accounts / transactions / goals / plan`

The user can edit saved planning inputs, inspect freshness, and explicitly choose **Update Plan** or **Regenerate**. The active plan remains visible during generation and after failure.

## 3.4 Android user (Release 3)

`Overview or Settings → Connect Android → same-account login → sync provenance`

The phone detects financial SMS locally, normalizes transactions, and sends canonical data through the backend. The web shows source and last-sync status; it does not read SMS.

# 4. Release scope

## 4.1 Release 1 — anonymous affordability and planning core

### Public and access

- Editorial landing and Try → Plan → Automate narrative (F01).
- Anonymous `/can-i-afford-this` with expiring opaque draft handoff (F02).
- Login, signup, OAuth, verification, password recovery, safe return paths (F03).

### First value

- Four persistent onboarding steps: **Goals; Monthly money; Balances and details; Review** (F04).
- Backend autosave/resume, saving status, retry, revision conflict recovery.
- Explicit **Generate my plan** action and saved first-plan reveal (F05).

### Authenticated essentials

- Responsive shell with Overview, Accounts, Transactions, Goals, Plan, and Settings (F06).
- Overview with one dominant next action; plan date/completeness; surplus, emergency-buffer, goal, projection, obligations, recorded-transaction, and source panels (F07).
- Manual accounts with currency, balance, source, and freshness; unknown is not zero (F08).
- Manual transactions and labeled source/review rows, filters, details, and correct transfer/card-payment semantics (F09).
- At most three active goals, contribution assignment, feasibility, detail view, and fourth-goal rejection (F10).
- Saved immutable plan snapshots, projections, assumptions, unknown/estimated inputs, and explicit Update Plan/regeneration (F11).
- Essential profile, financial details, logout/security, privacy export/deletion (F20).

Release 1 must work without Android. No Release 2 or 3 screen is required for Release 1 acceptance, and unavailable navigation is hidden.

## 4.2 Release 2 — decision tools

- Saved plan history and meaningful drift review, with baseline unchanged until confirmation (F12).
- Bounded scenarios: create, save, compare, and explicitly apply to a new traceable plan version (F13).
- Loan repayment and prepayment analysis; assumptions and fees explicit; not a lender offer (F14).
- Investment planning projections and contributions; ranges and missing values visible; no execution or invented holdings (F15).

## 4.3 Release 3 — intelligence and automation

- AI narrative assistance, attributable sources, structured reviewable proposals, cancellable/reconnectable stream (F16).
- Optional Android connection, QR/download handoff, device/sync status, and provenance (F17).
- Notification center with priority, read state, recovery, and deep links (F18).

## 4.4 Release 4 — reporting and remaining preferences

- Saved-version report previews and recoverable PDF exports (F19).
- Remaining notification preferences, privacy/security polish, and supported settings controls (F20).

## 4.5 F21 applies to every release

Accessibility, responsive behavior, loading/error/offline states, performance, evidence, and release verification apply to every stage (F21). A fixture-only implementation does not meet acceptance; applicable live backend journeys are required.

# 5. Information architecture

Public routes: `/`, `/how-it-works`, `/features`, `/security`, `/can-i-afford-this`.

Auth routes: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`.

Onboarding routes may use one route with step state or `/onboarding/goals`, `/onboarding/monthly-money`, `/onboarding/balances-details`, and `/onboarding/review`; the user must experience exactly four persistent steps, not a fictional generation pipeline. A generating/pending state may be shown only for a real synchronous request.

Release 1 app routes: `/dashboard`, `/dashboard/accounts`, `/dashboard/accounts/[id]`, `/dashboard/transactions`, `/dashboard/transactions/[id]`, `/dashboard/goals`, `/dashboard/goals/[id]`, `/dashboard/plan`, `/dashboard/settings`, `/dashboard/settings/profile`, `/dashboard/settings/financial`, `/dashboard/settings/privacy`, `/dashboard/settings/security`.

Release 2 routes: `/dashboard/plan/history`, `/dashboard/plan/review/[id]`, `/dashboard/scenarios`, `/dashboard/scenarios/new`, `/dashboard/scenarios/[id]`, `/dashboard/loans`, `/dashboard/loans/[id]`, `/dashboard/investments`.

Release 3 routes: `/dashboard/ai`, `/dashboard/settings/data-sources`, `/dashboard/notifications`.

Release 4 routes: `/dashboard/reports`, `/dashboard/reports/[id]`, `/dashboard/settings/notifications` and other preferences only when supported.

# 6. Public experience and anonymous affordability

## 6.1 Landing

The landing page communicates Try → Plan → Automate in one clear narrative. The hero may show an explicitly labeled HTML product example or a laptop watercolor illustration; it must not imply live data or unsupported capability. Primary CTA: **Build my financial plan**. Secondary CTA: **Try “Can I afford this?”**. Android is described as optional automation.

Trust copy explains deterministic calculations, user-controlled changes, source/freshness labels, optional SMS automation, and privacy without unsupported “bank-grade” claims.

## 6.2 Affordability inputs

Required: purchase/goal description, amount, monthly take-home income, recurring monthly obligations, and liquid savings. Optional: target date, existing EMI, and whether savings include emergency money. Keep this to roughly one minute; do not ask for full net worth or detailed transactions anonymously.

`POST /api/v1/affordability` owns validation and calculation. The UI renders the response; it does no finance math. The backend may return a short-lived opaque `draftToken`; sensitive inputs are not persisted indefinitely in localStorage and never encoded in URLs or event properties.

## 6.3 Result and claim handoff

The result contains **Safe**, **Tight**, or **Risky**, estimated monthly surplus, buffer impact, emergency-buffer months where calculable, time-to-afford, one recommendation, and Buy now versus Wait 3 months. It clearly labels estimates and limitations. Signup claims the opaque draft, restores safe high-level inputs into onboarding, and handles an expired reference with a recoverable message; it must not expose finance values in the token or route.

# 7. Authentication and onboarding

## 7.1 Authentication

Use existing `/api/v1/auth/*` and `/api/v1/users/me` contracts through the shared SDK. Support password and Google OAuth, email verification, recovery, rate limits, invalid credentials, network failure, session expiry, and safe return paths. One refresh coordinator owns refresh/retry; no redirect loops. `__Host-` cookies are `Secure`, `HttpOnly`, and appropriate `SameSite`; logout clears the in-memory query cache and local user state.

## 7.2 Four-step onboarding

1. **Goals:** choose intent and up to three goals (emergency fund, home, vehicle, travel, education, marriage, debt, retirement, wealth, custom).
2. **Monthly money:** take-home income, frequency, stability, regular additional income, and recurring obligations.
3. **Balances and details:** savings/bank cash, cash, investments, loans, EMIs, and minimal investment/SIP information.
4. **Review:** compact summary, section edits, unknown/estimated labels, and **Generate my plan**.

Planning data is stored via `GET/PUT /api/v1/households/planning` and goals CRUD. Every save reports `Saving…`, `Saved`, or `Couldn’t save`; failed saves retain edits. A revision conflict offers reload/review rather than overwriting. User-entered goal contributions are preserved; the UI never silently redistributes them.

## 7.3 First plan

`POST /api/v1/households/planning/generate` reuses the existing recalculation path. It is idempotent and revision-checked. Show a real pending state only while the synchronous request is active; do not invent stages, percentages, or calculation SSE. `GET /api/v1/plans/current` returns the saved reveal. On failure, the current plan remains active and the user can retry.

# 8. Authenticated product surfaces

## 8.1 Shell and Overview (F06, F07)

At desktop, use a 248px sidebar, 68px header, max 1440px content, 24px tablet gutters, and 16px phone gutters. Below 1024px use a drawer; restore focus after opening/closing and mark the active route. Navigation exposes only released, usable destinations.

Overview answers: where do I stand, what changed, and what should I do next? It has one dominant recommendation linked to review. It must not show an invented health score. Use explicit measures such as monthly surplus, emergency-buffer coverage, goal feasibility, plan completeness, cash flow, obligations, projection, and data confidence. Planned money and recorded money remain separate. Each panel loads and fails independently; recommendations never mutate state.

## 8.2 Accounts (F08)

`GET/POST /api/v1/accounts` and `GET/PATCH/DELETE /api/v1/accounts/{id}` support manual account list/add/edit/detail. Show account type, display name, INR balance when known, as-of date, source, and freshness. Unknown balances remain unknown. Successful edits refresh affected account, planning-readiness, and overview queries but do not replace saved planning assumptions automatically.

## 8.3 Transactions (F09)

`GET/POST /api/v1/transactions`, `GET/PATCH/DELETE /api/v1/transactions/{id}`, cash-flow, category, and account APIs support manual entry and later Android rows. URL filters are `accountId`, `categoryId`, `direction`, `status`, `startDate`, `endDate`, `cursor`, and `limit`; do not invent unsupported search or amount/date editing after creation. Show source and review status. Refresh recorded views only after a mutation.

Transfers are not spending twice: a self-transfer moves balances and is excluded from spending; a credit-card bill payment settles liability and cash without double-counting the purchase.

## 8.4 Goals (F10)

Goals CRUD and `/feasibility` support no more than three active goals; the backend rejects a fourth and over-allocation. List cards show name, target, date, progress, contribution, and on-track/at-risk status. Detail uses a desktop 65/35 projection-and-context layout. Editing a goal does not update a plan automatically; the user chooses **Update Plan**. Scenario controls arrive in Release 2.

## 8.5 Plan (F11)

`GET /api/v1/plans/current`, planning input GET/PUT, and generation POST support an immutable saved version over independently revised planning inputs. Show version, updated time, status, roadmap, projections, assumptions, missing/estimated fields, risks, and recommendations. Charts include a textual summary and expandable table. **Regenerate/Update Plan** is always explicit; stale-data warnings offer update information or continue. Keep the old version during regeneration and on failure.

## 8.6 Settings essentials (F20)

Release 1 includes profile, supported financial details, logout/password/security actions, privacy explanation, data export, and financial-data/account deletion. Destructive actions explain consequences and require confirmation. Do not claim unsupported active-session lists or controls. Release 4 adds remaining preferences, including notification choices.

# 9. Release 2 decision tools

F12 compares saved versions and shows meaningful drift traced to input/version IDs. Baseline stays unchanged until the user accepts; restore creates a new version. F13 compares bounded scenarios without baseline mutation; applying is explicit and creates a traceable plan version, with duplicate/conflict recovery. F14 delegates repayment and prepayment math to the financial engine and exposes assumptions, fees, payoff date, interest saved, buffer impact, and goal impact; it is not a lender offer. F15 provides planning projections, contribution assumptions, broad allocation and goal linkage; no trading, order book, invented holdings, or execution language.

# 10. Release 3 intelligence and automation

## 10.1 AI (F16)

The AI page is a chat workspace with current plan version, financial picture, surplus, goals, loans, and source context. Responses use structured reviewable cards for recommendations, risks, scenarios, research, plan changes, goal drafts, and actions. Credentialed SSE may stream, cancel, reconnect, and preserve partial output. Source attribution is required. Any mutation requires an explicit reviewed **Apply/Confirm** action.

## 10.2 Android connection (F17)

Android is optional. The device locally detects financial SMS, normalizes transactions, and syncs through existing ingestion/sync/device contracts. The web offers QR/download handoff and shows connected/disconnected state, device, last sync, record counts, and review counts. The web never reads SMS. A stale sync is visible; all Release 1 journeys remain usable without Android.

## 10.3 Notifications (F18)

The center uses Info, Important, and Action required priorities, read states, recovery on stream failure, and deep links. It may signal plan review, stale balances, unresolved transaction conflicts, EMI timing, goal risk, or a ready monthly review. Analytics never includes sensitive finance values; hide navigation until its supported API is integrated.

# 11. Release 4 reports and preferences

F19 previews and exports reports for an immutable selected saved version. Backend report/export APIs own canonical content; export failures are recoverable and no fictional completed jobs are shown. A report may include summary, snapshot, cash flow, assets/liabilities, goals, plan, projection, roadmap, loans, risks, recommendations, assumptions, sources, and generated date. F20 completes supported notification preferences, privacy, and security settings.

# 12. Visual system and responsive design

## 12.1 Brand

Light-only. Canvas cream `#FFF9F0`; surfaces `#FFFCF8`; navy for primary text and structure; purple `#6C63D6` for primary interactive emphasis; sage for positive/confirmed; blue for informational states; gold for caution; red only for destructive/critical errors. Use visible outlines and restrained elevation. Avoid gradients, neon trading aesthetics, repeated nested cards, and equal-weight KPI grids.

Typography is **DM Serif Display** for editorial display moments and **Manrope** for UI, body, labels, and numbers. Use tabular numerals for aligned money. Preserve readable hierarchy and do not rely on the serif face for dense controls.

## 12.2 Layout

Target widths: 360, 768, 1024, and 1440px. There must be no horizontal page overflow at any target. At 1440 use the full planning workspace; at 1024 collapse the sidebar to a drawer; at 768 stack comparison layouts while keeping tables usable; at 360 prioritize one primary action, readable cards, and progressive detail. Charts must remain interpretable and complex desktop comparisons become a sequenced mobile flow.

## 12.3 States

Every applicable screen supports loading, populated, empty with a next action, partial error with retry, stale/refetch while retaining populated content, and offline read state. Forms support validation, saving, saved, failed save retaining edits, and recoverable revision conflict. Unknown and estimated values are labeled explicitly. Do not blank unrelated panels when one API fails.

# 13. Architecture and API boundary

## 13.1 Ownership

Next.js App Router owns route composition, presentation, accessibility, and interaction state. Express owns authentication, authorization, validation, financial calculations, AI orchestration, persistence, revisions, and plan snapshots. The web has no database access and no canonical finance engine in components, route handlers, Server Actions, or browser utilities.

Generated shared SDK is the only typed client boundary to the backend. Feature service wrappers and TanStack Query hooks sit above it; generated SDK files are never hand-edited. A same-origin Next.js reverse proxy forwards `/api/v1/*` to the configured Express origin, keeping browser cookies and CSRF behavior same-origin. The proxy must preserve method, body, status, relevant headers, request IDs, and streaming responses; it must not log financial bodies.

## 13.2 Auth, CSRF, and transport

- Use `__Host-` secure, HttpOnly cookies; do not place tokens in localStorage.
- For state-changing requests, obtain/hold the backend CSRF token and send the agreed CSRF header; the SDK transport centralizes this behavior.
- Same-origin proxy and strict origin checks prevent cross-site request confusion; never disable CSRF because a request came from a Next route.
- One refresh coordinator retries an eligible request once, queues concurrent refreshes, clears memory-only cache on logout, and routes irrecoverable expiry to login safely.
- Abort superseded queries/mutations. Redact authorization, cookies, CSRF, and financial bodies from client/server logs.

## 13.3 API requirements

All endpoints return typed DTOs with stable error envelopes, request/correlation IDs, and explicit nullable/unknown fields. Mutations that can be retried accept idempotency keys. Revision-aware writes return conflict details rather than overwriting. Planning and plan endpoints distinguish input revision IDs from immutable plan version IDs. Pagination uses cursor/limit where supported. API contracts must document auth, CSRF, validation, empty, stale, and failure behavior.

Required Release 1 contracts include `/affordability`, `/planning/drafts`, `/auth/*`, `/users/me`, `/households/planning`, `/households/planning/generate`, `/plans/current`, accounts, transactions, cash-flow, categories, and goals/feasibility. Later APIs are introduced only with their release and integration evidence.

## 13.4 Numeric and financial representation

The API represents decimal money, rates, and calculated quantities as strings, never JavaScript binary floating-point numbers. The UI parses only for display and sends strings back unchanged; calculation remains backend-owned. Currency defaults to `INR`, locale `en-IN`, and dates use explicit ISO values in transport. Display uses `Intl.NumberFormat` and sensible lakh/crore labels such as `INR 18,400`, `INR 6.5 L`, and `INR 1.2 Cr`; never hand-written comma logic. Unknown is distinct from zero.

# 14. Frontend structure and data behavior

Recommended structure:

```text
frontend/src/
  app/                 # routes and composition
  features/            # marketing, affordability, onboarding, overview,
                       # accounts, transactions, goals, plan, scenarios,
                       # loans, investments, ai, Android, notifications, settings
  components/ui/       # reusable controls and state patterns
  components/layout/   # shell, sidebar, header
  lib/                 # SDK transport, proxy-safe utilities, formatting
  hooks/               # cross-feature hooks only
```

Use Server Components for static/public composition where useful. Use Client Components for forms, TanStack Query consumers, charts, interactive tables, and streams. Pages compose feature components; business logic remains in feature services/hooks. Avoid a giant global store and deep imports across feature internals.

TanStack Query owns server state. Use feature-specific keys and targeted invalidation: transaction edits refresh transaction views and affected summaries; account edits refresh account and relevant readiness; goal edits refresh goal and plan readiness; accepted scenario refreshes current plan, history, and overview. Retain populated data during background refetch. Optimistic updates are limited to reversible metadata/read state, not plan application, financial results, deletion, or drift acceptance.

# 15. Accessibility, privacy, and analytics

## 15.1 Accessibility (F21)

Core workflows are keyboard complete with visible focus, logical headings, associated errors, restored dialog/sheet focus, semantic table headers, labelled icon buttons, adequate contrast, and no color-only meaning. Chart summaries and expandable data tables convey the same information non-visually. Live regions announce save, generation, errors, and important status changes; toasts supplement but do not replace confirmation. Respect `prefers-reduced-motion` and avoid auto-advancing content.

## 15.2 Privacy and trust

Collect only data needed for the product. Explain data source and freshness at the point of use. Anonymous drafts expire and are opaque. Do not put entered finance data in URLs, analytics, logs, error reports, or notification metadata. Make export and deletion understandable, authenticated, confirmed, and recoverable where the backend supports recovery. Android SMS processing is local to Android before normalized sync; the browser never reads raw SMS. AI sources and uncertainty are visible.

## 15.3 Analytics

Use minimal product analytics, not surveillance-style clickstream. Events may include `landing_viewed`, `affordability_started`, `affordability_completed`, `signup_completed`, `onboarding_step_completed`, `onboarding_completed`, `first_plan_generated`, `first_plan_viewed`, `overview_viewed`, `transaction_added`, `transaction_reviewed`, `goal_created`, `plan_regenerated`, `plan_change_accepted`, `scenario_created`, `scenario_applied`, `ai_prompt_sent`, `android_connection_started`, `android_connected`, `notification_opened`, and `report_exported`.

Event payloads contain event name, coarse route/context, release, and non-sensitive aggregate identifiers only. Never include amount, income, balance, merchant, goal text, account, transaction, token, email, raw prompt, financial dates, or full URL query strings. Respect consent and deletion requests; document retention and access. Funnel reporting should measure anonymous result completion, signup continuity, onboarding completion, first-plan reveal, return usage, and Android connection without optimizing only for signup count.

# 16. Acceptance and verification

## 16.1 Feature acceptance

Every feature must have live supported routes, typed SDK calls, targeted query invalidation, responsive layout at all four target widths, loading/empty/error/stale/offline states, validation and save recovery where applicable, keyboard/focus semantics, appropriate tests, accurate copy, and explicit confirmation for financial mutations. A fixture-only screen is insufficient.

## 16.2 Release 1 acceptance

- Visitor receives a genuine affordability result before signup; opaque claim survives auth or reports an actionable expired state.
- Signup, refresh, OAuth, recovery, logout, CSRF, and reverse-proxy flows work without loops.
- Four onboarding steps persist, resume, preserve failed edits, distinguish unknown/estimated values, and allow review.
- A user explicitly generates a saved first plan; idempotency/revision checks hold; failure preserves the active plan.
- Overview, Accounts, Transactions, Goals (max three), Plan, and essential Settings are usable without Android.
- Overview has no invented health score; planned and recorded money are distinct; source/freshness is visible.
- No finance values leak into URLs, analytics, or logs; decimal API values remain strings and INR formatting is correct.

## 16.3 Later release acceptance

F12–F15 require traceable scenario/version behavior and no baseline mutation by comparison. F16–F18 require source attribution, stream recovery, explicit AI confirmation, Android provenance, and notification deep links. F19–F20 require selected-version-correct reports, recoverable export failures, and only supported preferences.

## 16.4 F21 release gate for every stage

At 360/768/1024/1440px: no overflow, keyboard and focus pass, announcements work, reduced motion works, charts have alternatives, and error/offline states are reviewable. Run lint, TypeScript, production build, SDK contract checks, frontend tests, and relevant backend integration/unit tests. Capture evidence from live backend journeys for the release scope. Verify performance, cache/refetch behavior, redacted telemetry, and no unsupported claims.

# 17. Module index and traceability

The master PRD cross-checks every current module:

| Module | Release | Covered by |
| --- | --- | --- |
| F00 Foundation | Foundation | §12–§14, §16.4 |
| F01 Marketing | R1 | §4.1, §6.1 |
| F02 Anonymous affordability | R1 | §3.1, §4.1, §6 |
| F03 Authentication continuity | R1 | §4.1, §7.1, §13.2 |
| F04 Progressive onboarding | R1 | §3.2, §4.1, §7.2 |
| F05 First plan | R1 | §4.1, §7.3, §16.2 |
| F06 App shell | R1 | §4.1, §8.1, §12.2 |
| F07 Overview | R1 | §4.1, §8.1 |
| F08 Accounts | R1 | §4.1, §8.2 |
| F09 Transactions | R1 | §4.1, §8.3 |
| F10 Goals | R1 | §4.1, §8.4 |
| F11 Plan | R1 | §4.1, §8.5 |
| F12 Plan history and drift | R2 | §4.2, §9, §16.3 |
| F13 Scenarios | R2 | §4.2, §9, §16.3 |
| F14 Loans | R2 | §4.2, §9 |
| F15 Investments | R2 | §4.2, §9 |
| F16 AI assistance | R3 | §4.3, §10.1 |
| F17 Android connection | R3 | §3.4, §4.3, §10.2 |
| F18 Notifications | R3 | §4.3, §10.3 |
| F19 Reports | R4 | §4.4, §11 |
| F20 Settings, privacy, security | R1 essentials / R4 preferences | §4.1, §4.4, §8.6, §11 |
| F21 Accessibility, performance, release | Every stage | §4.5, §15.1, §16.4 |

## 17.1 Delivery order

Build vertically: F00–F07 establish anonymous-to-first-plan value; F08–F11 complete the Release 1 planning core; F12–F15 add Release 2 decision tools; F16–F18 add Release 3 intelligence/automation; F19–F20 finish Release 4 reporting/preferences. Apply F21 checkpoints continuously, not as a final visual pass.

# 18. Final product model

```text
PUBLIC WEB              → trust and useful Try experience
ANONYMOUS AFFORDABILITY → decision support before signup
WEB PLANNER             → saved inputs, plan, goals, and explicit updates
ANDROID AUTOMATION     → optional fresher transaction reality
```

Externally: **Try it. Plan it. Keep it alive.** Internally: one canonical backend financial state, immutable plan versions, user-controlled changes, and a frontend that makes uncertainty and provenance clear.
