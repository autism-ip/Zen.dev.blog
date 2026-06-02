# Bookmarks & Auth Bug Fix — Design

> 2026-06-02 | bugfix | Medium complexity

## Context

Bookmarks 全面停止工作。根因：OAuth refresh_token 过期4个月未续期 + `[slug]/page.js` 使用旧静态 token 路径。

## Requirements

| # | 需求 | 来源 |
|---|------|------|
| R1 | 统一书签数据源，消除 `raindrop.js` 与 `raindrop-with-auth.js` 的分裂 | Issue 1 |
| R2 | 提取重复的 `getTokenManager()` 到单一模块 | Issue 5 |
| R3 | 增强 cron token 刷新的可靠性与告警 | Root cause |
| R4 | admin 页面加 Basic Auth 保护 | Issue 4 |
| R5 | 修复废弃 crypto API | Issue 8 |
| R6 | 支持 token 过期时的优雅降级 | Root cause |

## Design: 6 Changes

### Change 1: 统一数据源
`src/app/bookmarks/[slug]/page.js` 第9行:
```
- import { getBookmarkItems, getBookmarks } from '@/lib/raindrop'
+ import { getBookmarkItems, getBookmarks } from '@/lib/raindrop-with-auth'
```

### Change 2: 提取 getTokenManager
新建 `src/lib/auth/get-token-manager.js`:
```js
export function getTokenManager() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { getTokenManager } = require('./token-manager')
    return getTokenManager()
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    const { getTokenManager } = require('./supabase-token-manager')
    return getTokenManager()
  }
  const { getTokenManager } = require('./env-token-manager')
  return getTokenManager()
}
```
替换以下6处本地定义：
- `src/lib/raindrop-with-auth.js`
- `src/app/api/bookmarks/route.js`
- `src/app/api/auth/raindrop/callback/route.js`
- `src/app/api/auth/raindrop/status/route.js`
- `src/app/api/auth/raindrop/clear/route.js`
- `src/app/api/cron/refresh-tokens/route.js`

### Change 3: 增强 Cron
在 `src/app/api/cron/refresh-tokens/route.js` 中：
- 捕获 refresh 失败时记录结构化错误日志
- 返回明确的过期状态（不是泛 500）
- refresh_token 本身过期时标记为 `needs_reauth`

### Change 4: Admin 保护
在 `src/app/admin/raindrop-setup/page.js` 中：
- Server Component 检查 `ADMIN_SECRET` 环境变量
- 未设置时允许访问（开发向后兼容）
- 设置后通过 header 验证

### Change 5: 修复 Crypto API
`src/lib/auth/crypto.js`:
```
- crypto.createCipher(ALGORITHM, key, iv)
+ crypto.createCipheriv(ALGORITHM, key, iv)

- crypto.createDecipher(ALGORITHM, key, iv)
+ crypto.createDecipheriv(ALGORITHM, key, iv)
```

### Change 6: 优雅降级
`src/lib/raindrop-with-auth.js` 的 `makeAuthenticatedRequest`:
- 捕获 "No authentication data" 错误时返回缓存数据
- 在 admin UI 显示 token 状态警告

## Design Documents

- [BDD Specifications](./bdd-specs.md) - 行为场景与测试策略
- [Architecture](./architecture.md) - 系统架构与组件详情
- [Best Practices](./best-practices.md) - 安全、性能与代码质量指南

## Success Criteria

- [ ] `/bookmarks` 正常显示收藏夹列表
- [ ] `/bookmarks/[slug]` 正常显示书签详情
- [ ] `/admin/raindrop-setup` 受密码保护
- [ ] Cron token 刷新失败时有明确日志
- [ ] `getTokenManager()` 只定义一处
- [ ] crypto.js 使用非废弃 API
- [ ] 本地 `npm run build` 通过
