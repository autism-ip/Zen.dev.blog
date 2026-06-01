# Task 001: Safe Area Foundation

> **depends-on**: [] (no prerequisites)
> **type**: impl
> **priority**: P0

## BDD Scenario

```gherkin
Scenario: iOS safe area adaptation
  Given a user is on an iPhone with notch or Dynamic Island
  When they view the site in portrait mode
  Then the content should respect safe-area-inset-top
  And the bottom navigation should respect safe-area-inset-bottom
  And no content should be obscured by the notch or home indicator
```

## Files to Modify

1. `src/app/layout.js` — Add `viewportFit: 'cover'` to viewport export
2. `src/globals.css` — Add `pt-safe`, `pb-safe`, `p-safe` utilities

## Steps

### Step 1: Enable viewport-fit

In `src/app/layout.js`, add `viewportFit: 'cover'` to the viewport export.

### Step 2: Add safe-area utilities

In `src/globals.css`, add after the existing `px-safe` utility: `pt-safe`, `pb-safe`, `p-safe` using `env(safe-area-inset-*)`.

### Step 3: Apply safe-area to main wrapper

In `src/app/layout.js`, add `pt-safe` class to the `<main>` element.

## Verification

1. `npm run build` — no build errors
2. Manual: Open on iPhone simulator, verify content not obscured by notch

## Acceptance Criteria

- [ ] `viewportFit: 'cover'` present in viewport export
- [ ] `pt-safe`, `pb-safe`, `p-safe` utilities defined
- [ ] `<main>` has `pt-safe` class
- [ ] Build succeeds
