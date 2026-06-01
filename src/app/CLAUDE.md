# src/app/
> L2 | 父级: /CLAUDE.md

成员清单
layout.js: 根布局，next/font/local 自托管字体、Providers、Analytics、Sidebar 包裹
page.js: 首页，Hero 区域 + 最新内容列表
template.tsx: 路由切换动画模板，LazyMotion + AnimatePresence + m 实现按需加载的淡入淡出过渡
not-found.js: 404 页面
opengraph-image.js: 根级 OG 图片生成
shared-metadata.js: 共享 metadata 常量（ogImage 尺寸等）
actions.js: Server Actions
robots.js: robots.txt 生成
sitemap.js: sitemap.xml 生成
bookmarks.xml: bookmarks RSS feed
writing.xml: writing RSS feed
[slug]/: 动态页面路由 + OG 图片
admin/: 管理后台
api/: API 路由（auth、bookmarks、draft、revalidate 等）
bookmarks/: 书签功能
friends/: 友链页
icon/: 网站图标生成
journey/: 旅程页
musings/: 随想页
stack/: 技术栈页
visual/: 视觉页
workspace/: 工作空间页
writing/: 文章功能

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
