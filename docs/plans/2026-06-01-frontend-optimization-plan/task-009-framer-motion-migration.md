# Task 009: framer-motion Migration

> **depends-on**: [006] (Reduced motion — `MotionConfig` should be in place first)
> **type**: impl
> **priority**: P2

## BDD Scenario

```gherkin
Scenario: framer-motion LazyMotion migration
  Given the site uses framer-motion for animations
  When the bundle is analyzed
  Then all files should use `m` component instead of `motion`
  And AnimatePresence should remain as direct import
  And the bundle should be ~28KB smaller
```

## Files to Modify

1. `src/components/tool-card.js` — `motion` → `m`
2. `src/components/visual/gallery.js` — `motion` → `m`
3. `src/components/visual/lightbox-viewer.js` — `motion` → `m`, keep `AnimatePresence`
4. `src/components/visual/tab-selector.js` — `motion` → `m`
5. `src/components/visual/visual-explorer.js` — `motion` → `m`, keep `AnimatePresence`
6. `src/components/visual/media-card.js` — `motion` → `m`
7. `src/components/submit-bookmark/form.js` — `motion` → `m`, keep `AnimatePresence`
8. `src/components/workspace/easter-egg.js` — `motion` → `m`, keep `AnimatePresence`
9. `src/components/workspace/timeline.js` — `motion` → `m`, keep `AnimatePresence`
10. `src/components/workspace/hardware-list.js` — `motion` → `m`
11. `src/components/workspace/project-card.js` — `motion` → `m`
12. `src/components/category-section.js` — `motion` → `m`

## Steps

### Step 1: Add LazyMotion wrapper to each file

For each file, change the import from:
```js
import { motion } from 'framer-motion'
// or
import { AnimatePresence, motion } from 'framer-motion'
```
to:
```js
import { LazyMotion, domAnimation, m } from 'framer-motion'
// or (for files using AnimatePresence)
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion'
```

### Step 2: Replace motion.* with m.*

In each file, replace all `motion.div`, `motion.span`, `motion.li`, etc. with `m.div`, `m.span`, `m.li`.

### Step 3: Wrap component tree with LazyMotion

Wrap the rendered JSX with `<LazyMotion features={domAnimation}>...</LazyMotion>`. If the component already has a single wrapper element, add it there. If not, wrap the fragment.

### Step 4: Verify writing-list.js is already correct

`writing-list.js` already uses `LazyMotion + domAnimation + m` pattern — no changes needed.

## Verification

1. `npm run build` — no build errors
2. Bundle analyzer: Verify ~28KB reduction in framer-motion chunk
3. Manual: All animations still work (gallery, lightbox, timeline, etc.)
4. Manual: Page transitions still work (task-003 template.tsx uses `AnimatePresence` directly — unaffected)

## Acceptance Criteria

- [ ] 12 files migrated from `motion` to `m`
- [ ] `LazyMotion features={domAnimation}` wrapper in each file
- [ ] `AnimatePresence` imports remain direct (not via LazyMotion)
- [ ] Build succeeds
