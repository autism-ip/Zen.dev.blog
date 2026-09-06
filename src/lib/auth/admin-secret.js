/**
 * [INPUT]: 依赖 @/lib/supabase/private 的 service client，依赖 ./crypto 的 decrypt
 * [OUTPUT]: 对外提供 getAdminSecret() / clearAdminSecretCache()
 * [POS]: auth 模块的 admin 配置读取端，从 admin_secrets 表读取加密的管理密钥，
 *        被 /admin/layout.js 守卫调用（Node runtime），短 TTL 内存缓存
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import 'server-only'

import supabase from '@/lib/supabase/private'

import { decrypt } from './crypto'

const TABLE = 'admin_secrets'
const KEY = 'admin_secret'
const CACHE_TTL_MS = 60 * 1000

let cachedSecret = null
let cachedAt = 0

/**
 * 读取管理密钥（加密存储，service client 解密）。
 * 结果缓存 60 秒——admin 访问低频，DB 不可达时守卫 fail-closed。
 * 解密失败（旧格式/密钥不匹配）返回 null，由调用方决定拒绝策略。
 */
export async function getAdminSecret() {
  if (cachedSecret !== null && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedSecret
  }

  try {
    const { data, error } = await supabase.from(TABLE).select('value').eq('key', KEY).single()

    if (error || !data?.value) {
      console.error('Failed to load admin secret from DB:', error?.message || 'no row')
      return null
    }

    cachedSecret = decrypt(data.value)
    cachedAt = Date.now()
    return cachedSecret
  } catch (error) {
    console.error('Error loading admin secret:', error)
    return null
  }
}

export function clearAdminSecretCache() {
  cachedSecret = null
  cachedAt = 0
}
