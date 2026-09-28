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
  required: ['ok', 'error', 'code', 'hint'],
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
  description: 'A curated bookmark.',
  properties: {
    _id: { type: 'integer', description: 'Bookmark identifier.' },
    link: { type: 'string', format: 'uri', description: 'Target URL of the bookmark.' },
    title: { type: 'string', description: 'Bookmark title.' },
    excerpt: { type: 'string', description: 'Short excerpt or summary from the target page.' },
    note: { type: 'string', description: 'Personal note added by the site owner.' },
    type: { type: 'string', description: 'Bookmark type.', examples: ['link'] },
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
    public_id: { type: 'string', description: 'Public media identifier.' },
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
        'Increments the view counter for an existing published article; unknown slugs return 404. Limited to 60 requests per trusted client IP per 10 minutes, shared with writing-page views; excess API requests return 429. Within an instance, page-triggered views are deduplicated per visitor/article for 10 minutes. Unavailable in development environments.',
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
        200: jsonResponse('Submission stored', {
          type: 'object',
          required: ['res'],
          properties: {
            res: {
              type: 'object',
              required: ['id', 'createdTime', 'fields'],
              properties: {
                id: { type: 'string', description: 'Submission record identifier.' },
                createdTime: { type: 'string', format: 'date-time', description: 'Record creation time.' },
                fields: {
                  type: 'object',
                  properties: {
                    URL: { type: 'string', format: 'uri' },
                    Email: { type: 'string', format: 'email' },
                    Date: { type: 'string', format: 'date-time' },
                    Type: { type: 'string' }
                  }
                }
              }
            }
          }
        }),
        ...errorResponses([400, 403, 429, 500])
      }
    }
  },

  '/api/musings': {
    post: {
      operationId: 'createMusing',
      summary: 'Publish a musing (owner only)',
      description:
        'Creates a short musing by opening a GitHub issue in the backing repository. Requires the shared verification code within `body`; requests without it receive 401. Reserved for the site owner’s publishing tooling.',
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
      description: 'Every indexable URL on the site, with last-modified dates when reliably available.',
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

  '/tools.json': {
    get: {
      operationId: 'getFunctionTools',
      summary: 'Get Zen (zenhungyep) function tools',
      description:
        'Returns OpenAI Responses API function definitions generated from this OpenAPI document. Clients execute the HTTP requests; endpoint access restrictions still apply.',
      tags: ['discovery'],
      responses: {
        200: jsonResponse('Function definitions', {
          type: 'array',
          items: {
            type: 'object',
            required: ['type', 'name', 'description', 'parameters', 'strict'],
            properties: {
              type: { type: 'string', const: 'function' },
              name: { type: 'string' },
              description: { type: 'string' },
              parameters: { type: 'object', additionalProperties: true },
              strict: { type: 'boolean', const: false }
            },
            additionalProperties: false
          }
        })
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
        200: {
          description: 'OpenAPI document',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OpenApiDocument' } } }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

const quotaHeaders = {
  RateLimit: {
    description:
      'IETF draft-ietf-httpapi-ratelimit-headers-11: policy name with r (available requests) and t (seconds).',
    schema: { type: 'string' },
    example: '"posts";r=119;t=60'
  },
  'RateLimit-Policy': {
    description: 'Policy name with q (quota) and w (window seconds).',
    schema: { type: 'string' },
    example: '"posts";q=120;w=60'
  },
  'RateLimit-Limit': { description: 'Compatibility field: request quota.', schema: { type: 'integer', minimum: 1 } },
  'RateLimit-Remaining': {
    description: 'Compatibility field: remaining requests.',
    schema: { type: 'integer', minimum: 0 }
  },
  'RateLimit-Reset': {
    description: 'Compatibility field: delay in seconds, not Unix time.',
    schema: { type: 'integer', minimum: 1 }
  },
  'API-Version': { description: 'API major version.', schema: { type: 'string', const: 'v1' } }
}

// Model the stable OpenAPI envelope; arbitrary extension values remain legal OpenAPI.
const openApiDocumentSchema = {
  type: 'object',
  required: ['openapi', 'info', 'paths'],
  properties: {
    openapi: { type: 'string', const: '3.1.0' },
    info: {
      type: 'object',
      required: ['title', 'version'],
      properties: { title: { type: 'string' }, version: { type: 'string' }, description: { type: 'string' } },
      additionalProperties: true
    },
    servers: {
      type: 'array',
      items: {
        type: 'object',
        properties: { url: { type: 'string', format: 'uri' }, description: { type: 'string' } },
        required: ['url']
      }
    },
    paths: { type: 'object', additionalProperties: { type: 'object', additionalProperties: true } },
    components: { type: 'object', additionalProperties: { type: 'object', additionalProperties: true } },
    tags: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, description: { type: 'string' } },
        required: ['name']
      }
    }
  }
}

export function buildOpenApi() {
  const publicPaths = structuredClone(paths)
  publicPaths['/api'] = {
    get: {
      operationId: 'getApiIndex',
      summary: 'Discover the Zen API',
      description: 'Returns the supported version and canonical documentation links.',
      tags: ['discovery'],
      responses: {
        200: jsonResponse('API index', {
          type: 'object',
          required: ['name', 'version', 'openapi', 'documentation'],
          properties: {
            name: { type: 'string' },
            version: { type: 'string', const: 'v1' },
            openapi: { type: 'string', format: 'uri' },
            documentation: { type: 'string', format: 'uri' }
          }
        })
      }
    }
  }
  for (const [path, methods] of Object.entries(publicPaths)) {
    if (!path.startsWith('/api')) continue
    for (const operation of Object.values(methods)) {
      Object.assign(operation.responses, errorResponses([404, 405, 429, 500, 503]))
      for (const [status, response] of Object.entries(operation.responses)) {
        response.headers = {
          ...quotaHeaders,
          ...(status === '429'
            ? {
                'Retry-After': {
                  description: 'Wait this many seconds before retrying (RFC 9110).',
                  schema: { type: 'integer', minimum: 1 }
                }
              }
            : {})
        }
      }
    }
    publicPaths[path.replace(/^\/api/, '/api/v1')] = Object.fromEntries(
      Object.entries(methods).map(([method, operation]) => [
        method,
        { ...operation, operationId: `${operation.operationId}V1` }
      ])
    )
  }
  for (const methods of Object.values(publicPaths)) {
    for (const operation of Object.values(methods)) operation.parameters ??= []
  }
  return {
    openapi: '3.1.0',
    info: {
      title: `${SITE.title} public API`,
      version: '1.0.0',
      summary: 'Read-only content API and discovery endpoints for a personal writing site.',
      description: [
        'Public, unauthenticated API for reading posts, bookmarks, and visual media published on zenhungyep.com.',
        'Read endpoints are safe to call without credentials. Telemetry and submission endpoints may be rate limited.',
        'Every HTML page can additionally be requested as Markdown by sending `Accept: text/markdown`; unknown paths then return HTTP 404 with a Markdown explanation.',
        'Structured errors always use the Error schema with a stable `code` field.',
        'Versioning: use /api/v1/*; unversioned /api/* aliases retain v1 behavior. Breaking changes require a new major URL. No version is currently deprecated. Before retiring a version, publish a migration guide and at least 90 days notice at /developers#versioning, with Deprecation (RFC 9745 Structured Field Date), Sunset (RFC 8594 HTTP-date) and a Link with rel=deprecation on affected responses.',
        'RateLimit and RateLimit-Policy describe available request budgets. HTTP 429 includes Retry-After delay-seconds.'
      ].join(' '),
      contact: {
        name: CONTACT.label,
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
    paths: publicPaths,
    components: {
      schemas: {
        OpenApiDocument: openApiDocumentSchema,
        Post: postSchema,
        Bookmark: bookmarkSchema,
        VisualMedia: visualMediaSchema,
        Error: errorSchema
      }
    }
  }
}
