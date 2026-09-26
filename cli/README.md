# zenhungyep CLI

Official, zero-dependency Node.js client for [Zen (zenhungyep)](https://zenhungyep.com). Requires Node.js 22 or later.
API contract: [OpenAPI 3.1](https://zenhungyep.com/openapi.json).

## Install from this repository

The package is prepared for npm publication but is **not published yet**. From a checkout of this repository:

```sh
npm install --global ./cli
zenhungyep --help
zenhungyep posts --json
zenhungyep post <slug>
zenhungyep bookmarks --json
zenhungyep markdown /about
zenhungyep openapi
zenhungyep llms
```

Without installation, use `node cli/index.js posts`. To inspect another deployment, append
`--base https://your-deployment.example` (an HTTP(S) origin, without a path). `posts --json` emits an array of posts;
`bookmarks --json` emits an array of bookmarks. Other commands emit Markdown, JSON, or the plain-text agent guide. All
output goes to stdout; errors include the HTTP status, code and resolution hint on stderr and exit 1. Requests time out
after 30 seconds. There are no automatic retries or write commands.

## Versioning and quotas

Content calls use `/api/v1/posts` and `/api/v1/bookmarks`. Read calls are unauthenticated. Respect `RateLimit` and
`RateLimit-Policy`; on 429 wait for `Retry-After` seconds. See the
[versioning policy](https://zenhungyep.com/developers#versioning).

## Maintainer release

Verify the public deployment supports v1 before releasing this CLI. Confirm npm name ownership, package licensing, and
login/2FA or trusted publishing credentials, then:

```sh
npm pack ./cli --dry-run
cd cli
npm publish --access public
```

After a successful release, replace the unpublished notice here and on `/developers` with the verified npm URL and
installation command. No registry release is implied by building or packing this directory.
