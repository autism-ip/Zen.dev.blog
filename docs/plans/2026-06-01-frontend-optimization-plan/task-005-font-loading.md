# Task 005: Font Loading Optimization

> **depends-on**: [] (no prerequisites)
> **type**: impl
> **priority**: P1

## BDD Scenario

```gherkin
Scenario: Font loading optimization
  Given the site loads for the first time
  When the browser parses the HTML
  Then Noto Serif SC should load with font-display: swap
  And the fallback font should display immediately
  And the custom font should swap in without layout shift (CLS < 0.1)
```

## Files to Modify

1. `src/app/layout.js` — Replace `<link>` tags with `next/font/google` for Noto Serif SC
2. `src/globals.css` — Update `:lang(zh)` font-family to use CSS variable

## Steps

### Step 1: Self-host Noto Serif SC via next/font/google

In `src/app/layout.js`, import `NotoSerifSC` from `next/font/google`. Configure with `subsets: ['latin']`, `weight: ['400', '500', '600', '700']`, `display: 'swap'`, `variable: '--font-noto-serif-sc'`. Add the variable class to `<html>`.

### Step 2: Remove external font links

Remove the three `<link>` elements in `<head>` (two preconnect + one Google Fonts stylesheet). The `next/font/google` loader handles self-hosting automatically.

### Step 3: Update CSS font-family reference

In `src/globals.css`, update the `:lang(zh)` rule to use `var(--font-noto-serif-sc)` as the primary font instead of the hardcoded `"Noto Serif SC"` string.

## Verification

1. `npm run build` — no build errors
2. PageSpeed Insights — CLS < 0.1
3. Manual: Check Network tab — no external `fonts.googleapis.com` request
4. Manual: Chinese text renders correctly with Noto Serif SC

## Acceptance Criteria

- [ ] No external Google Fonts `<link>` in `<head>`
- [ ] `next/font/google` imports Noto Serif SC
- [ ] CSS variable `--font-noto-serif-sc` available
- [ ] `:lang(zh)` uses CSS variable
- [ ] Build succeeds
