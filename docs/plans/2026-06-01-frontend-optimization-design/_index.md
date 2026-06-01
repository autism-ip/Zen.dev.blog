# Frontend Optimization Design

> 2026-06-01 | Zen.dev.blog | feature/frontend-optimization

## Context

Zen.dev.blog 是一个基于 Next.js 15 + React 19 + Tailwind CSS 4 的个人博客站点。当前前端存在以下问题：

1. **移动端适配不足**：FloatingHeader 使用 JS scroll handler 硬切换，缺少过渡动画和 safe area 适配
2. **字体加载阻塞渲染**：Google Fonts 使用 `media="print"` hack，中文字体无子集化
3. **动画性能瓶颈**：framer-motion 动画对象每次渲染重建，缺少 GPU 加速和 reduced-motion 支持
4. **性能隐患**：Supabase realtime channel 泄漏风险，scroll handler 未节流，图片 sizes 不精确

## Requirements

### R1: 移动端适配 (P1)
- FloatingHeader 使用 CSS scroll-driven 动画替代 JS handler
- 底部安全区域适配 iOS notch/home indicator
- 页面切换动画（framer-motion AnimatePresence）
- 触摸反馈（active 状态、scale 动画）
- 滑动手势返回支持

### R2: 视觉精修 (P2)
- 三字体策略保持，优化加载：
  - Geist Sans/Mono：保持现有加载方式
  - Noto Serif SC：font-display: swap + unicode-range 子集化
  - Brittany Signature：preload 关键字体
- 添加 `prefers-reduced-motion` 媒体查询支持
- 色彩精修：避免纯黑/纯白，中性色 tint
- 动画流畅度提升：GPU 加速、easing 曲线优化

### R3: 性能优化 (P3)
- 动画对象不可变化（useMemo 缓存）
- Supabase realtime channel 泄漏修复
- Scroll handler 使用 requestAnimationFrame 节流
- 图片 sizes 属性精确匹配
- ShowInView rootMargin 预加载

## Success Criteria

- [ ] 移动端 FloatingHeader 过渡动画流畅（60fps）
- [ ] iOS safe area 全面适配
- [ ] 字体加载不阻塞首屏渲染
- [ ] prefers-reduced-motion 生效
- [ ] 无 Supabase channel 泄漏
- [ ] Lighthouse Performance > 90
- [ ] CLS < 0.1

## Design Documents

- [BDD Specifications](./bdd-specs.md) - Behavior scenarios and testing strategy
- [Architecture](./architecture.md) - System architecture and component details
- [Best Practices](./best-practices.md) - Security, performance, and code quality guidelines
