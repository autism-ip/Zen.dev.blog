/**
 * [INPUT]: 依赖 @/lib/agent/openapi 的 buildOpenApi
 * [OUTPUT]: GET /openapi.json —— OpenAPI 3.1 规格的 JSON 发布点
 * [POS]: app/openapi.json 的发布路由；agent 理解本站公开 API 的入口，与 /llms.txt 形成发现闭环
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { buildOpenApi } from '@/lib/agent/openapi'

export function GET() {
  return Response.json(buildOpenApi(), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
