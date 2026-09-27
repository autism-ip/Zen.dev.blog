# src/app/
> L2 | 父级: /CLAUDE.md

成员清单
layout.js: 根布局，无 JS 时解除路由动画的初始隐藏，next/font/local 自托管字体、Providers、Analytics、Sidebar 包裹
page.js: 首页，Hero 区域 + 最新内容列表
template.tsx: 路由切换动画模板，LazyMotion + AnimatePresence + m 实现按需加载的淡入淡出过渡
not-found.js: 404 页面与 noindex；error.js: 无敏感详情的可重试错误页
opengraph-image.js: 根级 OG 图片生成
shared-metadata.js: 共享 metadata 常量（ogImage 尺寸等）
actions.js: Server Actions，书签分页经白名单校验后直接调用已认证 provider，避免共享出口 IP 的公共 HTTP 配额
robots.js: robots.txt 生成
sitemap.js: sitemap.xml 生成，CMS 不可用时仍包含所有静态分区与开发者页面
llms.txt/: GET /llms.txt 路由，面向 agent 的指南（when-to-use + 如何调用），数据来自 lib/agent
openapi.json/: GET /openapi.json 路由，发布 lib/agent/openapi 的 OpenAPI 3.1 规格
bookmarks.xml: bookmarks RSS feed（规范站点身份、合法 XML、GUID 与 self 链接）
writing.xml: writing RSS feed
[slug]/: 动态页面路由 + OG 图片
about/: Person/ProfilePage 结构化数据与信任锚点页（Who/What/How，500+ 字符）
contact/: 信任锚点页（唯一公开联系渠道为 GitHub Issues）
privacy/: 信任锚点页（逐项声明采集与不采集的数据）
developers/: 开发者门户，端点清单直接渲染自 OpenAPI 文档
admin/: 管理后台
api/: API 路由（auth、bookmarks、draft、revalidate、posts、markdown 等）
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
