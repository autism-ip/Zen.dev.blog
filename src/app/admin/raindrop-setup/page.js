import { Suspense } from 'react'

import RaindropSetupContent from './RaindropSetupContent'

// ----------------------------------------------------------------
// L3: Raindrop OAuth setup page
// [INPUT]: 依赖 ./RaindropSetupContent 客户端组件；认证由父级 /admin/layout.js 守卫完成
// [OUTPUT]: 对外提供 RaindropSetupContent 页面渲染与 metadata
// [POS]: admin 的功能页，守卫逻辑已提升至 /admin/layout.js（密钥存 Supabase admin_secrets 表）
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
// ----------------------------------------------------------------

export const metadata = {
  title: 'Raindrop Setup - Admin',
  description: 'Configure Raindrop.io OAuth authentication'
}

export default function RaindropSetupPage() {
  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Suspense fallback={<div>Loading...</div>}>
        <RaindropSetupContent />
      </Suspense>
    </div>
  )
}
