# Zen.dev.blog - Next.js personal site
Next.js 15 + React 19 + Tailwind CSS 4 + Vitest + ESLint + Vercel

<directory>
.github/ - GitHub automation and repository policy (1子目录: workflows)
src/ - App Router pages, API routes, components, hooks, data, shared libraries
public/ - Static assets served directly by Next.js
scripts/ - Deployment and operational verification scripts
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
CI 只认一个入口: `npm run ci:gate`。本地与 GitHub Actions 走同一条 lint -> test -> build 路径，避免门禁与开发命令分裂。

开发规范:
业务文件维护 L3 头部契约；目录级结构变更同步最近的 CLAUDE.md；新增门禁必须可在本地复现。

变更日志:
2026-05-31: 建立 L1 项目宪法，记录 CI Gate 与核心目录职责。

法则: 极简·稳定·导航·版本精确
