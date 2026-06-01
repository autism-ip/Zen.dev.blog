# Codex Review Fixes — Implementation Plan

## Context

**Motivation**: PR #4 received 9 inline review comments from `chatgpt-codex-connector[bot]`. All are P2/P3 quality improvements — no blockers, but collectively they address real issues: offline CI failures, scroll clipping on notched devices, blurry images on mid-range viewports, broken tab animations, and a Supabase channel lifecycle bug.

**Current State vs Target State**:

| Dimension | Current | Target |
|-----------|---------|--------|
| Font loading | `next/font/google` (fails offline CI) | `next/font/local` with woff2 files |
| Floating header | Hidden at scroll=0 in Chrome 144+ | Visible at scroll=0 via `forwards` fill-mode |
| Template wrapper | No flex sizing, full `motion` bundle | `flex-1 w-full`, LazyMotion + `m` |
| Safe area | `pt-safe` on `<main>` clips scroll content | `pt-safe` inside ScrollArea |
| Supabase channels | `useRef` singleton — cleanup kills shared channel | Module-level ref-counted registry |
| Image sizes | `390px` breakpoint (misaligned) | `435px` matching custom `sm` |
| Tab animation | `domAnimation` (no layout projection) | `domMax` (supports `layoutId`) |

## Execution Plan

```yaml
tasks:
  - id: "001"
    subject: "Migrate Noto Serif SC to next/font/local"
    slug: "font-local"
    type: "impl"
    depends-on: []
  - id: "002"
    subject: "Fix FloatingHeader scroll-timeline and JS fallback"
    slug: "floating-header-scroll"
    type: "impl"
    depends-on: []
  - id: "003"
    subject: "Fix template flex sizing and migrate to lazy motion"
    slug: "template-flex-lazy"
    type: "impl"
    depends-on: []
  - id: "004"
    subject: "Fix safe area padding clipping scroll content"
    slug: "safe-area-scroll"
    type: "impl"
    depends-on: []
  - id: "005"
    subject: "Fix Supabase shared channel lifecycle with reference counting"
    slug: "supabase-channel-refcount"
    type: "impl"
    depends-on: []
  - id: "006"
    subject: "Fix image sizes breakpoint and tab selector layout animation"
    slug: "image-sizes-tab-layout"
    type: "impl"
    depends-on: []
```

## Task File References

- [Task 001: Migrate Noto Serif SC to next/font/local](./task-001-font-local.md)
- [Task 002: Fix FloatingHeader scroll-timeline and JS fallback](./task-002-floating-header-scroll.md)
- [Task 003: Fix template flex sizing and migrate to lazy motion](./task-003-template-flex-lazy.md)
- [Task 004: Fix safe area padding clipping scroll content](./task-004-safe-area-scroll.md)
- [Task 005: Fix Supabase shared channel lifecycle with reference counting](./task-005-supabase-channel-refcount.md)
- [Task 006: Fix image sizes breakpoint and tab selector layout animation](./task-006-image-sizes-tab-layout.md)

## BDD Coverage

| Scenario | Task |
|----------|------|
| Font loads without network at build time | 001 |
| Header visible on initial page load in Chrome 144+ | 002 |
| Scroll title hidden at scroll=0 in non-scroll-timeline browsers | 002 |
| Page fills available width next to sidebar | 003 |
| Template does not inflate baseline bundle | 003 |
| Content fully visible on devices with safe area insets | 004 |
| Channel survives individual component unmount | 005 |
| Images render at correct resolution on 393-430px viewports | 006 |
| Active tab background animates between tabs | 006 |

All 9 BDD scenarios from `bdd-specs.md` are covered.

## Dependency Chain

```
[001] [002] [003] [004] [005] [006]
  │     │     │     │     │     │
  └─────┴─────┴─────┴─────┴─────┘
        All independent (Tier 0)
        Single batch — parallel execution
```

All 6 tasks touch different files with no shared dependencies. They can execute in parallel as a single batch.
