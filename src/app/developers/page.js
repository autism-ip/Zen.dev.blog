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

const CODE_BLOCK = 'overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed'

const QUICKSTART = `# list writing posts as JSON
curl -sS ${SITE.url}/api/posts

# read the curated bookmarks feed
curl -sS ${SITE.url}/api/bookmarks

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
          <PageTitle title="Developers" />
          <p className="leading-relaxed text-gray-600">
            {SITE.url.replace(/^https?:\/\//, '')} exposes a small, read-only HTTP API for its published content, plus
            machine-readable descriptions of the site itself. Everything on this page is public and unauthenticated:
            there are no API keys to request and no sandbox to sign up for. Read endpoints are safe to poll; submission
            endpoints are rate-limited per IP address.
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

          <h2 className="mt-8 mb-4">Endpoints</h2>
          <EndpointList />

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

          <h2 className="mt-8 mb-4">CLI</h2>
          <p className="leading-relaxed text-gray-600">
            A small command-line client lives in the site repository under <code className="inline-code">cli/</code>. It
            wraps the endpoints above (<code className="inline-code">posts</code>,{' '}
            <code className="inline-code">bookmarks</code>, <code className="inline-code">markdown</code>,{' '}
            <code className="inline-code">openapi</code>) and runs with Node without any global install. It is not yet
            published to a package registry — run it from a clone, or watch the repository for the published package.
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

export const metadata = {
  title: 'Developers',
  description: 'Public API, OpenAPI specification, Markdown negotiation, and CLI for zenhungyep.com.',
  alternates: {
    canonical: '/developers'
  }
}
