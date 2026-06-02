# Task 006: Add admin page protection

**depends-on**: (none)

## Description

为 `src/app/admin/raindrop-setup/page.js` 添加 `ADMIN_SECRET` 环境变量验证。未设置时允许访问（开发兼容）。

## Execution Context

**Task Number**: 006 of 007
**Phase**: Security
**Prerequisites**: 无

## BDD Scenarios

```gherkin
Scenario: 有密码时需要验证
  Given ADMIN_SECRET 环境变量已设置
  When 未认证用户访问 /admin/raindrop-setup
  Then 返回 401 或重定向到登录页

Scenario: 无密码时开发兼容
  Given ADMIN_SECRET 环境变量未设置
  When 用户访问 /admin/raindrop-setup
  Then 正常显示 admin 页面（向后兼容开发环境）
```

## Files to Modify/Create

- Modify: `src/app/admin/raindrop-setup/page.js`

## Steps

### Step 1: Add server-side auth check
- 在 Server Component 层添加 `ADMIN_SECRET` 检查
- 未设置 → 渲染 `<RaindropSetupContent />`
- 已设置 + 未认证 → 返回 401
- 已设置 + 已认证 → 渲染页面

### Step 2: Verify

## Verification Commands

```bash
grep -n "ADMIN_SECRET" src/app/admin/raindrop-setup/page.js
# 应返回匹配
```

## Success Criteria

- `ADMIN_SECRET` 未设置时页面正常渲染
- `ADMIN_SECRET` 已设置时需要认证
