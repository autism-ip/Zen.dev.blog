# Task 005: Enhance cron error handling

**depends-on**: task-004

## Description

增强 `src/app/api/cron/refresh-tokens/route.js` 错误处理：refresh 失败时返回结构化响应，refresh_token 过期时标记 `needs_reauth`。

## Execution Context

**Task Number**: 005 of 007
**Phase**: Enhancement
**Prerequisites**: Task 004 完成

## BDD Scenario

```gherkin
Scenario: Token 刷新失败告警
  Given Cron 任务执行每日 token 刷新检查
  When refresh_token 已过期导致刷新失败
  Then 返回结构化错误响应 { success: false, needs_reauth: true }
  And 控制台输出明确的错误日志
```

## Files to Modify/Create

- Modify: `src/app/api/cron/refresh-tokens/route.js`

## Steps

### Step 1: Enhance catch block
- 识别 refresh_token 相关错误（HTTP 401 / "invalid_grant"）
- 区分 `needs_reauth`（refresh_token 失效）vs `refresh_failed`（临时错误）
- 返回: `{ success: false, needs_reauth: boolean, error: string }`
- 记录结构化 console.error

### Step 2: Verify

## Verification Commands

```bash
grep -n "needs_reauth" src/app/api/cron/refresh-tokens/route.js
# 应返回匹配
```

## Success Criteria

- catch 块返回结构化响应
- `needs_reauth` 标记在 refresh_token 失效时设置
- 结构化 console.error 输出
