# Technical SEO audit — zenhungyep.com

This change establishes crawlable, consistent technical signals. It does not promise rankings, immediate removals, or Google-generated sitelinks.

## Findings and fixes

- The root canonical was inherited by pages without a complete metadata override (notably Musings and CMS-dependent index fallbacks). Every public page now supplies a canonical and consistent Open Graph/Twitter title, description and URL; the root no longer assigns its canonical to errors.
- Removed detail-route `loading.js` boundaries that flushed a success response before existence checks. Invalid writing/bookmark URLs now return actual 404 responses.
- Blocking metadata is enabled for all user agents so `notFound()` can determine the HTTP status before a loading shell is streamed; crawler/user responses have the same semantics.
- Dynamic metadata referenced nonexistent `/og.png` URLs. Sharing now uses an existing image route. Missing dynamic image resources return 404. The Visual image was incorrectly implemented as a default-export route handler; it now uses Next's metadata file convention.
- The site exposed an indexable debug page and a 200-status unauthorized admin UI. Debug is 404 in production; admin, diagnostics, API and fixture responses have `X-Robots-Tag: noindex, nofollow`. Robots permits crawling so Google can actually read removal signals. Unknown HTML pages retain 404/noindex and recovery links. Existing indexed URLs must be recrawled before removal.
- A custom icon handler existed without a favicon declaration. Metadata now links the stable 96×96 PNG icon.
- Homepage biography and the inherited Paris/product-manager metadata contradicted each other. Shared metadata and About now use the existing homepage's mathematics/open-source identity. The personal site is modeled as Person + WebSite rather than an unsupported Organization/address. About adds ProfilePage; article/CMS/collection pages have visible BreadcrumbList navigation. JSON-LD escapes `<` from CMS values.
- Invalid publication timestamps could throw in article rendering and metadata. Dates are validated and absent dates are omitted rather than invented. Article title falls back to its actual content title. URL path segments are encoded once and GraphQL strings are escaped.
- The live Contentful model exposes SEO references as `Entry` and has no `hasCustomPage` or `Seo.title` field. The old template queries returned HTTP 400 and silently lost metadata. Queries now use the actual model and `... on Seo` fragments, with the content title as fallback.
- CMS failures were treated as missing content. Configured upstream failures now propagate as server errors, with non-indexable recovery UI; a genuine empty CMS query yields notFound. Metadata and content use the same draft selection; draft responses are noindex. Content data revalidates after an hour and draft fetches are uncached.
- Sitemap retains all local sections, deduplicates URLs, excludes private/diagnostic/unimplemented custom CMS routes, and uses real modification dates only. It no longer sets a fresh lastmod on every request.
- About/Contact/Privacy are present in ordinary navigation. Writing and Bookmarks index content is visible on desktop and mobile and has an H1. Route transitions start visible even if hydration fails. Visual media is now fetched directly from the existing provider on the server and hydrated into the interactive gallery; its first images/descriptions no longer require an API fetch in the browser.
- Build-time Google font fetching is replaced by existing checked-in WOFF2 files. The gallery shares cached server data for one hour rather than repeating the Cloudinary search on each visit.
- Removed `typescript.ignoreBuildErrors`, added a reproducible typecheck, tracked the existing generated TS config with its required alias, and aligned CI/runtime engines to the project's configured Node 24. ESLint excludes abandoned local worktrees.

## Reproduction

1. `npm ci` with Node 24.
2. `npm run ci:gate` (lint, complete Vitest suite, production build, typecheck).
3. `npm start -- --port 3000`.
4. `SEO_REPORT=docs/seo/local-audit.json node scripts/verify-seo.mjs http://localhost:3000`.
5. Repeat the crawler against production after deployment. It reads actual HTTP HTML without JavaScript, checks all sitemap pages, canonical/social/schema/H1 signals, errors, icon/image responses and internal links. Production CMS credentials are needed to validate the real dynamic content; a credential-free CI build is not sufficient evidence for those pages.
6. In a browser, visit every public section and an article/collection, navigate through internal links, inspect runtime and hydration errors, verify media and content remain visible, and repeat with JavaScript disabled.

## Google follow-up (external state)

In the verified Search Console property for `https://zenhungyep.com`, submit `/sitemap.xml`. Use URL Inspection on the homepage, About, Writing and a published article, compare Google's selected canonical with the declared canonical, and request indexing after deployment. Inspect any known incorrectly indexed error URLs with the live test: they should return 404/410 or readable noindex, not be blocked by robots.txt. Use Search Console temporary removal only when urgent suppression is desired; permanent removal still depends on the HTTP/noindex state.

Track Page indexing (soft 404, duplicate/canonical, crawled-not-indexed), Crawl stats and indexed-page rendering after recrawl. Measure real Core Web Vitals in Search Console/CrUX over its reporting window; a local laboratory check cannot establish field CWV. There is no dedicated sitelinks schema or switch: Google's automated system chooses whether and how to show them. Rich Results Test can validate supported eligible types; a valid schema graph alone does not guarantee a rich result.

No Search Console property access or Google index-removal confirmation is claimed by this code audit. No SERP screenshot was attached to this chat, so no screenshot match is claimed.

## Primary references

- [Google site names](https://developers.google.com/search/docs/appearance/site-names)
- [Google sitelinks](https://developers.google.com/search/docs/appearance/sitelinks)
- [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google noindex and crawler access](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google canonicalization](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- [Next.js 15 metadata](https://nextjs.org/docs/15/app/api-reference/functions/generate-metadata)

- [Next.js 15 blocking metadata](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/htmlLimitedBots)

## Validation evidence

- Node 24: lint, 151 tests, production build and TypeScript checks passed locally.
- `local-audit.json`: 20 sitemap pages plus four error routes; all canonical/social/JSON-LD/H1/HTTP checks pass, 25 internal links checked, no failures.
- Browser: 15 public/detail routes have visible content, no window errors, unhandled rejections or console errors. The published Chinese article renders its complete text and breadcrumb trail.
- The pre-change live crawl confirmed HTTP 200 for missing articles/collections, incorrect inherited canonicals, missing article description and schema fields, a 500 Stack image, and broken `/og.png` references. Isolated optional-widget CSR bailouts were not treated as whole-page failures.

The local laboratory observations are not a field Core Web Vitals certification. Google recrawl and search appearance remain pending after deployment.

## Post-PR review and resolution

The first review identified two follow-ups: configured Raindrop/GitHub failures still produced empty/error content, and articles without SEO descriptions had a generic snippet. Both are fixed. Provider failures propagate to the error boundary instead of a false 404 or an indexable empty result; credential-free CI remains supported. Article snippets now come from the first actual paragraph, with the same description in BlogPosting. Regression tests cover upstream failure versus missing credentials and article excerpt extraction.

The follow-up passed all 151 tests, lint, production build and typecheck. The full HTML crawl still has zero failures. Preview validation confirmed real 404 for a missing article, production-origin About canonical, ProfilePage markup, and Vercel's expected `X-Robots-Tag: noindex` for previews. Browser client navigation succeeded; a 390px viewport had no horizontal overflow; JavaScript-disabled Visual retained 24 images with visible content.
