# Task 003: Page Transition Component

> **depends-on**: [] (no prerequisites)
> **type**: impl
> **priority**: P1

## BDD Scenario

```gherkin
Scenario: Page transition animation
  Given a user navigates between pages on mobile
  When the route changes
  Then the outgoing page should fade out and slide left
  And the incoming page should fade in and slide from right
  And the transition should complete within 300ms
```

## Files to Modify

1. `src/app/template.tsx` — NEW file, client component for route transitions

## Steps

### Step 1: Create template.tsx

Create `src/app/template.tsx` as a `'use client'` component that wraps children in `AnimatePresence mode="wait"` with `motion.div` using `key={pathname}`.

Key parameters: `initial={false}`, `duration: 0.2`, `y: 8px`, `ease: [0.25, 0.1, 0.25, 1]`.

## Verification

1. `npm run build` — no build errors
2. Manual: Navigate between /writing and / — should see fade + slide transition
3. Manual: Enable "Reduce Motion" — transitions should be instant

## Acceptance Criteria

- [ ] `src/app/template.tsx` exists
- [ ] `AnimatePresence mode="wait"` used
- [ ] `initial={false}` prevents first-load animation
- [ ] Transition duration ≤ 200ms
- [ ] Build succeeds
