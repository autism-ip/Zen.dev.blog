/**
 * [INPUT]: buildFunctionTools derived from the canonical OpenAPI document
 * [OUTPUT]: GET /tools.json, an array of OpenAI Responses API function definitions
 * [POS]: Public discovery resource; no execution or authentication capability
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { buildFunctionTools } from '@/lib/agent/function-tools'

export function GET() {
  return Response.json(buildFunctionTools(), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
