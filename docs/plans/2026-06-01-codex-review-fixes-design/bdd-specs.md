# BDD Specifications — Codex Review Fixes

## Scenario 1: Font loading in offline CI

```gherkin
Scenario: Build succeeds without network access
  Given the CI environment has no internet access
  When `npm run build` executes
  Then the build completes with exit code 0
  And no font-fetching errors appear in the build log
```

## Scenario 2: FloatingHeader visible at scroll top (CSS scroll-timeline)

```gherkin
Scenario: Header visible on initial page load in Chrome 144+
  Given the browser supports CSS scroll-timeline
  And the user opens a page with a FloatingHeader
  When the page loads at scroll position 0
  Then the header is fully visible (opacity: 1, translateY: 0)
  And the header contains the mobile menu/back button and RSS link
```

## Scenario 3: FloatingHeader JS fallback initial state

```gherkin
Scenario: Scroll title hidden at scroll=0 in non-scroll-timeline browsers
  Given the browser does NOT support CSS scroll-timeline
  And the page has a scrollTitle prop
  When the page loads at scroll position 0
  Then the scrollTitle span has opacity 0
  And no flash of visible title text occurs
```

## Scenario 4: Template flex sizing

```gherkin
Scenario: Page fills available width next to sidebar
  Given the viewport is wider than the lg breakpoint (1024px)
  And a sidebar is visible
  When a page renders inside the template wrapper
  Then the template wrapper takes flex-1 and w-full
  And the page content fills the remaining horizontal space
```

## Scenario 5: Safe area padding does not clip scroll content

```gherkin
Scenario: Content fully visible on devices with safe area insets
  Given a device with a non-zero top safe-area-inset
  When the page renders with a ScrollArea
  Then the scroll area's content is not clipped at the bottom
  And the safe-area padding is applied inside the scroll context
```

## Scenario 6: Supabase shared channel lifecycle

```gherkin
Scenario: Channel survives individual component unmount
  Given two components both use useViewData
  And both are subscribed to the same Supabase channel
  When one component unmounts
  Then the channel remains active
  And the still-mounted component continues receiving realtime updates
```

## Scenario 7: Image sizes breakpoint alignment

```gherkin
Scenario: Images render at correct resolution on 393-430px viewports
  Given a viewport width of 400px (between xs:390px and sm:435px)
  When a MediaCard renders with a Cloudinary image
  Then the sizes attribute requests 100vw images
  And the image appears sharp, not blurry
```

## Scenario 8: Tab selector layout animation

```gherkin
Scenario: Active tab background animates between tabs
  Given the Visual page with filter tabs
  When the user clicks a different tab
  Then the active background slides smoothly to the new tab
  And no layout animation errors appear in console
```

## Scenario 9: Root template uses lazy motion

```gherkin
Scenario: Template does not inflate baseline bundle
  Given the framer-motion migration uses LazyMotion + m
  When the root template renders on any route
  Then it imports from LazyMotion/domAnimation, not the full motion bundle
  And the baseline client bundle size is not increased by template.tsx
```
