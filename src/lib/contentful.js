/**
 * [INPUT]: Contentful GraphQL and existing environment credentials, React request memoization
 * [OUTPUT]: CMS reads using actual Entry/Seo fragments; hourly caching, explicit content failures and optional SEO fallbacks
 * [POS]: Shared CMS provider for pages, APIs, feeds and machine-readable content
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import 'server-only'

import { cache } from 'react'

import { isDevelopment } from '@/lib/utils'

const fetchGraphQL = cache(async (query, preview = isDevelopment, revalidate = 3600) => {
  const token = preview ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN : process.env.CONTENTFUL_ACCESS_TOKEN
  // Credential-free CI can render local pages. Configured production failures must
  // propagate as server errors, never masquerade as a missing article (404).
  if (!process.env.CONTENTFUL_SPACE_ID || !token) return null
  const res = await fetch(`https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`, {
    ...(preview ? { cache: 'no-store' } : { cache: 'force-cache', next: { revalidate } }),
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(15000)
  })
  if (!res.ok) throw new Error(`Content service unavailable (${res.status})`)
  const result = await res.json()
  if (result.errors?.length) throw new Error('Content service returned an invalid response')
  return result
})

// https://nextjs.org/docs/app/building-your-application/data-fetching/patterns#preloading-data
export const preloadGetAllPosts = (preview = isDevelopment) => {
  void getAllPosts(preview).catch(() => {})
}

export const getAllPosts = cache(async (preview = isDevelopment) => {
  const entries = await fetchGraphQL(
    `query {
        postCollection(preview: ${preview}) {
          items {
            title
            slug
            date
            sys {
              firstPublishedAt
              publishedAt
            }
          }
        }
      }`,
    preview,
    3600
  )

  return entries?.data?.postCollection?.items ?? []
})

export const getPost = cache(async (slug, preview = isDevelopment) => {
  const entry = await fetchGraphQL(
    `query {
        postCollection(where: { slug: ${JSON.stringify(slug)} }, preview: ${preview}, limit: 1) {
          items {
            title
            slug
            date
            seo {
              ... on Seo {
              description
              }
            }
            content {
              json
              links {
                assets {
                  block {
                    sys {
                      id
                    }
                    url(transform: {
                      format: AVIF,
                      quality: 50
                    })
                    title
                    width
                    height
                    description
                    contentfulMetadata {
                      tags {
                        name
                      }
                    }
                  }
                }
                entries {
                  block {
                    sys {
                      id
                    }
                    __typename
                    ... on ContentEmbed {
                      title
                      embedUrl
                      type
                    }
                    ... on CodeBlock {
                      title
                      code
                    }
                    ... on Tweet {
                      id
                    }
                    ... on Carousel {
                      imagesCollection {
                        items {
                          title
                          description
                          url(transform: {
                            format: AVIF,
                            quality: 50
                          })
                        }
                      }
                    }
                    ... on Seo {
                      description
                    }
                  }
                  inline {
                    sys {
                      id
                    }
                    __typename
                    ... on ContentEmbed {
                      title
                      embedUrl
                      type
                    }
                    ... on CodeBlock {
                      title
                      code
                    }
                    ... on Tweet {
                      id
                    }
                    ... on Carousel {
                      imagesCollection {
                        items {
                          title
                          description
                          url(transform: {
                            format: AVIF,
                            quality: 50
                          })
                        }
                      }
                    }
                    ... on Seo {
                      description
                    }
                  }
                }
              }
            }
            sys {
              firstPublishedAt
              publishedAt
            }
          }
        }
      }`,
    preview
  )

  const data = entry?.data?.postCollection?.items?.[0]
  if (!data) return null

  // Ensure the data structure is complete with fallbacks
  return {
    ...data,
    title: data.title || 'Untitled',
    seo: { title: data.title, ...data.seo },
    content: data.content || { json: null },
    sys: data.sys || {}
  }
})

export const getWritingSeo = cache(async (slug, preview = isDevelopment) => {
  const entry = await fetchGraphQL(
    `query {
        postCollection(where: { slug: ${JSON.stringify(slug)} }, preview: ${preview}, limit: 1) {
          items {
            title
            date
            seo {
              ... on Seo {
              description
              ogImageTitle
              ogImageSubtitle
              keywords
              }
            }
            sys {
              firstPublishedAt
              publishedAt
            }
          }
        }
      }`,
    preview
  )

  const data = entry?.data?.postCollection?.items?.[0]
  if (!data) return null

  // Ensure the data structure is complete with fallbacks
  return {
    ...data,
    seo: { title: data.title, ...data.seo },
    sys: data.sys || {}
  }
})

export const getPageSeo = cache(async (slug, preview = isDevelopment) => {
  const entry = await fetchGraphQL(
    `query {
        pageCollection(where: { slug: ${JSON.stringify(slug)} }, preview: ${preview}, limit: 1) {
          items {
            title
            seo {
              ... on Seo {
              description
              ogImageTitle
              ogImageSubtitle
              keywords
              }
            }
          }
        }
      }`,
    preview
  )

  const data = entry?.data?.pageCollection?.items?.[0]
  return data ? { ...data, seo: { title: data.title, ...data.seo } } : null
})

// Local-content pages can render without optional editorial SEO overrides.
// Keep getPageSeo strict for CMS resources whose existence depends on it.
export const getOptionalPageSeo = cache(async (slug, preview = isDevelopment) => {
  try {
    return await getPageSeo(slug, preview)
  } catch {
    return null
  }
})

export const getAllPageSlugs = cache(async (preview = isDevelopment) => {
  const entries = await fetchGraphQL(
    `query {
        pageCollection(preview: ${preview}) {
          items {
            slug
            sys {
              id
              firstPublishedAt
              publishedAt
            }
          }
        }
      }`,
    preview
  )

  return entries?.data?.pageCollection?.items ?? []
})

export const getAllPostSlugs = cache(async (preview = isDevelopment) => {
  const entries = await fetchGraphQL(
    `query {
        postCollection(preview: ${preview}) {
          items {
            slug
          }
        }
      }`,
    preview
  )

  return entries?.data?.postCollection?.items ?? []
})

export const getPage = cache(async (slug, preview = isDevelopment) => {
  const entry = await fetchGraphQL(
    `query {
        pageCollection(where: { slug: ${JSON.stringify(slug)} }, preview: ${preview}, limit: 1) {
          items {
            title
            slug
            seo { ... on Seo { description } }
            content {
              json
              links {
                assets {
                  block {
                    sys {
                      id
                    }
                    url(transform: {
                      format: AVIF,
                      quality: 50
                    })
                    title
                    width
                    height
                    description
                  }
                }
                entries {
                  block {
                    sys {
                      id
                    }
                    __typename
                    ... on ContentEmbed {
                      title
                      embedUrl
                      type
                    }
                    ... on CodeBlock {
                      title
                      code
                    }
                    ... on Tweet {
                      id
                    }
                    ... on Carousel {
                      imagesCollection {
                        items {
                          title
                          description
                          url(transform: {
                            format: AVIF,
                            quality: 50
                          })
                        }
                      }
                    }
                    ... on Seo {
                      description
                    }
                  }
                  inline {
                    sys {
                      id
                    }
                    __typename
                    ... on ContentEmbed {
                      title
                      embedUrl
                      type
                    }
                    ... on CodeBlock {
                      title
                      code
                    }
                    ... on Tweet {
                      id
                    }
                    ... on Carousel {
                      imagesCollection {
                        items {
                          title
                          description
                          url(transform: {
                            format: AVIF,
                            quality: 50
                          })
                        }
                      }
                    }
                    ... on Seo {
                      description
                    }
                  }
                }
              }
            }
            sys {
              id
              firstPublishedAt
              publishedAt
            }
          }
        }
      }`,
    preview
  )

  const data = entry?.data?.pageCollection?.items?.[0]
  return data ? { ...data, seo: { title: data.title, ...data.seo } } : null
})

export const getAllLogbook = cache(async (preview = isDevelopment) => {
  const entries = await fetchGraphQL(
    `query {
        logbookCollection(order: date_DESC, preview: ${preview}) {
          items {
            title
            date
            description
            image {
              url(transform: {
                format: AVIF,
                quality: 50
              })
              title
              description
              width
              height
            }
          }
        }
      }`,
    preview
  )

  return entries?.data?.logbookCollection?.items ?? []
})
