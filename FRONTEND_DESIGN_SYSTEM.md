# Financial Dream Planner — Frontend Design System

> **Status:** Authoritative Design System Specification  
> **Target Scope:** Web Frontend Realignment (Release 1 through Release 4)  
> **Companion Document:** `FRONTEND_SCREEN_ARCHITECTURE.md`  
> **Source Plan Reference:** `FRONTEND_REALIGNMENT_PLAN.md`

---

## 1. Design System Mandate & Philosophy

### 1.1 The Product Feeling
Financial Dream Planner is a **calm, intelligent personal financial command center**, not a generic administrative dashboard, crypto exchange, or aggressive fintech app.

The user arrives looking for clarity about life decisions: *"Can I afford a new home?", "When can I retire?", "What happens if I take a sabbatical?"* The interface must convey quiet competence, mathematical integrity, and emotional reassurance.

| Desired Feeling | Banished Tropes |
| :--- | :--- |
| **Calm & Measured** | Neon trading flashes, aggressive ticker animations |
| **Trustworthy & Deterministic** | Hallucinated health scores, arbitrary progress rings |
| **Warm & Editorial** | Stark sterile SaaS tables, harsh dark-mode panels |
| **Hierarchical & Purposeful** | Equal-weight KPI grids, endless walls of identical cards |
| **Transparent & Reversible** | Silent background mutations, opaque auto-adjustments |

### 1.2 Core Product Principles Reflected in UI
1. **Outcome Before Signup**: Visitors must experience genuine, useful decision support (such as "Can I afford this?") without account friction.
2. **Plan Before Automation**: The core planning workspace is completely functional without mobile devices or SMS sync. Android is an optional freshness upgrade, never a gatekeeper.
3. **Backend Owns Financial Truth**: The Next.js frontend is purely a presentation, interaction, and validation surface. Every calculation, inflation adjustment, scenario overlay, and feasibility verdict is computed by the Express financial engine. No financial math is duplicated in React components.
4. **Explicit User Mutations**: The system never silently alters a plan snapshot. Any modification to goals, accounts, or assumptions flags a "Needs Update" or "Drift Detected" state; regenerating or restoring a plan requires an unambiguous user action.
5. **Unknown is Not Zero**: Missing financial information remains visibly labeled as "Not provided" or "Unknown". The UI must never silently convert a missing balance into ₹0.
6. **Calm, Not Gamified**: No dopamine badges, no streak counters, no artificial red panic states. Every status indicator explains *why* and points to the next logical step.

---

## 2. Color System & Semantic Tokens

### 2.1 Color Palette
The visual direction uses a **light-first, warm paper/parchment canvas** inspired by high-end financial journalism and classic notebook stationery, paired with deep navy ink for high-contrast legibility and restrained jewel tones for semantic clarity.

```text
CANVAS (Parchment)     SURFACE (Card)         BORDER (Muted Sand)
#FFF9F0                #FFFCF8                #E8E1D6

NAVY INK (Headings)    CHARCOAL (Body)        MUTED (Metadata)
#1F2A44                #344054                #475467

PURPLE (Interactive)   SAGE (Confirmed)       BLUE (Informational)
#5E55C9                #3D5C4A                #3B5B8C

GOLD (Warning/Drift)   CRIMSON (Destructive)
#7D5200                #A13F39
```

### 2.2 Token Specifications
| Token Role | Hex Code | Tailwind Token | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#FFF9F0` | `bg-canvas` (`bg-[#FFF9F0]`) | Outer page background, editorial warm paper feel |
| **Card Surface** | `#FFFCF8` | `bg-card` (`bg-[#FFFCF8]`) | Content cards, data panels, dialog backgrounds |
| **Secondary Surface**| `#F5EFE6` | `bg-muted` (`bg-[#F5EFE6]`) | Inset wells, table headers, disabled control states |
| **Primary Ink** | `#1F2A44` | `text-primary` (`text-[#1F2A44]`) | Headings, large numbers, active navigation, key CTA |
| **Body Ink** | `#344054` | `text-foreground` (`text-[#344054]`) | Descriptive body text, form labels, narrative copy |
| **Muted Ink** | `#475467` | `text-muted` (`text-[#475467]`) | Hints, metadata, table column headers, timestamps |
| **Structural Border**| `#E8E1D6` | `border-border` (`border-[#E8E1D6]`) | Card borders, dividers, table row borders |
| **Active Accent** | `#5E55C9` | `text-accent` (`text-[#5E55C9]`) | Primary interactive buttons, focus rings, active tabs |
| **Sage / Confirmed** | `#3D5C4A` | `text-sage` (`text-[#3D5C4A]`) | On-track goals, verified data, saved status, surpluses |
| **Functional Blue** | `#3B5B8C` | `text-blue` (`text-[#3B5B8C]`) | Scenarios, informative badges, timeline indicators |
| **Warning Gold** | `#7D5200` | `text-gold` (`text-[#7D5200]`) | Plan drift, tight buffers, over-allocation warnings |
| **Destructive Red** | `#A13F39` | `text-destructive` (`text-[#A13F39]`) | Delete confirmations, critical validation failures |

### 2.3 WCAG 2.1 AA Contrast Compliance Matrix
All foreground colors meet or exceed WCAG 2.1 Level AA (>= 4.5:1 for body text, >= 3.0:1 for large text/icons) against both `#FFF9F0` (Canvas) and `#FFFCF8` (Card Surface):

| Design Token | Color Value | Ratio vs `#FFFCF8` (Card) | Ratio vs `#FFF9F0` (Canvas) | Compliance Rating |
| :--- | :--- | :--- | :--- | :--- |
| **Navy Ink** | `#1F2A44` | **13.94:1** | **13.62:1** | **AAA** (Standard & Large) |
| **Charcoal Body** | `#344054` | **10.23:1** | **9.99:1** | **AAA** (Standard & Large) |
| **Muted Ink** | `#475467` | **7.52:1** | **7.34:1** | **AAA** (Standard & Large) |
| **Sage Green** | `#3D5C4A` | **7.26:1** | **7.09:1** | **AAA** (Standard & Large) |
| **Warning Gold** | `#7D5200` | **6.67:1** | **6.52:1** | **AA** (Standard) / **AAA** (Large) |
| **Functional Blue**| `#3B5B8C` | **6.71:1** | **6.55:1** | **AA** (Standard) / **AAA** (Large) |
| **Brand Purple** | `#5E55C9` | **5.67:1** | **5.54:1** | **AA** (Standard) / **AAA** (Large) |
| **Destructive Red**| `#A13F39` | **5.82:1** | **5.69:1** | **AA** (Standard) / **AAA** (Large) |

### 2.4 Focus Ring Token
To guarantee keyboard accessibility across all interactive elements:
- Focus ring: `outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF9F0]`

---

## 3. Typography System

### 3.1 Typefaces
- **Primary Interface Font: Manrope (`font-sans`)**  
  Used for body copy, form inputs, buttons, navigation, metadata, and data tables. Clean geometric structure with excellent legibility at micro sizes.
- **Editorial Display Font: DM Serif Display (`font-serif`)**  
  Used selectively for primary page headlines, hero questions, section headers, and dominant monetary totals. **Never** used for compact tables, data grids, or form controls.
- **Tabular Numerals: `tabular-nums`**  
  Mandatory on every monetary amount, milestone date, percentage, and metric counter to guarantee clean vertical alignment.

### 3.2 Typographic Hierarchy
| Level | Font Family | Size | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display 1** | DM Serif Display | `text-4xl sm:text-5xl` (36-48px) | 400 Regular | `-0.02em` | Hero landing statements |
| **Heading 1** | DM Serif Display | `text-3xl sm:text-4xl` (30-36px) | 400 Regular | `-0.01em` | Screen titles (`/dashboard`, `/plan`) |
| **Heading 2** | DM Serif Display | `text-2xl sm:text-3xl` (24-30px) | 400 Regular | `normal` | Major section containers, dominant metrics |
| **Heading 3** | Manrope | `text-lg sm:text-xl` (18-20px) | 600 SemiBold | `normal` | Sub-section cards, dialog headers |
| **Body Large** | Manrope | `text-base` (16px) | 400 / 500 | `normal` | Lead paragraphs, hero descriptions |
| **Body Regular**| Manrope | `text-sm` (14px) | 400 Regular | `normal` | Main narrative copy, table rows, form inputs |
| **Caption** | Manrope | `text-xs` (12px) | 500 Medium | `+0.01em` | Metadata, hints, input helper text, source labels |
| **Micro / Overline**| Manrope | `text-[10px]` (10px) | 700 Bold | `+0.08em uppercase` | Category chips, status pill overlines |

---

## 4. Component Architecture & Consolidation Strategy

### 4.1 The 80/20 Component Ratio
To avoid maintaining a fragile custom UI abstraction layer, the frontend strictly adheres to:
- **80–90% Library Primitives**: Reusable, accessible shadcn/Radix components in `frontend/src/components/ui/`.
- **10–20% Finance-Specific Primitives**: Custom domain components in `frontend/src/components/finance/` (or `components/planner/`) encoding financial meaning.

### 4.2 Banished Custom Abstractions
The following fragmented patterns must be collapsed into standard primitives:
1. **Generic Tailwind string exports** (`export const control = ...`, `export const action = ...`, `export const secondary = ...` in `features/planner/ui.tsx`).
2. **Parallel custom Button wrappers** (`ControlButton` in `components/planner/controls.tsx` vs `Button` in `components/ui/button.tsx`).
3. **Parallel custom Panel wrappers** (`Panel` in `components/planner/panel.tsx` vs `Card` in `components/ui/card.tsx` vs `Panel` in `features/planner/ui.tsx`).
4. **Parallel custom Input wrappers** (`ControlInput` in `components/planner/controls.tsx` vs `Input` in `components/ui/input.tsx` vs `Field` in `features/planner/ui.tsx`).

### 4.3 Required Library Primitives (`components/ui/`)
All generic primitives reside in `components/ui/`:
```text
components/ui/
  ├── button.tsx           # Radix Slot based, variants: default, secondary, outline, ghost, destructive
  ├── card.tsx             # Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
  ├── input.tsx            # Accessible input with 16px mobile font-size
  ├── textarea.tsx         # Multi-line input
  ├── label.tsx            # Radix Label primitive
  ├── select.tsx           # Radix Select primitive with accessible trigger and popup
  ├── checkbox.tsx         # Radix Checkbox primitive
  ├── radio-group.tsx      # Radix RadioGroup
  ├── tabs.tsx             # Radix Tabs with keyboard focus management
  ├── dialog.tsx           # Modal dialog with focus trap and background backdrop
  ├── sheet.tsx            # Slide-out drawer for mobile navigation and detailed inspectors
  ├── table.tsx            # Semantic table (table, thead, tbody, th, td, caption)
  ├── dropdown-menu.tsx    # Accessible dropdowns for user profile and action menus
  ├── popover.tsx          # Contextual information popover
  ├── tooltip.tsx          # Accessible tooltips for financial formulas and assumptions
  ├── badge.tsx            # Shared badge primitive with semantic tone variants
  ├── progress.tsx         # Accessible progress bar (`role="progressbar"`)
  ├── skeleton.tsx         # Pulse loading placeholders matching exact container dimensions
  ├── alert.tsx            # Alert, AlertTitle, AlertDescription for inline feedback
  ├── separator.tsx        # Subtle visual dividers
  └── sonner.tsx           # Accessible notification toasts
```

### 4.4 Finance-Specific Domain Primitives
Custom components exist solely to encode **financial meaning and data contracts**:

#### 1. `Money` (`components/finance/money.tsx`)
- Formats decimal string amounts via `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
- Handles large numbers with standard Indian numbering (`₹12.5 L`, `₹1.8 Cr`).
- Handles `null`, `undefined`, and `""` with explicit `"Not provided"` or `"Unknown"` fallback (never `₹0`).
- Always applies `font-mono tabular-nums`.

#### 2. `SourceBadge` (`components/finance/source-badge.tsx`)
- Displays provenance of data:
  - **Manual**: user entered manually in onboarding/settings.
  - **Android SMS**: synchronized from on-device financial SMS.
  - **Estimated**: flagged as approximate by the user.
  - **Calculated**: produced by the backend planning engine.

#### 3. `FreshnessBadge` (`components/finance/freshness-badge.tsx`)
- Indicates data currency:
  - **Fresh**: verified within last 7 days.
  - **Stale**: balances or inputs have changed since last plan snapshot.
  - **Needs Review**: recorded transactions conflict with active assumptions.

#### 4. `GoalProgress` (`components/finance/goal-progress.tsx`)
- Visualizes saved balance vs target amount.
- Displays target completion date, monthly contribution requirement, and status pill (On track / At risk).

#### 5. `PlanVersionHeader` (`components/finance/plan-version-header.tsx`)
- Displays active plan version number (e.g., `Version 2`), generated timestamp, and revision drift alerts.
- Provides explicit trigger for `"Update Plan"`.

#### 6. `TradeoffComparison` (`components/finance/tradeoff-comparison.tsx`)
- Side-by-side comparison cards (e.g. "Buy Now" vs "Save First" or "Current Plan" vs "With Car").
- Clearly articulates impacts on emergency runway, goal target dates, and monthly surplus.

#### 7. `ChartFallback` (`components/finance/chart-fallback.tsx`)
- Semantic HTML table alternative for any chart visualization.
- Accessible to screen readers with column headers (`<th scope="col">`), row headers (`<th scope="row">`), tabular numerals, and expandable `<details>` disclosure.

---

## 5. Visual & Asset Architecture

### 5.1 Asset Catalog Audit
The repository contains 241 raster assets in `frontend/public/Assets/`.
- **Hero Characters**: `woman_with_laptop.png`, `woman_writing_journal.png`, `purple_car_front.png`.
- **Houses & Goals**: `savings_jar_home.png`, `cozy_first_home.png`, `premium_home.png`.
- **Editorial Watercolor Touches**: `purple_watercolor_stroke.png`, `gold_watercolor_stripe.png`, `leafy_branch.png`.
- **UI & Chat**: Category circles (`amazon_icon_circle.png`, `fuel_icon_circle.png`), chat bubbles.

### 5.2 Asset Defect Inventory & Remediation
1. **Defect 1: Pre-Baked UI Raster Cards Faking Data**  
   - *Offending Assets*: `affordability_score.png`, `financial_health_card.png`, `net_worth_dashboard.png`, `spending_insights_chart.png`, `debt_trend_chart.png`.  
   - *Problem*: These assets contain hardcoded numbers, fake health scores, and blurry raster text that mislead users and violate Principle 6.6 (*Calm, not gamified; no fake health scores*).  
   - *Remediation Rule*: **Banned from all production screens.** Replace entirely with live HTML/CSS components fed by real API responses.
2. **Defect 2: Unencoded Spaces in File System Paths**  
   - *Problem*: Subfolders like `Assets/Finance UI/`, `Assets/Icons And Misc/`, `Assets/Cards And Charts/` break in environments where URLs are not automatically URI-encoded.  
   - *Remediation Rule*: Standardize import constants via `lib/assets.ts` with URI-encoded paths (e.g., `/Assets/Finance%20UI/...`) or rename folders in an approved asset maintenance pass.
3. **Defect 3: Inaccurate Accessibility Metadata**  
   - *Problem*: In `frontend/src/lib/assets.ts`, purely decorative watercolor strokes and foliage elements have `isDecorative: false` with meaningless alt text like `"Leaf branch four"`.  
   - *Remediation Rule*: Mark all background splashes, foliage, and accents as `isDecorative: true` (`aria-hidden="true"`, empty `alt=""`).

---

## 6. Responsive & Layout Foundations

### 6.1 Breakpoint Standards
The design system supports four mandatory responsive breakpoints:

```text
360px (Mobile)       768px (Tablet)       1024px (Landscape)   1440px (Desktop Canvas)
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Single-col   │     │ 2-col stack  │     │ Sidebar +    │     │ 248px side + │
│ Linear flow  │     │ Preserved    │     │ Multi-col    │     │ 68px header  │
│ 16px gutter  │     │ 24px gutter  │     │ Drawer off   │     │ Full command │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

| Breakpoint | Window Width | Gutter / Padding | Layout Behavior |
| :--- | :--- | :--- | :--- |
| **Mobile** | `360px` | `px-4` (16px) | Single column vertical stack, bottom sheets, mobile drawer |
| **Tablet Portrait** | `768px` | `px-6` (24px) | 2-column paired grids, stacked comparison tables |
| **Tablet Landscape**| `1024px` | `px-8` (32px) | Persistent 248px sidebar docked, multi-column analytics |
| **Wide Desktop** | `1440px` | `max-w-7xl mx-auto` | Max 1440px planning workspace canvas, 65/35 detail splits |

### 6.2 Horizontal Overflow Zero-Tolerance Rule
Under no circumstances may any route exhibit horizontal page scroll (`document.documentElement.scrollWidth > window.innerWidth`).
- Global rule in `globals.css`:
  ```css
  html, body {
    max-width: 100%;
    overflow-x: clip;
    -webkit-text-size-adjust: 100%;
  }
  ```

### 6.3 Touch Targets & Mobile Form Scaling
- **Minimum Interactive Touch Target**: Every interactive element (button, icon trigger, dropdown item, navigation link) must have a minimum bounding rect of **44x44px** (Tailwind `min-h-11 min-w-11` or accessible touch padding).
- **iOS Safari Auto-Zoom Prevention**: All text inputs and dropdown selects must utilize responsive text sizing: `text-base sm:text-sm` (16px on mobile viewports to prevent iOS auto-zoom, scaling to 14px on desktop).

---

## 7. Standard 6-State Visual Architecture

Every production route and data-bound panel must explicitly support six distinct states:

```text
1. LOADING        ──► Skeleton placeholders matching exact final dimensions
2. POPULATED      ──► Calm, high-contrast display with visible provenance
3. EMPTY          ──► Helpful narrative explanation + explicit primary CTA
4. PARTIAL ERROR  ──► Section-level alert with Retry control; never blank the page
5. STALE/REFETCH  ──► Existing data remains visible with subtle "Updating…" indicator
6. OFFLINE READ   ──► Cached plan visible with "Offline — changes will not save" badge
```

1. **Loading State**: Content-shaped skeletons (`Skeleton` component). Avoid spinner-only screens or full-page blocking loaders.
2. **Populated State**: Balanced visual hierarchy, tabular numbers, clear provenance labels.
3. **Empty State**: Clear explanation of why data is absent, accompanied by a single primary action link (e.g., *"No goals yet. Add a goal to give your plan direction."*).
4. **Partial Error State**: Isolated to the failing panel using an `Alert` with a `"Try again"` button. Unrelated sections remain fully functional.
5. **Stale / Needs-Update State**: Populated content remains fully readable; an amber banner or badge indicates that underlying inputs have changed since plan creation.
6. **Offline Read State**: Read-only display of cached TanStack Query data with clear notification that mutations are disabled until connection is restored.
