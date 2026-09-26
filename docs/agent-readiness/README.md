# Agent readiness follow-up — 2026-09-27

Implemented locally; not deployed and not published to npm. The production score 86/100 is the user's starting audit,
not a remeasured score.

## Changes

- API discovery at `/api` and `/api/v1`; public operations have compatible `/api/v1/*` aliases. Existing payloads and
  owner/bot checks are retained.
- Unknown API paths return JSON 404; unsupported methods return JSON 405 and Allow; malformed JSON and unexpected public
  handler exceptions return structured errors.
- Live per-IP, per-endpoint, per-instance fixed-window quotas. Versioned aliases share buckets. 429 includes
  Retry-After. No quota state is shared across instances; bounded-memory eviction and restarts can reset counters. This
  is throttling guidance, not a globally enforced quota. The host must overwrite IP headers.
- OpenAPI schemas now include submission results and the OpenAPI document envelope; 19 unique operations cover the
  legacy and versioned routes plus discovery files. Arbitrary OpenAPI extension/Path Item maps intentionally remain
  extensible.
- `/developers#versioning` declares major URL versioning and at least 90 days notice before retirement. No dates or
  deprecation headers are invented for active v1.
- Homepage prose, metadata, JSON-LD aliases, developer headings, llms.txt integration links, and static sitemap entries
  improve discovery of Zen (zenhungyep).
- No-JavaScript CSS restores visibility while retaining existing JS animations.
- CLI is a packable, zero-dependency Node 22+ package; v1 URLs, timeout, argument checks, machine error codes/hints,
  README and integration tests are included.
- RSS repair: XML-escaped cover URLs, valid image MIME types, explicit opaque GUIDs, canonical author/domain/self URLs,
  and complete fallback channel metadata.

## Verification

- `npm run ci:gate`: passed lint, 116 tests across 14 files, and production build. Two pre-existing
  anonymous-default-export lint warnings remain. The repository's existing build config skips TypeScript checking; no
  new type-check claim is made.
- API boundary/HTTP error layer coverage: 100% statements, lines and functions; 90.76% branches (30 focused tests).
  Coverage tooling was temporary; project dependency files were not changed.
- `node scripts/verify-agent-readiness.mjs http://127.0.0.1:3101`: **51 passed, 0 failed**. See `verification.json` for
  every checked path. All 19 documented operations were probed; write endpoints received only invalid input. Successful
  writes and upstream rejection were verified with mocked services, without publishing data.
- JSON success/error bodies were checked against the published response schemas; RSS/sitemap XML, llms.txt, robots.txt,
  JSON-LD, HTML/Markdown sitemap pages, raw HTML content and heading order, quota headers, 429, 404 and 405 were
  checked.
- Redocly CLI 2.3.0 independently validated OpenAPI 3.1 successfully. It emitted 19 advisory `security-defined`
  warnings: the contract describes no-key reads and the legacy owner-only body-secret check in prose rather than a
  formal OpenAPI Security Scheme. No fictitious authentication scheme was added.
- Raw homepage: **1,859 text characters**, **8.45%** text/markup ratio after removing script/style elements. This local
  ratio is not a claim about Ora's exact scoring formula. Raw response size: 58,119 bytes.
- Browser: desktop and 390px mobile have no horizontal overflow; the final rebuilt page is visible with JavaScript
  disabled (transition opacity 1, no hidden ancestor). Original JS transition behavior remains. A final screenshot
  request timed out; DOM/computed-style verification succeeded, and earlier desktop/mobile screenshots were visually
  inspected.
- Live `https://www.zenhungyep.com/developers` returns one 308 hop to the apex domain.
- `npm pack ./cli --dry-run --json`: only index.js, README.md, package.json included.

To repeat HTTP checks, start the production build first. The verification suite uses invalid submissions to exercise
429, so a repeated run within the 600-second window can encounter an already consumed quota. Restart a local instance or
wait for Retry-After before repeating. Do not use valid publishing credentials in probes.

## Remaining release and owner actions

1. Deploy the reviewed changes, rerun the endpoint script against the production domain, then rerun Is Agentic/Ora.
   Local checks cannot update the live score.
2. Confirm npm name ownership and licensing, authenticate with the publishing account/2FA or trusted publisher, then
   release `cli/`. Update developer docs with the verified registry URL only after publication. Current docs accurately
   say the package is unpublished.
3. Submit the sitemap and request indexing for `/` and `/developers` using the owner's Search Console/Bing credentials.
   Align existing public profiles with the canonical domain and “Zen (zenhungyep)”; no external listings or press
   messages were created. Generic “Zen” ranking cannot be guaranteed by code.
4. If globally consistent quotas become a product requirement, provision a shared store and decide service limits;
   current headers truthfully describe local quotas.
5. Strongly recommended before deployment: upgrade the session's Vercel CLI 59.11.7 to the current release with
   `npm i -g vercel@latest` (session guidance identifies 60.1.3). No global tooling was changed.

## Protocol references

- [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html)
- [RateLimit draft 11](https://www.ietf.org/archive/id/draft-ietf-httpapi-ratelimit-headers-11.html) (an Internet-Draft,
  not an RFC); legacy RateLimit-\* fields are compatibility fields.
- [Deprecation, RFC 9745](https://www.rfc-editor.org/rfc/rfc9745.html)
- [Sunset, RFC 8594](https://www.rfc-editor.org/rfc/rfc8594.html)
- [llms.txt](https://llmstxt.org/)
- [RSS 2.0](https://www.rssboard.org/rss-specification)
