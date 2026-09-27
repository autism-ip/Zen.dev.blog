/** Read-only deployment checks; POST probes use invalid input and never publish content. */
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

import { JSDOM } from 'jsdom'

const base = (process.argv[2] || 'http://127.0.0.1:3100').replace(/\/$/, '')
const report = { base, checkedAt: new Date().toISOString(), checks: [], failures: [] }
const check = async (label, fn) => {
  try {
    await fn()
    report.checks.push(label)
    console.info(`PASS ${label}`)
  } catch (error) {
    report.failures.push({ label, message: error.message })
    console.error(`FAIL ${label}: ${error.message}`)
  }
}
const get = (path, options = {}) =>
  fetch(`${base}${path}`, {
    ...options,
    headers: {
      ...(process.env.AGENT_VERIFY_LOCAL_IP && ['localhost', '127.0.0.1'].includes(new URL(base).hostname)
        ? { 'x-real-ip': process.env.AGENT_VERIFY_LOCAL_IP }
        : {}),
      ...options.headers
    },
    signal: AbortSignal.timeout(60000)
  })
const spec = await (await get('/openapi.json')).json()
function validate(value, schema) {
  if (schema.$ref)
    return validate(
      value,
      schema.$ref
        .slice(2)
        .split('/')
        .reduce((v, k) => v[k], spec)
    )
  if (schema.const !== undefined) assert.deepEqual(value, schema.const)
  if (schema.enum) assert(schema.enum.includes(value))
  const types = Array.isArray(schema.type) ? schema.type : [schema.type]
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
  assert(
    types.includes(type) || (types.includes('integer') && Number.isInteger(value)),
    `Expected ${types}, got ${type}`
  )
  if (type === 'object') {
    for (const key of schema.required || []) assert(Object.hasOwn(value, key), `Missing ${key}`)
    for (const [key, field] of Object.entries(schema.properties || {}))
      if (Object.hasOwn(value, key)) validate(value[key], field)
  }
  if (type === 'array') for (const item of value) validate(item, schema.items)
}
await check('unique OpenAPI operation IDs', () => {
  const operations = Object.values(spec.paths).flatMap(Object.values)
  assert.equal(new Set(operations.map((op) => op.operationId)).size, operations.length)
})
for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    await check(`${method.toUpperCase()} ${path}`, async () => {
      const response = await get(
        path,
        method === 'post' ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' } : {}
      )
      assert.equal(response.status, method === 'post' ? 400 : 200)
      const contract = operation.responses[response.status]
      assert(contract, `Undocumented status ${response.status}`)
      const type = response.headers.get('content-type').split(';')[0]
      assert(contract.content[type], `Undocumented media type ${type}`)
      if (type === 'application/json') validate(await response.json(), contract.content[type].schema)
      else {
        const text = await response.text()
        assert(text.length > 20)
        if (type.includes('xml'))
          assert(!new JSDOM(text, { contentType: 'text/xml' }).window.document.querySelector('parsererror'))
      }
      if (path.startsWith('/api')) {
        assert.match(response.headers.get('ratelimit'), /^"[a-z-]+";r=\d+;t=\d+$/)
        assert.match(response.headers.get('ratelimit-policy'), /^"[a-z-]+";q=\d+;w=\d+$/)
        assert.equal(response.headers.get('api-version'), 'v1')
        assert.match(response.headers.get('cache-control'), /no-store/)
      }
    })
  }
}
await check('function definitions match every OpenAPI operation with explicit typed arguments', async () => {
  const tools = await (await get('/tools.json')).json()
  const operations = Object.values(spec.paths).flatMap(Object.values)
  assert.deepEqual(tools.map((tool) => tool.name), operations.map((operation) => operation.operationId))
  for (const tool of tools) {
    assert.equal(tool.type, 'function')
    assert.equal(tool.strict, false)
    assert.equal(tool.parameters.type, 'object')
    assert.equal(tool.parameters.additionalProperties, false)
    assert.match(tool.description, /^(GET|POST) \//)
  }
  assert.deepEqual(tools.find((tool) => tool.name === 'listPostsV1').parameters, {
    type: 'object', properties: {}, required: [], additionalProperties: false
  })
})
for (const path of ['/api/no-such-endpoint', '/api/no-such.json', '/api/v2/posts'])
  await check(`JSON 404 ${path}`, async () => {
    const response = await get(path)
    assert.equal(response.status, 404)
    validate(await response.json(), spec.components.schemas.Error)
  })
await check('JSON 405 and Allow', async () => {
  const response = await get('/api/v1/posts', { method: 'POST' })
  assert.equal(response.status, 405)
  assert.equal(response.headers.get('allow'), 'GET, HEAD, OPTIONS')
  validate(await response.json(), spec.components.schemas.Error)
})
await check('JSON 400 malformed body', async () => {
  const response = await get('/api/v1/musings', {
    method: 'POST',
    body: '{',
    headers: { 'Content-Type': 'application/json' }
  })
  assert.equal(response.status, 400)
  assert.equal((await response.json()).code, 'invalid_json')
})
await check('bodyless query-only POST preserves slug validation', async () => {
  const response = await get('/api/v1/increment-views?slug=%25', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  assert.equal(response.status, 400)
  assert.equal((await response.json()).code, 'invalid_slug')
})
await check('counter rejects unknown articles without creating a row', async () => {
  const response = await get(`/api/v1/increment-views?slug=agent-readiness-missing-${crypto.randomUUID()}`, {
    method: 'POST'
  })
  assert.equal(response.status, 404)
  assert.equal((await response.json()).code, 'not_found')
})
await check('real 429 and Retry-After (invalid submissions only)', async () => {
  let response
  for (let i = 0; i < 6; i++) {
    response = await get('/api/v1/submit-bookmark', {
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' }
    })
    if (response.status === 429) break
  }
  assert.equal(response.status, 429)
  assert(Number(response.headers.get('retry-after')) > 0)
  assert.equal(response.headers.get('ratelimit-remaining'), '0')
  validate(await response.json(), spec.components.schemas.Error)
})
await check('raw homepage content, headings and structured data', async () => {
  const html = await (await get('/')).text()
  const document = new JSDOM(html).window.document
  const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph']
  assert(graph.some((node) => node['@type'] === 'WebSite' && node.name === 'Zen (zenhungyep)' && node.alternateName.includes('zenhungyep')))
  document.querySelectorAll('script,style').forEach((node) => node.remove())
  const text = document.body.textContent.replace(/\s+/g, ' ').trim()
  const markup = document.documentElement.outerHTML.length
  report.homepage = {
    textCharacters: text.length,
    markupCharacters: markup,
    contentRatio: text.length / markup,
    rawBytes: Buffer.byteLength(html)
  }
  assert(text.length >= 500)
  assert(text.length / markup >= 0.05)
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
  assert.equal(headings.filter((node) => node.tagName === 'H1').length, 1)
  assert.match(headings[0].textContent, /Zen/)
  for (let i = 1; i < headings.length; i++)
    assert(Number(headings[i].tagName[1]) <= Number(headings[i - 1].tagName[1]) + 1)
})
await check('robots, sitemap discovery and canonical developer page', async () => {
  const robots = await (await get('/robots.txt')).text()
  assert(robots.includes('Sitemap: https://zenhungyep.com/sitemap.xml'))
  const xml = await (await get('/sitemap.xml')).text()
  for (const path of ['/developers', '/about', '/contact', '/privacy'])
    assert(xml.includes(`https://zenhungyep.com${path}`))
  const doc = new JSDOM(await (await get('/developers')).text()).window.document
  assert(doc.title.includes('zenhungyep'))
  assert.equal(doc.querySelector('link[rel="canonical"]').href, 'https://zenhungyep.com/developers')
  assert(doc.querySelector('a[href="/tools.json"]'))
  for (const anchor of ['cli', 'versioning', 'rate-limits', 'function-tools']) assert(doc.getElementById(anchor))
})
const llms = await (await get('/llms.txt')).text()
await check('llms.txt structure and integration links', () => {
  assert.match(llms, /^# Zen.*\n\n> /)
  assert(llms.includes('/tools.json'))
  assert(llms.includes('/api/v1/posts'))
  assert(llms.includes('/developers#versioning'))
  assert(llms.includes('/developers#cli'))
})
// Verify every same-site guide link and all published HTML pages in the sitemap.
const linkedPaths = [...llms.matchAll(/\]\(https:\/\/zenhungyep\.com([^)]*)\)/g)].map(
  (match) => match[1].split('#')[0] || '/'
)
const sitemapDocument = new JSDOM(await (await get('/sitemap.xml')).text(), { contentType: 'text/xml' }).window.document
const pagePaths = [...sitemapDocument.querySelectorAll('loc')].map((node) => new URL(node.textContent).pathname)
for (const path of new Set([...linkedPaths, ...pagePaths])) {
  if (path.startsWith('/api') || /\.(txt|xml|json)$/.test(path)) continue
  await check(`HTML and Markdown ${path}`, async () => {
    assert.equal((await get(path)).status, 200)
    const markdown = await get(path, { headers: { Accept: 'text/markdown' } })
    assert.equal(markdown.status, 200)
    assert.match(markdown.headers.get('content-type'), /text\/markdown/)
    assert(
      markdown.headers
        .get('vary')
        .split(',')
        .map((v) => v.trim().toLowerCase())
        .includes('accept')
    )
    assert((await markdown.text()).startsWith('# '))
  })
}
await check('direct Markdown endpoint', async () => {
  const response = await get('/api/markdown/about')
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /text\/markdown/)
})
await check('Markdown 404', async () => {
  const response = await get('/agent-check/missing', { headers: { Accept: 'text/markdown' } })
  assert.equal(response.status, 404)
  assert.match(await response.text(), /404/)
})
await writeFile(process.argv[3] || '/tmp/zen-agent-verification.json', `${JSON.stringify(report, null, 2)}\n`)
console.info(`${report.checks.length} passed; ${report.failures.length} failed`)
if (report.failures.length) process.exitCode = 1
