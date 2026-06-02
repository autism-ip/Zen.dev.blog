# Best Practices — Bookmarks & Auth Fix

## Security

### Admin 页面保护
- 使用 `ADMIN_SECRET` 环境变量（不在代码中硬编码）
- 未设置时允许访问（开发环境向后兼容）
- 生产环境强制验证

### Token 存储
- 所有 token 使用 AES-256-GCM 加密存储
- `RAINDROP_ENCRYPTION_KEY` 必须足够长（32字节SHA256哈希）
- 不使用 `NEXT_PUBLIC_` 前缀存储敏感 token

## Performance

### Token Manager 选择
- 选择逻辑在模块加载时执行一次（通过单例模式）
- 不在每次请求时重新评估环境变量

### 缓存策略
- `raindrop-with-auth.js` 使用 `force-cache` + 2天 revalidate
- token 过期时的缓存降级：返回 stale 数据优于页面崩溃

## Code Quality

### DRY 原则
- `getTokenManager()` 只在 `get-token-manager.js` 中定义一次
- 所有消费者通过 import 获取，不复制逻辑

### 错误处理
- token 过期 → 尝试 refresh → refresh 失败 → 返回缓存 → 缓存无 → 优雅降级
- 每层都有明确的错误消息，不吞掉错误

### 向后兼容
- `raindrop.js` 暂时保留但标记为废弃
- crypto.js 的 IV 格式保持兼容（hex 编码，16字节 IV + 16字节 tag）

## Testing Checklist

- [ ] `npm run build` 通过
- [ ] `npm run lint` 通过
- [ ] `/bookmarks` 返回 200 + 有内容
- [ ] `/bookmarks/[slug]` 返回 200 + 有书签列表
- [ ] `/admin/raindrop-setup` 无密码时可访问
- [ ] `/admin/raindrop-setup` 有密码时需要验证
- [ ] Token 过期时页面不崩溃
- [ ] Cron 端点返回结构化响应
