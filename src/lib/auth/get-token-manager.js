/**
 * [INPUT]: 依赖 process.env 的 KV_REST_API_URL / KV_REST_API_TOKEN / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_ANON_KEY
 * [OUTPUT]: 对外提供 getTokenManager() 函数，返回选定的 token manager 实例
 * [POS]: auth 模块的路由层，根据环境变量选择 KV / Supabase / Env 三种存储后端之一
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import 'server-only'

// ============================================================
//  Token Manager 路由器
//  按优先级选择存储后端: KV > Supabase > Env
//  使用 require() 懒加载，避免未选中的后端产生副作用
// ============================================================

const STORAGE_PRIORITY = [
  {
    // Vercel KV — 最优方案，零冷启动
    check: () => process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
    load: () => require('./token-manager').getTokenManager()
  },
  {
    // Supabase — 第二方案，有连接池开销但功能完整
    check: () => process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_ANON_KEY,
    load: () => require('./supabase-token-manager').getTokenManager()
  },
  {
    // Env — 兜底方案，仅适合开发 / 构建阶段
    check: () => true,
    load: () => require('./env-token-manager').getTokenManager()
  }
]

export function getTokenManager() {
  for (const { check, load } of STORAGE_PRIORITY) {
    if (check()) return load()
  }
}
