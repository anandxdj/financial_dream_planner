# F00 - Web Foundation & Design System

## Objective
Create the stable Next.js UI foundation every later feature uses.

## Scope
- tokenized light theme
- typography, spacing, radius, semantic state roles
- providers and TanStack Query setup
- shared SDK integration pattern
- AppShell primitives
- Skeleton, EmptyState, ErrorState, InlineError
- accessible Button/Input/Dialog/Sheet/Tooltip/Badge/DataTable foundations

## Architecture rules
- Next.js does not own financial math or persistence.
- Generated SDK is never manually edited.
- Feature hooks wrap SDK calls.
- Page components are composition layers.
- Zustand only for small cross-component UI state.

## Acceptance criteria
- providers boot without auth/query loops
- keyboard focus is visible
- components have disabled/loading/error states where meaningful
- no feature-specific business logic in global components
- build/lint/tests pass
