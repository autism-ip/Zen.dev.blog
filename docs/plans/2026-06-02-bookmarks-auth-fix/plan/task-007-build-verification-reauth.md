# Task 007: Build verification and re-authorization

**depends-on**: task-002, task-003, task-004, task-005, task-006

## Description

运行完整 build 验证，确认所有修改不破坏构建。然后通过 `/admin/raindrop-setup` 重新授权 Raindrop.io OAuth。

## Execution Context

**Task Number**: 007 of 007
**Phase**: Verification
**Prerequisites**: 所有前序任务完成

## BDD Scenarios

```gherkin
Scenario: 收藏夹列表页正常渲染
  Given OAuth tokens 已存储在 KV 中且未过期
  When 用户访问 /bookmarks
  Then 页面显示所有收藏夹的标题和书签数量

Scenario: Token 过期时显示优雅降级
  Given OAuth tokens 已过期且 refresh 失败
  When 用户访问 /bookmarks
  Then 页面不崩溃
  And 显示友好的错误提示或缓存数据
```

## Files to Modify/Create

- 无（纯验证任务）

## Steps

### Step 1: Build verification
- `npm run build` — 确认无编译错误

### Step 2: Lint verification
- `npm run lint` — 确认无 lint 错误

### Step 3: Verification checks
- 无重复 getTokenManager 定义
- 无废弃 crypto API
- 无旧 raindrop.js 导入

### Step 4: Re-authorization
- 访问 `/admin/raindrop-setup`
- 完成 OAuth 授权流程
- 确认 token 状态有效

## Verification Commands

```bash
npm run build
npm run lint
grep -rn "function getTokenManager" src/ --include="*.js" | grep -v "get-token-manager.js" | grep -v "token-manager.js" | grep -v "supabase-token-manager.js" | grep -v "env-token-manager.js"
grep -n "createCipher\b\|createDecipher\b" src/lib/auth/crypto.js
```

## Success Criteria

- `npm run build` 通过
- `npm run lint` 通过
- 所有 BDD 场景验证通过
- OAuth 重新授权成功
- 书签功能恢复正常
