# Best Practices

> Frontend Optimization | 2026-06-01

## Performance Guidelines

### CSS Performance

**DO**:
- Use `transform` and `opacity` for animations (GPU-accelerated)
- Use `will-change` sparingly for known expensive animations
- Use `contain` for independent regions
- Use `content-visibility: auto` for long lists

**DON'T**:
- Animate layout properties (width, height, top, left)
- Use `blur()` on large elements without GPU acceleration
- Use `will-change` everywhere (creates new layers, uses memory)

### JavaScript Performance

**DO**:
- Use `requestAnimationFrame` for scroll/resize handlers
- Use `useMemo` for expensive computations
- Use `useCallback` for stable function references
- Use `React.memo` for pure components

**DON'T**:
- Create new objects in render (causes unnecessary re-renders)
- Use `inline` functions in JSX props
- Subscribe to global events without cleanup

### Font Loading

**DO**:
- Use `font-display: swap` for non-critical fonts
- Use `unicode-range` to subset fonts
- Preload critical fonts
- Use `preconnect` for external font origins

**DON'T**:
- Block rendering on font loading
- Load all font weights upfront
- Use `media="print"` hack (non-standard)

## Accessibility Guidelines

### Motion Sensitivity

**DO**:
- Respect `prefers-reduced-motion`
- Provide non-animated alternatives
- Use `animation-duration: 0.01ms` for reduced motion

**DON'T**:
- Force animations on users
- Use animations that flash or pulse rapidly
- Ignore vestibular disorders

### Touch Targets

**DO**:
- Maintain 44x44px minimum touch targets
- Add spacing between interactive elements
- Use `-webkit-tap-highlight-color: transparent` for custom feedback

**DON'T**:
- Place interactive elements too close together
- Rely on hover states for mobile functionality
- Use tiny buttons or links

### Color Contrast

**DO**:
- Meet WCAG AA contrast ratios (4.5:1 for normal text)
- Use tinted neutrals instead of pure black/white
- Test with color blindness simulators

**DON'T**:
- Use pure black (#000) on pure white (#fff)
- Use low-contrast text for important information
- Rely solely on color to convey information

## Mobile Guidelines

### Safe Areas

**DO**:
- Use `env(safe-area-inset-*)` for notch/home indicator
- Apply safe area padding to fixed-position elements
- Test on real devices with notch/Dynamic Island

**DON'T**:
- Ignore safe area insets
- Assume all devices have the same safe areas
- Use fixed heights that don't account for safe areas

### Scroll Behavior

**DO**:
- Use `passive: true` for scroll event listeners
- Throttle scroll handlers with `requestAnimationFrame`
- Use CSS `scroll-behavior: smooth` for anchor links

**DON'T**:
- Use `scroll` events without throttling
- Animate scroll position with JavaScript (use CSS)
- Block scroll during animations

### Page Transitions

**DO**:
- Use `AnimatePresence` for route transitions
- Keep transitions under 300ms
- Respect `prefers-reduced-motion`

**DON'T**:
- Use complex transitions that block interaction
- Animate layout properties during transitions
- Force transitions on slow devices

## Code Quality

### Component Design

**DO**:
- Keep components small and focused
- Use `memo()` for expensive components
- Extract reusable logic into hooks
- Use TypeScript for type safety

**DON'T**:
- Create god components
- Mix business logic with presentation
- Use `any` types

### State Management

**DO**:
- Use local state for UI-only state
- Use context for shared state
- Use refs for values that don't trigger re-renders

**DON'T**:
- Use global state for local UI state
- Store derived state
- Mutate state directly

### Testing

**DO**:
- Test user interactions, not implementation details
- Use `screen.getByRole` for accessible queries
- Mock external dependencies

**DON'T**:
- Test internal state
- Use `enzyme` (deprecated)
- Skip accessibility testing

## Security

### Input Validation

**DO**:
- Validate all user input
- Sanitize HTML content
- Use parameterized queries

**DON'T**:
- Trust client-side validation alone
- Render unsanitized user input
- Expose sensitive data in client-side code

### Dependencies

**DO**:
- Keep dependencies updated
- Audit for vulnerabilities regularly
- Use lock files for reproducible builds

**DON'T**:
- Use deprecated packages
- Ignore security advisories
- Install packages from untrusted sources
