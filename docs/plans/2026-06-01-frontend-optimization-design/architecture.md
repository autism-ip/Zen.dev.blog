# Architecture

> Frontend Optimization | 2026-06-01

## Current Architecture

```
src/
├── app/
│   ├── layout.js          # Root layout: Geist fonts, SideMenu, Analytics
│   ├── page.js            # Home: ScrollArea + FloatingHeader + WritingList
│   └── [slug]/            # Dynamic routes
├── components/
│   ├── floating-header.js # Mobile header with JS scroll handler
│   ├── mobile-drawer.js   # vaul drawer for mobile nav
│   ├── side-menu.js       # Desktop sidebar (hidden on mobile)
│   ├── scroll-area.js     # Scroll container with ID
│   ├── show-in-view.js    # IntersectionObserver wrapper
│   ├── writing-list.js    # Posts list with framer-motion
│   ├── gradient-bg.js     # Decorative gradient backgrounds
│   └── sunny-mode.js      # Easter egg overlay
├── hooks/
│   ├── useViewData.js     # Supabase realtime subscription
│   └── useKeyPress.js     # Keyboard shortcut handler
├── lib/
│   ├── fonts.js           # OG image font loading
│   ├── constants.js       # App constants
│   └── utils.js           # Utility functions
└── globals.css            # Tailwind config, custom utilities, animations
```

## Proposed Changes

### Phase 1: Mobile Adaptation

#### 1.1 FloatingHeader scroll-driven animation
**File**: `src/components/floating-header.js`
**Change**: Replace JS scroll handler with CSS `animation-timeline: scroll()`

```css
/* globals.css */
@supports (animation-timeline: scroll()) {
  .floating-header {
    animation: header-reveal linear forwards;
    animation-timeline: scroll();
    animation-range: 0px 100px;
  }

  @keyframes header-reveal {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
}
```

**Fallback**: Keep existing JS handler for browsers without scroll-driven animation support.

#### 1.2 Safe area insets
**File**: `src/globals.css`
**Change**: Add safe area utilities to existing `px-safe` and extend to all edges

```css
@utility safe-area-top {
  padding-top: env(safe-area-inset-top);
}

@utility safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

**File**: `src/app/layout.js`
**Change**: Apply `safe-area-top` to `<main>` wrapper

#### 1.3 Page transitions
**File**: `src/components/page-transition.js` (new)
**Change**: Create client component for route transitions

```jsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export function PageTransition({ children }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

**File**: `src/app/layout.js`
**Change**: Import and wrap children with `PageTransition`

```jsx
import { PageTransition } from '@/components/page-transition'

// In RootLayout:
<PageTransition>
  {children}
</PageTransition>
```

#### 1.4 Touch feedback
**File**: `src/globals.css`
**Change**: Add touch feedback utility

```css
@utility touch-feedback {
  -webkit-tap-highlight-color: transparent;
  transition: transform 100ms ease-out;
}

@utility touch-feedback:active {
  transform: scale(0.95);
}
```

### Phase 2: Visual Refinement

#### 2.1 Font loading optimization
**File**: `src/app/layout.js`
**Change**: Optimize Google Fonts loading

```jsx
{/* Preconnect */}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

{/* Noto Serif SC with font-display: swap */}
<link
  href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

**File**: `src/globals.css`
**Change**: Add unicode-range for Chinese characters

```css
@font-face {
  font-family: 'Noto Serif SC';
  font-display: swap;
  unicode-range: U+4E00-9FFF, U+3400-4DBF, U+2F00-2FDF;
}
```

#### 2.2 Reduced motion support
**File**: `src/globals.css`
**Change**: Add prefers-reduced-motion media query

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

#### 2.3 Color refinement
**File**: `src/globals.css`
**Change**: Replace pure black/white with tinted versions

```css
:root {
  --color-black: oklch(15% 0.005 250);  /* Slightly blue-tinted black */
  --color-white: oklch(99% 0.002 250);  /* Slightly blue-tinted white */
}
```

### Phase 3: Performance Optimization

#### 3.1 Supabase channel fix
**File**: `src/hooks/useViewData.js`
**Change**: Fix global channel lifecycle

```javascript
// Use a ref to track subscription status
const channelRef = useRef(null)

useEffect(() => {
  if (channelRef.current) return

  channelRef.current = supabase
    .channel('supabase_realtime')
    .on(/* ... */)
    .subscribe()

  return () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }
}, [])
```

#### 3.2 Scroll handler throttling
**File**: `src/components/floating-header.js`
**Change**: Use requestAnimationFrame

```javascript
useEffect(() => {
  let rafId = null

  const onScroll = (e) => {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      // Update transform values
      rafId = null
    })
  }

  scrollAreaElem?.addEventListener('scroll', onScroll, { passive: true })
  return () => {
    scrollAreaElem?.removeEventListener('scroll', onScroll)
    if (rafId) cancelAnimationFrame(rafId)
  }
}, [scrollTitle])
```

#### 3.3 Image sizes optimization
**File**: Components using `next/image`
**Change**: Add precise sizes attribute

```jsx
<Image
  src={src}
  sizes="(max-width: 390px) 100vw, (max-width: 768px) 50vw, 33vw"
  // ...
/>
```

## Dependencies

| Dependency | Version | Purpose | Impact |
|------------|---------|---------|--------|
| framer-motion | ^12.15.0 | Page transitions, animations | Core |
| vaul | ^1.1.2 | Mobile drawer | Core |
| react-intersection-observer | ^9.16.0 | Lazy loading | Low |
| @supabase/supabase-js | ^2.50.0 | Realtime updates | Core |
| tailwindcss-animate | ^1.0.7 | Animation utilities | Low |
