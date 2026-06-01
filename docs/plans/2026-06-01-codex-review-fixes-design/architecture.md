# Architecture — Codex Review Fixes

## Files to Modify

### 1. `src/app/layout.js`
- **Font**: Replace `next/font/google` NotoSerifSC with `next/font/local`
- **Safe area**: Remove `pt-safe` from `<main>`, apply safe-area inside ScrollArea context

### 2. `public/fonts/NotoSerifSC-Regular.woff2` (new)
- Self-hosted font file for `next/font/local`

### 3. `src/globals.css`
- **CSS scroll-timeline**: Change `animation-fill-mode: both` → `forwards`
- **ScrollArea safe-area**: Add safe-area-aware scroll utility if needed

### 4. `src/components/floating-header.js`
- **JS fallback**: Set initial inline style on spanRef element (opacity:0, translateY:100%)

### 5. `src/app/template.tsx`
- **Flex sizing**: Add `className="flex-1 w-full"` to motion wrapper
- **Lazy motion**: Replace `motion` import with `LazyMotion` + `m` from `framer-motion`

### 6. `src/hooks/useViewData.js`
- **Shared channel**: Replace useRef singleton with module-level Map for reference counting

### 7. `src/components/visual/media-card.js`
- **Sizes breakpoint**: Change `390px` → `435px` in sizes attribute

### 8. `src/components/visual/tab-selector.js`
- **Layout animation**: Change `domAnimation` → `domMax` to include layout projection

## Dependency Chain

```
Issue 2 (CSS) ──→ Issue 3 (JS fallback)   [independent, both affect FloatingHeader]
Issue 4 (template flex) ──→ Issue 9 (template lazy motion)  [same file]
Issue 1 (font) ──→ Issue 5 (safe area)    [both in layout.js, independent logic]
Issue 6 (channel) ── standalone
Issue 7 (sizes) ── standalone
Issue 8 (tab layout) ── standalone
```
