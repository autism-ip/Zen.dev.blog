# BDD Specifications

> Frontend Optimization | 2026-06-01

## Mobile Adaptation Scenarios

### Scenario: FloatingHeader scroll-driven animation
```
Given a user is on a mobile device (< 1024px)
When they scroll down the page
Then the FloatingHeader should smoothly animate in from the top
And the animation should use CSS scroll-driven animation (not JS)
And the header should be fully visible after scrolling 100px
```

### Scenario: iOS safe area adaptation
```
Given a user is on an iPhone with notch or Dynamic Island
When they view the site in portrait mode
Then the content should respect safe-area-inset-top
And the bottom navigation should respect safe-area-inset-bottom
And no content should be obscured by the notch or home indicator
```

### Scenario: Page transition animation
```
Given a user navigates between pages on mobile
When the route changes
Then the outgoing page should fade out and slide left
And the incoming page should fade in and slide from right
And the transition should complete within 300ms
And the animation should respect prefers-reduced-motion
```

### Scenario: Touch feedback on interactive elements
```
Given a user taps a button or link on mobile
When they touch the element
Then the element should scale down to 0.95
And the element should return to scale 1.0 on release
And the feedback should complete within 150ms
```

## Visual Refinement Scenarios

### Scenario: Font loading optimization
```
Given the site loads for the first time
When the browser parses the HTML
Then Noto Serif SC should load with font-display: swap
And the fallback font should display immediately
And the custom font should swap in without layout shift (CLS < 0.1)
```

### Scenario: Reduced motion support
```
Given a user has prefers-reduced-motion: reduce enabled
When they interact with the site
Then all animations should be disabled or reduced to opacity transitions
And page transitions should be instant
And scroll-driven animations should be disabled
```

### Scenario: Color palette refinement
```
Given the site renders on any device
When viewing text and backgrounds
Then no pure black (#000) or pure white (#fff) should be used
And neutrals should be tinted toward the brand hue
And text contrast should meet WCAG AA (4.5:1 for normal text)
```

## Performance Optimization Scenarios

### Scenario: Supabase channel lifecycle
```
Given the WritingList component mounts
When it subscribes to Supabase realtime updates
Then a single global channel should be created
And the channel should be reused across re-renders
And the channel should be cleaned up on unmount
And no memory leaks should occur
```

### Scenario: Scroll handler throttling
```
Given a user scrolls rapidly on the page
When the scroll event fires
Then the FloatingHeader handler should use requestAnimationFrame
And no layout thrashing should occur
And the animation should maintain 60fps
```

### Scenario: Image loading optimization
```
Given the site displays images
When the browser loads an image
Then the image should have precise sizes attribute
And the image should use AVIF format
And below-fold images should lazy load
And above-fold images should preload
```

## Edge Cases

### Scenario: Very small screen (320px)
```
Given a user on a 320px wide device
When they view the site
Then all content should be readable
And no horizontal scroll should occur
And touch targets should remain 44x44px minimum
```

### Scenario: Slow 3G connection
```
Given a user on a slow 3G connection
When they load the site
Then critical CSS should be inlined
And fonts should load asynchronously
And the page should be interactive within 5 seconds
```

### Scenario: Landscape orientation on mobile
```
Given a user rotates their phone to landscape
When the viewport changes
Then the layout should adapt appropriately
And the FloatingHeader should remain functional
And content should use the wider viewport effectively
```
