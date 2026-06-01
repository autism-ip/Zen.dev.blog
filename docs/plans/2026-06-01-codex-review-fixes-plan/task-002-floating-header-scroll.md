# Task 002: Fix FloatingHeader scroll-timeline and JS fallback

> **depends-on**: []
> **type**: impl
> **priority**: P2

## BDD Scenario

```gherkin
Scenario: Header visible on initial page load in Chrome 144+
  Given the browser supports CSS scroll-timeline
  And the user opens a page with a FloatingHeader
  When the page loads at scroll position 0
  Then the header is fully visible (opacity: 1, translateY: 0)
  And the header contains the mobile menu/back button and RSS link
```

```gherkin
Scenario: Scroll title hidden at scroll=0 in non-scroll-timeline browsers
  Given the browser does NOT support CSS scroll-timeline
  And the page has a scrollTitle prop
  When the page loads at scroll position 0
  Then the scrollTitle span has opacity 0
  And no flash of visible title text occurs
```

## Files to Modify

1. `src/globals.css` — Fix CSS scroll-timeline animation fill-mode
2. `src/components/floating-header.js` — Set initial inline style on spanRef

## Steps

### Step 1: Fix CSS animation fill-mode

In `src/globals.css`, inside the `@supports (animation-timeline: scroll())` block, change the `.floating-header` rule:

Change `animation: floating-header-reveal linear both;` to `animation: floating-header-reveal linear forwards;`

The `both` fill-mode applies the `from` state (hidden) at scroll=0. `forwards` only applies the `to` state (visible) after the animation completes.

### Step 2: Set initial style on JS fallback spanRef

In `src/components/floating-header.js`, set initial inline style on the `<span ref={spanRef}>` element so it starts hidden before the first scroll event fires.

Add `style={{ opacity: 0, transform: 'translateY(100%)' }}` to the span element.

### Step 3: Verify

Run `npm run build` — must pass.

## Verification

1. `npm run lint` — no errors
2. `npm run build` — exit code 0

## Acceptance Criteria

- [ ] CSS `.floating-header` uses `forwards` fill-mode, not `both`
- [ ] JS fallback span has initial `opacity:0` and `transform:translateY(100%)` inline style
- [ ] Build passes
