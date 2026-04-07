'use client'

import { useEffect } from 'react'

/**
 * [INPUT]: 依赖 window.keydown 事件
 * [OUTPUT]: 对外提供 useKeyPress hook，监听键盘事件
 * [POS]: hooks/ 的键盘快捷键 hook，被 VinylPlayer 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export function useKeyPress(callback, keyCodes, disabled = false) {
  useEffect(() => {
    const handler = (event) => {
      if (disabled) return
      if (keyCodes.includes(event.code) && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        callback(event)
      }
    }

    window.addEventListener('keydown', handler, { passive: true })
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [callback, keyCodes, disabled])
}
