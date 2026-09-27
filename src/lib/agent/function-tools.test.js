import { expect, it } from 'vitest'

import { buildFunctionTools } from '@/lib/agent/function-tools'
import { buildOpenApi } from '@/lib/agent/openapi'

it('exports a typed Responses API function for every documented operation, including no-input reads', () => {
  const tools = buildFunctionTools()
  const operations = Object.values(buildOpenApi().paths).flatMap(Object.values)
  expect(tools.map((tool) => tool.name)).toEqual(operations.map((operation) => operation.operationId))
  for (const tool of tools) {
    expect(tool.type).toBe('function')
    expect(tool.strict).toBe(false)
    expect(tool.description).toMatch(/(?:GET|POST) \//)
    expect(tool.parameters.type).toBe('object')
    expect(tool.parameters.additionalProperties).toBe(false)
  }
  expect(tools.find((tool) => tool.name === 'listPostsV1').parameters).toEqual({
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false
  })
})

it('preserves optional queries and required JSON bodies without changing HTTP contracts', () => {
  const tools = buildFunctionTools()
  const bookmarks = tools.find((tool) => tool.name === 'listBookmarksV1').parameters
  expect(bookmarks.required).toEqual([])
  expect(bookmarks.properties.query.properties.page).toMatchObject({ type: 'integer', minimum: 0, maximum: 200 })
  const counter = tools.find((tool) => tool.name === 'incrementViewCountV1').parameters
  expect(counter.required).toEqual(['query'])
  expect(counter.properties.query.required).toEqual(['slug'])
  const submit = tools.find((tool) => tool.name === 'submitBookmarkV1')
  expect(submit.description).toContain('Automated agents are rejected')
  expect(submit.parameters.required).toEqual(['body'])
  expect(submit.parameters.properties.body.required).toEqual(['url', 'email'])
  expect(tools.find((tool) => tool.name === 'createMusingV1').description).toContain('owner')
  for (const item of Object.values(buildOpenApi().paths)) {
    if (item.get) expect(item.get.requestBody).toBeUndefined()
  }
})

it('serves the generated definitions as cacheable public JSON', async () => {
  const { GET } = await import('@/app/tools.json/route')
  const response = GET()
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8')
  expect(response.headers.get('cache-control')).toContain('public')
  expect(await response.json()).toEqual(buildFunctionTools())
})
