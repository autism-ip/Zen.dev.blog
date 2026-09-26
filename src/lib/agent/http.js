/**
 * [INPUT]: 无外部依赖；使用 Web 标准 Request/Response，可在 edge middleware 与 Node runtime 通用
 * [OUTPUT]: 对外提供 prefersMarkdown / markdownResponse / apiError / apiHandler / MARKDOWN_CONTENT_TYPE / VARIANT_HEADER
 * [POS]: lib/agent 的 HTTP 语义层；middleware 用它做内容协商，路由用它构造 markdown 与结构化 JSON 错误响应
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8'

// 内容协商的缓存键：HTML 与 Markdown 必须分别缓存
export const VARIANT_HEADER = 'Accept'

// ---------------------------------------------------------------------------
// Accept 协商
// ---------------------------------------------------------------------------

/** 解析 Accept 头中某个 media type 的 q 值，未出现时返回 0 */
function qualityOf(acceptHeader, mediaType) {
  for (const part of acceptHeader.split(',')) {
    const [rawType, ...params] = part.trim().split(';')
    if (rawType.trim().toLowerCase() !== mediaType) continue

    const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
    if (!qParam) return 1

    const q = Number.parseFloat(qParam.slice(2))
    return Number.isFinite(q) ? q : 1
  }
  return 0
}

/**
 * 仅当客户端显式要求 text/markdown 且其权重不低于 text/html 时返回 true。
 * 浏览器（text/html、image 等）与 curl 默认的通配符请求都不会命中。
 */
export function prefersMarkdown(acceptHeader) {
  if (!acceptHeader) return false

  const markdownQuality = qualityOf(acceptHeader, 'text/markdown')
  if (markdownQuality === 0) return false

  return markdownQuality >= qualityOf(acceptHeader, 'text/html')
}

// ---------------------------------------------------------------------------
// 响应构造
// ---------------------------------------------------------------------------

export function markdownResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': MARKDOWN_CONTENT_TYPE,
      Vary: VARIANT_HEADER,
      ...headers
    }
  })
}

/**
 * 结构化 JSON 错误：保留既有的 `error` 字符串字段以兼容现有消费方，
 * 同时补充 `code`（机器可读错误码）与 `hint`（解决提示），供 agent 直接消费。
 */
export function apiError({ code, message, hint, status, headers = {} }) {
  return Response.json(
    { ok: false, error: message, code, hint },
    { status, headers: { 'Cache-Control': 'private, no-store', ...headers } }
  )
}

/** Public JSON route safety net; preserve legacy payloads while containing failures. */
export function apiHandler(handler) {
  return async (request, context) => {
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
      try {
        await request.clone().json()
      } catch {
        return apiError({
          code: 'invalid_json',
          message: 'Invalid JSON request body',
          hint: 'Send valid JSON with Content-Type: application/json',
          status: 400
        })
      }
    }
    try {
      const response = await handler(request, context)
      response.headers.set('Cache-Control', 'private, no-store')
      return response
    } catch {
      return apiError({
        code: 'internal_error',
        message: 'The request could not be completed',
        hint: 'Retry later; if it persists, report the endpoint via /contact',
        status: 500
      })
    }
  }
}
