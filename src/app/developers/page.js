/**
 * [INPUT]: 依赖 @/lib/agent/openapi 的 buildOpenApi（端点单一真相源）、@/lib/agent/site 的 SITE/AGENT_FILES/CONTACT、@/components 的布局组件
 * [OUTPUT]: DevelopersPage 页面组件与 metadata 元数据
 * [POS]: app/developers 的页面入口；公开 API 的开发者门户，端点清单直接从 OpenAPI 文档渲染以避免文档漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { FloatingHeader } from '@/components/floating-header'
import { GradientBg2 } from '@/components/gradient-bg'
import { PageTitle } from '@/components/page-title'
import { ScrollArea } from '@/components/scroll-area'
import { buildOpenApi } from '@/lib/agent/openapi'
import { AGENT_FILES, CONTACT, SITE } from '@/lib/agent/site'
import { pageMetadata } from '@/lib/seo'

const CODE_BLOCK = 'overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed'

const QUICKSTART = `# list writing posts as JSON
curl -sS ${SITE.url}/api/v1/posts

# read the curated bookmarks feed
curl -sS ${SITE.url}/api/v1/bookmarks

# ask any page for Markdown instead of HTML
curl -sS -H 'Accept: text/markdown' ${SITE.url}/`

const ERROR_SAMPLE = `{
  "ok": false,
  "error": "Invalid slug parameter",
  "code": "invalid_slug",
  "hint": "Pass a slug of 1-200 characters"
}`

function EndpointList() {
  const spec = buildOpenApi()

  return (
    <ul className="flex list-none flex-col gap-6">
      {Object.entries(spec.paths).map(([path, operations]) =>
        Object.entries(operations).map(([method, operation]) => (
          <li key={`${method}-${path}`} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="rounded-md bg-gray-900 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-white uppercase">
                {method}
              </span>
              <code className="font-mono text-sm text-gray-900">{path}</code>
              <span className="text-xs text-gray-400">{operation.operationId}</span>
            </div>
            <p className="text-sm text-gray-600">{operation.description}</p>
          </li>
        ))
      )}
    </ul>
  )
}

export default function DevelopersPage() {
  return (
    <ScrollArea useScrollAreaId>
      <GradientBg2 />
      <FloatingHeader scrollTitle="Developers" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="Zen (zenhungyep) Developers" />
          <p className="leading-relaxed text-gray-600">
            {SITE.name} exposes a small, read-only HTTP API for its published content, plus machine-readable
            descriptions of the site itself. Read endpoints need no API keys. Publishing a musing is reserved for the
            owner; bookmark submissions are for the human form. All JSON endpoints publish their request quotas.
          </p>

          <h2 className="mt-8 mb-4">Quickstart</h2>
          <pre className={CODE_BLOCK}>
            <code>{QUICKSTART}</code>
          </pre>

          <h2 className="mt-8 mb-4">Authentication</h2>
          <p className="leading-relaxed text-gray-600">
            Content endpoints require no credentials. Two endpoints are intentionally constrained: view counting and
            bookmark suggestions are rate-limited per IP, and publishing a musing requires a shared secret held by the
            site owner. If you receive <code className="inline-code">401</code> or{' '}
            <code className="inline-code">403</code>, the response body explains which rule applied.
          </p>

          <h2 id="versioning" className="mt-8 mb-4">
            Versioning and deprecation
          </h2>
          <p className="leading-relaxed text-gray-600">
            Use <code>/api/v1/</code> for new integrations. Existing <code>/api/</code> URLs remain v1 aliases with the
            same response bodies, permissions, and quotas. Additive fields may appear; clients should ignore unknown
            fields. Breaking changes require a new major URL. No version is currently deprecated and no retirement is
            scheduled. Before retiring a version, this page will announce a migration guide and at least 90 days of
            notice. Affected responses will include <code>Deprecation</code> as a Structured Field Date (RFC 9745),
            <code> Sunset</code> as an HTTP-date (RFC 8594), and a <code>Link</code> with <code>rel="deprecation"</code>
            .
          </p>

          <h2 id="rate-limits" className="mt-8 mb-4">
            Rate limits
          </h2>
          <p className="leading-relaxed text-gray-600">
            Public JSON reads allow 120 requests per 60 seconds per endpoint. View counting allows 60 per 600 seconds;
            bookmark submissions and musing publication allow 5 per 600 seconds. Quotas are per client IP and server
            instance, held in bounded memory; restarts or routing to another instance may reset them. Versioned and
            unversioned aliases share the same bucket. Responses are private and not cached with another client's quota.
          </p>
          <p className="leading-relaxed text-gray-600">
            Client identity comes from Vercel's controlled IP header. Other hosts must configure
            <code> TRUSTED_CLIENT_IP_HEADER</code> for a gateway that overwrites that header. When trusted identity is
            unavailable, reads remain available without quota headers and writes return 503; clients never share an
            anonymous quota bucket. Counter requests share their budget with writing-page views. Within each instance,
            page views are deduplicated per visitor/article for ten minutes. Only published articles can receive counts.
          </p>
          <pre className={CODE_BLOCK}>
            <code>{'RateLimit-Policy: "posts";q=120;w=60\nRateLimit: "posts";r=119;t=60'}</code>
          </pre>
          <p className="leading-relaxed text-gray-600">
            These fields follow{' '}
            <a className="link" href="https://www.ietf.org/archive/id/draft-ietf-httpapi-ratelimit-headers-11.html">
              IETF RateLimit draft 11
            </a>
            , which is not yet an RFC. <code>q</code> is the quota, <code>w</code> the window in seconds,
            <code>r</code> available requests, and <code>t</code> seconds until reset. Compatibility fields
            <code> RateLimit-Limit</code>, <code>RateLimit-Remaining</code>, and <code>RateLimit-Reset</code> expose the
            same values (Reset is seconds, not a timestamp). HTTP 429 includes <code>Retry-After</code> seconds; wait
            that long before retrying. Unknown paths return JSON 404; unsupported methods return JSON 405 with
            <code> Allow</code>. Malformed JSON returns 400.
          </p>

          <h2 className="mt-8 mb-4">Endpoints</h2>
          <EndpointList />

          <h2 id="function-tools" className="mt-8 mb-4">
            Function calling
          </h2>
          <p className="leading-relaxed text-gray-600">
            <a className="link" href="/tools.json">
              Zen (zenhungyep) function tools
            </a>{' '}
            provides an array of OpenAI Responses API function definitions generated from{' '}
            <a className="link" href="/openapi.json">
              OpenAPI
            </a>
            . Each function name matches an operationId. Your client executes the corresponding HTTP request: map query
            arguments to URL query parameters and body arguments to the JSON request body. Reads without arguments use
            an empty object schema. Strict mode is disabled to preserve optional arguments. These definitions grant no
            credentials or permissions; owner-only operations and human bookmark submissions retain their existing
            restrictions. For public reading, select the GET operations you need.
          </p>

          <h2 className="mt-8 mb-4">Markdown for agents</h2>
          <p className="leading-relaxed text-gray-600">
            Any HTML page can be requested as Markdown by sending{' '}
            <code className="inline-code">Accept: text/markdown</code>. The response is served with{' '}
            <code className="inline-code">Content-Type: text/markdown</code> and{' '}
            <code className="inline-code">Vary: Accept</code>. Unknown paths answer with HTTP{' '}
            <code className="inline-code">404</code> and a Markdown explanation instead of a silent HTML shell.
          </p>

          <h2 className="mt-8 mb-4">Errors</h2>
          <p className="mb-3 leading-relaxed text-gray-600">
            Every API error is structured JSON with a stable, machine-readable <code className="inline-code">code</code>{' '}
            plus a human-readable message and a resolution hint:
          </p>
          <pre className={CODE_BLOCK}>
            <code>{ERROR_SAMPLE}</code>
          </pre>

          <h2 className="mt-8 mb-4">Machine-readable resources</h2>
          <ul className="flex list-none flex-col gap-2 text-sm">
            {AGENT_FILES.map((file) => (
              <li key={file.path}>
                <a href={file.path} className="link">
                  {file.path}
                </a>
                <span className="text-gray-500"> — {file.description}</span>
              </li>
            ))}
          </ul>

          <h2 id="cli" className="mt-8 mb-4">
            Official Zen (zenhungyep) CLI
          </h2>
          <p className="leading-relaxed text-gray-600">
            A small command-line client lives in the site repository under <code className="inline-code">cli/</code>. It
            wraps the endpoints above (<code className="inline-code">posts</code>,{' '}
            <code className="inline-code">bookmarks</code>, <code className="inline-code">markdown</code>,{' '}
            <code className="inline-code">openapi</code>) and runs with Node.js 22 or later. It is not yet published to
            a package registry. From a repository checkout, install with npm install --global ./cli, or run node
            cli/index.js posts. The CLI uses v1 endpoints and reports error codes and hints on stderr.
          </p>

          <p className="mt-8 text-sm text-gray-500">
            Missing an endpoint you need, or found the API misbehaving? Open an issue:{' '}
            <a href={CONTACT.url} className="link" target="_blank" rel="noopener noreferrer">
              {CONTACT.label}
            </a>
          </p>
        </div>
      </div>
    </ScrollArea>
  )
}

export const metadata = pageMetadata('/developers')
