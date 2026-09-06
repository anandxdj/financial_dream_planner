# Financial Dream Planner — Frontend Screen Architecture & Realignment Audit

> **Status:** Authoritative Screen Architecture & File Audit  
> **Working Branch:** `main-2`  
> **Companion Document:** `FRONTEND_DESIGN_SYSTEM.md`  
> **Source Plan Reference:** `FRONTEND_REALIGNMENT_PLAN.md`

---

## 1. Executive Summary & Architectural Core

This document establishes the authoritative screen-by-screen architecture, user journeys, state contracts, and complete source file audit for the **Financial Dream Planner** web application realignment.

### 1.1 The Product Loop: Try → Plan → Automate
```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. TRY (Public Decision Support)                                        │
│    "Can I afford this?" ──► Genuine verdict before signup               │
│    Expiring opaque draft preserves entered numbers into onboarding       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Signup / Claim Draft)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. PLAN (Core Planning Workspace — Release 1)                          │
│    Four-step persistent onboarding ──► Explicit First Plan generation    │
│    Financial Command Center (Overview) ──► Goals (Max 3) ──► Plan      │
│    Canonical Express backend owns calculations, revision checks, states │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Optional Freshness Layer)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. AUTOMATE (Living Reality & Decision Tools — Release 2 & 3)           │
│    Observed transactions & balances ──► Material drift alerts            │
│    Scenarios (F13), Loans (F14), Investments (F15)                      │
│    Android financial SMS sync (R3) ──► Transparent provenance           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Architectural Invariants
1. **Separation of Concerns**:
   - **Express Backend**: Owns financial rules, inflation adjustments, compounding, feasibility calculations, plan snapshot generation, drift detection, and persistence.
   - **Generated OpenAPI TypeScript SDK**: The single, immutable typed boundary between client and server.
   - **TanStack Query**: Owns server state caching, background revalidation, and targeted invalidations.
   - **Next.js App Router**: Owns route composition, presentation, layout adaptability, and local accessibility state.
2. **Explicit Mutations**: Financial plans and baseline snapshots are immutable. Adding accounts, modifying goals, or logging transactions never silently recalculates an active plan. A plan update occurs only when the user triggers an explicit **"Update Plan"** action.
3. **Draft Preservation Without Data Leakage**: Sensitive financial inputs from anonymous affordability checks are stored via an opaque, short-lived server token (`POST /api/v1/planning/drafts`). Financial amounts are never encoded in URL query parameters, browser history, or analytics payloads.

---

## 2. Six Canonical Screens Architecture

The following six screens constitute the core planning experience. Each is defined by its specific goal, the user question it answers, its information hierarchy, available actions, responsive behavior, and six required operational states.

---

### Screen 1 — Landing Page (`/`)

#### 1. Goal & Purpose
Introduce Financial Dream Planner with calm editorial authority. Explain the product value in human terms (*"Can I afford the life I'm planning?"*) rather than backend jargon. Lead prospective users into either immediate decision support (`/can-i-afford-this`) or guided plan creation (`/onboarding`).

#### 2. Primary User Question
> *"What is this product, how does it help me make life decisions, and why should I trust it?"*

#### 3. Information Hierarchy & Wireframe
```text
┌──────────────────────────────────────────────────────────────────────────┐
│ [Logo] Financial Dream Planner              [Sign In] [Build My Plan]    │
├──────────────────────────────────────────────────────────────────────────┤
│ HERO SECTION (60/40 Editorial Grid)                                      │
│   Headline: "Can I afford the life I'm planning?"                        │
│   Subhead: See how a new car, home, trip, or loan affects your future    │
│            savings and goals — before you commit.                        │
│   Primary CTA: [ Build my financial plan ]                               │
│   Secondary CTA: [ Try "Can I afford this?" ]                            │
│   Trust Badges: 100% Deterministic Math · Zero Fake Scores · Private     │
│   Right Visual: Character illustration (woman_with_laptop.png) +         │
│                 Interactive Trade-off preview card                       │
├──────────────────────────────────────────────────────────────────────────┤
│ THREE DISCIPLINES (Try · Plan · Automate)                                │
│   [ 1. Try ] Test life decisions before signing up                       │
│   [ 2. Plan ] Connect your income, loans, and goals into a roadmap       │
│   [ 3. Automate ] Notice drift when real spending changes (Android SMS)   │
├──────────────────────────────────────────────────────────────────────────┤
│ GOALS & TRADE-OFFS SHOWCASE                                              │
│   Three connected cards: First Home Down Payment, Europe Trip, Car Loan  │
│   Demonstrates dynamic interaction: "Trip delays Home by 2 months"       │
├──────────────────────────────────────────────────────────────────────────┤
│ TRUST & PRIVACY FOUNDATION                                               │
│   Clear guarantees: Deterministic calculations, no marketing loans,      │
│   exportable & deletable data, zero credential scraping.                 │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 4. Actions
- **Primary CTA**: `Build my financial plan` → navigates to `/onboarding`.
- **Secondary CTA**: `Try "Can I afford this?"` → navigates to `/can-i-afford-this`.
- **Header Actions**: `Sign in` → `/login`, `Get Started` → `/onboarding`.

#### 5. Desktop vs. Mobile Behavior
- **Desktop (1024px–1440px)**: 60/40 split hero section with editorial typography; 3-column feature grid; interactive side-by-side trade-off preview.
- **Mobile (360px–768px)**: Single-column linear flow; hero visual stacks below primary CTAs; cards stack vertically with 16px touch gutters; 44px min touch targets for all links.

#### 6. States
- **Loading**: Static Server Component; instant initial render.
- **Populated**: High-contrast typography, crisp borders, warm `#FFF9F0` parchment canvas.
- **Empty / Error / Stale**: Not applicable (public static page with client-side interactive sandbox).

---

### Screen 2 — Can I Afford This? (`/can-i-afford-this`, `/affordability`)

#### 1. Goal & Purpose
Deliver genuine, immediate decision support before requiring account creation. Test whether a prospective purchase or commitment fits within the user's cash flow and emergency reserves without collecting full net worth.

#### 2. Primary User Question
> *"Can I afford to spend ₹X on this right now without compromising my emergency safety net?"*

#### 3. Information Hierarchy & Wireframe
```text
┌──────────────────────────────────────────────────────────────────────────┐
│ [Back] Financial Dream Planner                                           │
├──────────────────────────────────────────────────────────────────────────┤
│ Header: "Can I afford this?"                                             │
│ Subhead: See what a purchase means for your monthly money and emergency  │
│          buffer. No account needed.                                      │
├─────────────────────────────────────┬────────────────────────────────────┤
│ LEFT: PURCHASE & CASH FLOW INPUTS   │ RIGHT: THE VERDICT & TRADE-OFFS    │
│   1. Purchase amount (INR)          │   Verdict Banner:                  │
│   2. Monthly take-home income (INR) │   [ Looks Manageable | Buffer Tight│
│   3. Total monthly expenses (INR)   │     | Would Stretch Finances ]     │
│   4. Liquid savings (INR, optional) │   Explanation Paragraph            │
│   5. Target purchase date (optional)│   Key Metrics:                     │
│                                     │     - Monthly surplus: ₹14,400     │
│   [ Check Affordability Button ]    │     - Buffer impact: -₹1,50,000    │
│                                     │     - Time to afford: 3 months     │
│                                     │   Comparison:                      │
│                                     │     [ Buy Now ] vs [ Wait 3 Months]│
│                                     │   Carry-Forward Action:            │
│                                     │   [ Build my plan with these ]     │
└─────────────────────────────────────┴────────────────────────────────────┘
```

#### 4. Actions
- **Primary Form Action**: `Check affordability` → invokes `POST /api/v1/affordability`.
- **Claim & Transition Action**: `Build my plan with these inputs` → calls `POST /api/v1/planning/drafts` to generate an opaque `draftToken`, preserves it in local storage, and redirects to `/register?next=/onboarding`.
- **Secondary Actions**: `Sign in` link (for returning users who want to merge inputs into existing profile).

#### 5. Desktop vs. Mobile Behavior
- **Desktop (1024px–1440px)**: 2-column layout (50/50 split). Inputs on the left, instant verdict and trade-off comparison on the right with sticky alignment.
- **Mobile (360px–768px)**: Sequenced 2-stage flow: user fills inputs, taps button, page smoothly scrolls to verdict card below. Number inputs use `inputMode="decimal"` and 16px text size to prevent viewport zooming.

#### 6. States
- **Initial / Empty**: Right panel displays an inviting preview: *"Enter your purchase details on the left to see your personalized surplus and buffer analysis."*
- **Loading**: Primary button disabled with `Checking…` state; subtle skeleton over verdict card.
- **Populated**: Verdict badge (Safe/Tight/Risky), plain English explanation, side-by-side Buy Now vs Wait comparison.
- **Partial Error**: Inline alert on the form: *"Please provide valid positive numbers for purchase and monthly income."* Unsaved inputs are preserved.
- **Draft Claim Error**: If draft token creation fails, an inline alert offers *"Retry preserving inputs"* without losing entered data.

---

### Screen 3 — Progressive Onboarding (`/onboarding`)

#### 1. Goal & Purpose
Guide the user through constructing their foundational financial model in exactly four focused steps. Collect goals, monthly cash flow, and balance information without feeling like an administrative tax form. Support continuous autosave and resumption.

#### 2. Primary User Question
> *"What does my complete financial baseline look like today, and what are my primary goals?"*

#### 3. Information Hierarchy & Wireframe
```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Build your financial plan                         Autosave: [ Saved ✓ ] │
│ Progress: [ 1. Goals ] ──► [ 2. Monthly ] ──► [ 3. Balances ] ──► [ 4. ] │
├──────────────────────────────────────────────────────────────────────────┤
│ STEP CONTAINER                                                           │
│                                                                          │
│ Step 1: Goals                                                            │
│   Select up to 3 goals (Emergency Fund, Home, Car, Travel, Education...) │
│   Set Target Amount, Target Date, Current Savings, and Monthly SIP       │
│                                                                          │
│ Step 2: Monthly Money                                                    │
│   Take-home Income, Essential Expenses, Flexible Spending, EMIs          │
│   Inline checkbox: [ ] Mark as estimated                                 │
│                                                                          │
│ Step 3: Balances & Details                                               │
│   Liquid Savings / Bank Cash, Income Stability (Stable/Variable)         │
│   Optional Disclosures: Loans (Principal, Rate) · Investments (SIP, Lump)│
│                                                                          │
│ Step 4: Review & Generate                                                │
│   Clean summary of all inputs with "(estimated)" tags where flagged      │
│   Explicit missing values clearly marked as "Not provided"               │
│   Prominent Primary CTA: [ Generate my plan ]                            │
├──────────────────────────────────────────────────────────────────────────┤
│ Navigation: [ < Back ]                                    [ Continue > ] │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 4. Actions
- **Navigation Actions**: `Continue` (advances step), `Back` (retreats step), step pill clicks.
- **Autosave Engine**: 700ms debounced `PUT /api/v1/households/planning` with `expectedRevision`.
- **Generation CTA (Step 4)**: `Generate my plan` → invokes `POST /api/v1/households/planning/generate` with an `Idempotency-Key` header, invalidates plan queries, and routes to `/dashboard/plan?welcome=1`.
- **Draft Claim (on mount)**: Checks for anonymous draft token from `/can-i-afford-this`, claims it via `POST /api/v1/households/planning/drafts/claim`, and populates Step 2 & 3 automatically.

#### 5. Desktop vs. Mobile Behavior
- **Desktop (1024px–1440px)**: 4-step horizontal stepper bar; 2-column input grids for monthly cash flow; collapsible accordion disclosures for optional loans and investments.
- **Mobile (360px–768px)**: 2x2 stepper grid; stacked single-column inputs; sticky bottom navigation bar with `Back` and `Continue` buttons (44px min height).

#### 6. States
- **Loading**: Initial load renders skeleton matching current step form layout.
- **Saving**: Status indicator shows `Saving…` with subtle pulse.
- **Saved**: Status indicator transitions to `Saved ✓` in Sage Green.
- **Failed Save**: Status indicator displays `Couldn’t save. Your edits are still here.` Retry control appears; user edits are never discarded.
- **Revision Conflict (409)**: Alert displays: *"Your inputs were updated in another session. [Reload saved inputs] or [Review conflict]."*
- **Generating**: Button transitions to `Generating your plan…` with spinner; step controls disabled to prevent race conditions.

---

### Screen 4 — Overview / Financial Command Center (`/dashboard`)

#### 1. Goal & Purpose
Act as the central command center for the user's financial life. Answer where the user stands, what has changed, and what decision requires attention next. Completely avoid the generic KPI-grid trap.

#### 2. Primary User Question
> *"Where do I stand financially today, what changed recently, and what is my single most important next action?"*

#### 3. Information Hierarchy & Wireframe
```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Good afternoon, Anand                   Plan v2 · Generated Sep 4, 2026 │
├──────────────────────────────────────────────────────────────────────────┤
│ DOMINANT NEXT ACTION BANNER (Dynamic Context)                            │
│   Headline: "Your Car Goal Looks Tight"                                  │
│   Body: Recent fuel price inflation and SIP adjustments suggest reviewing│
│         your timeline. You can adjust monthly savings or push by 2 mos. │
│   Action: [ Review Goal Impact ]                                         │
├─────────────────────────────────────┬────────────────────────────────────┤
│ CURRENT MONTHLY REALITY             │ FINANCIAL TIMELINE & ROADMAP       │
│   Monthly Income:  ₹1,20,000        │   Today ──── Emergency ──► House   │
│   Planned Outflows: ₹82,000         │   Oct 2026   Dec 2026     Jun 2029 │
│   Free Capacity:    ₹38,000         │                                    │
│   Emergency Runway: 4.5 months      │   [ View Full Projection Chart ]   │
├─────────────────────────────────────┴────────────────────────────────────┤
│ ACTIVE GOALS SUMMARY (Max 3)                                             │
│   1. Emergency Fund:  ₹3,00,000 (100% funded)        [ Complete ✓ ]      │
│   2. House Downpay:   ₹28,00,000 (₹45,500/mo SIP)    [ On Track ]        │
│   3. Europe Vacation: ₹3,50,000 (₹15,000/mo SIP)     [ Review Needed ]   │
├─────────────────────────────────────┬────────────────────────────────────┤
│ MONEY REALITY (Recorded vs Planned) │ DATA PROVENANCE & FRESHNESS        │
│   Planned: ₹1,20,000 in / ₹82,000 out│   2 Manual Accounts (Fresh)       │
│   Recorded: ₹34,200 out (5 txns)    │   Optional Android: Not connected  │
│   [ View Transactions Ledger ]      │   [ Connect Android SMS ]          │
└─────────────────────────────────────┴────────────────────────────────────┘
```

#### 4. Actions
- **Dominant Action**: Deep-links directly to the most critical decision (e.g. `/dashboard/goals`, `/dashboard/plan`, or `/onboarding`).
- **Secondary Actions**: Quick links to `View Transactions Ledger`, `Review Goal`, `Update Plan`.

#### 5. Desktop vs. Mobile Behavior
- **Desktop (1024px–1440px)**: 248px persistent sidebar docked; top dominant action banner; asymmetric 60/40 visual balance between monthly cash flow and timeline projection.
- **Mobile (360px–768px)**: Hamburger drawer navigation with focus trap; banner stacks first; timeline collapses into an accessible horizontal milestone stepper; card gutters reduce to 16px.

#### 6. States
- **Loading**: Independent panel skeletons; dominant banner skeleton renders first.
- **Populated**: Balanced hierarchy with clear separation between *planned* money and *recorded* money.
- **Empty (No Plan Generated)**: Prominent banner: *"You have not created your first plan yet. [Build my plan]"*.
- **Partial Error**: If recorded transactions fail to fetch, the transactions card shows an isolated retry notice; cash flow and goals remain fully functional.
- **Stale Plan**: If underlying inputs or accounts changed since last plan snapshot, an amber banner appears: *"Your plan needs updating — recent changes to income or accounts may have affected your trajectory. [Review and update]"*.

---

### Screen 5 — Goal Detail (`/dashboard/goals/[id]`)

#### 1. Goal & Purpose
Provide deep, interactive planning analysis for an individual life goal. Transform goal management from sterile database CRUD into an exploratory trade-off tool showing timeline projections, required SIPs, inflation impacts, and goal interactions.

#### 2. Primary User Question
> *"When will I reach this goal at my current contribution, and what happens if I change my monthly savings?"*

#### 3. Information Hierarchy & Wireframe
```text
┌──────────────────────────────────────────────────────────────────────────┐
│ [ < Back to Goals ]   FIRST HOME DOWN PAYMENT           [ Update Plan ] │
│ Target: ₹28,00,000 · Target Date: Dec 2027 · Housing Goal                │
├─────────────────────────────────────┬────────────────────────────────────┤
│ LEFT (65%): PLANNING & PROJECTION   │ RIGHT (35%): CONTRIBUTION & ACTIONS│
│                                     │                                    │
│ Progress Bar:                       │ Your Chosen Monthly Contribution:  │
│ Saved: ₹7,50,000 ─────── Target: ₹28L│ ₹45,500 / month                    │
│ [█████████░░░░░░░░░░░░░░░░░] 26.8%  │                                    │
│                                     │ Engine Feasibility Verdict:        │
│ Funding Trajectory:                 │ Required SIP: ₹42,800 / month      │
│ - At ₹45,500/mo: Complete Oct 2027  │ Status: [ Within Capacity ✓ ]      │
│   (2 months ahead of target date)   │                                    │
│ - If reduced to ₹35,000/mo:         │ Impact on Other Goals:             │
│   Completion delayed to May 2028    │ Europe Trip delayed by 1 month     │
│                                     │                                    │
│ Inflation Impact Analysis:          │ [ Edit Goal Parameters ]           │
│ Today's money: ₹28,00,000           │ [ Remove Goal ]                    │
│ Future inflated cost: ₹30,85,000    │                                    │
│ Assumed inflation: 6.0% p.a.        │                                    │
└─────────────────────────────────────┴────────────────────────────────────┘
```

#### 4. Actions
- **Primary Action**: `Update Plan` (navigates to `/dashboard/plan` to incorporate new goal parameters into the official snapshot).
- **Edit Goal**: Opens inline form to modify target amount, target date, or monthly contribution.
- **Delete Goal**: Opens accessible double-confirmation modal (`Keep Goal` vs `Confirm Removal`).
- **Feasibility Evaluation**: Backed by `GET /api/v1/goals/feasibility`.

#### 5. Desktop vs. Mobile Behavior
- **Desktop (1024px–1440px)**: 65/35 asymmetrical split. Visual timeline and inflation analysis on the left; contribution controls and feasibility verdict on the right.
- **Mobile (360px–768px)**: Single column stack: Goal title & progress bar first, feasibility verdict second, interactive trade-off breakdown third, edit/delete actions at the bottom.

#### 6. States
- **Loading**: Skeleton layout for progress bar and metrics.
- **Populated**: Rich timeline milestones with tabular currency formatting.
- **Empty / Not Found**: Friendly alert: *"This goal is no longer active or could not be found. [View active goals]"*.
- **Over-Allocated**: Warning banner: *"Your chosen monthly contribution of ₹45,500 exceeds your available surplus (₹38,000). Adjust this goal or your monthly expenses."*
- **Partial Error**: Feasibility recalculation error shows an isolated retry button without hiding saved goal numbers.

---

### Screen 6 — Plan Workspace (`/dashboard/plan`)

#### 1. Goal & Purpose
The definitive source of financial truth for the household. Tells a coherent, comprehensive narrative of the user's financial trajectory, connecting assets, cash flows, inflation assumptions, and goal milestones into an immutable, versioned roadmap.

#### 2. Primary User Question
> *"What is my complete long-term financial roadmap, what assumptions is it built on, and is my current plan version up to date?"*

#### 3. Information Hierarchy & Wireframe
```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Plan Version 2 (Active)                 Generated: Sep 4, 2026, 11:30 AM │
│ [ Plan History ]   [ Edit Financial Inputs ]        [ Update Plan (CTA) ]│
├──────────────────────────────────────────────────────────────────────────┤
│ DRIFT / STALE ALERT BANNER (Conditional)                                 │
│   Observed drift detected against active plan: recorded transactions     │
│   differ from baseline. Your active plan remains strictly unchanged.     │
│   [ Review Drift Findings ]                                              │
├──────────────────────────────────────────────────────────────────────────┤
│ 1. FINANCIAL SNAPSHOT & CASH FLOW                                        │
│    Monthly Income: ₹1,20,000 │ Outflows: ₹82,000 │ Surplus: ₹38,000      │
│    Emergency Reserve: ₹3,00,000 (4.5 months runway, Shortfall: ₹0)       │
├──────────────────────────────────────────────────────────────────────────┤
│ 2. LONG-TERM PROJECTION & MILESTONE ROADMAP                              │
│    Interactive SVG Timeline (Today ──► 2027 ──► 2030 ──► 2035)           │
│    Shows Net Worth & Goal Milestones compounding over time               │
│    Accessible Tabular Fallback (<details> disclosure table)              │
├──────────────────────────────────────────────────────────────────────────┤
│ 3. ACTIVE GOALS INVENTORY                                                │
│    Summary table: Goal, Category, Target Today, Inflated Target, Date    │
├──────────────────────────────────────────────────────────────────────────┤
│ 4. KEY RISKS & BOTTLENECKS                                               │
│    Identifies vulnerability points (e.g. single income earner, low SIP)  │
├──────────────────────────────────────────────────────────────────────────┤
│ 5. CALCULATION ASSUMPTIONS & POLICY AUDIT                                │
│    Policy Version: v1.4.2 · General Inflation: 6.0% · Return: 12.0%      │
│    Source: Manually saved inputs as of Sep 4, 2026                       │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 4. Actions
- **Primary CTA**: `Update Plan` → calls `POST /api/v1/households/planning/generate` with `expectedRevision`, generates a new immutable version, and refreshes the snapshot.
- **Secondary Actions**:
  - `Plan history` → navigates to `/dashboard/plan/history` (Release 2 feature).
  - `Edit financial inputs` → navigates to `/onboarding`.
  - `Review drift findings` → navigates to `/dashboard/plan/review/[id]`.

#### 5. Desktop vs. Mobile Behavior
- **Desktop (1024px–1440px)**: Full-width planning workspace canvas (max-w-7xl); interactive SVG milestone chart; multi-column assumption tables; side-by-side snapshot summaries.
- **Mobile (360px–768px)**: Stacked narrative flow; chart converts to compact touch-scrollable cards with an immediate expandable `<details>` table summary; header CTAs collapse into a sticky top bar.

#### 6. States
- **Loading**: Full workspace skeleton with pulsating timeline and metric boxes.
- **Populated**: Complete roadmap with explicit version number and generation timestamp.
- **Empty (No Plan Generated)**: Empty state prompt: *"You do not have a saved plan yet. Start with your goals and monthly money. [Build your plan]"*.
- **Generating**: Active plan remains fully visible while generating; button indicates `Generating your plan…`.
- **Generation Failure**: Active plan remains completely intact; an inline alert explains: *"Plan generation failed. Your existing plan version remains active."*
- **Stale / Needs Update**: Amber banner indicates that input revisions have advanced past snapshot revision, offering a 1-click update.

---

## 3. Comprehensive KEEP / REFACTOR / DELETE Source Audit

This exhaustive audit evaluates every file currently residing in `frontend/src` (108 files total). It provides the exact architectural verdict and migration path while preserving active uncommitted Release 2 changes.

### 3.1 Collision Advisory for Active Release 2 Files
The working directory contains active, uncommitted Release 2 changes (F12 Plan History, F13 Scenarios, F14 Loans, F15 Investments).
- **Critical File: `frontend/src/features/planner/ui.tsx`**: Currently imported by active R2 files (`history-drift.tsx`, `scenarios.tsx`, `loans.tsx`, `investments.tsx`) for `action`, `secondary`, `control`, `Panel`, `PageTitle`, `ErrorNotice`, `Loading`, `Empty`, `money`, `date`. **DO NOT delete or truncate `ui.tsx` during Release 1 realignment.** Instead, mark it as `COLLAPSE / COMPATIBILITY SHIM`. It will re-export standard primitives until Release 2 files are refactored.
- **Critical File: `frontend/src/components/planner/badge.tsx`**: Imported by `history-drift.tsx`, `scenarios.tsx`, `loans.tsx`, `investments.tsx`. Must be preserved or re-exported from `components/ui/badge.tsx`.
- **Critical File: `frontend/src/components/planner/app-shell.tsx`**: Has uncommitted R2 modifications adding Scenarios, Loans, and Investments to navigation. Refactoring of the app shell must preserve these dynamic nav items.
- **Critical File: `frontend/src/features/planner/queries.ts`**: Contains uncommitted R2 changes adding `PlannerApiError` and status extraction in `unwrap()`. Must be kept intact.
- **Critical File: `frontend/src/features/planner/plan.tsx`**: Contains uncommitted R2 changes adding `useCurrentDrift` and the drift banner. Refactoring must preserve drift alert hooks.

---

### 3.2 Master File Audit Table (108 Files)

| File Path | Category | Status | Rationale | Target / Replacement Path | Release 2 Collision Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `frontend/src/proxy.ts` | Transport | **KEEP** | Essential reverse-proxy layer forwarding `/api/v1/*` to Express backend with cookie & CSRF preservation. | Keep as-is. | Core transport dependency. |
| `frontend/src/app/favicon.ico` | App | **KEEP** | Standard favicon icon asset. | Keep as-is. | None. |
| `frontend/src/app/globals.css` | Styles | **REFACTOR** | Contains foundational tokens and WCAG contrast fixes, but needs consolidation of semantic design tokens (`--canvas`, `--card`, etc.). | Refactor in-place to standardize tokens. | Global dependency; preserve `:focus-visible` and overflow rules. |
| `frontend/src/app/layout.tsx` | Layout | **KEEP** | Root HTML document wrapping QueryProvider, ThemeProvider, and Toaster. | Keep as-is. | Root provider layout. |
| `frontend/src/app/page.tsx` | Route | **REFACTOR** | Current landing page is jargon-heavy ("canonical ledger", "immutable baseline") and uses glow blur effects. Recompose with customer-centric Try → Plan → Automate narrative. | Recompose using new design system primitives. | None. |
| `frontend/src/app/affordability/page.tsx` | Route | **REFACTOR** | Canonical route for anonymous affordability check. Refactor page composition to use new two-column layout. | Recompose with new `Affordability` feature. | None. |
| `frontend/src/app/can-i-afford-this/page.tsx` | Route | **KEEP** | Marketing alias route redirecting/rendering `affordability/page.tsx`. | Keep as alias. | None. |
| `frontend/src/app/auth/callback/page.tsx` | Auth | **KEEP** | OAuth callback handler verifying authentication state. | Keep as-is. | Auth flow. |
| `frontend/src/app/login/page.tsx` | Auth | **KEEP** | Login route utilizing `auth-shell` and `login-form`. | Keep as-is. | Auth flow. |
| `frontend/src/app/register/page.tsx` | Auth | **KEEP** | User registration route. | Keep as-is. | Auth flow. |
| `frontend/src/app/forgot-password/page.tsx` | Auth | **KEEP** | Password recovery initiation route. | Keep as-is. | Auth flow. |
| `frontend/src/app/reset-password/page.tsx` | Auth | **KEEP** | Password reset confirmation route. | Keep as-is. | Auth flow. |
| `frontend/src/app/verify-email/page.tsx` | Auth | **KEEP** | Email verification panel route. | Keep as-is. | Auth flow. |
| `frontend/src/app/onboarding/page.tsx` | Route | **REFACTOR** | Houses progressive 4-step onboarding wizard. Needs clean multi-step wrapper. | Recompose with new `Onboarding` feature. | None. |
| `frontend/src/app/dashboard/layout.tsx` | Layout | **REFACTOR** | Wraps dashboard routes in `PlannerShell`. Update to reference new `AppShell` in `components/layout/`. | Update to `components/layout/app-shell`. | Shell wraps R2 routes; preserve children. |
| `frontend/src/app/dashboard/page.tsx` | Route | **REFACTOR** | Dashboard home (Overview). Recompose into Financial Command Center. | Recompose with new `Overview` feature. | None. |
| `frontend/src/app/dashboard/accounts/page.tsx` | Route | **REFACTOR** | Accounts management route. Recompose presentation with Card/Table primitives. | Recompose with new `Accounts` feature. | None. |
| `frontend/src/app/dashboard/goals/page.tsx` | Route | **REFACTOR** | Goals list route. Recompose with `GoalCard` and 3-goal limit banner. | Recompose with new `Goals` feature. | None. |
| `frontend/src/app/dashboard/goals/[id]/page.tsx` | Route | **REFACTOR** | Goal detail route. Recompose into 65/35 interactive planning workspace. | Recompose with new `GoalDetail` feature. | None. |
| `frontend/src/app/dashboard/plan/page.tsx` | Route | **REFACTOR** | Plan roadmap route. Recompose into narrative snapshot/roadmap view. | Recompose with new `Plan` feature. | **Active uncommitted R2 file** (`plan.tsx`). |
| `frontend/src/app/dashboard/transactions/page.tsx` | Route | **REFACTOR** | Ledger table route. Recompose with accessible filter bar and table primitives. | Recompose with new `Transactions` feature. | None. |
| `frontend/src/app/dashboard/transactions/[id]/page.tsx` | Route | **REFACTOR** | Transaction detail modal/route. | Recompose with `Dialog` primitive. | None. |
| `frontend/src/app/dashboard/transactions/new/page.tsx` | Route | **REFACTOR** | Manual transaction creation form. | Recompose with `Form` primitives. | None. |
| `frontend/src/app/dashboard/settings/page.tsx` | Route | **REFACTOR** | Household settings, data export, and deletion safety. | Recompose with Card/Alert primitives. | None. |
| `frontend/src/app/dashboard/plan/history/page.tsx` | R2 Route | **KEEP** | Release 2: Plan version history route. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/app/dashboard/plan/review/[id]/page.tsx` | R2 Route | **KEEP** | Release 2: Plan drift review and acceptance route. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/app/dashboard/scenarios/page.tsx` | R2 Route | **KEEP** | Release 2: Scenarios list route. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/app/dashboard/scenarios/new/page.tsx` | R2 Route | **KEEP** | Release 2: Scenario creation sandbox route. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/app/dashboard/scenarios/[id]/page.tsx` | R2 Route | **KEEP** | Release 2: Scenario comparison detail route. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/app/dashboard/loans/page.tsx` | R2 Route | **KEEP** | Release 2: Loans list and overview route. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/app/dashboard/loans/[id]/page.tsx` | R2 Route | **KEEP** | Release 2: Loan prepayment & amortization analysis route. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/app/dashboard/investments/page.tsx` | R2 Route | **KEEP** | Release 2: Investment projections & compounding route. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/components/planner/app-shell.tsx` | Shell | **REFACTOR** | Shell layout with navigation and mobile drawer. Update visual presentation while keeping R2 navigation items. | Move to `components/layout/app-shell.tsx`. | **Modified in active R2 worktree**. Preserve nav links. |
| `frontend/src/components/planner/asset-image.tsx` | Assets | **KEEP** | Responsive wrapper for raster assets with metadata resolution and fallback dimensions. | Move to `components/finance/asset-image.tsx`. | None. |
| `frontend/src/components/planner/badge.tsx` | Component | **COLLAPSE** | Custom badge component. Merge tones into shared `components/ui/badge.tsx`. | `components/ui/badge.tsx` (re-export for compat). | **Imported by active R2 files** (`scenarios`, `loans`, `investments`). |
| `frontend/src/components/planner/chart-fallback.tsx` | A11y | **KEEP** | Accessible tabular fallback for financial charts with WCAG semantics. | Move to `components/finance/chart-fallback.tsx`. | Reusable data visualization primitive. |
| `frontend/src/components/planner/controls.tsx` | Controls | **DELETE / COLLAPSE** | Custom `ControlButton`, `ControlInput`, `ControlSelect`. Redundant with `components/ui/` primitives. | Replace with `button.tsx`, `input.tsx`, `select.tsx`. | Transition callers before deletion. |
| `frontend/src/components/planner/example-plan-card.tsx` | Marketing | **REFACTOR** | Static mock card used on landing page. Update copy to reflect customer language. | Keep in `features/marketing/`. | None. |
| `frontend/src/components/planner/index.ts` | Barrel | **COLLAPSE** | Barrel export file. Update or deprecate once components migrate to clean feature folders. | Deprecate in favor of direct imports. | Verify barrel imports across repo. |
| `frontend/src/components/planner/interactive-tradeoff-demo.tsx` | Sandbox | **REFACTOR** | Landing page sandbox preview. Refactor to use shared `Button` and `Card` primitives. | Keep in `features/marketing/`. | None. |
| `frontend/src/components/planner/metric-card.tsx` | KPI | **REVIEW / DELETE** | Unused KPI card wrapper. Encourages equal-weight dashboard anti-pattern. | Delete or collapse into domain-specific cards. | Unused in production routes. |
| `frontend/src/components/planner/panel.tsx` | Container | **DELETE / COLLAPSE** | Generic card wrapper. Redundant with `components/ui/card.tsx`. | Replace with standard `Card` primitive. | **Imported by `ui.tsx` and features**. |
| `frontend/src/components/planner/tradeoff-card.tsx` | Card | **REFACTOR** | Decision comparison card. Generalize into `TradeoffComparison` domain component. | `components/finance/tradeoff-comparison.tsx`. | Unused directly in routes. |
| `frontend/src/components/ui/button.tsx` | Primitive | **KEEP / EXPAND** | Shadcn button primitive using Radix Slot. | Expand variants (secondary, outline, ghost). | Core UI foundation. |
| `frontend/src/components/ui/card.tsx` | Primitive | **KEEP / EXPAND** | Standard Card primitive (Header, Title, Content, Footer). | Expand with subtle parchment border styles. | Core UI foundation. |
| `frontend/src/components/ui/input.tsx` | Primitive | **KEEP** | Accessible input primitive. Ensure 16px mobile font-size. | Standardize focus rings and helper text. | Core UI foundation. |
| `frontend/src/components/ui/label.tsx` | Primitive | **KEEP** | Accessible Radix label primitive. | Keep as-is. | Core UI foundation. |
| `frontend/src/components/ui/sonner.tsx` | Notification | **KEEP** | Accessible toast notification provider. | Keep as-is. | Toast notifications. |
| `frontend/src/constants/api.ts` | Constants | **KEEP** | Route definitions and API endpoints. | Expand route constants for Release 1 & 2. | Global dependency. |
| `frontend/src/features/auth/components/auth-callback-panel.tsx` | Auth | **KEEP** | OAuth callback presentation. | Keep as-is. | Auth flow. |
| `frontend/src/features/auth/components/auth-shell.tsx` | Auth | **KEEP** | Authentication screen shell layout. | Keep as-is. | Auth flow. |
| `frontend/src/features/auth/components/dashboard-panel.tsx` | Auth | **KEEP** | Dashboard preview panel for auth pages. | Keep as-is. | Auth flow. |
| `frontend/src/features/auth/components/forgot-password-form.tsx` | Auth | **KEEP** | Forgot password form with validation. | Keep as-is. | Auth flow. |
| `frontend/src/features/auth/components/google-button.tsx` | Auth | **KEEP** | Google OAuth button. | Keep as-is. | Auth flow. |
| `frontend/src/features/auth/components/login-form.tsx` | Auth | **KEEP** | Email/password login form. | Keep as-is. | Auth flow. |
| `frontend/src/features/auth/components/register-form.tsx` | Auth | **KEEP** | Registration form. | Keep as-is. | Auth flow. |
| `frontend/src/features/auth/components/reset-password-form.tsx` | Auth | **KEEP** | Password reset form. | Keep as-is. | Auth flow. |
| `frontend/src/features/auth/components/verify-email-panel.tsx` | Auth | **KEEP** | Email verification panel. | Keep as-is. | Auth flow. |
| `frontend/src/features/planner/accounts.tsx` | Feature | **REFACTOR** | Accounts management view. Refactor to use `Card` and `Table` primitives; preserve queries. | `features/accounts/accounts.tsx`. | None. |
| `frontend/src/features/planner/accounts.test.tsx` | Test | **KEEP** | Accounts feature unit and interaction tests. | Update test assertions on refactor. | None. |
| `frontend/src/features/planner/affordability.tsx` | Feature | **REFACTOR** | Anonymous affordability logic and presentation. Split into clean presentation and draft handler. | `features/affordability/affordability.tsx`. | None. |
| `frontend/src/features/planner/affordability.test.tsx` | Test | **KEEP** | Affordability calculation and draft tests. | Keep as-is. | None. |
| `frontend/src/features/planner/analytics.ts` | Analytics | **KEEP** | Privacy-conscious funnel telemetry with strict data redaction (zero money amounts). | Keep as-is. | Global dependency. |
| `frontend/src/features/planner/goals.tsx` | Feature | **REFACTOR** | Goals list, add form, and detail view. Break into separate list and detail components. | `features/goals/goals.tsx`. | None. |
| `frontend/src/features/planner/goals.test.tsx` | Test | **KEEP** | Goal CRUD and 3-goal limit tests. | Keep as-is. | None. |
| `frontend/src/features/planner/onboarding.tsx` | Feature | **REFACTOR** | 4-step wizard. Refactor presentation into guided cards; preserve autosave and revision logic. | `features/onboarding/onboarding.tsx`. | None. |
| `frontend/src/features/planner/onboarding.test.tsx` | Test | **KEEP** | Autosave, revision, and draft claim tests. | Keep as-is. | None. |
| `frontend/src/features/planner/overview.tsx` | Feature | **REFACTOR** | Overview dashboard. Redesign from generic 3-KPI grid into Financial Command Center. | `features/overview/overview.tsx`. | None. |
| `frontend/src/features/planner/plan.tsx` | Feature | **REFACTOR** | Plan view. Redesign layout into narrative roadmap; preserve drift banner and generation logic. | `features/plan/plan.tsx`. | **Modified in active R2 worktree**. Preserve drift hooks. |
| `frontend/src/features/planner/plan.test.tsx` | Test | **KEEP** | Plan generation and revision tests. | Keep as-is. | None. |
| `frontend/src/features/planner/planning-queries.ts` | Data Layer | **KEEP** | Core planning and goals TanStack Query hooks. | Move to `lib/query/planning.ts`. | Core query plumbing. |
| `frontend/src/features/planner/projection.tsx` | Feature | **REFACTOR** | SVG projection chart. Refactor to use accessible SVG with tabular data fallback. | `components/finance/projection-chart.tsx`. | Reusable chart primitive. |
| `frontend/src/features/planner/queries.ts` | Data Layer | **KEEP** | Core accounts, transactions, and plan queries. | Move to `lib/query/planner.ts`. | **Modified in active R2 worktree** (`PlannerApiError`). |
| `frontend/src/features/planner/settings.tsx` | Feature | **REFACTOR** | Household settings view. Refactor presentation using `Card` and `Alert`. | `features/settings/settings.tsx`. | None. |
| `frontend/src/features/planner/settings.test.tsx` | Test | **KEEP** | Settings and privacy export tests. | Keep as-is. | None. |
| `frontend/src/features/planner/shell.tsx` | Shell | **COLLAPSE** | Redundant wrapper around `app-shell.tsx`. | Merge directly into `components/layout/app-shell.tsx`. | None. |
| `frontend/src/features/planner/transactions.tsx` | Feature | **REFACTOR** | Transactions ledger and filters. Recompose with `Table` and `Badge` primitives. | `features/transactions/transactions.tsx`. | None. |
| `frontend/src/features/planner/transactions.test.tsx`| Test | **KEEP** | Ledger and filter tests. | Keep as-is. | None. |
| `frontend/src/features/planner/ui.tsx` | UI Shim | **COLLAPSE / COMPAT SHIM** | Contains generic string classes (`control`, `action`, `secondary`) and basic helpers. Must NOT be deleted because active R2 files import it. | Re-export shadcn primitives and deprecate gradually. | **CRITICAL: Imported by active R2 files** (`history-drift`, `scenarios`, `loans`, `investments`). |
| `frontend/src/features/planner/decision-queries.ts` | R2 Data | **KEEP** | Release 2: TanStack Query hooks for history, drift, scenarios, loans, investments. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/features/planner/history-drift.tsx` | R2 Feature | **KEEP** | Release 2: Plan history and meaningful drift review component. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/features/planner/history-drift.test.tsx`| R2 Test | **KEEP** | Release 2: Plan history and drift tests. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/features/planner/investments.tsx` | R2 Feature | **KEEP** | Release 2: Investment projections and compounding simulation. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/features/planner/investments.test.tsx`| R2 Test | **KEEP** | Release 2: Investment feature tests. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/features/planner/loans.tsx` | R2 Feature | **KEEP** | Release 2: Loan amortization, prepayment, and refinancing analysis. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/features/planner/loans.test.tsx` | R2 Test | **KEEP** | Release 2: Loan feature tests. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/features/planner/scenarios.tsx` | R2 Feature | **KEEP** | Release 2: Bounded scenario sandbox and comparison tool. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/features/planner/scenarios.test.tsx` | R2 Test | **KEEP** | Release 2: Scenario comparison and apply tests. | **PRESERVE** (Active Release 2 file). | Uncommitted R2 file. Do not touch. |
| `frontend/src/hooks/use-forgot-password.ts` | Hook | **KEEP** | Password recovery mutation hook. | Keep as-is. | Auth hook. |
| `frontend/src/hooks/use-login.ts` | Hook | **KEEP** | Login mutation hook with query cache invalidation. | Keep as-is. | Auth hook. |
| `frontend/src/hooks/use-logout.ts` | Hook | **KEEP** | Logout mutation hook clearing query cache and cookies. | Keep as-is. | Auth hook. |
| `frontend/src/hooks/use-me.ts` | Hook | **KEEP** | Authenticated user query hook (`/api/v1/users/me`). | Keep as-is. | Auth hook. |
| `frontend/src/hooks/use-register.ts` | Hook | **KEEP** | Registration mutation hook. | Keep as-is. | Auth hook. |
| `frontend/src/hooks/use-reset-password.ts` | Hook | **KEEP** | Password reset submission hook. | Keep as-is. | Auth hook. |
| `frontend/src/hooks/use-verify-email.ts` | Hook | **KEEP** | Email verification submission hook. | Keep as-is. | Auth hook. |
| `frontend/src/lib/api.ts` | Lib | **KEEP** | Base API client configuration. | Keep as-is. | Transport. |
| `frontend/src/lib/assets.ts` | Lib | **REFACTOR** | Catalog of 241 raster assets. Needs accessibility metadata fixes (`isDecorative: true` for ornaments) and URI path encoding. | Refactor in-place. | Asset registry. |
| `frontend/src/lib/sdk.ts` | Lib | **KEEP** | Configured typed OpenAPI SDK instance with CSRF handling. | Keep as-is. | Canonical API boundary. |
| `frontend/src/lib/transport.test.ts` | Test | **KEEP** | Transport and CSRF unit tests. | Keep as-is. | Core transport test. |
| `frontend/src/lib/utils.ts` | Lib | **KEEP** | Standard `cn()` classnames utility function. | Keep as-is. | Global utility. |
| `frontend/src/providers/query-provider.tsx` | Provider | **KEEP** | TanStack QueryClientProvider with memory-only cache. | Keep as-is. | Global provider. |
| `frontend/src/providers/theme-provider.tsx` | Provider | **KEEP** | Theme provider wrapper. | Keep as-is. | Global provider. |
| `frontend/src/schemas/auth.ts` | Schema | **KEEP** | Zod validation schemas for authentication forms. | Keep as-is. | Auth validation. |
| `frontend/src/services/auth.service.ts` | Service | **KEEP** | Authentication SDK service methods. | Keep as-is. | Auth service. |
| `frontend/src/services/onboarding-draft.ts` | Service | **KEEP** | Manages local storage token and claim API handoff for anonymous draft. | Keep as-is. | Core draft handoff. |
| `frontend/src/services/onboarding-draft.test.ts` | Test | **KEEP** | Anonymous draft preservation and claim unit test. | Keep as-is. | Core test. |
| `frontend/src/test/setup.ts` | Test | **KEEP** | Vitest environment setup and DOM matchers. | Keep as-is. | Test setup. |
| `frontend/src/types/auth.ts` | Types | **KEEP** | TypeScript types for authentication entities. | Keep as-is. | Auth types. |

---

## 4. Reusable Data & Query Plumbing Catalog

The existing engineering foundation on `main-2` is robust. The presentation layer realignment preserves and reuses 100% of the following query plumbing:

### 4.1 TanStack Query Hooks & Key Registry
| Hook Name | File Location | Query Key | Endpoint Invoked | Invalidation Trigger |
| :--- | :--- | :--- | :--- | :--- |
| `useCurrentPlan()` | `queries.ts` | `["plan"]` | `GET /api/v1/plans/current` | Plan generation, drift acceptance, scenario apply |
| `usePlanning()` | `planning-queries.ts` | `["planning"]` | `GET /api/v1/households/planning` | Onboarding autosave, goal edits, account updates |
| `useGoals()` | `planning-queries.ts` | `["goals"]` | `GET /api/v1/goals` | Goal create, update, delete |
| `useFeasibility()` | `planning-queries.ts` | `["goals", "feasibility"]` | `GET /api/v1/goals/feasibility` | Goal mutations, monthly cash flow edits |
| `useAccounts()` | `queries.ts` | `["accounts"]` | `GET /api/v1/accounts` | Account create, balance edit, delete |
| `useRecordedCashFlow()`| `queries.ts` | `["recorded-cash-flow"]` | `GET /api/v1/transactions/cash-flow` | Transaction added, reviewed, deleted |
| `useTransactions()` | `overview.tsx` | `["transactions", ...]` | `GET /api/v1/transactions` | Transaction mutations |
| `useCategories()` | `queries.ts` | `["categories"]` | `GET /api/v1/categories` | Rarely invalidated (reference data) |
| `useMe()` | `use-me.ts` | `["me"]` | `GET /api/v1/users/me` | Login, logout, profile update |

### 4.2 State Mutations & Idempotency Rules
1. **Onboarding Autosave**:
   - Debounced by 700ms on user keystrokes.
   - Dispatches `PUT /api/v1/households/planning` passing `expectedRevision: revision.current`.
   - On success, updates in-memory revision ref and TanStack query cache without causing re-renders.
2. **First Plan & Regeneration**:
   - Generates unique UUID `Idempotency-Key` header per generation attempt.
   - Dispatches `POST /api/v1/households/planning/generate` passing `expectedRevision`.
   - On completion, invalidates `["plan"]` query, updating the active snapshot while preserving plan history.
3. **Goal Feasibility**:
   - Backend guarantees rejection of a 4th active goal (`GOAL_LIMIT_EXCEEDED`).
   - Rejects total monthly contributions exceeding calculated monthly surplus (`OVER_ALLOCATED`).
   - Frontend renders explicit warning banner; user-chosen contributions are never silently altered.

---

## 5. Next Implementation Wave & Prioritized Tasks

To execute the realignment cleanly without breaking active Release 2 work, the implementation must proceed in the following prioritized wave:

```text
WAVE 1: Design System Primitives & Shims
  Task 1.1: Expand `components/ui/` with missing primitives (select, table, dialog, sheet, tabs, alert, badge).
  Task 1.2: Build finance-specific components in `components/finance/` (`money.tsx`, `source-badge.tsx`, `chart-fallback.tsx`).
  Task 1.3: Update `features/planner/ui.tsx` as a re-exporting compatibility shim to prevent R2 breakages.

WAVE 2: Public Acquisition Layer
  Task 2.1: Recompose Screen 1 (Landing `/`) with calm, outcome-focused copy and warm visual hierarchy.
  Task 2.2: Recompose Screen 2 (Affordability `/can-i-afford-this`) with side-by-side verdict cards and draft handoff.

WAVE 3: Onboarding & First Value
  Task 3.1: Recompose Screen 3 (Onboarding `/onboarding`) with clean 4-step stepper and progressive disclosure.
  Task 3.2: Verify anonymous draft claim handoff from affordability into onboarding.

WAVE 4: Command Center & Shell
  Task 4.1: Refactor `components/layout/app-shell.tsx` with high-contrast docked sidebar and focus-trapped mobile drawer.
  Task 4.2: Recompose Screen 4 (Overview `/dashboard`) into Financial Command Center with dominant next action banner.

WAVE 5: Goal Detail & Plan Workspace
  Task 5.1: Recompose Screen 5 (Goal Detail `/dashboard/goals/[id]`) with 65/35 projection and trade-off layout.
  Task 5.2: Recompose Screen 6 (Plan Workspace `/dashboard/plan`) with narrative roadmap and accessible SVG projections.

WAVE 6: End-to-End Verification Gate
  Task 6.1: Run full responsive inspection at 360px, 768px, 1024px, 1440px (0px overflow verification).
  Task 6.2: Run WCAG 2.1 AA automated contrast and keyboard focus checks.
  Task 6.3: Run full frontend test suite (`pnpm test`) and Next.js production build (`pnpm build`).
```
