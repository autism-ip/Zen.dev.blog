# BDD Specifications — Bookmarks & Auth Fix

## Feature: 书签页面正常显示

### Scenario: 收藏夹列表页正常渲染
```
Given: OAuth tokens 已存储在 KV 中且未过期
When: 用户访问 /bookmarks
Then: 页面显示所有收藏夹的标题和书签数量
And: 侧边栏显示收藏夹导航
```

### Scenario: 收藏夹详情页正常渲染
```
Given: OAuth tokens 有效
When: 用户访问 /bookmarks/[slug]
Then: 页面显示该收藏夹下的书签列表
And: BookmarkList 组件加载 initialData
```

### Scenario: Token 过期时显示优雅降级
```
Given: OAuth tokens 已过期且 refresh 失败
When: 用户访问 /bookmarks
Then: 页面不崩溃
And: 显示友好的错误提示或缓存数据
And: 日志记录 token 过期错误
```

### Scenario: 未配置认证时构建安全
```
Given: 未设置任何 OAuth 环境变量
When: 执行 npm run build
Then: 构建成功完成
And: 书签页面显示空状态而非构建错误
```

## Feature: Admin 页面受保护

### Scenario: 有密码时需要验证
```
Given: ADMIN_SECRET 环境变量已设置
When: 未认证用户访问 /admin/raindrop-setup
Then: 返回 401 或重定向到登录页
```

### Scenario: 无密码时开发兼容
```
Given: ADMIN_SECRET 环境变量未设置
When: 用户访问 /admin/raindrop-setup
Then: 正常显示 admin 页面（向后兼容开发环境）
```

## Feature: Token 管理集中化

### Scenario: getTokenManager 单一来源
```
Given: 代码库中存在 getTokenManager 选择逻辑
When: 检查所有使用 getTokenManager 的文件
Then: 所有文件都从 src/lib/auth/get-token-manager.js 导入
And: 不存在重复的选择逻辑
```

### Scenario: Token 刷新失败告警
```
Given: Cron 任务执行每日 token 刷新检查
When: refresh_token 已过期导致刷新失败
Then: 返回结构化错误响应 { success: false, needs_reauth: true }
And: 控制台输出明确的错误日志
```

## Feature: Crypto API 现代化

### Scenario: 使用非废弃 API
```
Given: src/lib/auth/crypto.js 使用 Node.js crypto 模块
When: 加密或解密 token
Then: 使用 createCipheriv/createDecipheriv
And: 显式传入 IV
```
