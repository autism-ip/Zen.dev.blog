import Link from 'next/link'
import { Suspense } from 'react'

import { FloatingHeader } from '@/components/floating-header'
import { PageTitle } from '@/components/page-title'
import { PenflowSignature } from '@/components/penflow-signature'
import { ScreenLoadingSpinner } from '@/components/screen-loading-spinner'
import { ScrollArea } from '@/components/scroll-area'
import { SunnyOverlay, SunnyToggle } from '@/components/sunny-mode'
import { Button } from '@/components/ui/button'
import { WritingList } from '@/components/writing-list'
import { getAllPosts } from '@/lib/contentful'
import { getItemsByYear, getSortedPosts } from '@/lib/utils'

async function fetchData() {
  const allPosts = await getAllPosts()
  const sortedPosts = getSortedPosts(allPosts)
  const items = getItemsByYear(sortedPosts)
  return { items }
}

export default async function Home() {
  const { items } = await fetchData()

  return (
    <ScrollArea useScrollAreaId>
      <SunnyOverlay />
      <FloatingHeader scrollTitle="Zen" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="Home" className="lg:hidden" />
          <p>
            Hi, I am Zen(叶振幸).
            <br />
            Open Source Intern , Mathematics & Applied Math Student 👋
            <br />
            Bridging Mathematics & AI—Python & Deep Learning frameworks (MindSpore/PyTorch).
            <br />
            From Mathematical Modeling to AI-driven diagnostics.
            <br />
            Exploring Open Source × Deep Learning; Passionate about building open source projects—let's chat!
          </p>
          <SunnyToggle />
          <Button asChild variant="link" className="inline px-0">
            <Link href="/writing">
              <h2 className="mt-8 mb-4">Writing</h2>
            </Link>
          </Button>
          <Suspense fallback={<ScreenLoadingSpinner />}>
            <WritingList items={items} header="Writing" />
          </Suspense>
          <PenflowSignature />
        </div>
      </div>
    </ScrollArea>
  )
}
