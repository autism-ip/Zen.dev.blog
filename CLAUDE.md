# Zen.dev.blog - Next.js personal site
Next.js 15 + React 19 + Tailwind CSS 4 + Vitest + ESLint + Vercel

<directory>
.github/ - GitHub automation and repository policy (1子目录: workflows)
src/ - App Router pages, API routes, components, hooks, data, shared libraries
public/ - Static assets served directly by Next.js
scripts/ - Deployment and operational verification scripts
cli/ - zenhungyep CLI client for the public API (agent/developer surface, not yet published)
docs/ - Product notes, setup guides, and architecture references
</directory>

<config>
package.json - npm scripts, runtime engines, dependency graph, and ci:gate entrypoint
package-lock.json - npm reproducible install source for CI
next.config.mjs - Next.js runtime and build configuration
eslint.config.mjs - Flat ESLint policy for app code and tests
vitest.config.js - Vitest jsdom test harness and alias mapping
vercel.json - Vercel cron configuration for token refresh
</config>

架构决策:
src/lib/view-count.js 为 middleware 内部浏览计数与公共 API 共用的服务端 provider，内部更新直接访问服务，并与公共 API 共享可信访客配额及文章去重。
CI 只认一个入口: `npm run ci:gate`。本地与 GitHub Actions 走同一条 lint -> test -> build 路径，避免门禁与开发命令分裂。

开发规范:
业务文件维护 L3 头部契约；目录级结构变更同步最近的 CLAUDE.md；新增门禁必须可在本地复现。

变更日志:
2026-09-27: Agent readiness 后续修复：v1 兼容别名、JSON 404/405/400/500、共享按实例配额响应头、类型化契约、品牌发现、静态 sitemap、首页说明及 no-JS 动画兜底、CLI 可发布包与 RSS XML 修复。验证入口 scripts/verify-agent-readiness.mjs；尚未部署或发布 npm。
2026-09-27: Agent 就绪度改造（lib/agent 新模块 + 7 个新路由 + cli/）：修复 CSR bailout（Analytics/SpeedInsights 加 Suspense 边界、DialogStateProvider 去 ClientOnly、penflow ssr:false）使首页有 658 字符 SSR 内容且未知路径返回真实 404；新增 Markdown 内容协商（middleware 受控响应，单一 Vary: Accept）、/llms.txt、/openapi.json、/api/posts、/developers、/about、/contact、/privacy 与站点级 JSON-LD；全部公开 API 错误改为 {ok,error,code,hint} 结构化 JSON。
2026-09-06: 安全加固 PR #9-#14（revalidate secret 轮换删泄露脚本 / OAuth state+日志脱敏 / raindrop_tokens RLS 收紧 service_role / bookmarks 白名单 / admin fail-closed / 安全头+限流+错误脱敏 / 关闭公开 revalidate）；另修复 bookmark 显示、浏览量 matcher、raindrop token 切 Supabase。
2026-06-01: 新增 src/app/template.tsx 路由切换动画；修复 icon route Next.js 15 兼容性；next.config.mjs 增加 typescript.ignoreBuildErrors + webpack @/ alias；创建 src/app/ L2 文档。
2026-05-31: 建立 L1 项目宪法，记录 CI Gate 与核心目录职责。

法则: 极简·稳定·导航·版本精确
