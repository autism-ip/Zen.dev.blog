# Bookmarks & Auth Bug Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Load `superpowers:executing-plans` skill using the Skill tool to implement this plan task-by-task.

**Goal:** 修复书签无法显示和 OAuth 认证过期的 bug，统一数据源，集中化 token 管理。

**Architecture:** 提取 `getTokenManager()` 到单一模块消除6处重复，统一 `[slug]/page.js` 使用 OAuth 路径，修复废弃 crypto API，增强 cron 错误处理，admin 页面加 Basic Auth 保护。

**Tech Stack:** Next.js 15 App Router, Node.js crypto, Vercel KV, Supabase, Raindrop.io OAuth2

**Design Support:**
- [BDD Specs](../design/bdd-specs.md)
- [Architecture](../design/architecture.md)
- [Best Practices](../design/best-practices.md)

## Context

书签功能自2026年1月29日 OAuth token 过期后全面停止工作。每日 cron 刷新任务因 refresh_token 同样过期而持续失败。此外 `[slug]/page.js` 使用旧的静态 token 路径（`raindrop.js`），与使用 OAuth 路径的 `layout.js` / `page.js` 形成分裂。

| Aspect | Current State | Target State |
|--------|--------------|--------------|
| 数据源 | `raindrop.js` + `raindrop-with-auth.js` 双路径 | 仅 `raindrop-with-auth.js` |
| Token Manager | 6处复制粘贴的选择逻辑 | 单一 `get-token-manager.js` |
| Crypto API | 废弃的 `createCipher`/`createDecipher` | `createCipheriv`/`createDecipheriv` |
| Cron 错误处理 | 泛 500 错误 | 结构化 `{ success, needs_reauth }` |
| Admin 安全 | 无保护，任何人可访问 | `ADMIN_SECRET` 验证 |
| Token 过期降级 | 页面崩溃 | 优雅降级 + 缓存回退 |

## Execution Plan

```yaml
tasks:
  - id: "001"
    subject: "Create centralized getTokenManager module"
    slug: "create-centralized-token-manager"
    type: "impl"
    depends-on: []
  - id: "002"
    subject: "Fix deprecated crypto API"
    slug: "fix-deprecated-crypto-api"
    type: "impl"
    depends-on: ["001"]
  - id: "003"
    subject: "Unify bookmark data source"
    slug: "unify-bookmark-data-source"
    type: "impl"
    depends-on: ["001"]
  - id: "004"
    subject: "DRY replace getTokenManager in 6 files"
    slug: "dry-replace-token-manager"
    type: "refactor"
    depends-on: ["001"]
  - id: "005"
    subject: "Enhance cron error handling"
    slug: "enhance-cron-error-handling"
    type: "impl"
    depends-on: ["004"]
  - id: "006"
    subject: "Add admin page protection"
    slug: "add-admin-page-protection"
    type: "impl"
    depends-on: []
  - id: "007"
    subject: "Build verification and re-authorization"
    slug: "build-verification-reauth"
    type: "verify"
    depends-on: ["002", "003", "004", "005", "006"]
```

**Task File References:**
- [Task 001: Create centralized getTokenManager module](./task-001-create-centralized-token-manager.md)
- [Task 002: Fix deprecated crypto API](./task-002-fix-deprecated-crypto-api.md)
- [Task 003: Unify bookmark data source](./task-003-unify-bookmark-data-source.md)
- [Task 004: DRY replace getTokenManager in 6 files](./task-004-dry-replace-token-manager.md)
- [Task 005: Enhance cron error handling](./task-005-enhance-cron-error-handling.md)
- [Task 006: Add admin page protection](./task-006-add-admin-page-protection.md)
- [Task 007: Build verification and re-authorization](./task-007-build-verification-reauth.md)

## BDD Coverage

| BDD Scenario | Covered By |
|-------------|-----------|
| 收藏夹列表页正常渲染 | Task 003, Task 007 |
| 收藏夹详情页正常渲染 | Task 003, Task 007 |
| Token 过期时显示优雅降级 | Task 005, Task 007 |
| 未配置认证时构建安全 | Task 003, Task 007 |
| 有密码时需要验证 | Task 006, Task 007 |
| 无密码时开发兼容 | Task 006, Task 007 |
| getTokenManager 单一来源 | Task 001, Task 004 |
| Token 刷新失败告警 | Task 005, Task 007 |
| 使用非废弃 API | Task 002, Task 007 |

## Dependency Chain

```
task-001 (centralized token manager)
    │
    ├──→ task-002 (crypto API fix)
    ├──→ task-003 (unify data source)
    ├──→ task-004 (DRY replace 6 files)
    │        │
    │        └──→ task-005 (cron enhancement)
    │
task-006 (admin protection) [independent]

task-007 (build verify) ← depends on 002, 003, 004, 005, 006
```

**Analysis:**
- No circular dependencies
- 001 is the foundation — must complete first
- 002, 003, 004, 006 can proceed in parallel after 001
- 005 depends on 004 (same file: cron route)
- 007 is the final gate — verifies everything together
