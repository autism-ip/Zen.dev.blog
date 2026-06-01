# Task 006: Fix image sizes breakpoint and tab selector layout animation

> **depends-on**: []
> **type**: impl
> **priority**: P2

## BDD Scenario

```gherkin
Scenario: Images render at correct resolution on 393-430px viewports
  Given a viewport width of 400px (between xs:390px and sm:435px)
  When a MediaCard renders with a Cloudinary image
  Then the sizes attribute requests 100vw images
  And the image appears sharp, not blurry
```

```gherkin
Scenario: Active tab background animates between tabs
  Given the Visual page with filter tabs
  When the user clicks a different tab
  Then the active background slides smoothly to the new tab
  And no layout animation errors appear in console
```

## Files to Modify

1. `src/components/visual/media-card.js` — Fix sizes breakpoint from 390px to 435px
2. `src/components/visual/tab-selector.js` — Change `domAnimation` to `domMax`

## Steps

### Step 1: Fix media-card sizes

In `src/components/visual/media-card.js`, change the `sizes` attribute on the `CldImage` component from `"(max-width: 390px) 100vw, (max-width: 768px) 50vw, 33vw"` to `"(max-width: 435px) 100vw, (max-width: 768px) 50vw, 33vw"`.

This aligns with the custom `sm` breakpoint defined in `globals.css` as `--breakpoint-sm: 435px`.

### Step 2: Fix tab-selector layout animation

In `src/components/visual/tab-selector.js`, change `domAnimation` to `domMax` in both the import and the `<LazyMotion>` features prop.

The `layoutId` prop requires layout projection features which are only available in `domMax`, not `domAnimation`.

### Step 3: Verify

Run `npm run build` — must pass.

## Verification

1. `npm run lint` — no errors
2. `npm run build` — exit code 0
3. `grep "435px" src/components/visual/media-card.js` confirms new breakpoint
4. `grep "domMax" src/components/visual/tab-selector.js` confirms lazy bundle

## Acceptance Criteria

- [ ] media-card sizes uses `435px` breakpoint (matches custom `sm`)
- [ ] tab-selector uses `domMax` instead of `domAnimation`
- [ ] Build passes
