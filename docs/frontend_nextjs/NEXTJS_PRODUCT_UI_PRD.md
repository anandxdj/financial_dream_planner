---
title: "Financial Dream Planner - Next.js Product & UI PRD"
subtitle: "Try -> Plan -> Automate"
author: "Product specification"
date: "2026-08-31"
geometry: margin=0.75in
fontsize: 10pt
mainfont: "DejaVu Sans"
monofont: "DejaVu Sans Mono"
colorlinks: true
toc: true
toc-depth: 3
---

# 1. Executive summary

Financial Dream Planner web is not a marketing-only site and not a browser clone of the Android app. It has three jobs:

1. **Try** - let a visitor experience real financial decision support before signup.
2. **Plan** - let an authenticated user build, understand, and explore a useful financial plan entirely on the web, even without Android.
3. **Automate** - convert users to the Android app when they want automatic transaction capture and a continuously updated financial state.

The web product should therefore be designed as a complete planning workspace with a public acquisition layer, a low-friction anonymous calculator, a progressive onboarding flow, a desktop-first authenticated planning application, and an Android connection bridge.

The core promise is:

> **A financial plan that grows with you.**

The core product loop is:

```text
Understand current state
        ->
Build a baseline plan
        ->
Explore goals and scenarios
        ->
Observe real-world changes
        ->
Detect meaningful drift
        ->
Recalculate
        ->
Recommend the next best action
```

On web, the user can complete all planning steps manually. Android later improves data quality and recency by supplying normalized transaction data from financial SMS.

# 2. Existing repository baseline

The current frontend is already a Next.js App Router application with React, TypeScript, TanStack Query, React Hook Form, Zod, shadcn, Tailwind, Sonner, Lucide, and existing authentication surfaces. The implementation plan should evolve this frontend rather than replace it.

Current working assumptions:

- Next.js remains **frontend-only**.
- Express owns business logic, financial calculations, AI orchestration, persistence, and authorization.
- The generated shared SDK remains the low-level API client.
- TanStack Query feature hooks sit above the SDK.
- No database access from Next.js.
- No business-critical finance math in React components, route handlers, or Server Actions.
- Web and mobile share product concepts and backend state, but not UI code.

# 3. Product strategy: Try -> Plan -> Automate

## 3.1 Try

Visitors should be able to obtain useful financial decision support before creating an account.

Primary launch tool:

**Can I afford this?**

It should provide a genuine result rather than hiding the result behind signup.

The anonymous result should include:

- affordability status: Safe / Tight / Risky;
- estimated monthly surplus;
- emergency-buffer impact;
- a simple time-to-afford estimate;
- one best recommendation;
- a comparison such as Buy now vs Wait 3 months.

Signup unlocks deeper analysis, long-term plan impact, saved scenarios, goals, plan history, AI conversation, and Android automation.

## 3.2 Plan

A user who never installs Android should still be able to:

- create accounts manually;
- enter balances;
- enter income and recurring obligations;
- enter loans and EMIs;
- record existing investments and SIPs;
- add manual transactions;
- create up to three active goals;
- generate a first financial plan;
- view financial health;
- view cash flow and projections;
- run scenarios;
- explore loan prepayment;
- use AI chat and research within product boundaries;
- generate reports and PDF exports.

The website therefore remains a real product, not a download funnel.

## 3.3 Automate

Android is positioned after value is demonstrated:

> **Make your plan a living plan.**

The Android app can capture financial SMS locally, normalize transactions, sync canonical transaction data to the same backend account, and keep the financial state fresher.

The web never reads SMS directly.

```text
Android phone
   -> local financial-SMS detection
   -> normalized transactions
   -> Express API
   -> canonical financial state
   -> Next.js planning workspace
```

# 4. Product goals and non-goals

## 4.1 Goals

The web MVP should:

1. Convert visitors by demonstrating actual product value before signup.
2. Let users create a first useful plan without Android.
3. Make the planning experience meaningfully better on desktop than on mobile.
4. Make data quality and freshness explicit.
5. Make Android feel like an automation upgrade, not a prerequisite.
6. Keep all meaningful financial mutations explicit and reviewable.
7. Keep the UI calm, trustworthy, understandable, and India-first.
8. Stay modular enough for feature-by-feature development by human or AI coding agents.

## 4.2 Non-goals

The initial web product is not:

- a brokerage;
- a stock-trading terminal;
- a tax-filing product;
- a bank account aggregator;
- a full household financial-management suite;
- a dark-mode-first product;
- a crypto-style analytics dashboard;
- a generic collection of EMI/SIP calculators;
- a replacement for the Android SMS ingestion layer.

# 5. Primary users

## 5.1 Visitor evaluating the product

Needs:

- understand the value quickly;
- trust the product with sensitive financial data;
- try something without commitment;
- avoid a hard download wall.

Primary path:

```text
Landing -> Anonymous affordability result -> Build full plan -> Signup
```

## 5.2 New authenticated web user

Needs:

- progressive setup;
- a first useful result quickly;
- no requirement to know exact financial terminology;
- an understandable first plan.

Primary path:

```text
Signup -> Web onboarding -> First plan reveal -> Overview
```

## 5.3 Existing Android user on desktop

Needs:

- richer charts;
- transaction review at scale;
- scenario comparison;
- plan history;
- reports;
- AI with more context on screen.

Primary path:

```text
Login -> Overview -> Plan / Scenarios / Transactions / AI
```

# 6. Product principles

1. **Outcome before account.** Demonstrate value before asking for signup where possible.
2. **Plan before automation.** Android enhances the product; it does not gate the product.
3. **Action-first, not dashboard-first.** Show what matters and what to do next.
4. **Deterministic math, explainable AI.** AI explains and researches; finance engines calculate.
5. **Show provenance and freshness.** Never imply stale or estimated information is live.
6. **One primary action.** Avoid competing CTA noise.
7. **Desktop should use width.** Do not stretch mobile cards across a browser.
8. **Progressive disclosure.** Summary first; detail on demand.
9. **No silent plan mutation.** Baseline changes require explicit user approval.
10. **Calm visual language.** Financial risk should be clear without creating anxiety.

# 7. Success metrics

## 7.1 Acquisition funnel

Track:

```text
Landing visitor
 -> affordability tool started
 -> affordability result viewed
 -> signup started
 -> signup completed
 -> onboarding completed
 -> first plan generated
 -> full plan viewed
 -> returned within 7 days
 -> Android connected
```

Primary activation metrics:

- **Generated First Plan**
- **Connected Automatic Data Source**

Supporting metrics:

- affordability-result completion rate;
- anonymous-result -> signup conversion;
- signup -> onboarding completion;
- first-plan reveal -> Overview entry;
- first plan -> Android connection;
- scenario creation rate;
- monthly plan review rate;
- transaction review completion rate.

Do not optimize only for signup count.

# 8. Information architecture

## 8.1 Public routes

```text
/
/how-it-works
/features
/security
/can-i-afford-this
```

Additional SEO pages may be added later, but launch should not require a large content site.

## 8.2 Auth routes

```text
/login
/register
/forgot-password
/reset-password
/verify-email
```

## 8.3 Web onboarding routes

```text
/onboarding
/onboarding/goals
/onboarding/income
/onboarding/obligations
/onboarding/balances
/onboarding/loans
/onboarding/investments
/onboarding/review
/onboarding/generating
/onboarding/ready
```

## 8.4 Authenticated app routes

```text
/dashboard
/dashboard/transactions
/dashboard/transactions/[id]
/dashboard/goals
/dashboard/goals/[id]
/dashboard/plan
/dashboard/plan/history
/dashboard/plan/version/[id]
/dashboard/plan/review/[id]
/dashboard/scenarios
/dashboard/scenarios/new
/dashboard/scenarios/[id]
/dashboard/accounts
/dashboard/accounts/[id]
/dashboard/loans
/dashboard/loans/[id]
/dashboard/investments
/dashboard/ai
/dashboard/reports
/dashboard/reports/[id]
/dashboard/notifications
/dashboard/settings
/dashboard/settings/profile
/dashboard/settings/financial
/dashboard/settings/data-sources
/dashboard/settings/notifications
/dashboard/settings/privacy
/dashboard/settings/security
```

# 9. Public website PRD

## 9.1 Landing page `/`

### Purpose

Explain the product in less than one scroll, prove the value in the next few sections, establish trust, and drive users into the anonymous tool or full plan creation.

### Hero

Recommended message hierarchy:

```text
Your financial plan should change when your life does.

Understand where your money is going, plan your goals,
explore decisions, and know what to do next.
```

Primary CTA:

**Build my financial plan**

Secondary CTA:

**Try "Can I afford this?"**

Supporting microcopy:

```text
Free to start. Android automation available.
```

### Hero visual

Do not use a generic fake fintech dashboard in a floating browser mockup.

Show a short product story:

```text
TODAY
Monthly surplus              INR 18,400

YOUR GOAL
Home deposit                 May 2028

BEST NEXT MOVE
Build INR 24,000 more emergency savings
```

The visual should communicate the product loop rather than merely show decorative charts.

### Problem section

Headline:

> A financial plan becomes outdated when life changes.

Examples:

- salary changed;
- new EMI;
- spending increased;
- a new goal appeared;
- an unexpected cost happened.

Response:

> Your plan should react too.

### How it works

Three steps:

1. **Tell us where you stand** - income, savings, obligations, loans, investments, goals.
2. **Get your roadmap** - projections, risks, priorities, and next-best action.
3. **Keep it alive** - Android can automate transaction capture from financial SMS.

### Product pillars

Show only the strongest pillars:

- Living Plan
- Goals
- What-if Scenarios
- Financial Health
- AI Copilot
- Transaction Intelligence
- Research

Avoid technical implementation terms.

### Anonymous-tool CTA

A prominent section should invite the visitor to try:

> **Can I afford this?**

Example input preview:

```text
Laptop                         INR 100,000
Monthly take-home              INR 58,000
Monthly obligations            INR 31,000
```

CTA:

**Check affordability**

### Android section

Position Android as an upgrade:

> **Make your plan update itself.**

Explain:

```text
Financial SMS -> local detection -> normalized transactions -> living plan
```

CTA:

**Get the Android app**

Do not make this the primary hero CTA.

### Trust section

Explain:

- financial planning calculations are deterministic;
- users remain in control of plan changes;
- SMS automation is optional;
- source and freshness are shown where relevant;
- raw personal conversations are not the web product's data source.

### Footer

Launch footer should include:

- Product
- How it works
- Security
- Privacy
- Terms
- Login
- Build my plan

## 9.2 `/how-it-works`

Purpose: explain the lifecycle in more detail.

Sections:

```text
1. Build your financial picture
2. Generate your baseline plan
3. Explore scenarios
4. Keep your state current
5. Review meaningful drift
6. Accept or reject plan changes
```

Use real product screenshots/illustrations once UI exists.

## 9.3 `/features`

Group by outcome, not menu structure.

Recommended groups:

### Understand
- financial health;
- cash flow;
- accounts;
- transaction intelligence.

### Plan
- goals;
- roadmap;
- projections;
- loans.

### Explore
- scenarios;
- AI questions;
- research.

### Keep current
- Android sync;
- plan drift;
- monthly review.

## 9.4 `/security`

Must exist before public launch.

Explain clearly:

- what the web stores;
- what Android processes;
- what is estimated vs authoritative;
- how users can revoke sessions;
- how data deletion works;
- how source/provenance is represented;
- that important plan changes require confirmation.

Avoid vague statements such as "bank-grade security" unless they can be substantiated.

# 10. Anonymous affordability tool

Route: `/can-i-afford-this`

This is a product surface, not a marketing form.

## 10.1 User flow

```text
What are you considering?
 -> amount
 -> monthly take-home
 -> recurring obligations
 -> current liquid savings / emergency buffer
 -> optional target date
 -> result
```

Keep the flow short enough to complete in roughly one minute.

## 10.2 Inputs

Required:

- purchase/goal description;
- amount;
- monthly take-home income;
- recurring monthly obligations;
- liquid savings.

Optional:

- target date;
- existing EMI;
- whether savings shown include emergency money.

Do not ask for full net worth or detailed transaction history anonymously.

## 10.3 Calculation boundary

The Next.js app must **not** calculate affordability itself.

Recommended contract:

```text
Anonymous UI
 -> anonymous scenario API
 -> deterministic backend calculation
 -> result DTO
 -> render result
```

For conversion preservation, backend may return a short-lived anonymous `draftToken` that can be claimed after registration. Avoid persisting sensitive anonymous finance inputs indefinitely in browser localStorage.

## 10.4 Result

The result must be useful before signup.

### Top verdict

One of:

- **Safe**
- **Tight**
- **Risky**

Avoid false precision.

### Supporting metrics

Show:

- estimated monthly surplus;
- remaining liquid buffer after purchase;
- estimated emergency-buffer months;
- time-to-afford without materially weakening safety;
- one primary recommendation.

### Comparison

Default comparison:

```text
BUY NOW                  WAIT 3 MONTHS
Buffer: 2.5 months       Buffer: 3.7 months
Goal capacity: lower     Goal capacity: healthier
```

### Conversion CTA

After giving the result:

> **Want this decision evaluated against your complete financial life?**

Primary:

**Build my full plan**

Unlock copy:

- goals impact;
- loans interaction;
- long-term projection;
- multiple scenarios;
- saved plan;
- AI explanation;
- Android automation.

## 10.5 Signup handoff

After registration:

- preserve anonymous decision description and amount;
- preserve user-supplied high-level values where safe;
- prefill onboarding;
- do not force duplicate entry;
- optionally create a draft scenario after the first plan exists.

# 11. Authentication

Existing authentication should remain simple and consistent with the current starter.

## 11.1 Login

Layout:

```text
Brand
Welcome back
Email
Password
Log in
or
Continue with Google
Forgot password
Create account
```

No marketing carousel.

## 11.2 Register

Fields:

- name;
- email;
- password;
- confirm password;
- Google option.

If entered from anonymous calculator, show subtle continuity:

> Your affordability result will be saved after you create your account.

## 11.3 Auth UX states

Support:

- loading;
- invalid credentials;
- unverified email;
- rate limited;
- network unavailable;
- expired reset link;
- refresh/session expiry.

# 12. Web onboarding

Web onboarding is a planning flow, not a data-entry wall.

Use a centered max-width form area around 640-760px with a calm progress indicator.

## 12.1 Onboarding entry

Explain:

> You do not need perfect numbers. Start with what you know and refine later.

CTA:

**Build my plan**

## 12.2 Goals

Ask what money should achieve first.

Preset choices:

- Emergency fund
- Home
- Vehicle
- Travel
- Education
- Marriage
- Clear debt
- Retirement
- Build wealth
- Custom

Maximum three active goals.

Do not fully configure all goals here. Capture intent first.

## 12.3 Income

Fields:

- monthly take-home;
- frequency;
- stability: stable / mostly stable / variable;
- optional additional regular income.

## 12.4 Obligations

Capture only recurring commitments:

- rent;
- family contribution;
- utilities;
- insurance;
- subscriptions;
- other fixed expenses.

Avoid full category-budget setup during onboarding.

## 12.5 Balances

Capture high-level current money:

- savings/bank cash;
- cash;
- current investments.

Copy:

> An estimate is fine. You can update exact account details later.

## 12.6 Loans

If applicable:

- type;
- outstanding amount;
- EMI;
- interest rate if known;
- remaining tenure if known.

## 12.7 Investments

Keep minimal:

- total investments;
- monthly SIP / contribution;
- broad categories if known.

Do not ask users to reconstruct every holding before first value.

## 12.8 Review

Show a compact financial summary before generation:

```text
Income               INR 58,000 / month
Fixed obligations    INR 22,400 / month
Loans                 INR 8,500 / month
Savings               INR 128,000
Investments           INR 184,000
Goals                 3
```

Allow edits by section.

Primary:

**Generate my plan**

## 12.9 Generation state

Use real progress stages where backend can expose them:

```text
Understanding your cash flow       done
Checking debt burden               done
Evaluating goals                   active
Projecting your financial future   pending
Building your roadmap              pending
```

Do not use arbitrary fake progress percentages.

# 13. First plan reveal

Route: `/onboarding/ready`

This is an activation moment and should not immediately dump the user into a large dashboard.

Layout:

```text
Your plan is ready

Financial Health       78 / 100 - Good
Monthly Surplus        INR 18,400
Goals                  2 of 3 on track
Best Next Move         Build emergency savings +INR 3k/month

Projected financial future
[clean chart]

[ Explore my plan ]
```

Below the core result:

```text
Make this a living plan
Connect Android for automatic transaction tracking
[QR / Android CTA]
```

Android remains secondary to the primary action **Explore my plan**.

# 14. Authenticated app shell

## 14.1 Navigation structure

Group navigation semantically:

```text
OVERVIEW
Overview
Transactions

PLANNING
Goals
Plan
Scenarios

FINANCES
Accounts
Loans
Investments

AI Copilot

REPORTS
Reports
```

Bottom/supporting:

- Notifications
- Settings
- Profile

## 14.2 Shell dimensions

Recommended desktop baseline:

- sidebar: 240-256px;
- top bar: 64-72px;
- main content max width: approximately 1440px;
- page gutters: 24px at medium desktop, 32px at large desktop;
- 12-column layout grid for complex pages;
- 16-24px vertical section gaps for dense surfaces;
- larger 32-48px separation between conceptual page sections.

Exact pixels are tokens, not page-specific constants.

## 14.3 Top bar

Contains:

- current page title or compact breadcrumb;
- notification icon;
- avatar/profile;
- optionally data-freshness indicator on high-value pages.

Global search is post-MVP.

# 15. Overview page `/dashboard`

The Overview page answers:

1. Where do I stand?
2. What changed?
3. What should I do next?

## 15.1 Recommended layout

```text
Header
  greeting / concise status
  financial-picture status

Row 1
  Financial Health       | Next Best Action

Row 2
  Financial Future / Net Worth Projection

Row 3
  Monthly Cash Flow | Goals | Upcoming Obligations

Conditional row
  Plan Drift / Important Change

Lower utility
  Recent Transactions | Android/Data Source Status
```

## 15.2 Financial Health

Show:

- score;
- qualitative label;
- trend vs previous review;
- explanation access.

Expanded explanation may show deterministic components such as:

- emergency fund;
- savings rate;
- debt burden;
- monthly surplus;
- goal readiness;
- protection/risk coverage;
- income stability.

Never present a mysterious score with no explanation.

## 15.3 Next Best Action

Exactly one dominant recommendation.

Example:

> **Best move this week**
>
> Add INR 3,000 to your emergency fund.
>
> This improves your coverage from 2.4 to 2.6 months.

Actions:

- Do this / View plan action
- Why?
- Ask AI

## 15.4 Financial Future

Large but restrained projection chart.

Default:

- expected projection;
- current year -> long-term horizon;
- highlight meaningful milestones.

Do not put a dozen chart toggles on Overview. Deep chart controls belong in Plan.

## 15.5 Monthly cash flow

Show:

- income;
- spending/obligations;
- surplus;
- small change vs baseline or prior month.

Avoid a giant category pie chart here.

## 15.6 Goals preview

Show up to three active goals with:

- progress;
- target date;
- status;
- one-line risk if needed.

## 15.7 Upcoming obligations

Show only material items:

- EMI;
- recurring major payments;
- goal milestone;
- plan review due.

## 15.8 Drift card

Render only when meaningful.

Example:

> **Your plan may need an update**
>
> Spending has remained about 14% above baseline for two weeks.

Primary:

**Review changes**

## 15.9 Financial-picture confidence

Reusable status component:

```text
Financial picture: High confidence
```

or:

```text
Financial picture: Needs updating
Account balances are 12 days old
Transactions are manual only
```

Click -> data-quality popover/drawer.

# 16. Data sources and Android bridge

Route: `/dashboard/settings/data-sources`

This page explains where financial information comes from.

## 16.1 Data-source cards

### Android

Disconnected:

```text
Android automation
Not connected
Automatically detect financial transactions from SMS
[ Connect Android ]
```

Connected:

```text
Android
OnePlus Nord
Connected
Last sync: 12 min ago
274 transactions tracked
3 need review
```

### Manual

Show count of manually maintained accounts/records.

### PDF statements

Launch state:

```text
Statement import
Coming later
```

When implemented, this becomes a full source.

### Account Aggregator

Future - not presented as available in MVP.

## 16.2 Android connection flow

Web route/action:

**Connect Android**

Display:

- QR code;
- Android download link;
- concise 3-step instructions.

```text
1. Install Financial Dream Planner
2. Sign in with the same account
3. Enable transaction sync
```

No complex pairing protocol is required if same-account login is sufficient. A pairing token may later make the handoff smoother.

## 16.3 Web sync behavior

Web should show:

- last sync time;
- status;
- new transactions;
- review count.

For MVP, do not promise that clicking web "Sync" can remotely read SMS while the phone is closed. If foreground Android sync is required, say:

> Open the Android app to scan new messages.

# 17. Accounts

Route: `/dashboard/accounts`

## 17.1 List

Group:

- Cash & Bank
- Credit
- Investments
- Other

Example:

```text
SBI Savings            INR 18,331   Confirmed 2h ago
HDFC Salary            INR 42,800   Estimated - 6d ago
HDFC Credit Card      -INR 12,480   Updated today
Cash                    INR 3,500   Manual
```

Source/freshness must be visible without opening detail.

## 17.2 Add account

Fields vary by type but start minimal:

- account type;
- display name;
- institution optional;
- masked identifier optional;
- current/opening balance;
- balance as-of date;
- source.

## 17.3 Detail

Show:

- current balance;
- confirmed vs estimated;
- last confirmed time;
- source;
- recent transactions;
- monthly inflow/outflow;
- linked goals;
- balance history when available.

Freshness policy:

- <7 days: normal;
- 7-30 days: warning;
- >30 days: strong warning before serious plan regeneration.

# 18. Transactions

Route: `/dashboard/transactions`

This is a desktop workspace, not a mobile list stretched wider.

## 18.1 Header summary

Show:

```text
Spent           INR 31,400
Income          INR 58,000
Net             +INR 26,600
```

for the active filter/date period.

## 18.2 Controls

- search;
- date;
- account;
- category;
- type;
- source;
- review status.

Important filters should be represented in URL search params so filtered views are shareable/reloadable.

## 18.3 Table

Columns:

- date;
- merchant/description;
- category;
- account;
- type/status;
- amount;
- source.

Desktop interactions:

- row selection;
- quick category edit;
- detail side panel;
- manual transaction;
- multi-select for review/category changes when useful.

## 18.4 Empty state without Android

Do not block the page.

```text
No transactions yet

Add transactions manually or connect Android for automatic tracking.

[ Add transaction ]   [ Connect Android ]
```

Later add:

**Upload statement**

when PDF ingestion exists.

## 18.5 Transaction detail

Show:

- amount;
- merchant;
- category;
- account;
- date/time;
- payment method if known;
- source/provenance;
- reference;
- balance after transaction when known;
- impact on monthly spending.

Actions:

- edit category;
- edit merchant;
- add note;
- exclude/include in spending;
- mark transfer where appropriate.

## 18.6 Self-transfers

Display clearly:

```text
Transfer
SBI -> HDFC
INR 20,000
Excluded from spending
```

## 18.7 Credit cards

Credit card purchase:

- counts as spending;
- increases credit-card liability.

Bill payment:

- decreases bank cash;
- decreases credit-card liability;
- is shown as transfer/liability settlement;
- is not counted again as spending.

# 19. Goals

Route: `/dashboard/goals`

Maximum three active goals in MVP.

## 19.1 Goals overview

Cards should show:

- name;
- progress percentage;
- current vs target amount;
- target date;
- on-track/at-risk;
- required monthly contribution where applicable.

Do not turn goals into a dense table.

## 19.2 Goal detail workspace

Route: `/dashboard/goals/[id]`

Desktop layout:

```text
Goal header
  name / target / date / status

Projection chart         Goal health

Contributions            Required monthly amount

Impact on overall plan
Risks
Assumptions
Scenarios
```

Actions:

- Ask AI about this goal
- Try scenario
- Edit goal

## 19.3 Goal creation

Structured first:

- type;
- amount;
- date;
- saved amount;
- priority.

Then AI may ask a small number of contextual questions if needed.

AI produces a draft; user confirms creation.

# 20. Plan

Route: `/dashboard/plan`

This is the flagship web page.

## 20.1 Header

```text
Your Financial Plan
Version 18
Updated today
On track

[ Regenerate ] [ Run scenario ] [ Export report ]
```

## 20.2 Views

Use local tabs within the Plan page:

- Overview
- Roadmap
- Projection

These are views of one plan, not separate top-level navigation items.

## 20.3 Plan overview

Sections:

- current status;
- next milestone;
- goals;
- top recommendations;
- risks;
- assumptions;
- changes since previous plan.

## 20.4 Roadmap

Use a large timeline:

```text
NOW
 |
 +-- Build emergency fund         Nov 2026
 |
 +-- Bike EMI ends                Mar 2027
 |
 +-- Increase SIP                 Apr 2027
 |
 +-- Bike goal                    May 2027
 |
 +-- Home down payment            May 2028
```

Each milestone can expand to show:

- why it exists;
- monthly contribution/action;
- dependencies;
- effect if delayed.

## 20.5 Projection

Controls:

- Net Worth
- Cash
- Debt
- Investments
- Goals

Scenario bands:

- Conservative
- Expected
- Optimistic

Use Recharts for standard web charts.

Charts require textual summary for accessibility and interpretation.

## 20.6 Regeneration

Manual regeneration is allowed.

Recommended semantics:

- preview/generated candidate is a draft;
- only accepted/applied plan becomes a new canonical plan version;
- repeated identical previews do not spam history.

Before regeneration, check important data freshness.

If stale:

```text
Some information may be outdated.
HDFC balance was last confirmed 34 days ago.

[ Update information ] [ Continue anyway ]
```

# 21. Plan drift review

Route: `/dashboard/plan/review/[id]`

Show a difference-first UI.

```text
What changed
Monthly spending       INR 30,000 -> INR 35,400
Income                 unchanged
New recurring payment  INR 899 / month

Impact
Emergency goal         +1 month
Home goal              +3 months
2035 net worth          -INR 2.8L
```

Then proposed adjustment.

Actions:

- Accept new baseline
- Keep current plan
- Review transactions

Never update baseline silently.

# 22. Plan history

Route: `/dashboard/plan/history`

Timeline/table:

```text
Today        Version 18   Current
12 Aug       Version 17   Income updated
2 Jul        Version 16   Bike goal added
```

Version detail should show meaningful differences, not a raw data dump.

Restore behavior:

> Restore this state as a new plan version.

Never erase later history.

# 23. Scenarios

Route: `/dashboard/scenarios`

This is a major desktop differentiator.

## 23.1 Scenario list

Show saved scenarios with:

- title;
- changed assumptions;
- created date;
- headline impact;
- status: draft/saved/applied historical reference.

## 23.2 Scenario builder

Route: `/dashboard/scenarios/new`

Inputs:

- income;
- recurring expenses;
- investment/SIP contribution;
- loan prepayment;
- goal amount;
- goal date.

Desktop layout:

```text
Inputs panel          Baseline vs Scenario
                      metrics + projection
```

## 23.3 Result

Example:

```text
Monthly surplus      INR 18,100 -> INR 30,100
Home goal            May 2028 -> Sep 2027
2041 net worth       INR 1.21Cr -> INR 1.48Cr
```

Actions:

- Save scenario
- Apply to plan
- Discard

Applying requires confirmation and produces a new plan version.

# 24. Loans

Route: `/dashboard/loans`

## 24.1 Overview

Show:

- total outstanding;
- total monthly EMI;
- debt-free date;
- weighted/representative rate only if meaningful.

## 24.2 List

Per loan:

- type/name;
- outstanding;
- EMI;
- interest;
- remaining tenure;
- next due date.

## 24.3 Detail

Route: `/dashboard/loans/[id]`

Show:

- original amount;
- outstanding;
- rate;
- EMI;
- remaining tenure;
- principal vs interest;
- repayment timeline;
- impact on monthly plan.

### Prepayment simulation

Input amount and show:

- revised payoff date;
- estimated interest saved;
- immediate cash-buffer impact;
- affected goals/plan.

CTA:

**Create scenario**

Do not mutate loan records merely by simulating.

# 25. Investments

Route: `/dashboard/investments`

This is a planning/analysis surface, not execution.

## 25.1 Overview

Show:

- total invested;
- monthly SIP/contribution;
- broad asset allocation;
- linked goals;
- projection.

## 25.2 Existing holdings

If detailed holdings are available, show them calmly without broker-style price flashing.

## 25.3 Research entry points

Examples:

- Research this holding
- Compare similar index funds
- Explain risk
- How does this allocation affect my goal?

No Buy/Sell buttons.

No order book.

No personalized security recommendation phrasing that crosses the intended product/compliance boundary without legal review.

# 26. AI Copilot

Route: `/dashboard/ai`

Keep the experience chat-first.

## 26.1 Desktop layout

```text
Main chat pane                Context pane
                              Current plan version
                              Health
                              Monthly surplus
                              Active goals
                              Loans
                              Sources when applicable
```

The context pane is informative; users should not manually micromanage agent context.

## 26.2 Empty state

Suggested prompts:

- Can I afford a INR 1 lakh laptop?
- Why did my spending increase?
- What should I focus on this month?
- What happens if my salary rises to INR 75k?
- Research index-fund options for this goal.

## 26.3 Structured cards in chat

Supported response components:

- RecommendationCard
- RiskCard
- ScenarioCard
- ResearchCard
- PlanChangeCard
- GoalDraftCard
- ActionCard

## 26.4 Streaming

Use reusable SSE client behavior:

- partial response;
- cancel;
- reconnect/error handling where appropriate;
- preserve partial answer if interrupted.

## 26.5 Mutations

AI may draft:

- goal changes;
- scenario changes;
- plan changes;
- categorization suggestions.

UI must render explicit **Apply** / **Confirm** action before canonical state changes.

# 27. Reports

Route: `/dashboard/reports`

Web is the primary report workspace.

## 27.1 Report list

Possible MVP entries:

- Current Financial Plan
- Monthly Review

Goal-specific reports can come later.

## 27.2 Report preview

Route: `/dashboard/reports/[id]`

Sections:

- Executive Summary
- Financial Snapshot
- Financial Health
- Cash Flow
- Assets and Liabilities
- Goals
- Plan
- Projection
- Roadmap
- Loans
- Risks
- Recommendations
- Assumptions
- Research Sources
- Generated date

Primary:

**Export PDF**

Report content must come from backend canonical data/calculations, not client-side recomputation.

# 28. Notifications

Route: `/dashboard/notifications`

Three levels:

- Info
- Important
- Action required

Examples:

### Action required

- plan review needed;
- balance confirmation needed;
- unresolved transaction conflict.

### Important

- EMI due soon;
- goal at risk;
- meaningful spending deviation.

### Info

- monthly review ready;
- research completed.

Every notification deep-links to the relevant page/entity.

Avoid social-network patterns such as unread-count pressure for trivial messages.

# 29. Settings

## 29.1 Profile

- name;
- email;
- avatar;
- account basics.

## 29.2 Financial details

Central edit surface for:

- income;
- dependents;
- recurring obligations;
- insurance basics;
- general financial assumptions.

## 29.3 Data sources

As specified in Section 16.

## 29.4 Notifications

Preference controls by level/topic.

## 29.5 Privacy and data

Show:

- what data is stored;
- what source each data class comes from;
- download/export data;
- delete financial data;
- delete account.

## 29.6 Security

- active sessions;
- revoke session;
- password change;
- account security actions.

# 30. Visual design direction

The authenticated web app should feel like a **modern planning workspace**, not a bank portal and not a crypto terminal.

## 30.1 Overall visual language

Use:

- clean or slightly warm light canvas;
- white/near-white content surfaces;
- dark neutral text;
- restrained primary blue/teal/green accent;
- green for positive status;
- amber for caution;
- red only for true critical/destructive states;
- thin borders;
- subtle elevation;
- strong typographic hierarchy;
- generous whitespace;
- excellent chart typography.

Avoid:

- gradient soup;
- glassmorphism everywhere;
- large decorative 3D objects;
- neon trading aesthetics;
- cards nested repeatedly inside cards;
- 10 equal-weight KPI tiles;
- tiny low-contrast text.

## 30.2 Layout tokens

Recommended starting tokens:

```text
sidebar.width.large     248px
header.height           68px
page.max                1440px
page.gutter.large       32px
page.gutter.medium      24px
section.gap             32px
card.radius             14px
control.radius          10px
```

These may be tuned during visual implementation.

## 30.3 Typography

Use semantic roles rather than per-page sizes:

```text
display
page-title
section-title
card-title
body
body-small
label
caption
money-xl
money-lg
money-md
```

Large financial numbers should use tabular numerals where the font supports them.

## 30.4 Cards

Cards are used when they create a meaningful boundary, not for every section.

Prefer:

- border + surface difference;
- subtle hover only when clickable;
- low elevation;
- clean alignment.

## 30.5 Charts

Rules:

- one dominant message per chart;
- restrained palette;
- no 3D charts;
- no gratuitous area gradients;
- sensible currency abbreviations: INR, lakh/crore in labels where appropriate;
- full value available via tooltip;
- textual summary below/near chart;
- conservative/expected/optimistic visually distinguishable without relying only on color.

# 31. Responsive behavior

Desktop is primary.

Target experience:

```text
>=1440px     excellent
1024-1439    excellent
768-1023     fully usable tablet
<768         simplified web fallback
```

The <768 experience should remain functional but should not attempt to replace the Android-native product.

Responsive rules:

- sidebar collapses;
- multi-column workspaces stack;
- transaction table may switch to denser card/list representation;
- complex scenario comparison becomes vertically sequenced;
- charts remain readable;
- primary actions remain visible.

# 32. Loading, empty, error, and stale states

## 32.1 Loading

Principle:

```text
cached useful data first
 -> current lightweight data
 -> heavy charts/historical panels later
```

Use skeletons only when content is truly unknown.

Do not replace a populated page with skeletons during background refetch.

## 32.2 Empty states

Every empty state includes:

1. what is missing;
2. why it matters;
3. one primary action.

Example:

```text
No transactions yet
Add one manually or connect Android to automate tracking.
[ Add transaction ]
```

Secondary Android CTA can be present.

## 32.3 Errors

Global rule: one subsystem failure must not blank unrelated information.

Examples:

- projection failure -> keep summary and show Retry inside projection section;
- AI failure -> keep conversation and allow retry;
- plan regeneration failure -> current plan remains active;
- research failure -> say fresh research is unavailable;
- Android sync stale -> display old canonical data with timestamp;
- auth refresh failure -> return to login cleanly without loops.

## 32.4 Offline

Web is not designed as an offline-first product.

Allow browser-cached UI/state to remain visible where TanStack Query already has data, but mutations requiring backend should explain connectivity failure and avoid pretending they succeeded.

# 33. Accessibility

Release requirements:

- keyboard navigation through all core workflows;
- visible focus indicators;
- semantic headings;
- accessible labels for icon-only buttons;
- sufficient contrast;
- no meaning by color alone;
- reduced-motion support;
- data tables have proper headers;
- charts include textual summaries;
- form errors associated with fields;
- dialogs trap focus appropriately;
- toast feedback is supplementary, not the only confirmation for important outcomes.

# 34. Frontend architecture

## 34.1 App structure

Recommended evolution:

```text
frontend/src/

app/
  (marketing)/
  (auth)/
  onboarding/
  dashboard/

features/
  marketing/
  affordability/
  onboarding/
  overview/
  data-sources/
  accounts/
  transactions/
  goals/
  plan/
  scenarios/
  loans/
  investments/
  ai/
  reports/
  notifications/
  settings/

components/
  ui/
  layout/

providers/
lib/
hooks/
types/
```

Existing route names may be migrated incrementally. Avoid a large route refactor unless it materially improves implementation.

## 34.2 Feature anatomy

Example:

```text
features/plan/
  components/
    PlanHeader/
    PlanOverview/
    PlanRoadmap/
    ProjectionChart/
    RecommendationList/
    RiskPanel/
    AssumptionsPanel/
  hooks/
    use-plan.ts
    use-plan-history.ts
    use-regenerate-plan.ts
  services/
    plan.api.ts
  schemas/
  types/
  utils/
  tests/
```

Rules:

- page files compose features;
- business logic does not live in page components;
- feature API wrappers use the shared SDK;
- server state lives in TanStack Query;
- local transient UI state remains local or in small Zustand stores only when cross-component coordination requires it;
- no giant global store;
- no giant global query-key registry;
- no deep imports across feature internals;
- generated SDK code is never manually edited.

# 35. Component system

Global UI components should remain genuinely reusable.

Recommended inventory:

```text
AppShell
Sidebar
TopBar
PageHeader
SectionHeader

Button
IconButton
Input
AmountInput
Select
Combobox
DatePicker
Tabs
SegmentedControl
Badge
Tooltip
Popover
Dialog
Sheet
DropdownMenu
CommandMenu (later)

Card
MetricCard
StatRow
Money
StatusBadge
FreshnessBadge
SourceBadge
ConfidenceBadge

DataTable
FilterBar
Pagination/CursorControls

FinancialHealthScore
GoalProgress
ProjectionChart
RoadmapTimeline
PlanStatus
NextBestAction

Skeleton
EmptyState
ErrorState
InlineError
Toast
```

Feature-specific components stay in their feature folders.

# 36. Server/client component policy

Use Server Components for static/public composition and server-renderable marketing content where it helps performance/SEO.

Use Client Components where interactive product state requires it:

- TanStack Query consumers;
- forms;
- charts;
- interactive tables;
- AI stream UI;
- scenario controls.

Do not force the entire authenticated app into either extreme. Keep boundaries intentional.

No business-critical finance calculations in Server Components or Server Actions.

# 37. Data and query behavior

## 37.1 Query defaults

Use reasonable defaults around 30-60 seconds for ordinary current-state data, then override by feature.

Examples:

- profile/session: relatively stable;
- transactions: fresher;
- plan version: stable until mutation;
- historical plan versions: highly cacheable;
- AI stream: not TanStack Query response streaming;
- notifications: moderate freshness.

## 37.2 Mutations

Invalidate only affected query families.

Examples:

- transaction category edit -> transaction detail/list + affected summaries;
- account balance update -> account + financial picture + relevant plan-data readiness;
- goal edit -> goal + plan readiness/projection dependencies;
- apply scenario -> current plan + history + overview.

Avoid broad "invalidate everything" behavior.

## 37.3 Optimistic UI

Safe for:

- low-risk metadata edits where rollback is trivial;
- notification read state.

Avoid optimistic confirmation for:

- applying a plan;
- financial calculation results;
- deleting important records;
- accepting drift baseline changes.

# 38. India-first formatting

Defaults:

- currency: INR;
- locale: `en-IN`;
- grouping: lakh/crore conventions where natural;
- date formatting: readable India-first defaults;
- all amount components use Intl formatting rather than hand-written commas.

Examples:

```text
INR 18,400
INR 1.2 Cr
INR 6.5 L
```

The final visual format may use the rupee symbol where the selected font supports it consistently.

# 39. Privacy and trust UX

The UI must clearly distinguish:

- live/authoritative data;
- confirmed data;
- estimated data;
- manually entered data;
- Android/SMS-derived normalized data;
- future PDF/API-derived data.

Do not say "bank balance" without indicating source/freshness when not authoritative.

Important actions require explicit confirmation:

- apply scenario to plan;
- accept new baseline;
- delete account;
- delete financial records;
- destructive session/security changes.

# 40. Analytics event plan

Track product events, not surveillance-style every-click telemetry.

Core events:

```text
landing_viewed
affordability_started
affordability_completed
affordability_signup_clicked
signup_completed
onboarding_started
onboarding_step_completed
onboarding_completed
first_plan_generated
first_plan_viewed
overview_viewed
android_connection_started
android_connected
transaction_added
transaction_reviewed
goal_created
plan_regenerated
plan_change_accepted
scenario_created
scenario_applied
ai_prompt_sent
research_result_viewed
report_exported
```

Analytics tooling can be added later; event naming should be defined now so product code remains consistent.

# 41. Feature-driven delivery modules

Each module should be independently understandable and implementable.

## F00 - Web foundation and design system

### Scope

- app shell foundations;
- theme tokens;
- typography;
- spacing;
- reusable UI state components;
- providers;
- query setup;
- SDK integration pattern;
- error boundaries.

### Definition of done

- core tokens exist;
- reusable skeleton/empty/error patterns exist;
- app provider tree is stable;
- sample SDK query works;
- keyboard/focus basics pass.

## F01 - Marketing and conversion

### Routes

- `/`
- `/how-it-works`
- `/features`
- `/security`

### Definition of done

- clear Try -> Plan -> Automate narrative;
- strong CTA hierarchy;
- real responsive layout;
- SEO metadata;
- no fake unavailable feature claims.

## F02 - Anonymous affordability tool

### Route

- `/can-i-afford-this`

### Definition of done

- short input flow;
- backend deterministic result;
- useful result before signup;
- Buy now vs Wait comparison;
- anonymous draft handoff into signup;
- error/retry state;
- no client-side finance math.

## F03 - Authentication continuity

### Scope

- login/register/reset/verify;
- anonymous-draft continuity;
- auth boot behavior.

### Definition of done

- session refresh is reliable;
- signup preserves anonymous tool context;
- auth errors are explicit;
- no redirect loops.

## F04 - Web onboarding

### Routes

- onboarding flow.

### Definition of done

- autosave/resume;
- goal-first flow;
- finance basics;
- review;
- accessible forms;
- user can skip unknown optional values.

## F05 - First plan generation and reveal

### Scope

- generation progress;
- first plan reveal;
- transition to dashboard;
- Android secondary CTA.

### Definition of done

- current plan survives generation failure;
- progress state is understandable;
- first value appears before Android promotion.

## F06 - Authenticated shell

### Scope

- sidebar;
- top bar;
- grouped navigation;
- responsive behavior;
- route protection integration.

## F07 - Overview

### Scope

- financial health;
- next-best action;
- financial future preview;
- cash flow;
- goals;
- obligations;
- drift;
- data confidence.

## F08 - Accounts and data confidence

### Scope

- accounts list/detail/add/edit;
- balance freshness;
- confirmed vs estimated;
- financial-picture indicator.

## F09 - Transactions

### Scope

- summary;
- search/filter;
- table;
- detail;
- manual entry;
- review states;
- self-transfer/card-payment semantics;
- Android source visibility.

## F10 - Goals

### Scope

- goals overview;
- goal create/edit;
- goal detail;
- AI-assisted draft;
- max-three active rule.

## F11 - Plan

### Scope

- plan overview;
- roadmap;
- projection;
- regeneration;
- risks/recommendations/assumptions.

## F12 - Plan history and drift

### Scope

- plan versions;
- compare meaningful differences;
- drift review;
- baseline confirmation.

## F13 - Scenarios

### Scope

- scenario list;
- builder;
- baseline comparison;
- save/apply/discard.

## F14 - Loans

### Scope

- loan list/detail;
- repayment visualization;
- prepayment simulation;
- scenario handoff.

## F15 - Investments

### Scope

- planning summary;
- allocation;
- SIPs;
- goal linkage;
- research entry points;
- no execution.

## F16 - AI Copilot

### Scope

- chat;
- SSE stream;
- structured cards;
- context pane;
- research sources;
- explicit mutation confirmation.

## F17 - Android connection

### Scope

- data source page;
- QR/download handoff;
- sync status;
- Android-connected states across Overview and Transactions.

## F18 - Notifications

### Scope

- notification center;
- deep links;
- priority classes;
- read states.

## F19 - Reports

### Scope

- report list;
- preview;
- PDF export action;
- report states.

## F20 - Settings, privacy, security

### Scope

- profile;
- financial details;
- notification preferences;
- data/privacy;
- sessions/security.

## F21 - Accessibility, performance, release polish

### Scope

- keyboard audit;
- focus audit;
- responsive audit;
- loading waterfall audit;
- chart accessibility;
- bundle/performance review;
- copy consistency;
- cross-browser verification.

# 42. Recommended development sequence

Do not build all public pages first and only later discover whether the actual product works.

Recommended vertical delivery:

## Phase 1 - Conversion to first value

```text
F00 Foundation
F01 Marketing
F02 Anonymous affordability
F03 Auth continuity
F04 Web onboarding
F05 First plan reveal
F06 Authenticated shell
F07 Basic Overview
```

Milestone:

> A visitor can discover the product, get a useful anonymous answer, create an account, build a first plan, and reach a useful Overview.

## Phase 2 - Planning core

```text
F10 Goals
F11 Plan
F14 Loans
F08 Accounts
```

Milestone:

> A web-only user can maintain enough financial state to use the planner seriously.

## Phase 3 - Decision tools

```text
F13 Scenarios
F16 AI Copilot
F15 Investments
```

Milestone:

> The user can explore decisions and research without changing the baseline accidentally.

## Phase 4 - Financial activity

```text
F09 Transactions
F17 Android connection
```

Milestone:

> Manual and Android-synced transaction data become visible in the same web workspace.

## Phase 5 - Living-plan lifecycle

```text
F12 Plan history and drift
F18 Notifications
```

Milestone:

> The product detects meaningful change and guides a user through reviewing it.

## Phase 6 - Reporting and release

```text
F19 Reports
F20 Settings/privacy/security
F21 Accessibility/performance/release polish
```

# 43. MVP scope

## P0

Must work well:

- landing;
- anonymous affordability result;
- auth;
- web onboarding;
- first plan reveal;
- Overview;
- accounts;
- manual transactions;
- goals;
- plan;
- roadmap;
- projection;
- loans;
- scenarios;
- AI chat;
- Android connection status/handoff.

## P1

Still expected for a strong MVP, but after P0 stability:

- full transaction review/bulk workflows;
- plan history;
- drift review;
- investments planning;
- notifications;
- reports/PDF;
- richer research presentation.

## Stretch/post-MVP

- PDF statement import;
- global command search;
- advanced keyboard workflows;
- deeper holdings analytics.

## Future

- Account Aggregator;
- browser push;
- advanced household UI;
- multi-currency product experience;
- dark mode;
- brokerage/execution integrations.

# 44. Testing strategy

## Unit/component

Prioritize:

- forms and validation;
- financial display formatting;
- filter/query-state logic;
- query invalidation behavior;
- mutation confirmation flows;
- data-confidence rendering;
- structured AI cards;
- scenario inputs;
- chart summary helpers.

Use Vitest + React Testing Library for frontend tests.

## Integration

Test critical feature flows against mocked/real test API contracts:

- anonymous result -> signup continuity;
- onboarding -> plan generation;
- plan regeneration;
- transaction edit -> overview refresh;
- scenario -> apply -> new plan;
- Android connected/disconnected states;
- auth refresh failure.

## E2E later

High-value E2E flows:

1. Anonymous calculator -> signup -> onboarding -> first plan.
2. Web-only user adds account -> transaction -> goal -> plan.
3. Create scenario -> apply -> new plan version.
4. Android-connected user sees synced transaction -> reviews it.
5. Plan drift -> accepts/rejects baseline change.

# 45. Definition of done for every feature

A feature is not complete merely because the happy-path screen exists.

Every feature should satisfy applicable items:

- routes work;
- responsive behavior works;
- API calls go through feature hooks/shared SDK;
- no duplicated finance calculations in UI;
- loading state exists;
- cached refresh behavior is sane;
- empty state exists;
- error state exists;
- stale/freshness behavior exists where relevant;
- forms preserve appropriate user input;
- keyboard navigation works;
- focus behavior works;
- screen-reader semantics are reasonable;
- feature-level tests exist for important behavior;
- mutation confirmation exists where financial state changes;
- analytics event names are wired consistently when analytics is enabled;
- copy does not claim capabilities that are not implemented;
- no giant page component or cross-feature deep imports.

# 46. Release checklist

Before considering the Next.js MVP production-ready:

## Product

- anonymous result gives genuine value;
- web-only flow reaches first plan without Android;
- Android is presented as enhancement, not hard requirement;
- baseline plan cannot change silently;
- data freshness is visible;
- transfers/card payments are represented correctly;
- investment surface does not imply execution.

## UX

- Overview has one clear next-best action;
- no page is overwhelmed by equal-priority cards;
- loading does not unnecessarily block usable cached data;
- empty states contain a next action;
- mobile-browser fallback is usable;
- critical flows work using keyboard only.

## Engineering

- Next.js contains no canonical finance engine;
- no direct DB access;
- SDK integration is consistent;
- query invalidation is targeted;
- route protection is paired with backend auth;
- build/lint/tests pass;
- core pages have error boundaries/states.

## Trust

- security/privacy pages match actual implementation;
- estimated vs confirmed balances are clear;
- financial sources/freshness are visible;
- delete/export account/data paths are understandable;
- AI-generated proposals require explicit apply/confirm.

# 47. Final product model

The web experience should be understood internally as:

```text
PUBLIC WEB
Acquire trust and demonstrate value

        |
        v
ANONYMOUS DECISION TOOL
Real utility before signup

        |
        v
WEB PLANNER
Build and understand the financial future

        |
        v
ANDROID AUTOMATION
Keep the plan connected to financial reality
```

Externally, the simplest product story is:

> **Try it. Plan it. Keep it alive.**

The website gets the user to value. The authenticated web workspace gives the user depth. Android supplies automatic transaction reality. The backend keeps both experiences on one canonical financial state and one evolving plan.
