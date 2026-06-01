# Task 010: Image Sizes Optimization

> **depends-on**: [] (no prerequisites)
> **type**: impl
> **priority**: P2

## BDD Scenario

```gherkin
Scenario: Image loading optimization
  Given the site displays images
  When the browser loads an image
  Then the image should have precise sizes attribute
  And the image should use AVIF format
  And below-fold images should lazy load
  And above-fold images should preload
```

## Files to Modify

1. `src/components/visual/media-card.js` — Verify sizes attribute (already has one)
2. `src/components/workspace/hardware-list.js` — Verify sizes attribute (already has one)
3. `src/components/tool-card.js` — Add precise `sizes` attribute if missing

## Steps

### Step 1: Audit existing sizes attributes

Check all `next/image` components. Two files already have `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"`. Verify these match the actual layout breakpoints (xs: 390, sm: 435, md: 768, lg: 1024).

### Step 2: Update sizes to match custom breakpoints

Update sizes attributes to use the project's custom breakpoints:
```
sizes="(max-width: 390px) 100vw, (max-width: 768px) 50vw, 33vw"
```

### Step 3: Verify AVIF format

`next.config.mjs` already has `formats: ['image/avif']`. No changes needed — just verify.

### Step 4: Verify lazy loading

Next.js `Image` component defaults to `loading="lazy"` for non-priority images. Verify no `priority` flag is used on below-fold images.

## Verification

1. `npm run build` — no build errors
2. Lighthouse: Image optimization score should be 100
3. Network tab: Images served as AVIF
4. Network tab: Below-fold images load after above-fold content

## Acceptance Criteria

- [ ] All `next/image` components have precise `sizes` attribute
- [ ] Sizes use project breakpoints (390, 768, 1024)
- [ ] AVIF format confirmed in next.config.mjs
- [ ] No unnecessary `priority` flags on below-fold images
- [ ] Build succeeds
