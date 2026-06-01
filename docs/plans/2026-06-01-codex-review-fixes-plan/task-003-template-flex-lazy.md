# Task 003: Fix template flex sizing and migrate to lazy motion

> **depends-on**: []
> **type**: impl
> **priority**: P2

## BDD Scenario

```gherkin
Scenario: Page fills available width next to sidebar
  Given the viewport is wider than the lg breakpoint (1024px)
  And a sidebar is visible
  When a page renders inside the template wrapper
  Then the template wrapper takes flex-1 and w-full
  And the page content fills the remaining horizontal space
```

```gherkin
Scenario: Template does not inflate baseline bundle
  Given the framer-motion migration uses LazyMotion + m
  When the root template renders on any route
  Then it imports from LazyMotion/domAnimation, not the full motion bundle
  And the baseline client bundle size is not increased by template.tsx
```

## Files to Modify

1. `src/app/template.tsx` — Add flex sizing classes + migrate to LazyMotion/m

## Steps

### Step 1: Migrate to LazyMotion + m

Replace `import { AnimatePresence, motion } from 'framer-motion'` with `import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion'`.

Replace `<motion.div>` with `<m.div>` and wrap the return JSX in `<LazyMotion features={domAnimation}>`.

### Step 2: Add flex sizing

Add `className="flex-1 w-full"` to the `m.div` wrapper so it fills the available space next to the sidebar.

### Step 3: Verify

Run `npm run build` — must pass.

## Verification

1. `npm run lint` — no errors
2. `npm run build` — exit code 0
3. `grep "LazyMotion" src/app/template.tsx` confirms lazy import

## Acceptance Criteria

- [ ] template.tsx imports `LazyMotion`, `domAnimation`, `m` (not `motion`)
- [ ] Template wrapper has `flex-1 w-full` classes
- [ ] Build passes
