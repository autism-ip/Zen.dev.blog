import { createClient } from '@supabase/supabase-js'

function createPublicClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env vars SUPABASE_URL or SUPABASE_ANON_KEY')
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// 延迟初始化：模块被求值时不做环境校验。
// 页面预渲染会触达该模块（SSR 渲染 WritingList），若在顶层抛错，
// 无 env 的构建环境（如 CI）会因整页预渲染失败而中断构建。
let publicClient = null

const supabaseClient = {
  get client() {
    if (!publicClient) {
      publicClient = createPublicClient()
    }
    return publicClient
  },

  // 代理 useViewData 用到的 Supabase 客户端方法
  from(...args) {
    return this.client.from(...args)
  },

  channel(...args) {
    return this.client.channel(...args)
  },

  removeChannel(...args) {
    return this.client.removeChannel(...args)
  }
}

export default supabaseClient
