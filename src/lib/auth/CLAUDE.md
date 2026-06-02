# auth/
> L2 | 父级: src/lib/CLAUDE.md

成员清单
get-token-manager.js: 路由器，按 KV > Supabase > Env 优先级选择存储后端
token-manager.js: Vercel KV 后端实现，读写 KV_REST_API_URL/KV_REST_API_TOKEN
supabase-token-manager.js: Supabase 后端实现，读写 NEXT_PUBLIC_SUPABASE_URL/SUPABASE_ANON_KEY
env-token-manager.js: 环境变量兜底方案，仅读取 process.env 无需外部依赖
crypto.js: 加解密工具，token 安全存储的基础设施

法则: 成员完整·一行一文件·父级链接·技术词前置

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
