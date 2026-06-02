# Task 003: Unify bookmark data source

**depends-on**: task-001

## Description

将 `src/app/bookmarks/[slug]/page.js` 的导入从 `@/lib/raindrop` 切换到 `@/lib/raindrop-with-auth`。

## Execution Context

**Task Number**: 003 of 007
**Phase**: Core Fixes
**Prerequisites**: Task 001 完成

## BDD Scenarios

```gherkin
Scenario: 收藏夹详情页正常渲染
  Given OAuth tokens 有效
  When 用户访问 /bookmarks/[slug]
  Then 页面显示该收藏夹下的书签列表
  And BookmarkList 组件加载 initialData

Scenario: 未配置认证时构建安全
  Given 未设置任何 OAuth 环境变量
  When 执行 npm run build
  Then 构建成功完成
  And 书签页面显示空状态而非构建错误
```

## Files to Modify/Create

- Modify: `src/app/bookmarks/[slug]/page.js` (line 9)

## Steps

### Step 1: Change import
- 第9行: `from '@/lib/raindrop'` → `from '@/lib/raindrop-with-auth'`

### Step 2: Verify API compatibility
- 确认 `getBookmarkItems(id, pageIndex)` 和 `getBookmarks()` 在两个模块中签名一致

## Verification Commands

```bash
grep -n "from '@/lib/raindrop'" src/app/bookmarks/\[slug\]/page.js
# 应返回空

grep -n "from '@/lib/raindrop-with-auth'" src/app/bookmarks/\[slug\]/page.js
# 应返回匹配
```

## Success Criteria

- `[slug]/page.js` 从 `@/lib/raindrop-with-auth` 导入
- 构建时行为安全
