/**
 * [INPUT]: Public SITE identity and API discovery URLs
 * [OUTPUT]: Concise public developer guide and metadata
 * [POS]: app/developers public documentation entry; detailed contract lives in OpenAPI
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { FloatingHeader } from '@/components/floating-header'
import { GradientBg2 } from '@/components/gradient-bg'
import { PageTitle } from '@/components/page-title'
import { ScrollArea } from '@/components/scroll-area'
import { CONTACT, SITE } from '@/lib/agent/site'
import { pageMetadata } from '@/lib/seo'

export default function DevelopersPage() {
  return (
    <ScrollArea useScrollAreaId>
      <GradientBg2 />
      <FloatingHeader scrollTitle="Developers" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title={`${SITE.displayName} Developers`} />
          <p className="leading-relaxed text-gray-600">
            Published writing, bookmarks, and other public content can be read through the site's API. The{' '}
            <a className="link" href="/openapi.json">
              OpenAPI specification
            </a>{' '}
            describes available requests and responses.{' '}
            <a className="link" href="/tools.json">
              Function definitions
            </a>{' '}
            are available for compatible clients. These files describe public capabilities only; they do not grant
            access to restricted actions.
          </p>
          <h2 id="versioning" className="mt-8 mb-4">
            Versioning
          </h2>
          <p className="leading-relaxed text-gray-600">
            Use <code>/api/v1/</code> for new integrations. Existing unversioned URLs remain compatible with v1. Any
            breaking change will use a new major version and be announced here before retirement.
          </p>
          <h2 id="rate-limits" className="mt-8 mb-4">
            Usage limits
          </h2>
          <p className="leading-relaxed text-gray-600">
            Requests may be rate limited. Check the response headers and respect <code>Retry-After</code> when a request
            receives HTTP 429. Read endpoints are public; write operations retain their own restrictions.
          </p>
          <h2 id="function-tools" className="mt-8 mb-4">
            Machine-readable access
          </h2>
          <p className="leading-relaxed text-gray-600">
            The{' '}
            <a className="link" href="/llms.txt">
              agent guide
            </a>{' '}
            describes when to use this site. Published HTML pages also support <code>Accept: text/markdown</code>. The{' '}
            <a className="link" href="/sitemap.xml">
              sitemap
            </a>{' '}
            lists public pages.
          </p>
          <h2 id="cli" className="mt-8 mb-4">
            CLI
          </h2>
          <p className="leading-relaxed text-gray-600">
            A command-line client is available in the site's public repository. It has not been published to a package
            registry.
          </p>
          <p className="mt-8 text-sm text-gray-500">
            For corrections or questions, open an issue on{' '}
            <a href={CONTACT.url} className="link" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </ScrollArea>
  )
}

export const metadata = pageMetadata('/developers')
