/**
 * [INPUT]: 依赖 vitest 与 @/lib/agent/openapi 的 buildOpenApi
 * [OUTPUT]: OpenAPI 契约测试：唯一 operationId、逐操作描述与响应、类型化参数、可序列化
 * [POS]: lib/agent 的契约测试；守护 audit 的 function-calling 兼容性与 schema 可解析性要求
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import { buildOpenApi } from '@/lib/agent/openapi'

const spec = buildOpenApi()
const operations = Object.entries(spec.paths).flatMap(([path, methods]) =>
  Object.entries(methods).map(([method, operation]) => ({ path, method, operation }))
)

describe('buildOpenApi', () => {
  it('declares OpenAPI 3.1 with server, info and contact', () => {
    expect(spec.openapi).toBe('3.1.0')
    expect(spec.servers[0].url).toContain('zenhungyep.com')
    expect(spec.info.title).toContain('Zen')
    expect(spec.info.description.length).toBeGreaterThan(50)
    expect(spec.info.contact.url).toContain('github.com')
    expect(spec.info.contact.email).toBe('y1327514070@gmail.com')
  })

  it('documents at least the public read surface', () => {
    expect(Object.keys(spec.paths)).toEqual(
      expect.arrayContaining(['/api/posts', '/api/bookmarks', '/api/visual/list', '/llms.txt', '/openapi.json'])
    )
    expect(operations.length).toBeGreaterThanOrEqual(10)
  })

  it('gives every operation a unique operationId', () => {
    const ids = operations.map(({ operation }) => operation.operationId)

    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every operation a summary, a description and typed responses', () => {
    for (const { path, method, operation } of operations) {
      expect(operation.summary, `${method} ${path} summary`).toBeTruthy()
      expect(operation.description, `${method} ${path} description`).toBeTruthy()
      expect(operation.tags?.length, `${method} ${path} tags`).toBeGreaterThan(0)

      const responses = Object.entries(operation.responses)
      expect(responses.length, `${method} ${path} responses`).toBeGreaterThan(0)

      for (const [status, response] of responses) {
        expect(response.description, `${method} ${path} ${status} description`).toBeTruthy()
        if (status !== '200') {
          expect(response.content['application/json'].schema.$ref).toBe('#/components/schemas/Error')
        }
      }
    }
  })

  it('types every parameter with a schema', () => {
    const parameters = operations.flatMap(({ operation }) => operation.parameters ?? [])

    expect(parameters.length).toBeGreaterThan(0)
    for (const parameter of parameters) {
      expect(parameter.name).toBeTruthy()
      expect(['query', 'header', 'path', 'cookie']).toContain(parameter.in)
      expect(parameter.schema?.type).toBeTruthy()
      expect(typeof parameter.required).toBe('boolean')
    }
  })

  it('is fully serializable and self-contained', () => {
    const serialized = JSON.parse(JSON.stringify(spec))

    expect(serialized.components.schemas.Error.properties.code.type).toBe('string')
    expect(serialized.components.schemas.Post.required).toContain('slug')
    expect(serialized.components.schemas.Bookmark.properties.link.format).toBe('uri')
    expect(serialized.components.schemas.VisualMedia.properties.created_at.format).toBe('date-time')
  })
})
