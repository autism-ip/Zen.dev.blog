# Best Practices — Codex Review Fixes

## Font Loading
- `next/font/local` guarantees build-time availability, no network dependency
- Font file should be woff2 format for best compression
- Keep `font-display: swap` for fast text rendering

## CSS Scroll-Driven Animation
- `forwards` fill-mode preserves end-state after animation completes
- `both` fill-mode applies both start and end states, causing initial hidden state
- Always test scroll animations at scroll=0

## Supabase Realtime
- Module-level state survives React strict mode double-mount
- Reference counting prevents premature channel teardown
- Always clean up subscriptions to prevent memory leaks

## Bundle Optimization
- `LazyMotion` + `m` is the correct pattern for framer-motion tree-shaking
- `domAnimation` contains basic animation features
- `domMax` includes layout projection (needed for `layoutId`)
- Root template is the highest-traffic client component — must use lazy loading

## Safe Area Insets
- Apply padding inside scroll containers, not on fixed-height parents
- `env(safe-area-inset-*)` is zero on non-notched devices — safe to use everywhere
- `viewportFit: 'cover'` is required for insets to take effect
