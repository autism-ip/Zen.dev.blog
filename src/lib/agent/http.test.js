/**
 * [INPUT]: 依赖 vitest 与 @/lib/agent/http 的 prefersMarkdown / markdownResponse / apiError
 * [OUTPUT]: 内容协商判定与响应构造的行为测试
 * [POS]: lib/agent 的 HTTP 语义层测试；守护 Accept 协商与结构化错误契约，防止 agent 可读性回归
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import { apiError, MARKDOWN_CONTENT_TYPE, markdownResponse, prefersMarkdown } from '@/lib/agent/http'

describe('prefersMarkdown', () => {
  it('accepts an explicit text/markdown request', () => {
    expect(prefersMarkdown('text/markdown')).toBe(true)
  })

  it('accepts markdown listed before html', () => {
    expect(prefersMarkdown('text/markdown, text/html;q=0.8')).toBe(true)
  })

  it('rejects browser accept headers', () => {
    const browser = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
    expect(prefersMarkdown(browser)).toBe(false)
  })

  it('rejects wildcard-only headers', () => {
    expect(prefersMarkdown('*/*')).toBe(false)
  })

  it('rejects markdown with lower priority than html', () => {
    expect(prefersMarkdown('text/html, text/markdown;q=0.5')).toBe(false)
  })

  it('rejects empty and missing headers', () => {
    expect(prefersMarkdown('')).toBe(false)
    expect(prefersMarkdown(undefined)).toBe(false)
  })

  it('does not treat rsc component requests as markdown', () => {
    expect(prefersMarkdown('text/x-component')).toBe(false)
  })
})

describe('markdownResponse', () => {
  it('serves markdown with an explicit content type and a single Vary: Accept', async () => {
    const response = markdownResponse('# Hello')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe(MARKDOWN_CONTENT_TYPE)
    expect(response.headers.get('vary')).toBe('Accept')
    expect(await response.text()).toBe('# Hello')
  })

  it('carries the status through for error documents', async () => {
    const response = markdownResponse('# 404 — Page not found', { status: 404 })

    expect(response.status).toBe(404)
    expect(await response.text()).toContain('404')
  })
})

describe('apiError', () => {
  it('returns a structured error that keeps the legacy error string', async () => {
    const response = apiError({
      code: 'invalid_slug',
      message: 'Invalid slug parameter',
      hint: 'Use 1-200 safe characters',
      status: 400
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'Invalid slug parameter',
      code: 'invalid_slug',
      hint: 'Use 1-200 safe characters'
    })
  })
})
