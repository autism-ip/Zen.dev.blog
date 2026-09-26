// @vitest-environment node
import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { promisify } from 'node:util'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const exec = promisify(execFile)
let server, base
beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/api/v1/posts')
      res.end(JSON.stringify({ ok: true, posts: [{ title: 'Article', url: 'https://zenhungyep.com/writing/test' }] }))
    else if (req.url === '/api/v1/bookmarks') res.end(JSON.stringify([{ title: 'Link', link: 'https://example.com' }]))
    else if (req.url === '/openapi.json') res.end(JSON.stringify({ openapi: '3.1.0' }))
    else if (req.url === '/llms.txt') res.end('# Zen (zenhungyep)')
    else if (req.url === '/writing/missing') {
      res.statusCode = 404
      res.end(JSON.stringify({ error: 'Not found', code: 'not_found', hint: 'Use posts to find a slug' }))
    } else if (req.headers.accept === 'text/markdown') res.end(`# Markdown ${req.url}`)
    else {
      res.statusCode = 404
      res.end('Not found')
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})
afterAll(() => new Promise((resolve) => server.close(resolve)))
const run = (...args) => exec(process.execPath, ['cli/index.js', ...args, '--base', base])

describe('official CLI package', () => {
  it('is publishable with a bounded package file list', () => {
    const pkg = JSON.parse(readFileSync('cli/package.json'))
    expect(pkg.private).not.toBe(true)
    expect(pkg.files).toContain('README.md')
    expect(pkg.bin.zenhungyep).toBe('./index.js')
  })
  it.each([
    ['posts', 'Article'],
    ['bookmarks', 'Link'],
    ['openapi', '3.1.0'],
    ['llms', '# Zen'],
    ['help', 'Usage']
  ])('runs %s', async (command, expected) => {
    expect((await run(command)).stdout).toContain(expected)
  })
  it('prints JSON suitable for scripts', async () => {
    expect(JSON.parse((await run('posts', '--json')).stdout)[0].title).toBe('Article')
  })
  it.each([
    'a b',
    '/writing/a%20b',
    'https://zenhungyep.com/writing/a%20b',
    'https://zenhungyep.com/writing/a%20b?ref=feed#section',
    '/writing/a%20b?ref=feed#section'
  ])('encodes a post slug once: %s', async (slug) => {
    expect((await run('post', slug)).stdout.trim()).toBe('# Markdown /writing/a%20b')
  })
  it('requests Markdown', async () => expect((await run('markdown', 'about')).stdout).toContain('# Markdown /about'))
  it('reports machine codes and hints on stderr with a nonzero exit', async () => {
    await expect(run('post', 'missing')).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('not_found')
    })
    await expect(run('post', 'missing')).rejects.toMatchObject({ stderr: expect.stringContaining('Use posts') })
  })
  it.each([['wat'], ['post'], ['posts', '--wat'], ['posts', '--base', 'file:///tmp']])(
    'rejects invalid input %s',
    async (...args) => {
      await expect(exec(process.execPath, ['cli/index.js', ...args])).rejects.toMatchObject({ code: 1 })
    }
  )
})
