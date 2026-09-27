import { FloatingHeader } from '@/components/floating-header'
import { GradientBg4 } from '@/components/gradient-bg'
import { PageTitle } from '@/components/page-title'
import { ScrollArea } from '@/components/scroll-area'
import { VisualExplorer } from '@/components/visual/visual-explorer'
import { getPageSeo } from '@/lib/contentful'
import { pageMetadata } from '@/lib/seo'
import { toVisualData } from '@/lib/visual-data'
import { getVisualPageData } from '@/lib/visual-page-data'

export default async function VisualPage() {
  const { media, unavailable } = await getVisualPageData()
  return (
    <ScrollArea>
      <GradientBg4 />
      <FloatingHeader title="Visual" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="Visual Portfolio" />
          <p className="mb-8 text-gray-600">
            Explore a curated collection of visual works including photography and AI-generated art. Discover creative
            expressions across different mediums and styles.
          </p>
          <VisualExplorer
            initialData={toVisualData(media)}
            initialError={unavailable ? 'Gallery temporarily unavailable. Please try again later.' : null}
          />
        </div>
      </div>
    </ScrollArea>
  )
}

export async function generateMetadata() {
  const [data, { unavailable }] = await Promise.all([getPageSeo('visual'), getVisualPageData()])
  return { ...pageMetadata('/visual', data?.seo), ...(unavailable && { robots: { index: false, follow: true } }) }
}
