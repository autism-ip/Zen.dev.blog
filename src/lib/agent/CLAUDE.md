# src/lib/agent/
> L2 | 父级: /CLAUDE.md

面向 AI agent 与机器的对外表面层：站点身份、Markdown 镜像、结构化数据、OpenAPI 契约与统一 HTTP 语义。

成员清单
site.js: 站点身份唯一真相源（SITE/SOCIAL/CONTACT/HOME_BIO/AGENT_FILES/SECTIONS），被本目录其余文件与页面消费
api.js: API 边界：/api/v1 映射、JSON 404/405、发现入口、按实例共享配额与 IETF draft 11 响应头；仅信任平台控制的 IP 来源，无身份写入 503；页面计数共享可信访客配额并按文章去重
api.test.js / routes.test.js: API 边界、限流、错误与已有业务响应回归测试
cli.test.js: CLI 子进程与本地 HTTP 服务集成测试
readiness.test.js / feeds.test.js: 发现资源、首页、sitemap 与 RSS 格式回归测试
http.js: HTTP 语义层（prefersMarkdown 协商判定 / markdownResponse / apiError / apiHandler），edge middleware 与 Node 路由通用，无 next/server 依赖
markdown.js: 文档层（homeMarkdown/sectionMarkdown/postMarkdown/pageMarkdown/bookmarkCollectionMarkdown/notFoundMarkdown/llmsTxt），HTML 页面的机器可读镜像
rich-text.js: Contentful 富文本 → Markdown 转换器，与 components/contentful/rich-text.js（转 JSX）方向相反
posts.js: 文章索引整形（toIndexPosts），不可变排序 + 绝对 URL 编码，供 API 与 Markdown 共用
json-ld.js: 站点级 schema.org @graph（Person + WebSite），被根布局注入
openapi.js: OpenAPI 3.1 文档构造器，端点契约的唯一真相源，被 /openapi.json 与 /developers 共同渲染
documents.test.js: 文档层测试（500+ 字符首页镜像、404 说明、llms.txt when-to-use、富文本转换、JSON-LD 完整性）
http.test.js: 协商与响应构造测试（Accept 解析、单一 Vary: Accept、结构化错误）
function-tools.js / function-tools.test.js: 从 OpenAPI 生成 Responses API 函数定义；无参数操作显式空对象、保留可选参数与访问限制、JSON 发布点回归测试
identity.test.js: 品牌名称、首页个人简介与文档发现链接回归测试
openapi.test.js: 契约测试（唯一 operationId、逐操作描述、类型化参数、可序列化）

依赖方向
site.js ← 所有文件（事实层，无内部依赖）
http.js ← middleware.js 与全部 API 路由
openapi.js ← openapi.json 路由与 developers 页面（同一份数据渲染两处，杜绝文档漂移）

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
