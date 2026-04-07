'use client'

/**
 * [INPUT]: 依赖 useSunnyMode hook, SunnyToggle, SunnyOverlay 组件
 * [OUTPUT]: 包装 musings 页面的阳光模式客户端组件
 * [POS]: easter-egg/ 的客户端包装器，整合 SunnyOverlay 和 SunnyToggle 到 musings 页面
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useSunnyMode } from '@/hooks/use-sunny-mode'
import { SunnyOverlay, SunnyToggle } from './sunny-mode'

export function SunnyModeWrapper({ children }) {
  const { active, toggle } = useSunnyMode()

  return (
    <>
      <SunnyOverlay active={active} />
      <div className="relative">
        {/* Floating sunny mode toggle in top-right corner */}
        <div className="fixed top-20 right-4 z-30">
          <SunnyToggle active={active} onToggle={toggle} />
        </div>
        {children}
      </div>
    </>
  )
}
