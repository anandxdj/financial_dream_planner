# F12 — History and drift

## Release phase

Release 2 (Decision Tools).

## Dependencies

- **[F00 Foundation](F00_foundation.md)**: Visual tokens, accessible color contrasts, typography (`DM Serif Display` + `Manrope`), tabular numbers, base layout grids.
- **[F06 App shell](F06_app_shell.md)**: Sidebar layout (248px desktop / drawer below 1024px), header, top-level navigation, active route highlights.
- **[F07 Overview](F07_overview.md)**: Drift alert callouts and historical baseline link indicators.
- **[F11 Plan](F11_plan.md)**: Saved versioned snapshots, planning input revisions, recalculation triggers, and plan reveal semantics.

## Routes & Navigation Gating

- **Routes**:
  - `/dashboard/plan/history`: Paginated timeline of immutable saved plan versions, status, and drift overview.
  - `/dashboard/plan/review/[id]`: Side-by-side comparison between the active baseline plan and a historical snapshot or observed drift findings.
- **Navigation Gating**:
  - Navigation links to `/dashboard/plan/history` and `/dashboard/plan/review/[id]` must remain hidden or disabled in `DEFAULT_PLANNER_NAV` and the Plan page until backend integration tests pass.
  - No fixture-only or mock-only screens may be exposed in production navigation.

## Screens and Behavior

### 1. Version History Timeline (`/dashboard/plan/history`)
- Chronological list of saved plan snapshots ordered by `createdAt` descending.
- The active version is prominently marked with a distinct badge: `Current Baseline`.
- Each version card displays:
  - Version number (`Version X`)
  - Creation timestamp formatted with Indian date conventions (e.g. `14 Aug 2026, 03:30 PM IST`)
  - Trigger reason: `initial_generation`, `user_recalculation`, `scenario_applied`, or `drift_accepted`
  - Input revision ID and snapshot hash (`snapshotHash.slice(0, 8)`)
  - Key snapshot metrics: Monthly surplus, Emergency runway (months), Total goal contributions
  - Completeness status badge: `Complete` or `Incomplete (N missing inputs)`
  - Action link: `Review Version` -> navigates to `/dashboard/plan/review/[id]`

### 2. Meaningful Drift Review
- When household financial inputs (e.g. income, expenses, account balances, debt obligations) change relative to the active plan's baseline snapshot, drift is evaluated via the drift engine.
- Material drift triggers a persistent caution banner on Overview and Plan:
  - Summary of material drift findings (e.g. "Monthly surplus decreased by ₹15,000", "Emergency runway reduced from 6 to 3.8 months").
  - Action buttons: `Review Drift` and `Keep Baseline`.
- Clicking `Review Drift` opens the side-by-side drift review screen.

### 3. Side-by-Side Comparison Screen (`/dashboard/plan/review/[id]`)
- Two-column or tabbed interface displaying:
  - **Left / Baseline Column**: `Active Baseline (Version X)` with original inputs, engine assumptions, and outputs.
  - **Right / Comparison Column**: Selected Historical Version or Current Observed Drift Findings.
- Differential highlighting:
  - Positive changes (e.g. higher surplus, longer runway) highlighted in Sage (`#2E7D32` background tint).
  - Negative changes (e.g. increased obligations, goal at risk) highlighted in Caution Gold (`#8A531D` border/tint) or Critical Red.
  - Unchanged values displayed in standard body navy.

### 4. Immutable-Baseline Rule
- Inspecting older versions, reviewing drift, or comparing snapshots **MUST NEVER** mutate the current plan baseline (`plans.currentVersionId`) or modify active `household_planning` inputs.
- Read operations are strictly idempotent and side-effect free.

### 5. Explicit Confirmation for Mutations
- **Accepting Drift (`POST /api/v1/drift/{id}/accept`)**:
  - User clicks `Accept Drift & Update Plan`.
  - A confirmation modal displays the full delta summary.
  - Confirmation creates a **new** plan version with incremented `versionNumber`, updates `plans.currentVersionId`, and records `triggerReason: "drift_accepted"`.
  - The previous baseline remains in history, preserving an unbroken audit trail.
- **Dismissing Drift (`POST /api/v1/drift/{id}/keep`)**:
  - User clicks `Keep Baseline`.
  - Marks the drift event as `status: "kept"`.
  - The baseline plan remains unchanged; no new plan version is generated.
- **Restoring Historical Version**:
  - User clicks `Restore This Version`.
  - Modal prompts: "Restoring Version X will create a new Version Y with Version X's inputs. Your current plan will remain in history."
  - Generates a new plan version rather than rolling back pointers, maintaining append-only immutability.

## Screen States

- **Loading**:
  - Skeleton cards representing version list items with animated shimmer.
  - Comparison table renders skeleton cells for baseline and target columns.
- **Populated**:
  - Full history list with pagination controls.
  - Active baseline badge, comparison metrics with tabular numerals, and expandable snapshot details.
- **Empty with Next Action**:
  - Displayed when only 1 version exists and no drift has been recorded:
    - Text: "You are currently on your initial plan version (Version 1). As you update your planning inputs or evaluate scenarios, your version history will appear here."
    - Action CTA: `Review Current Plan` (`/dashboard/plan`).
- **Partial Error with Retry**:
  - If drift evaluation fails or history pagination errors:
    - Persistent error banner: "Unable to load plan history. [Retry]"
    - Preserves any previously loaded versions; does not blank the screen.
- **Stale / Refetching**:
  - When paginating or refreshing data, existing content remains visible with reduced opacity (0.7) and `aria-busy="true"`.
- **Offline Read State**:
  - Cached history list and reviewed versions remain accessible.
  - Action buttons (`Accept Drift`, `Restore Version`) are disabled with an offline notice: "You are offline. Reconnect to make plan changes."
- **Conflict Recovery (409 Conflict)**:
  - If another session or device accepted drift or updated the plan while the review screen was open, submitting an accept/keep action returns HTTP 409 `STALE_BASELINE`.
  - Dialog explains: "Your baseline plan was updated in another session. Please reload to review changes against the latest plan."
  - Provides a single `Reload Latest Plan` button.

## Exact API Mapping

### 1. Plan History
- **Endpoint**: `GET /api/v1/plans/history`
- **Query Parameters**:
  - `cursor`: string (optional, opaque base64 cursor)
  - `limit`: number (optional, default 25, max 100)
- **Response Schema (`200 OK`)**:
  ```json
  {
    "data": [
      {
        "version": {
          "id": "uuid",
          "planId": "uuid",
          "householdId": "uuid",
          "versionNumber": 2,
          "snapshotId": "uuid",
          "triggerReason": "drift_accepted",
          "createdAt": "2026-09-06T04:30:00.000Z"
        },
        "snapshot": {
          "id": "uuid",
          "householdId": "uuid",
          "snapshotHash": "sha256...",
          "inputs": { "cashFlow": {}, "emergencyFund": {}, "loan": {}, "investment": {}, "goal": {} },
          "engineOutputs": {
            "cashFlow": { "monthlyIncome": "120000.00", "totalOutflows": "85000.00", "monthlySurplus": "35000.00" },
            "emergencyFund": { "currentReserves": "300000.00", "runwayMonths": "4.2", "targetAmount": "425000.00" },
            "completeness": { "status": "complete", "missing": [], "warnings": [] }
          },
          "completeness": { "status": "complete", "missing": [], "warnings": [] },
          "policyVersion": "v1.0",
          "resolvedAssumptions": { "generalInflation": "6.0", "returns": { "expected": "12.0" } },
          "asOf": "2026-09-06T04:30:00.000Z",
          "createdAt": "2026-09-06T04:30:00.000Z"
        },
        "driftSummary": {
          "comparedToVersionId": "uuid",
          "isMaterial": true,
          "findingCodes": ["SURPLUS_DECREASED"],
          "findingsCount": 1,
          "findings": [],
          "deltas": {}
        }
      }
    ],
    "nextCursor": "string | undefined"
  }
  ```
- **Error Responses**: `401 Unauthorized`, `500 Internal Server Error`.

### 2. Plan Version Detail
- **Endpoint**: `GET /api/v1/plans/versions/{id}`
- **Path Parameter**: `id`: string (UUID of plan version)
- **Response Schema (`200 OK`)**:
  ```json
  {
    "data": {
      "version": {
        "id": "uuid",
        "planId": "uuid",
        "householdId": "uuid",
        "versionNumber": 2,
        "triggerReason": "user_recalculation",
        "createdAt": "2026-09-06T04:30:00.000Z"
      },
      "snapshot": {
        "id": "uuid",
        "inputs": {},
        "engineOutputs": {},
        "completeness": {},
        "resolvedAssumptions": {}
      },
      "isCurrent": false,
      "drift": {
        "isMaterial": true,
        "findings": [],
        "deltas": {}
      }
    }
  }
  ```
- **Error Responses**: `401 Unauthorized`, `404 Not Found` (`PLAN_VERSION_NOT_FOUND`).

### 3. Restore Plan Version
- **Endpoint**: `POST /api/v1/plans/restore`
- **Request Body**:
  ```json
  {
    "versionId": "uuid",
    "expectedRevision": 3
  }
  ```
- **Response Schema (`200 OK`)**:
  ```json
  {
    "data": {
      "plan": { "id": "uuid", "currentVersionId": "uuid-new" },
      "currentVersion": { "id": "uuid-new", "versionNumber": 4, "triggerReason": "user_recalculation" },
      "snapshot": { "id": "uuid", "engineOutputs": {} }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `VERSION_ID_REQUIRED`
  - `404 Not Found`: `PLAN_VERSION_NOT_FOUND`
  - `409 Conflict`: `REVISION_CONFLICT`

### 4. Current Drift Event
- **Endpoint**: `GET /api/v1/drift/current`
- **Response Schema (`200 OK`)**:
  ```json
  {
    "data": {
      "id": "uuid",
      "householdId": "uuid",
      "checkId": "uuid",
      "baselineVersionId": "uuid",
      "status": "pending",
      "findings": [
        {
          "domain": "cashFlow",
          "field": "monthlySurplus",
          "baselineValue": "45000.00",
          "observedValue": "35000.00",
          "delta": "-10000.00",
          "severity": "medium",
          "message": "Monthly surplus decreased by ₹10,000"
        }
      ],
      "policyVersion": "v1.0",
      "engineVersion": "v1.0.0",
      "observedInputs": {},
      "observedCalculatedOutput": {},
      "deltas": {},
      "createdAt": "2026-09-06T05:00:00.000Z"
    }
  }
  ```

### 5. Accept Drift
- **Endpoint**: `POST /api/v1/drift/{id}/accept`
- **Headers**: `Idempotency-Key: <uuid>`
- **Response Schema (`200 OK`)**:
  ```json
  {
    "data": {
      "event": { "id": "uuid", "status": "accepted", "createdVersionId": "uuid" },
      "plan": { "id": "uuid", "currentVersionId": "uuid" },
      "version": { "id": "uuid", "versionNumber": 3, "triggerReason": "drift_accepted" },
      "snapshot": { "id": "uuid", "engineOutputs": {} }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `NO_MATERIAL_FINDINGS` or `INVALID_STATE`
  - `404 Not Found`: `DRIFT_EVENT_NOT_FOUND`
  - `409 Conflict`: `STALE_BASELINE` (active plan moved forward since check)

### 6. Keep Baseline (Dismiss Drift)
- **Endpoint**: `POST /api/v1/drift/{id}/keep`
- **Response Schema (`200 OK`)**:
  ```json
  {
    "data": {
      "id": "uuid",
      "status": "kept",
      "resolvedAt": "2026-09-06T05:15:00.000Z"
    }
  }
  ```

## Responsive & Accessibility Behavior

### Responsive Layout (360px, 768px, 1024px, 1440px)
- **1440px (Wide Desktop)**:
  - 2-column view: 380px left pane with sticky timeline of version cards; 800px+ main pane displaying full side-by-side comparison table.
- **1024px (Small Desktop / Tablet Landscape)**:
  - Navigation drawer replaces permanent sidebar.
  - Version comparison stacks into segmented view with "Baseline" and "Comparison" toggle tabs.
- **768px (Tablet Portrait)**:
  - Single column timeline. Comparison table converts into stacked cards with clear delta callouts.
- **360px (Mobile Phone)**:
  - Cards take 100% viewport width with 16px gutters.
  - Zero horizontal page overflow (`overflow-x: hidden`).
  - Delta indicators rendered as compact badges: `+₹10,000` (Sage) or `-₹5,000` (Gold).
  - Minimum tap target size of 44x44px for all buttons and version links.

### Accessibility (WCAG 2.1 AA)
- Semantic table elements (`<table>`, `<caption>`, `<th scope="col">`, `<th scope="row">`, `<td>`).
- `aria-live="polite"` regions for drift check progress and status announcements.
- Confirmation modals implement strict focus traps, `aria-modal="true"`, `role="dialog"`, and `Escape` key listeners. Focus returns to the triggering button upon dismissal.
- High contrast: Text colors maintain >= 4.5:1 contrast ratio against Canvas Cream (`#FFF9F0`) and Surface (`#FFFCF8`).
- Numeric alignment: Currency and numeric figures use `tabular-nums` (`font-variant-numeric: tabular-nums`) with Indian numbering formatting (`en-IN` style: Lakhs/Crores).

## Analytics & Privacy Rules

- **Strict Redaction**:
  - Under no circumstances may sensitive financial amounts (balances, incomes, EMIs, expenses, surpluses) be included in analytics payloads, query parameters, or client console logs.
- **Allowed Telemetry Events**:
  - `plan_history_viewed`: `{ total_versions_count: number }`
  - `plan_version_inspected`: `{ version_number: number, trigger_reason: string }`
  - `drift_banner_viewed`: `{ severity: "low" | "medium" | "high", finding_count: number }`
  - `drift_review_opened`: `{ check_id: string }`
  - `drift_accepted`: `{ check_id: string, resulting_version_number: number }`
  - `drift_kept`: `{ check_id: string }`

## Measurable Acceptance Criteria

1. **Immutable Baseline**: Browsing history or viewing drift does not alter `plans.currentVersionId` or `household_planning.inputs`.
2. **Traceable History**: `GET /api/v1/plans/history` lists all versions with version numbers, timestamps, and trigger reasons matching the database.
3. **Drift Detection**: Material input changes generate detectable drift events with specific field deltas and severity classifications.
4. **Explicit Confirmation**: Accepting drift or restoring a version requires explicit confirmation in a modal showing itemized deltas.
5. **New Version on Accept**: Calling `/api/v1/drift/{id}/accept` creates a new version with `versionNumber = max + 1` and updates the active plan.
6. **No-op on Keep**: Calling `/api/v1/drift/{id}/keep` marks the event `kept` without creating a new version.
7. **Conflict Handling**: Concurrent baseline changes during review return 409 Conflict and present a recoverable reload UI.
8. **Responsive Compliance**: Zero horizontal scrolling or clipped text at 360px, 768px, 1024px, and 1440px viewports.
9. **Accessibility**: All interactive elements have >= 44px touch targets, full keyboard accessibility, and semantic table structures.
10. **Zero Privacy Leaks**: Automated test inspection verifies that zero monetary figures appear in telemetry events or client logs.
11. **Test Coverage**: Frontend Vitest test suite covers version listing, drift diff rendering, accept confirmation, keep actions, and 409 conflict states with >90% code coverage.
