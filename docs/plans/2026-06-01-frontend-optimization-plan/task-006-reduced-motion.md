# Task 006: Reduced Motion Support

> **depends-on**: [004] (FloatingHeader scroll — task-006 step 2 adds reduced-motion inside task-004's `@supports` block)
> **type**: impl
> **priority**: P1

## BDD Scenario

```gherkin
Scenario: Reduced motion support
  Given a user has prefers-reduced-motion: reduce enabled
  When they interact with the site
  Then all animations should be disabled or reduced to opacity transitions
  And page transitions should be instant
  And scroll-driven animations should be disabled
```

## Files to Modify

1. `src/globals.css` — Add `prefers-reduced-motion` media query

## Steps

### Step 1: Add global reduced motion CSS

In `src/globals.css`, add a `@media (prefers-reduced-motion: reduce)` block that sets `animation-duration: 0.01ms !important`, `animation-iteration-count: 1 !important`, `transition-duration: 0.01ms !important`, and `scroll-behavior: auto !important` on `*, *::before, *::after`.

### Step 2: Disable CSS scroll-driven animations for reduced motion

Inside the `@supports (animation-timeline: scroll())` block (from task-004), add a nested `@media (prefers-reduced-motion: reduce)` that sets `animation: none` on `.floating-header`.

## Verification

1. `npm run build` — no build errors
2. Manual: Enable "Reduce Motion" in OS settings, navigate between pages — transitions instant
3. Manual: Scroll — FloatingHeader should appear immediately without animation

## Acceptance Criteria

- [ ] `@media (prefers-reduced-motion: reduce)` block exists in globals.css
- [ ] All animation/transition durations set to 0.01ms
- [ ] CSS scroll animations disabled under reduced motion
- [ ] Build succeeds
