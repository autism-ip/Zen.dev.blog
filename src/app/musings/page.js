import { FloatingHeader } from '@/components/floating-header'
import { GradientBg5 } from '@/components/gradient-bg'
import { MusingsList } from '@/components/musings-list'
import { PageTitle } from '@/components/page-title'
import { QuickPostButton } from '@/components/quick-post-button'
import { ScrollArea } from '@/components/scroll-area'
import { pageMetadata } from '@/lib/seo'

async function getMusings() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/autism-ip/git-thoughts/main/public/issues.json', {
      next: { revalidate: 86400 },
      // 显式超时：慢网络下让预渲染快速落到降级分支，而不是耗尽 Next 的 60s 预算
      signal: AbortSignal.timeout(8000)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const musings = await response.json()
    return musings
  } catch (error) {
    console.error('Failed to fetch musings from GitHub:', error)

    if (process.env.NODE_ENV === 'development') {
      try {
        const fs = await import('fs')
        const path = await import('path')
        const testDataPath = path.join(process.cwd(), 'public', 'test-musings.json')
        const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'))
        console.info('Using test data as fallback')
        return testData
      } catch (testError) {
        console.error('Failed to load test data:', testError)
      }
    }

    throw new Error('Musings temporarily unavailable')
  }
}

export default async function MusingsPage(props) {
  const musings = await getMusings()
  const searchParams = await props.searchParams
  const selectedTag = searchParams?.tag

  return (
    <ScrollArea useScrollAreaId>
      <GradientBg5 />
      <FloatingHeader scrollTitle="Musings" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="Musings" />
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-gray-500">Thoughts and reflections, powered by GitHub Issues</p>
              <p className="mt-1 text-xs text-gray-400">
                Learn more:{' '}
                <a
                  href="https://github.com/autism-ip/git-thoughts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 transition-colors hover:text-gray-700"
                >
                  git-thoughts
                </a>
              </p>
            </div>
            <QuickPostButton />
          </div>

          <MusingsList musings={musings} selectedTag={selectedTag} />
        </div>
      </div>
    </ScrollArea>
  )
}

export const metadata = pageMetadata('/musings')

export const revalidate = 3600
