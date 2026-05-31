# .github/
> L2 | 父级: /CLAUDE.md

成员清单
CODEOWNERS: 仓库审阅归属规则，决定 GitHub 评审默认负责人
FUNDING.yml: GitHub Sponsors 展示配置
pull_request_template.md: PR 描述模板，约束提交者提供变更上下文
workflows/ci.yml: 主质量门禁，push/PR 运行 `npm run ci:gate`
workflows/lint-pr.yml: PR 标题语义检查，使用 semantic-pull-request action

架构决策:
CI 门禁集中在 workflows/ci.yml，脚本入口集中在 package.json，GitHub Actions 不复制业务命令。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
