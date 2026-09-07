# Financial Dream Planner — UI Realignment PRD

> **Status:** Implementation source of truth  
> **Branch:** `ai-architecture-realignment`  
> **Scope:** Web frontend design-system consolidation, screen realignment, responsive/accessibility polish, and removal of misleading/demo financial UI behavior  
> **Companion docs:** `FRONTEND_DESIGN_SYSTEM.md`, `FRONTEND_SCREEN_ARCHITECTURE.md`

---

## 1. Objective

Realign the existing Next.js product into a coherent, premium, India-first **Financial Command Center** that feels calm, human, editorial, trustworthy, and mathematically rigorous.

This is **not** a redesign from zero. The repository already contains the correct product direction, a large branded asset library, and eleven reference boards. The implementation must converge on those references while preserving existing product flows and the newly-corrected backend AI/scenario architecture.

The resulting UI must answer one question consistently:

> **“Where do I stand, what changed, and what should I review next?”**

The interface must never look like a generic SaaS admin panel, stock-trading terminal, crypto dashboard, or generic AI chat product.

---

## 2. Source-of-truth hierarchy

When design sources disagree, use this order:

1. `UI_REALIGNMENT_PRD.md` — this document.
2. Product/business invariants enforced by backend APIs.
3. Reference boards in `frontend/public/refferne_image/`.
4. `FRONTEND_SCREEN_ARCHITECTURE.md`.
5. `FRONTEND_DESIGN_SYSTEM.md`.
6. Current frontend implementation.

Current implementation is evidence, **not authority**, when it conflicts with backend ownership of financial truth or the design references.

---

## 3. Reference-board catalog

The repository contains eleven product reference boards. They are the visual/flow reference for the implementation.

| Board | File | Primary implementation scope |
| --- | --- | --- |
| 01 | `01_landing_and_marketing_flow.png` | Landing, public product story, pricing, calculator entry points |
| 02 | `02_auth_and_verification_flow.png` | Login, register, verify email, password recovery |
| 03 | `03_onboarding_welcome_and_goals.png` | Onboarding welcome, goal selection, goal setup |
| 04 | `04_onboarding_financials_and_generation.png` | Income, expenses, balances, loans/investments, review/generation |
| 05 | `05_dashboard_overview.png` | Financial Command Center / Overview |
| 06 | `06_transactions_accounts_and_sync.png` | Transactions, accounts, source/freshness, Android sync |
| 07 | `07_goals_management_workspace.png` | Goals list, goal detail, contribution/feasibility workspace |
| 08 | `08_financial_plan_and_scenarios.png` | Plan, plan history, scenarios, loans/investments decision tools |
| 09 | `09_ai_copilot_reports_and_settings.png` | AI Copilot, reports, settings |
| 10 | `10_help_support_pricing_and_referral.png` | Help/support, pricing/referral/support surfaces |
| 11 | `11_master_product_journey_overview.png` | Whole journey consistency and cross-screen hierarchy |

Reference images guide layout, density, visual rhythm, and product story. They must **not** be used as rasterized UI or as fake data screenshots inside authenticated screens.

---

## 4. Research synthesis — 2026 finance UX patterns

Research reviewed current public guidance and product behavior from Copilot Money, YNAB, Origin, and current 2026 fintech dashboard UX literature.

### 4.1 Patterns to adopt

1. **The first viewport answers one financial question.**
   - Do not open with four equal KPI cards competing for attention.
   - Overview should lead with status + next action, then support it with money reality.

2. **Summaries must drill into evidence.**
   - Cash-flow summaries link to transactions.
   - Goal status links to goal detail.
   - AI assertions expose sources/provenance.
   - Plan values expose plan version / as-of information.

3. **Freshness and scope are first-class UI.**
   - Distinguish planned vs recorded money.
   - Show plan version, snapshot date, source and freshness where relevant.
   - Loading, empty, stale, partial and failed states must be visibly different.

4. **Financial changes require deliberate friction.**
   - AI may propose and explain.
   - Scenario changes must be reviewed.
   - Applying a scenario remains an explicit user action.
   - Destructive actions use confirmation and plain language.

5. **Goal planning works best as progress + required next contribution.**
   - Users need target, saved amount, required monthly contribution, target date and feasibility status together.

6. **Charts answer a specific question or are removed.**
   - Line: change over time.
   - Bar: period/category comparison.
   - Table/text: precise values.
   - No decorative donut/chart just to fill a card.

7. **Desktop web should exploit desktop space instead of cloning mobile.**
   - Persistent navigation at desktop.
   - Detail panels and comparison workspaces can use asymmetric columns.
   - Mobile becomes a linear decision narrative.

### 4.2 Patterns to reject

- AI “health scores” without deterministic policy definitions.
- Fake social proof or unsourced customer/goal numbers.
- Raster screenshots masquerading as live financial cards/charts.
- Equal-weight KPI walls.
- Neon finance/crypto styling.
- Excessive gradients/glassmorphism.
- Red as decoration.
- Silent demo-data substitution after real API failure.
- Missing values silently displayed as zero.
- Client-side canonical financial calculations.

---

## 5. Product-design principles

### 5.1 Calm authority
The product should feel like a trusted financial notebook crossed with a premium planning workspace: warm paper, clean white working surfaces, dark ink, restrained accents, and strong hierarchy.

### 5.2 Outcome before abstraction
Prefer:
- “You have ₹38,000 of monthly capacity”
- “Your home goal needs ₹42,800/month”
- “Your plan changed because income was edited”

Avoid exposing backend vocabulary such as canonical ledger, immutable snapshots, graph nodes, policy engine, or LangGraph unless in an advanced technical/audit disclosure.

### 5.3 Unknown is not zero
`null`, missing and unavailable values display as **Not provided**, **Not recorded**, **Unavailable**, or **Needs review** depending on semantics.

### 5.4 Backend owns financial truth
The frontend may format, sort, filter and visualize backend values. It must not be the canonical calculator for:
- net worth,
- surplus / savings rate,
- goal feasibility,
- compound projections,
- scenario impact,
- emergency-fund sufficiency,
- loan payoff,
- investment projections,
- policy or affordability verdicts.

### 5.5 AI proposes; humans apply
AI output is narrative assistance plus structured, engine-backed proposals. It never silently mutates the user’s plan.

---

## 6. Locked visual system

### 6.1 Color tokens

Use semantic tokens everywhere. Avoid one-off hex values except within the token definition itself.

```text
Canvas                #FFF9F0
Surface / Card        #FFFCF8
Surface Strong        #FFFFFF
Surface Muted         #F5EFE6
Border                 #E8E1D6
Ink / Heading          #1F2A44
Body                   #344054
Muted                  #475467
Primary Purple         #5E55C9
Positive / Sage        #3D5C4A
Information Blue       #3B5B8C
Warning Gold           #7D5200
Destructive Red        #A13F39
```

Semantic rules:
- Purple = selected / primary interaction / current planning state.
- Sage = confirmed, on-track, positive, verified.
- Blue = informational, scenario/plan context, provenance.
- Gold = drift, tight capacity, review needed.
- Red = destructive or genuinely critical invalid state only.

### 6.2 Typography

Reduce the current six-font stack to three intentional roles:

- **Manrope** — primary product UI, navigation, body, forms, tables, metrics.
- **DM Serif Display** — editorial display/headlines and selected dominant numbers only.
- **Kalam** — rare handwritten accent on marketing/editorial moments only.

Rules:
- No Playfair/Plus Jakarta precedence in product UI.
- No script font in tables/forms.
- Monetary values and percentages use `tabular-nums`.
- Dense financial values favor Manrope over serif.

### 6.3 Shape

```text
Controls             10px radius
Standard cards       16px radius
Large narrative card 20px radius
Hero / editorial     24px max
Pills                 full radius only for status/chips
```

Avoid using `rounded-3xl` as the default card treatment.

### 6.4 Elevation

- Default surfaces: border-first, near-zero shadow.
- Active/floating surfaces: subtle one-step elevation.
- Modals/sheets: stronger elevation.
- Never rely on shadow alone for hierarchy.

### 6.5 Motion

Motion is functional, 150–250ms by default:
- disclosure expansion,
- sheet/dialog transitions,
- tab changes,
- scenario compare transitions,
- toast/status confirmation.

No looping decorative animations in authenticated planning screens.
Respect `prefers-reduced-motion`.

---

## 7. Component architecture

### 7.1 Generic UI primitives

Generic accessible controls live only in `frontend/src/components/ui/`.

Required primitives:
- Button
- Card
- Input
- Textarea
- Label
- Select
- Checkbox
- Radio Group
- Tabs
- Dialog
- Sheet
- Table
- Dropdown Menu
- Popover
- Tooltip
- Badge
- Progress
- Skeleton
- Alert
- Separator
- Sonner

Do not maintain a second generic component system under `components/planner/` or `features/planner/ui.tsx`.

### 7.2 Finance-domain primitives

Shared financial meaning belongs in `components/finance/`:

- `Money`
- `SourceBadge`
- `FreshnessBadge`
- `GoalProgress`
- `PlanVersionHeader`
- `FinancialMetric`
- `TradeoffComparison`
- `ScenarioDelta`
- `DataStateNotice`
- `ChartFallback`

These components may encode finance-specific semantics but must not calculate canonical financial truth.

### 7.3 Feature ownership

Every domain feature owns its internal UI/data orchestration:

```text
features/<feature>/
├── components/
├── hooks/
├── services/
├── types/
├── schemas/     # only if actually needed
├── utils/       # presentation-only utilities
└── index.ts
```

Question to ask: **“What feature owns this?”**, not “What type of file is this?”

---

## 8. Asset strategy

The repository already contains branded categories such as:
- Characters
- Houses
- Botanical
- Backgrounds
- Effects
- Chat
- Finance UI
- Cards / Charts
- Icons / misc

### Use assets for
- human editorial moments,
- goal illustrations,
- onboarding encouragement,
- empty states,
- marketing story,
- subtle botanical/watercolor decoration.

### Do not use raster assets for
- live account balances,
- live KPI cards,
- live charts,
- plan calculations,
- AI results,
- goal progress values,
- anything whose numeric content can become stale or misleading.

Authenticated screens should generally use **less illustration density** than marketing/onboarding.

---

## 9. Navigation & shell

### Desktop
- 248px persistent sidebar.
- Primary nav:
  - Overview
  - Goals
  - Transactions
  - Plan
  - AI Copilot
  - Reports
  - Settings
- Accounts belongs under Transactions context.
- Scenarios, Loans and Investments belong under Plan context.
- Notifications accessible from account/footer area.

### Tablet/mobile
- Compact top bar + accessible Sheet navigation.
- Focus trap, Escape close, focus restoration.
- Main content gutters: 16px mobile, 24px tablet, 32px desktop.
- Minimum touch target: 44×44px.

### Shell rule
Navigation should disappear visually when the user is in a focused onboarding/auth flow.

---

## 10. Screen PRDs

### 10.1 Landing / marketing — Board 01

**Question:** Why should I trust this product to help with real financial decisions?

First viewport:
- concise editorial headline around life decisions,
- primary CTA: build plan,
- secondary CTA: try affordability,
- single branded character/art composition,
- three trust statements that are verifiable.

Required sections:
1. Hero
2. Try → Plan → Keep Current product loop
3. Trade-off example using UI components, not rasterized fake dashboard
4. Goals/life decisions
5. How data stays current
6. Privacy/trust
7. Pricing (only real pricing)
8. FAQ
9. Footer

**Ban:** unsourced `100K+`, `4.8`, `₹1.2Cr+` style metrics.

### 10.2 Authentication — Board 02

**Question:** Can I safely enter/return to my financial workspace?

- Two-column editorial shell on desktop; single-column on mobile.
- Form area is compact and calm.
- Side illustration explains the product benefit instead of generic auth artwork.
- Verification/recovery states use the same shell.
- Error copy is specific and actionable.

### 10.3 Onboarding — Boards 03 & 04

**Question:** Can I create a useful plan without feeling like I am filling out a tax form?

Required journey:
1. Welcome / intent
2. Goals (max 3 active)
3. Income & stability
4. Expenses / obligations
5. Balances / emergency context
6. Optional loans
7. Optional investments
8. Review
9. Generate
10. Completion

The existing richer multi-step flow may remain if it maps cleanly to the reference journey, but it must be moved under `features/onboarding/` and visually normalized.

Must include:
- visible save state,
- progress state,
- estimated/source labels,
- clear optionality,
- review screen before plan generation,
- plan generation state that never invents progress percentages.

### 10.4 Overview / Financial Command Center — Board 05

**Question:** Where do I stand today, what changed, and what needs my attention?

Hierarchy:
1. Greeting + PlanVersionHeader
2. Dominant next-action / drift banner
3. Current monthly reality
4. Roadmap / milestone preview
5. Active goals (max 3)
6. Recorded vs planned reality
7. Source/freshness panel
8. Recent transactions / drill-down

Do **not** lead with four equal KPI cards.

All values come from backend/current plan/ledger APIs. No `demoStore` fallback in authenticated production paths.

### 10.5 Transactions, Accounts & Sync — Board 06

**Question:** What actually happened to my money, where did it come from, and how fresh is the data?

Transactions:
- desktop-first table/list,
- clear date, merchant/payee, category, account, direction, amount, source,
- filters and search,
- selected transaction detail in side panel/dialog,
- empty/error/loading states.

Accounts:
- asset/liability groups,
- balance + freshness + source,
- manual account actions,
- Android sync optionality clearly explained.

Sync:
- never imply a connected bank integration when only manual/SMS is supported,
- explicit last synced time,
- source badges.

### 10.6 Goals workspace — Board 07

**Question:** Am I on track, what monthly contribution is required, and what trade-off does a change create?

Goals list:
- max 3 active emphasized,
- target / saved / contribution / date / status,
- add goal when capacity exists.

Goal detail:
- goal progress,
- current trajectory,
- backend feasibility,
- inflation/policy disclosure when available,
- impact on other goals,
- edit action,
- remove confirmation.

No client-side feasibility math.

### 10.7 Plan + Scenarios + Loans + Investments — Board 08

**Question:** What is my official roadmap, and what happens if I change one assumption?

Plan:
- version header,
- drift state,
- financial snapshot,
- long-term roadmap,
- active goals inventory,
- risks/bottlenecks,
- assumptions/provenance.

Scenarios:
- baseline vs scenario,
- clear changed inputs,
- engine-evaluated deltas,
- user must review before apply,
- draft/run/apply states visibly distinct.

Loans/Investments:
- decision tools, not trading surfaces,
- emphasize payoff/projection/goal impact rather than market excitement.

### 10.8 AI Copilot — Board 09

**Question:** Can the product explain my plan and help me test a decision without pretending AI is the calculator?

Layout:
- conversation workspace,
- optional history,
- optional financial-context panel,
- source-aware assistant messages,
- structured proposal cards,
- proposal review modal,
- scenario staging confirmation.

Language:
- “Engine-backed” / “Grounded in Plan vX”.
- Never label the LLM itself “deterministic”.

Run UX:
- queued/planning state,
- recoverable SSE reconnect,
- failure state,
- cancellation when exposed,
- conversation refresh after completion.

### 10.9 Reports & Settings — Board 09

Reports:
- export/summary surfaces only when backed by real data,
- date/as-of/version visible,
- no fake report thumbnails.

Settings:
- profile,
- financial data/source preferences,
- privacy/data lifecycle,
- optional Android connection state,
- AI-related controls only when backend behavior supports them.

### 10.10 Help / Support / Pricing / Referral — Board 10

- simple searchable help/support structure,
- clear product limitations,
- real pricing only,
- referral only if actual referral backend/program exists,
- human-readable privacy/security explanations.

### 10.11 Master journey — Board 11

Every route should preserve the same mental model:

```text
TRY A DECISION
      ↓
BUILD THE BASELINE
      ↓
SEE THE PLAN
      ↓
KEEP REALITY CURRENT
      ↓
TEST A SCENARIO
      ↓
REVIEW BEFORE APPLYING
```

---

## 11. Data and state rules

Every data surface must intentionally handle:

1. Loading
2. Populated
3. Empty
4. Partial data
5. Error
6. Stale / needs review
7. Unauthorized/session-expired where relevant

### Failure isolation
If one dashboard panel fails, dependable sibling panels remain visible when safe.

### Demo data
- Public demo/calculator experiences may use explicit example/demo states.
- Authenticated production screens must never silently replace failed API data with demo values.
- Demo mode, when intentionally provided, must be visually labeled.

---

## 12. Accessibility requirements

- WCAG 2.1 AA minimum.
- Visible `focus-visible` state on every interactive control.
- 44px minimum touch target.
- Form controls have programmatic labels.
- Dialog/sheet focus trap and focus restoration.
- Escape closes dialogs/sheets where expected.
- Charts have semantic/table fallback.
- Status is not communicated by color alone.
- Currency values use readable Indian formatting.
- Mobile inputs stay >=16px where browser zoom can be triggered.
- Respect reduced motion.

---

## 13. Responsive rules

### 360–767px
- single-column decision narrative,
- 16px gutters,
- horizontal data tables become cards or deliberate horizontal scroll,
- sticky action bars only when they materially help completion.

### 768–1023px
- 24px gutters,
- 2-column cards selectively,
- drawer navigation.

### 1024–1440px+
- persistent 248px sidebar,
- max content width ~1400px,
- asymmetric grids preferred for decision workspaces,
- avoid stretching text beyond readable measure.

---

## 14. Technical implementation plan

### Phase UI-0 — Foundation
- Normalize fonts.
- Normalize semantic color tokens.
- Normalize radii/elevation.
- Complete generic UI primitives as needed.
- Add missing finance primitives.
- Convert `components/planner/*` generic wrappers into compatibility re-exports, then remove imports feature-by-feature.

### Phase UI-1 — Public + Auth
- Landing
- Affordability
- Auth/verification/recovery
- Remove fake public social proof

### Phase UI-2 — Onboarding
- Move implementation from `features/planner/onboarding` → `features/onboarding`.
- Preserve behavior/tests.
- Normalize all steps to design system.

### Phase UI-3 — Financial Command Center
- Modularize Overview.
- Remove `demoStore` authenticated fallback.
- Remove frontend financial truth calculations.
- Recompose to next-action-first hierarchy.

### Phase UI-4 — Core money management
- Accounts
- Transactions
- Goals list/detail
- Shared provenance/freshness visuals

### Phase UI-5 — Planning decisions
- Plan
- Plan history/drift
- Scenarios
- Loans
- Investments

### Phase UI-6 — AI, Reports, Settings, Help
- Finish AI visual consistency after architecture migration.
- Reports/settings/help consistency.

### Phase UI-7 — Cleanup
- Remove unused legacy planner UI wrappers.
- Remove unused assets/imports.
- Remove duplicate font/token definitions.
- Accessibility pass.
- Responsive pass.
- Build/test/lint verification.

---

## 15. Implementation acceptance criteria

The realignment is complete only when all of the following are true:

### Visual system
- [ ] Manrope + DM Serif + optional Kalam only.
- [ ] No conflicting canvas/card token sets.
- [ ] Generic controls come from `components/ui`.
- [ ] Finance semantics come from `components/finance`.
- [ ] Card/control radii follow locked scale.

### Financial correctness
- [ ] No authenticated `demoStore` fallback after API errors.
- [ ] No canonical financial calculations in React.
- [ ] Missing values do not silently become zero.
- [ ] AI-generated financial proposals are engine-evaluated before display.

### UX
- [ ] Overview leads with next action/status rather than KPI grid.
- [ ] Plan version/freshness/provenance visible where material.
- [ ] Scenario review is explicit before apply.
- [ ] AI narrative is clearly separated from deterministic calculation provenance.
- [ ] Public marketing contains no unsourced social proof.

### Architecture
- [ ] `features/planner` is no longer a product mega-bucket.
- [ ] Onboarding implementation is owned by `features/onboarding`.
- [ ] Large feature views are decomposed by responsibility.
- [ ] App routes remain thin composition layers.

### Quality
- [ ] Existing functional tests preserved or replaced with equivalent coverage.
- [ ] New critical UI state tests added.
- [ ] Frontend test suite passes.
- [ ] Frontend lint passes.
- [ ] Next.js production build passes.
- [ ] Manual responsive review at 360px, 768px, 1024px, 1440px.

---

## 16. Non-goals for this pass

- Dark mode.
- Crypto/trading features.
- New financial calculations in the browser.
- New banking aggregation providers.
- A visual rewrite of the Android app.
- Animation-heavy marketing experiments.
- New component libraries when shadcn/Base UI can satisfy the need.

---

## 17. Final quality bar

A finished screen should be able to pass this test:

> A user should understand the financial meaning of the screen in under five seconds, know whether the data is current, know what action is safe to take next, and never have to wonder whether a displayed financial number came from real saved data, a deterministic engine, AI text, or a demo fallback.
