# Task 004: DRY replace getTokenManager in 6 files

**depends-on**: task-001

## Description

将6个文件中的本地 `getTokenManager()` 替换为从 `@/lib/auth/get-token-manager` 导入。

## Execution Context

**Task Number**: 004 of 007
**Phase**: Refactoring
**Prerequisites**: Task 001 完成

## BDD Scenario

```gherkin
Scenario: getTokenManager 单一来源
  Given 代码库中存在 getTokenManager 选择逻辑
  When 检查所有使用 getTokenManager 的文件
  Then 所有文件都从 src/lib/auth/get-token-manager.js 导入
  And 不存在重复的选择逻辑
```

## Files to Modify/Create

- Modify: `src/lib/raindrop-with-auth.js` (删除第6-22行，添加import)
- Modify: `src/app/api/bookmarks/route.js` (删除第6-23行，添加import)
- Modify: `src/app/api/auth/raindrop/callback/route.js` (删除第4-15行，添加import)
- Modify: `src/app/api/auth/raindrop/status/route.js` (删除本地函数，添加import)
- Modify: `src/app/api/auth/raindrop/clear/route.js` (删除本地函数，添加import)
- Modify: `src/app/api/cron/refresh-tokens/route.js` (删除第5-21行，添加import)

## Steps

### Step 1: Replace in each file
对每个文件：
1. 删除本地 `getTokenManager()` / `getStorageAndTokenManager()` 函数
2. 添加 `import { getTokenManager } from '@/lib/auth/get-token-manager'`
3. **注意 `api/bookmarks/route.js`**: 保留 storage (KV) 逻辑，只替换 token manager 部分

### Step 2: Verify

## Verification Commands

```bash
grep -rn "function getTokenManager\|function getStorageAndTokenManager" src/ \
  --include="*.js" \
  | grep -v "get-token-manager.js" \
  | grep -v "token-manager.js" \
  | grep -v "supabase-token-manager.js" \
  | grep -v "env-token-manager.js"
# 应返回空

grep -rn "from '@/lib/auth/get-token-manager'" src/ --include="*.js"
# 应返回6个匹配
```

## Success Criteria

- 6个文件中无本地函数定义
- 所有文件从集中模块导入
- `api/bookmarks/route.js` 的 storage 逻辑保留
