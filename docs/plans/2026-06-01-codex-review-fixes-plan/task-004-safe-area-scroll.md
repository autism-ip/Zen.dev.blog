# Task 004: Fix safe area padding clipping scroll content

> **depends-on**: []
> **type**: impl
> **priority**: P2

## BDD Scenario

```gherkin
Scenario: Content fully visible on devices with safe area insets
  Given a device with a non-zero top safe-area-inset
  When the page renders with a ScrollArea
  Then the scroll area's content is not clipped at the bottom
  And the safe-area padding is applied inside the scroll context
```

## Files to Modify

1. `src/app/layout.js` — Remove `pt-safe` from `<main>`
2. `src/components/scroll-area.js` — Add `pt-safe` to ScrollArea

## Steps

### Step 1: Remove pt-safe from main

In `src/app/layout.js`, change `<main>` className from `"pt-safe min-h-screen bg-white"` to `"min-h-screen bg-white"`.

### Step 2: Apply safe-area inside ScrollArea

In `src/components/scroll-area.js`, add `pt-safe` to the default className of the ScrollArea component. This applies the safe-area padding inside the scroll context, so content shifts down without clipping the bottom.

### Step 3: Verify

Run `npm run build` — must pass.

## Verification

1. `npm run lint` — no errors
2. `npm run build` — exit code 0
3. `<main>` no longer has `pt-safe` class

## Acceptance Criteria

- [ ] `<main>` className does not include `pt-safe`
- [ ] ScrollArea has `pt-safe` class
- [ ] Build passes
