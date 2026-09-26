/**
 * [INPUT]: 依赖 @/lib/agent/site 的 SITE / CONTACT 事实
 * [OUTPUT]: 对外提供 buildOpenApi() —— OpenAPI 3.1 文档对象（唯一 operationId、逐操作描述、类型化参数与响应 schema）
 * [POS]: lib/agent 的契约层；被 /openapi.json 路由序列化发布，是 agent 理解本站公开 API 的机器可读入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { CONTACT, SITE } from '@/lib/agent/site'

// ---------------------------------------------------------------------------
// 可复用组件
// ---------------------------------------------------------------------------

const errorSchema = {
  type: 'object',
  description: 'Structured error envelope. Branch on `code`, not on the message text.',
  required: ['ok', 'error', 'code'],
  properties: {
    ok: { type: 'boolean', const: false },
    error: { type: 'string', description: 'Human-readable message, safe to display.' },
    code: {
      type: 'string',
      description: 'Machine-readable error code, stable across releases.',
      examples: ['invalid_slug', 'rate_limited', 'upstream_unavailable']
    },
    hint: { type: 'string', description: 'Suggested next action for the caller.' }
  }
}

const postSchema = {
  type: 'object',
  description: 'A long-form writing post.',
  required: ['title', 'slug', 'url'],
  properties: {
    title: { type: 'string', description: 'Post title in the author’s original language.' },
    slug: { type: 'string', description: 'URL-safe identifier; the post lives at /writing/{slug}.' },
    url: { type: 'string', format: 'uri', description: 'Absolute canonical URL of the post.' },
    date: {
      type: ['string', 'null'],
      format: 'date-time',
      description: 'First publication timestamp (ISO 8601).'
    },
    updatedAt: { type: ['string', 'null'], format: 'date-time', description: 'Last content update (ISO 8601).' }
  }
}

const bookmarkSchema = {
  type: 'object',
  description: 'A curated bookmark (Raindrop.io item).',
  properties: {
    _id: { type: 'integer', description: 'Raindrop item id.' },
    link: { type: 'string', format: 'uri', description: 'Target URL of the bookmark.' },
    title: { type: 'string', description: 'Bookmark title.' },
    excerpt: { type: 'string', description: 'Short excerpt or summary from the target page.' },
    note: { type: 'string', description: 'Personal note added by the site owner.' },
    type: { type: 'string', description: 'Raindrop item type.', examples: ['link'] },
    cover: { type: ['string', 'null'], format: 'uri', description: 'Cover image URL when available.' },
    tags: { type: 'array', items: { type: 'string' }, description: 'Tag list.' },
    created: { type: 'string', format: 'date-time', description: 'Creation timestamp (ISO 8601).' },
    collectionId: { type: 'integer', description: 'Whitelisted public collection this bookmark belongs to.' }
  }
}

const visualMediaSchema = {
  type: 'object',
  description: 'A photograph or AI-generated image/video from the public Visual gallery.',
  properties: {
    public_id: { type: 'string', description: 'Cloudinary public identifier.' },
    url: { type: 'string', format: 'uri', description: 'Direct asset URL.' },
    width: { type: 'integer', description: 'Pixel width.' },
    height: { type: 'integer', description: 'Pixel height.' },
    aspect_ratio: { type: 'number', description: 'width / height.' },
    format: { type: 'string', description: 'File format.', examples: ['avif', 'jpg', 'mp4'] },
    created_at: { type: 'string', format: 'date-time', description: 'Upload timestamp (ISO 8601).' },
    mediaType: { type: 'string', enum: ['image', 'video'], description: 'Media kind.' },
    sourceType: { type: 'string', enum: ['photography', 'aigc'], description: 'Origin of the media.' },
    category: { type: 'string', description: 'Owner-defined category label.' },
    title: { type: 'string', description: 'Optional title.' },
    description: { type: 'string', description: 'Optional description.' },
    location: { type: 'string', description: 'Optional capture location.' },
    camera: { type: 'string', description: 'Optional camera metadata.' },
    capturedAt: { type: ['string', 'null'], description: 'EXIF capture time when available.' },
    tags: { type: 'array', items: { type: 'string' }, description: 'Tag list.' }
  }
}

function jsonResponse(description, schema) {
  return { description, content: { 'application/json': { schema } } }
}

function errorResponses(statuses) {
  return Object.fromEntries(
    statuses.map((status) => [status, jsonResponse('Error', { $ref: '#/components/schemas/Error' })])
  )
}

// ---------------------------------------------------------------------------
// 操作
// ---------------------------------------------------------------------------

const paths = {
  '/api/posts': {
    get: {
      operationId: 'listPosts',
      summary: 'List writing posts',
      description:
        'Returns every published post on the site, newest first. Use it to build indexes, feeds, or to resolve the slug of an article before requesting its Markdown.',
      tags: ['content'],
      responses: {
        200: jsonResponse('Posts, newest first', {
          type: 'object',
          required: ['ok', 'posts'],
          properties: {
            ok: { type: 'boolean', const: true },
            posts: { type: 'array', items: { $ref: '#/components/schemas/Post' } }
          }
        }),
        ...errorResponses([500])
      }
    }
  },

  '/api/bookmarks': {
    get: {
      operationId: 'listBookmarks',
      summary: 'List curated bookmarks',
      description:
        'Without parameters, returns every bookmark across all public collections (cached upstream for two days). With `collection`, returns one whitelisted collection, 50 items per page.',
      tags: ['content'],
      parameters: [
        {
          name: 'collection',
          in: 'query',
          required: false,
          description: 'Whitelisted public collection id (numeric). Non-whitelisted ids are rejected with 400.',
          schema: { type: 'string', pattern: '^[0-9]+$' },
          examples: { ai: { value: '65582294' }, tools: { value: '65590917' } }
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          description: 'Zero-based page index. Only meaningful together with `collection`.',
          schema: { type: 'integer', minimum: 0, maximum: 200, default: 0 }
        }
      ],
      responses: {
        200: jsonResponse('Bookmark list', {
          type: 'array',
          items: { $ref: '#/components/schemas/Bookmark' }
        }),
        ...errorResponses([400, 500])
      }
    }
  },

  '/api/visual/list': {
    get: {
      operationId: 'listVisualMedia',
      summary: 'List visual media',
      description:
        'Returns photographs and AI-generated media published in the Visual gallery, newest first. Read-only.',
      tags: ['content'],
      responses: {
        200: jsonResponse('Media list', {
          type: 'object',
          required: ['ok', 'media'],
          properties: {
            ok: { type: 'boolean', const: true },
            media: { type: 'array', items: { $ref: '#/components/schemas/VisualMedia' } }
          }
        }),
        ...errorResponses([500])
      }
    }
  },

  '/api/increment-views': {
    post: {
      operationId: 'incrementViewCount',
      summary: 'Record a page view',
      description:
        'Increments the public view counter for one page slug. Rate limited to 60 requests per IP per 10 minutes; excess returns 429. Unavailable in development environments.',
      tags: ['telemetry'],
      parameters: [
        {
          name: 'slug',
          in: 'query',
          required: true,
          description: 'Page slug to increment, 1–200 characters (letters, digits, CJK, space, dash, underscore, dot).',
          schema: { type: 'string', minLength: 1, maxLength: 200 }
        }
      ],
      responses: {
        200: jsonResponse('Counter incremented', {
          type: 'object',
          properties: {
            messsage: { type: 'string', description: 'Confirmation message (spelling preserved for compatibility).' }
          }
        }),
        ...errorResponses([400, 429, 500])
      }
    }
  },

  '/api/submit-bookmark': {
    post: {
      operationId: 'submitBookmark',
      summary: 'Suggest a bookmark',
      description:
        'Submits a link suggestion for the owner to review. Rate limited to 5 requests per IP per 10 minutes. Automated agents are rejected with 403 — this endpoint serves the human form on the site.',
      tags: ['submissions'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['url', 'email'],
              properties: {
                url: { type: 'string', format: 'uri', description: 'URL being suggested.' },
                email: { type: 'string', format: 'email', description: 'Contact email of the submitter.' },
                type: { type: 'string', description: 'Suggested category.', examples: ['Other', 'Design', 'AI'] }
              }
            }
          }
        }
      },
      responses: {
        200: jsonResponse('Submission stored', { type: 'object', additionalProperties: true }),
        ...errorResponses([400, 403, 429, 500])
      }
    }
  },

  '/api/musings': {
    post: {
      operationId: 'createMusing',
      summary: 'Publish a musing (owner only)',
      description:
        'Creates a short musing by opening a GitHub issue in the backing repository. Requires the shared verification code at the end of `body`; requests without it receive 401. Reserved for the site owner’s publishing tooling.',
      tags: ['owner'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['body'],
              properties: {
                body: {
                  type: 'string',
                  description: 'Musing text. Must end with the owner’s private verification code.'
                },
                labels: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Labels applied to the created issue.',
                  default: ['Public']
                }
              }
            }
          }
        }
      },
      responses: {
        200: jsonResponse('Musing created', {
          type: 'object',
          properties: {
            success: { type: 'boolean', const: true },
            issue: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                number: { type: 'integer' },
                url: { type: 'string', format: 'uri' },
                title: { type: 'string' }
              }
            }
          }
        }),
        ...errorResponses([400, 401, 500])
      }
    }
  },

  '/writing.xml': {
    get: {
      operationId: 'getWritingFeed',
      summary: 'Writing RSS feed',
      description: 'RSS 2.0 feed of the Writing section.',
      tags: ['feeds'],
      responses: {
        200: { description: 'RSS document', content: { 'application/rss+xml': { schema: { type: 'string' } } } }
      }
    }
  },

  '/bookmarks.xml': {
    get: {
      operationId: 'getBookmarksFeed',
      summary: 'Bookmarks RSS feed',
      description: 'RSS 2.0 feed of the Bookmarks section.',
      tags: ['feeds'],
      responses: {
        200: { description: 'RSS document', content: { 'application/rss+xml': { schema: { type: 'string' } } } }
      }
    }
  },

  '/sitemap.xml': {
    get: {
      operationId: 'getSitemap',
      summary: 'Sitemap',
      description: 'Every indexable URL on the site, with change frequency and priority.',
      tags: ['discovery'],
      responses: {
        200: { description: 'Sitemap document', content: { 'application/xml': { schema: { type: 'string' } } } }
      }
    }
  },

  '/llms.txt': {
    get: {
      operationId: 'getLlmsTxt',
      summary: 'Agent guide',
      description:
        'Plain-text guide for agents: what the site is, when to use it, which resources exist, and how to request Markdown.',
      tags: ['discovery'],
      responses: {
        200: { description: 'Agent guide', content: { 'text/plain': { schema: { type: 'string' } } } }
      }
    }
  },

  '/openapi.json': {
    get: {
      operationId: 'getOpenApiSpec',
      summary: 'This specification',
      description: 'Returns this OpenAPI document.',
      tags: ['discovery'],
      responses: {
        200: { description: 'OpenAPI document', content: { 'application/json': { schema: { type: 'object' } } } }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

export function buildOpenApi() {
  return {
    openapi: '3.1.0',
    info: {
      title: `${SITE.name} public API`,
      version: '1.0.0',
      summary: 'Read-only content API and discovery endpoints for a personal writing site.',
      description: [
        'Public, unauthenticated API for reading posts, bookmarks, and visual media published on zenhungyep.com.',
        'Read endpoints are safe to call without credentials. Telemetry and submission endpoints are rate limited per IP.',
        'Every HTML page can additionally be requested as Markdown by sending `Accept: text/markdown`; unknown paths then return HTTP 404 with a Markdown explanation.',
        'Structured errors always use the Error schema with a stable `code` field.'
      ].join(' '),
      contact: {
        name: CONTACT.label,
        email: CONTACT.email,
        url: CONTACT.url
      }
    },
    servers: [{ url: SITE.url, description: 'Production' }],
    tags: [
      { name: 'content', description: 'Read published content.' },
      { name: 'discovery', description: 'Machine-readable descriptions of the site.' },
      { name: 'feeds', description: 'RSS feeds.' },
      { name: 'telemetry', description: 'Public counters. Rate limited.' },
      { name: 'submissions', description: 'Human-facing submission endpoints. Rate limited; bots rejected.' },
      { name: 'owner', description: 'Endpoints reserved for the site owner. Require a shared secret.' }
    ],
    paths,
    components: {
      schemas: {
        Post: postSchema,
        Bookmark: bookmarkSchema,
        VisualMedia: visualMediaSchema,
        Error: errorSchema
      }
    }
  }
}
