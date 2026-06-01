# Task 001: Migrate Noto Serif SC to next/font/local

> **depends-on**: []
> **type**: impl
> **priority**: P2

## BDD Scenario

```gherkin
Scenario: Build succeeds without network access
  Given the CI environment has no internet access
  When `npm run build` executes
  Then the build completes with exit code 0
  And no font-fetching errors appear in the build log
```

## Files to Modify

1. `public/fonts/` — Add Noto Serif SC woff2 font file(s)
2. `src/app/layout.js` — Replace `next/font/google` with `next/font/local`

## Steps

### Step 1: Download Noto Serif SC font

Download Noto Serif SC woff2 files (weights 400, 500, 600, 700) to `public/fonts/`. Use the Google Fonts CSS API to extract woff2 URLs, then download.

### Step 2: Replace font import in layout.js

Replace `next/font/google` import with `next/font/local` pointing to the downloaded woff2 files. Keep the same `variable: '--font-noto-serif-sc'` and `display: 'swap'`.

### Step 3: Verify

Run `npm run build` — must complete with exit code 0, no font-fetching errors.

## Verification

1. `npm run lint` — no errors
2. `npm run build` — exit code 0, no font errors in log
3. The `--font-noto-serif-sc` CSS variable is still available in the built output

## Acceptance Criteria

- [ ] Noto Serif SC font files exist in `public/fonts/`
- [ ] `layout.js` uses `next/font/local` instead of `next/font/google`
- [ ] `--font-noto-serif-sc` CSS variable preserved
- [ ] Build succeeds without network access
