# Task 001: Create centralized getTokenManager module

**depends-on**: (none)

## Description

创建 `src/lib/auth/get-token-manager.js`，提取当前复制粘贴在6个文件中的 token manager 选择逻辑到单一模块。

## Execution Context

**Task Number**: 001 of 007
**Phase**: Foundation
**Prerequisites**: 无

## BDD Scenario

```gherkin
Scenario: getTokenManager 单一来源
  Given 代码库中存在 getTokenManager 选择逻辑
  When 检查所有使用 getTokenManager 的文件
  Then 所有文件都从 src/lib/auth/get-token-manager.js 导入
  And 不存在重复的选择逻辑
```

**Spec Source**: `../design/bdd-specs.md`

## Files to Modify/Create

- Create: `src/lib/auth/get-token-manager.js`

## Steps

### Step 1: Create module
- 创建 `src/lib/auth/get-token-manager.js`
- 导出 `getTokenManager()` 函数
- 选择逻辑：KV (`KV_REST_API_URL` + `KV_REST_API_TOKEN`) > Supabase (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_ANON_KEY`) > Env (fallback)
- 每个分支使用 `require()` 延迟加载对应的 token manager 模块
- 参考当前 `src/lib/raindrop-with-auth.js:6-22` 的实现

### Step 2: Verify
- 确认文件创建成功
- 确认导出的 `getTokenManager` 函数签名正确

## Verification Commands

```bash
ls -la src/lib/auth/get-token-manager.js
```

## Success Criteria

- `src/lib/auth/get-token-manager.js` 存在并导出 `getTokenManager`
- 选择逻辑与现有实现一致
