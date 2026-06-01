# Task 004: FloatingHeader Scroll Animation

> **depends-on**: [001] (Safe area foundation — viewportFit must be set first)
> **type**: impl
> **priority**: P1

## BDD Scenario

```gherkin
Scenario: FloatingHeader scroll-driven animation
  Given a user is on a mobile device (< 1024px)
  When they scroll down the page
  Then the FloatingHeader should smoothly animate in from the top
  And the animation should use CSS scroll-driven animation (not JS)
  And the header should be fully visible after scrolling 100px

Scenario: Scroll handler throttling
  Given a user scrolls rapidly on the page
  When the scroll event fires
  Then the FloatingHeader handler should use requestAnimationFrame
  And no layout thrashing should occur
  And the animation should maintain 60fps
```

## Files to Modify

1. `src/globals.css` — Add CSS scroll-driven animation with `@supports` guard
2. `src/components/floating-header.js` — Add JS fallback with `requestAnimationFrame` throttling

## Steps

### Step 1: Add CSS scroll-driven animation

In `src/globals.css`, add a `@supports (animation-timeline: scroll())` block with `.floating-header` keyframe that animates `translateY(-100%)` → `translateY(0)` and `opacity: 0` → `opacity: 1` over `animation-range: 0px 100px`.

### Step 2: Refactor JS scroll handler with requestAnimationFrame

In `src/components/floating-header.js`, wrap the `onScroll` handler in `requestAnimationFrame` to prevent layout thrashing. Guard against multiple rAF calls with a ref. Use `{ passive: true }` on the event listener (already present).

### Step 3: Add CSS class to header element

In `src/components/floating-header.js`, add the `floating-header` class to the `<header>` element so CSS scroll-driven animation can target it when supported.

## Verification

1. `npm run build` — no build errors
2. Manual: On Chrome 144+, scroll down — header animates via CSS (check DevTools Performance panel)
3. Manual: On Safari/Firefox, scroll down — JS fallback kicks in smoothly at 60fps
4. Manual: Scroll rapidly — no jank, no layout thrashing

## Acceptance Criteria

- [ ] `@supports (animation-timeline: scroll())` block exists in globals.css
- [ ] `requestAnimationFrame` used in JS scroll handler
- [ ] `floating-header` CSS class applied to header element
- [ ] Header fully visible after 100px scroll
- [ ] Build succeeds
