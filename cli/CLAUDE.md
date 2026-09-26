# cli/
> L2 | 父级: /CLAUDE.md

`zenhungyep` 命令行客户端：把站点公开 API 封装为可直接脚本化的命令，零依赖（仅用 Node 18+ 内置 fetch）。

成员清单
package.json: 包元数据与 bin 映射（private: true，尚未发布到 npm），engines 要求 Node >= 18
index.js: 唯一入口（可执行）。子命令 posts / post / markdown / bookmarks / openapi / llms；--base 切换目标部署，--json 输出原始 JSON；toSlug 接受 slug、路径或完整 URL

行为约定
输出走 process.stdout.write（仓库 no-console 规则只允许 error/info/warn）；错误写 stderr 并以退出码 1 结束，便于脚本判断。
默认目标 https://zenhungyep.com（apex 为规范主机，www 由 next.config.mjs 308 重定向至此）；端点契约见 src/lib/agent/openapi.js，二者必须同步演进。

使用
node cli/index.js --help
node cli/index.js posts
node cli/index.js markdown /about

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
