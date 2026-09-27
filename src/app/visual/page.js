import { FloatingHeader } from '@/components/floating-header'
import { GradientBg4 } from '@/components/gradient-bg'
import { PageTitle } from '@/components/page-title'
import { ScrollArea } from '@/components/scroll-area'
import { VisualExplorer } from '@/components/visual/visual-explorer'
import { getPageSeo } from '@/lib/contentful'
import { pageMetadata } from '@/lib/seo'
import { toVisualData } from '@/lib/visual-data'
import { getVisualMedia } from '@/lib/visual-media'

export default async function VisualPage() {
  const media = await getVisualMedia()
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
          <VisualExplorer initialData={toVisualData(media)} />
        </div>
      </div>
    </ScrollArea>
  )
}

export async function generateMetadata() {
  const data = await getPageSeo('visual')
  return pageMetadata('/visual', data?.seo)
}
