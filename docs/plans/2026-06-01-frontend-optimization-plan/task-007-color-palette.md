# Task 007: Color Palette Refinement

> **depends-on**: [006] (Reduced motion — `prefers-reduced-motion` should be in place first)
> **type**: impl
> **priority**: P2

## BDD Scenario

```gherkin
Scenario: Color palette refinement
  Given the site renders on any device
  When viewing text and backgrounds
  Then no pure black (#000) or pure white (#fff) should be used
  And neutrals should be tinted toward the brand hue
  And text contrast should meet WCAG AA (4.5:1 for normal text)
```

## Files to Modify

1. `src/globals.css` — Replace pure black/white with tinted stone palette

## Steps

### Step 1: Add tinted color variables

In `src/globals.css`, add to the `:root` or `@theme` block: `--color-bg: #fafaf9` (stone-50), `--color-text: #1c1917` (stone-900). These replace pure white and pure black.

### Step 2: Update base styles

In the `@layer base` block of `globals.css`:
- Update `::selection` to use `bg-stone-900 text-stone-50` instead of `bg-black text-white`
- Update `html, body` background to `bg-stone-50`
- Update `body` text color to `text-stone-900`
- Update `h1, h2, h3` text color to `text-stone-900`

### Step 3: Verify WCAG contrast

Stone-50 (#fafaf9) on Stone-900 (#1c1917) = ~15.8:1 contrast ratio, well above WCAG AA 4.5:1.

## Verification

1. `npm run build` — no build errors
2. Manual: Visual inspection — no harsh pure black/white contrast
3. Lighthouse accessibility audit — contrast passes
4. Manual: Dark areas should feel warm, not stark

## Acceptance Criteria

- [ ] No `#000`, `#fff`, `bg-black`, `text-black`, `bg-white`, `text-white` in base styles
- [ ] Stone palette used for backgrounds and text
- [ ] WCAG AA contrast maintained
- [ ] Build succeeds
