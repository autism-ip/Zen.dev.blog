import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types'
import dynamic from 'next/dynamic'

import { Link } from '@/components/link'
import { ShowInView } from '@/components/show-in-view'

const TweetCard = dynamic(() => import('@/components/tweet-card/tweet-card').then((mod) => mod.TweetCard))
const CodeBlock = dynamic(() => import('@/components/contentful/code-block').then((mod) => mod.CodeBlock))
const DynamicIframe = dynamic(() => import('@/components/contentful/iframe').then((mod) => mod.Iframe))
import { dasherize } from '@/lib/utils'

async function renderEmbeddedEntry(entry) {
  switch (entry.__typename) {
    case 'ContentEmbed': {
      const { embedUrl, title, type } = entry

      switch (type) {
        case 'Video': {
          const YouTubeEmbed = await import('@next/third-parties/google').then((mod) => mod.YouTubeEmbed)
          const videoId = embedUrl.split('/embed/')[1]

          return (
            <ShowInView>
              <YouTubeEmbed
                videoid={videoId}
                playlabel={title}
                params="fs=0;controls=0&mute=1"
                className="aspect-video"
              />
              {title && <div className="py-2 text-center text-xs font-light text-gray-500">{title}</div>}
            </ShowInView>
          )
        }
        case 'SoundCloud': {
          return <DynamicIframe embedUrl={embedUrl} title={title} scrolling="no" className="h-[166px]" />
        }
        case 'link': {
          return (
            <Link
              href={embedUrl}
              className="my-2 block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900">{title}</span>
              <span className="mt-1 block text-xs text-gray-500">{new URL(embedUrl).hostname}</span>
            </Link>
          )
        }
        default:
          return null
      }
    }
    case 'CodeBlock': {
      return <CodeBlock {...entry} />
    }
    case 'Tweet': {
      const { id } = entry
      return <TweetCard id={id} />
    }
    case 'Carousel': {
      const Carousel = await import('@/components/contentful/carousel').then((mod) => mod.Carousel)
      return <Carousel images={entry.imagesCollection?.items} />
    }
    case 'Seo': {
      const img = parseMarkdownImage(entry.description)
      if (!img) return null
      return (
        <figure className="mb-6 flex flex-col gap-2 overflow-hidden rounded-xl">
          <img
            src={img.src}
            alt={img.alt || entry.title || ''}
            loading="lazy"
            decoding="async"
            className="animate-reveal"
          />
          {img.alt && (
            <figcaption className="text-center text-xs font-light break-all text-gray-500">{img.alt}</figcaption>
          )}
        </figure>
      )
    }
    default:
      return null
  }
}

// 解析 Seo entry 中 markdown 图片语法: ![alt](url)
function parseMarkdownImage(description) {
  if (!description) return null
  const match = description.match(/!\[(?<alt>[^\]]*)\]\((?<url>[^)]+)\)/)
  if (!match) return null
  const { alt, url } = match.groups
  // 补全协议
  const src = url.startsWith('//') ? `https:${url}` : url
  return { src, alt }
}

function options(links) {
  const findAsset = (id) => links?.assets.block.find((item) => item.sys.id === id)
  const findEntry = (id) =>
    links?.entries.block.find((item) => item.sys.id === id) ?? links?.entries.inline.find((item) => item.sys.id === id)

  return {
    renderMark: {
      [MARKS.BOLD]: (text) => <span className="font-semibold text-black">{text}</span>,
      [MARKS.ITALIC]: (text) => <span className="italic">{text}</span>,
      [MARKS.CODE]: (text) => <code className="inline-code">{text}</code>
    },
    renderNode: {
      [BLOCKS.HEADING_2]: (_, children) => {
        const id = dasherize(children)
        const url = `h2-${id}`
        return (
          <h2
            id={url}
            className="group relative mt-6 mb-2 w-fit cursor-pointer before:absolute before:-left-4 hover:before:content-['#']"
          >
            <a href={`#${url}`} className="group-hover:underline group-hover:underline-offset-4">
              {children}
            </a>
          </h2>
        )
      },
      [BLOCKS.HEADING_3]: (_, children) => {
        const id = dasherize(children)
        const url = `h3-${id}`
        return (
          <h3
            id={url}
            className="group relative mt-6 mb-2 w-fit cursor-pointer before:absolute before:-left-4 hover:before:content-['#']"
          >
            <a href={`#${url}`} className="group-hover:underline group-hover:underline-offset-4">
              {children}
            </a>
          </h3>
        )
      },
      // Must be a <div> instead of <p> to avoid descendant issue, hence to avoid mismatching UI between server and client on hydration.
      [BLOCKS.PARAGRAPH]: (_, children) => (
        <div className="mb-4 leading-[1.75] last:mb-0 [&:has(+ul)]:mb-1">{children}</div>
      ),
      [BLOCKS.UL_LIST]: (_, children) => <ul className="mb-4 flex list-disc flex-col gap-0.5 pl-6">{children}</ul>,
      [BLOCKS.OL_LIST]: (_, children) => (
        <ol className="mb-4 flex list-inside list-[decimal-leading-zero] flex-col gap-2">{children}</ol>
      ),
      [BLOCKS.LIST_ITEM]: (_, children) => <li>{children}</li>,
      [BLOCKS.QUOTE]: (_, children) => (
        <blockquote className="mb-4 rounded-r-lg border-l-2 border-gray-200 px-4 font-medium text-gray-500">
          {children}
        </blockquote>
      ),
      [BLOCKS.EMBEDDED_ASSET]: (node) => {
        const asset = findAsset(node.data.target.sys.id)
        if (!asset) return null
        const isEagerLoading = asset.contentfulMetadata?.tags?.some((tag) => tag.name === 'Eager Loading')

        return (
          <figure className="mb-6 flex flex-col gap-2 overflow-hidden rounded-xl">
            <img
              src={asset.url}
              width={asset.width || 400}
              height={asset.height || 300}
              alt={asset.description || asset.title}
              loading={isEagerLoading ? 'eager' : 'lazy'}
              decoding="async"
              className="animate-reveal"
              // eslint-disable-next-line react/no-unknown-property
              nopin="nopin"
            />
            {asset.description && (
              <figcaption className="text-center text-xs font-light break-all text-gray-500">
                {asset.description}
              </figcaption>
            )}
          </figure>
        )
      },
      [BLOCKS.HR]: () => <hr className="my-12" />,
      [BLOCKS.EMBEDDED_ENTRY]: async (node) => {
        const entry = findEntry(node.data.target.sys.id)
        if (!entry) return null
        return renderEmbeddedEntry(entry)
      },
      [INLINES.HYPERLINK]: (node, children) => <Link href={node.data.uri}>{children}</Link>,
      [INLINES.EMBEDDED_ENTRY]: async (node) => {
        const entry = findEntry(node.data.target.sys.id)
        if (!entry) return null
        return renderEmbeddedEntry(entry)
      }
    }
  }
}

export const RichText = ({ content }) => {
  if (!content) return null
  return documentToReactComponents(content.json, options(content.links))
}
