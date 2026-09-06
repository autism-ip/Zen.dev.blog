import { Link2Icon, Tag } from 'lucide-react'
import dynamic from 'next/dynamic'

import { ErrorBoundary } from '@/components/ui/error-boundary'

const TweetCard = dynamic(() => import('@/components/tweet-card/tweet-card').then((mod) => mod.TweetCard))

// 普通书签卡片（也作为 tweet embed 失败时的降级 UI）
const RegularCard = ({ bookmark, order }) => (
  <a
    key={bookmark._id}
    className="thumbnail-shadow flex aspect-auto min-w-0 cursor-pointer flex-col gap-4 overflow-hidden rounded-xl bg-white p-4 transition-colors duration-300 hover:bg-gray-100"
    href={`${bookmark.link}?ref=me.deeptoai.com`}
    target="_blank"
    rel="noopener noreferrer"
    data-bookmark-order={order}
  >
    <span className="aspect-1200/630 overflow-hidden rounded-lg">
      <img
        src={bookmark.cover || '/assets/fallback.avif'}
        alt={bookmark.title}
        width={1200}
        height={630}
        loading={order < 2 ? 'eager' : 'lazy'}
        decoding="async"
        className="animate-reveal aspect-1200/630 rounded-lg border bg-cover bg-center bg-no-repeat object-cover"
        onError={(e) => {
          e.target.onerror = null
          e.target.src = '/assets/fallback.avif'
        }}
        nopin="nopin"
      />
    </span>
    <div className="flex flex-col gap-1">
      <h2 className="line-clamp-4 text-lg leading-snug">{bookmark.title}</h2>
      <span className="line-clamp-4 inline-flex items-center gap-1 text-sm text-gray-500">
        <Link2Icon size={16} />
        {bookmark.domain}
      </span>
      <span className="line-clamp-6 text-sm">{bookmark.excerpt || bookmark.note}</span>

      {/* Tags */}
      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {bookmark.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900"
            >
              <Tag size={10} className="text-gray-400" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  </a>
)

export const BookmarkCard = ({ bookmark, order }) => {
  // tweet 的本质特征是链接含 /status/{id}，而非收藏夹归类
  const tweetMatch = bookmark.link?.match(/\/status\/(\d+)/)

  if (tweetMatch) {
    return (
      // embed 数据源异常时不炸整页，降级为普通可点击卡片
      <ErrorBoundary fallback={<RegularCard bookmark={bookmark} order={order} />}>
        <TweetCard id={tweetMatch[1]} />
      </ErrorBoundary>
    )
  }

  return <RegularCard bookmark={bookmark} order={order} />
}
