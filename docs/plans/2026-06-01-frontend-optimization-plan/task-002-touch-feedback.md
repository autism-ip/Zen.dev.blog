# Task 002: Touch Feedback CSS

> **depends-on**: [] (no prerequisites)
> **type**: impl
> **priority**: P1

## BDD Scenario

```gherkin
Scenario: Touch feedback on interactive elements
  Given a user taps a button or link on mobile
  When they touch the element
  Then the element should scale down to 0.95
  And the element should return to scale 1.0 on release
  And the feedback should complete within 150ms
```

## Files to Modify

1. `src/globals.css` — Add touch feedback base styles and utility

## Steps

### Step 1: Add iOS Safari :active hack

In `src/globals.css`, add to `@layer base`: `-webkit-tap-highlight-color: transparent` on `html`, and `transform: scale(0.97)` on `a:active, button:active`.

### Step 2: Add touch-feedback utility

In `src/globals.css`, add `@utility touch-feedback` with `:active` scale transform.

## Verification

1. `npm run build` — no build errors
2. Manual: On iOS Safari, tap any link — should see brief scale-down effect

## Acceptance Criteria

- [ ] `-webkit-tap-highlight-color: transparent` on html
- [ ] `a:active` and `button:active` have scale transform
- [ ] `touch-feedback` utility available
- [ ] Build succeeds
