'use client'

import { ArrowLeftIcon, RadioIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { memo, useEffect, useMemo, useRef } from 'react'
import Balancer from 'react-wrap-balancer'

import { LoadingSpinner } from '@/components/loading-spinner'
import { Button } from '@/components/ui/button'

const MobileDrawer = dynamic(() => import('@/components/mobile-drawer').then((mod) => mod.MobileDrawer))
const SubmitBookmarkDrawer = dynamic(
  () => import('@/components/submit-bookmark/drawer').then((mod) => mod.SubmitBookmarkDrawer),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)
import { MOBILE_SCROLL_THRESHOLD, SCROLL_AREA_ID } from '@/lib/constants'

// CSS scroll-driven animation 检测：Chrome 144+ 原生接管，无需 JS 计算
const supportsScrollTimeline = typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline', 'scroll()')

export const FloatingHeader = memo(({ scrollTitle, title, goBackLink, bookmarks, currentBookmark, children }) => {
  const pathname = usePathname()
  const isWritingIndexPage = pathname === '/writing'
  const isWritingPath = pathname.startsWith('/writing')
  const isBookmarksIndexPage = pathname === '/bookmarks'
  const isBookmarkPath = pathname.startsWith('/bookmarks')

  // rAF throttle: 每帧最多执行一次，防止布局抖动
  const rafRef = useRef(null)
  const translateYRef = useRef(0)
  const opacityRef = useRef(scrollTitle ? 0 : 1)
  const spanRef = useRef(null)

  const memoizedMobileDrawer = useMemo(() => <MobileDrawer />, [])

  useEffect(() => {
    // CSS scroll-driven animation 已接管，跳过 JS fallback
    if (supportsScrollTimeline || !scrollTitle) return

    const scrollAreaElem = document.querySelector(`#${SCROLL_AREA_ID}`)

    const onScroll = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const scrollY = scrollAreaElem?.scrollTop ?? 0

        translateYRef.current = Math.max(100 - scrollY, 0)
        opacityRef.current = Math.min(
          Math.max((scrollY - MOBILE_SCROLL_THRESHOLD * (MOBILE_SCROLL_THRESHOLD / (scrollY ** 2 / 100))) / 100, 0),
          1
        )

        const el = spanRef.current
        if (el) {
          el.style.transform = `translateY(${translateYRef.current}%)`
          el.style.opacity = opacityRef.current
        }
      })
    }

    scrollAreaElem?.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scrollAreaElem?.removeEventListener('scroll', onScroll)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [scrollTitle])

  const memoizedSubmitBookmarkDrawer = useMemo(
    () => <SubmitBookmarkDrawer bookmarks={bookmarks} currentBookmark={currentBookmark} />,
    [bookmarks, currentBookmark]
  )

  const memoizedBalancer = useMemo(
    () => (
      <Balancer ratio={1}>
        <span className="line-clamp-2 font-semibold tracking-tight">{title}</span>
      </Balancer>
    ),
    [title]
  )

  return (
    <header className="floating-header sticky inset-x-0 top-0 z-10 mx-auto flex h-12 w-full shrink-0 items-center border-b bg-white text-sm font-medium lg:hidden">
      <div className="flex size-full items-center px-3">
        {/* Left: hamburger or back button (fixed width) */}
        <div className="shrink-0">
          {goBackLink ? (
            <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" asChild>
              <Link href={goBackLink} title="Go back">
                <ArrowLeftIcon size={16} />
              </Link>
            </Button>
          ) : (
            memoizedMobileDrawer
          )}
        </div>

        {/* Center: title (flex-1, truncated) */}
        <div className="flex min-w-0 flex-1 items-center justify-center truncate px-2">
          {scrollTitle && (
            <span ref={spanRef} className="line-clamp-2 font-semibold tracking-tight">
              {scrollTitle}
            </span>
          )}
          {title && !scrollTitle && memoizedBalancer}
        </div>

        {/* Right: action buttons (fixed width) */}
        <div className="flex shrink-0 items-center gap-2">
          {(isWritingIndexPage || isBookmarksIndexPage) && (
            <Button variant="outline" size="xs" asChild>
              <a
                href={isWritingIndexPage ? '/writing.xml' : '/bookmarks.xml'}
                title="RSS feed"
                target="_blank"
                rel="noopener noreferrer"
              >
                <RadioIcon size={16} className="mr-1" />
                <span className="hidden sm:inline">RSS feed</span>
              </a>
            </Button>
          )}
          {isBookmarkPath && memoizedSubmitBookmarkDrawer}
          {/* This is a hack to show writing views with framer motion reveal effect */}
          {scrollTitle && isWritingPath && children}
        </div>
      </div>
    </header>
  )
})
FloatingHeader.displayName = 'FloatingHeader'
