'use client'

/**
 * [INPUT]: 依赖 framer-motion 的 AnimatePresence + motion，依赖 next/navigation 的 usePathname
 * [OUTPUT]: 对外提供 Template 组件，包裹 children 实现路由切换动画
 * [POS]: src/app 的路由模板，Next.js App Router template 文件在路由变更时触发卸载/挂载从而驱动动画
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ReactNode } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
