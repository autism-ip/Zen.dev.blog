# Architecture — Bookmarks & Auth Fix

## Current State (问题)

```
                    ┌──────────────────────┐
                    │   Raindrop.io API     │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                 │
    ┌─────────▼──────┐  ┌─────▼──────────┐  ┌──▼───────────────┐
    │  raindrop.js    │  │raindrop-with-  │  │ api/bookmarks/   │
    │  (静态token)    │  │auth.js (OAuth) │  │ route.js (OAuth) │
    └───────┬─────────┘  └──────┬─────────┘  └──┬───────────────┘
            │                   │                │
            │           ┌───────▼────────┐       │
            │           │ getTokenManager │       │
            │           │ (复制6份!)      │       │
            │           └────────────────┘       │
            │                                    │
    ┌───────▼──────────┐                ┌───────▼────────┐
    │ [slug]/page.js   │                │ BookmarkList   │
    │ (用旧路径!)      │                │ (infinite scroll)│
    └──────────────────┘                └────────────────┘
```

## Target State (修复后)

```
                    ┌──────────────────────┐
                    │   Raindrop.io API     │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  raindrop-with-auth   │
                    │  (唯一数据源)         │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │ get-token-manager.js  │
                    │ (单一选择逻辑)        │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                 │
    ┌─────────▼──────┐  ┌─────▼──────────┐  ┌──▼───────────────┐
    │  KV TokenMgr   │  │ Supabase T.M.  │  │ Env T.M.        │
    └────────────────┘  └────────────────┘  └──────────────────┘
```

## Changes Overview

| File | Action | Description |
|------|--------|-------------|
| `src/lib/auth/get-token-manager.js` | **新建** | 集中化 token manager 选择逻辑 |
| `src/app/bookmarks/[slug]/page.js` | **修改** | 导入源从 `raindrop` → `raindrop-with-auth` |
| `src/lib/raindrop-with-auth.js` | **修改** | 删除本地 `getTokenManager()`，改用集中模块 |
| `src/app/api/bookmarks/route.js` | **修改** | 同上 |
| `src/app/api/auth/raindrop/callback/route.js` | **修改** | 同上 |
| `src/app/api/auth/raindrop/status/route.js` | **修改** | 同上 |
| `src/app/api/auth/raindrop/clear/route.js` | **修改** | 同上 |
| `src/app/api/cron/refresh-tokens/route.js` | **修改** | 同上 + 增强错误处理 |
| `src/lib/auth/crypto.js` | **修改** | `createCipher` → `createCipheriv` |
| `src/app/admin/raindrop-setup/page.js` | **修改** | 添加 Basic Auth 保护 |

## Dependencies

```
get-token-manager.js
  ├── token-manager.js (KV)
  ├── supabase-token-manager.js
  └── env-token-manager.js

raindrop-with-auth.js
  └── get-token-manager.js (新增依赖)

所有 API routes
  └── get-token-manager.js (替换本地函数)
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| crypto API 变更导致旧 token 无法解密 | 中 | createCipheriv 支持相同 IV 格式；不兼容时标记 needs_reauth |
| [slug]/page.js 切换后构建时行为变化 | 低 | raindrop-with-auth 已有构建时安全处理 |
| Admin 保护可能锁住开发环境 | 低 | ADMIN_SECRET 未设置时跳过验证 |
