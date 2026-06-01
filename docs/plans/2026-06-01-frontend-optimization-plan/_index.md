# Frontend Optimization Implementation Plan

> 2026-06-01 | Zen.dev.blog | feature/frontend-optimization

## Context

Zen.dev.blog 的前端存在三类问题，按优先级排列：

1. **移动端适配不足**：FloatingHeader 使用 JS scroll handler 硬切换（每帧 setState），iOS safe-area 未启用（viewportFit 缺失），页面切换无动画
2. **视觉体验待精修**：字体使用 media="print" hack 加载，缺少 prefers-reduced-motion 支持，纯黑/纯白色彩伤眼
3. **性能隐患**：13 个文件直接 import motion 破坏 LazyMotion，Supabase channel 泄漏风险，scroll handler 未节流

### Current State vs Target State

| Dimension | Current | Target |
|-----------|---------|--------|
| FloatingHeader | JS scroll handler + setState per frame | CSS scroll-state query (Chrome 144+) with JS fallback |
| Safe area | `px-safe` utility exists but viewportFit missing | Full safe-area support, viewportFit: 'cover' |
| Page transitions | None | framer-motion AnimatePresence via template.tsx |
| Font loading | media="print" hack, external Google Fonts request | next/font/google self-hosted, font-display: swap |
| Reduced motion | Not supported | MotionConfig + CSS prefers-reduced-motion |
| Colors | Pure #000/#fff | Tinted stone palette (#fafaf9/#1c1917) |
| framer-motion | 13 files use `motion` (full bundle) | All files use `m` + LazyMotion |
| Supabase | Global channel variable, cleanup race condition | useRef-based lifecycle, proper cleanup |

## Execution Plan

```yaml
tasks:
  - id: "001"
    subject: "Safe area foundation"
    slug: "safe-area-foundation"
    type: "impl"
    depends-on: []

  - id: "002"
    subject: "Touch feedback CSS"
    slug: "touch-feedback"
    type: "impl"
    depends-on: []

  - id: "003"
    subject: "Page transition component"
    slug: "page-transition"
    type: "impl"
    depends-on: []

  - id: "004"
    subject: "FloatingHeader scroll animation"
    slug: "floating-header-scroll"
    type: "impl"
    depends-on: ["001"]

  - id: "005"
    subject: "Font loading optimization"
    slug: "font-loading"
    type: "impl"
    depends-on: []

  - id: "006"
    subject: "Reduced motion support"
    slug: "reduced-motion"
    type: "impl"
    depends-on: ["004"]

  - id: "007"
    subject: "Color palette refinement"
    slug: "color-palette"
    type: "impl"
    depends-on: ["006"]

  - id: "008"
    subject: "Supabase channel fix"
    slug: "supabase-channel"
    type: "impl"
    depends-on: []

  - id: "009"
    subject: "framer-motion migration"
    slug: "framer-motion-migration"
    type: "impl"
    depends-on: ["006"]

  - id: "010"
    subject: "Image sizes optimization"
    slug: "image-sizes"
    type: "impl"
    depends-on: []
```

## Task File References

- [Task 001: Safe area foundation](./task-001-safe-area-foundation.md)
- [Task 002: Touch feedback CSS](./task-002-touch-feedback.md)
- [Task 003: Page transition component](./task-003-page-transition.md)
- [Task 004: FloatingHeader scroll animation](./task-004-floating-header-scroll.md)
- [Task 005: Font loading optimization](./task-005-font-loading.md)
- [Task 006: Reduced motion support](./task-006-reduced-motion.md)
- [Task 007: Color palette refinement](./task-007-color-palette.md)
- [Task 008: Supabase channel fix](./task-008-supabase-channel.md)
- [Task 009: framer-motion migration](./task-009-framer-motion-migration.md)
- [Task 010: Image sizes optimization](./task-010-image-sizes.md)

## BDD Coverage

| BDD Scenario | Task | Status |
|--------------|------|--------|
| iOS safe area adaptation | 001 | Covered |
| Touch feedback on interactive elements | 002 | Covered |
| Page transition animation | 003 | Covered |
| FloatingHeader scroll-driven animation | 004 | Covered |
| Font loading optimization | 005 | Covered |
| Reduced motion support | 006 | Covered |
| Color palette refinement | 007 | Covered |
| Supabase channel lifecycle | 008 | Covered |
| framer-motion LazyMotion migration | 009 | Covered |
| Scroll handler throttling | 004 (integrated) | Covered |
| Image loading optimization | 010 | Covered |
| Very small screen (320px) | 001, 002 | Partial — deferred |
| Slow 3G connection | 005 | Partial — deferred |
| Landscape orientation on mobile | 001, 004 | Partial — deferred |

## Dependency Chain

```
001 (Safe area) ──────────┐
002 (Touch feedback) ─────┤
003 (Page transition) ────┤
005 (Font loading) ───────┤
008 (Supabase) ───────────┤
010 (Image sizes) ────────┘

001 ─────→ 004 (FloatingHeader) ─────→ 006 (Reduced motion) ─┬→ 007 (Color palette)
                                                               └→ 009 (framer-motion)
```

## Verification

Each task includes:
1. BDD scenario (Given/When/Then)
2. Files to modify
3. Verification command (build + manual check)
4. Acceptance criteria
