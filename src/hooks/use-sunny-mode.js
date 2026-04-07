'use client'

/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 useSunnyMode hook → { active: boolean, toggle: () => void }
 * [POS]: hooks/ 的阳光模式状态管理，支持跨组件同步和 localStorage 持久化
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'sunny-mode'

/**
 * Cross-component sunny mode state with localStorage persistence
 * and CustomEvent broadcast for cross-tab sync
 * @returns {{ active: boolean, toggle: () => void }}
 */
export function useSunnyMode() {
  const subscribe = useCallback((callback) => {
    const handler = (event) => {
      // Handle both storage events (other tabs) and custom events (same tab)
      if (event.type === 'storage' || event.type === 'sunny-mode-storage') {
        callback()
      }
    }

    window.addEventListener('storage', handler)
    window.addEventListener('sunny-mode-storage', handler)

    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('sunny-mode-storage', handler)
    }
  }, [])

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  }, [])

  const active = useSyncExternalStore(subscribe, getSnapshot, () => false)

  const toggle = useCallback(() => {
    const newValue = localStorage.getItem(STORAGE_KEY) !== 'true'
    localStorage.setItem(STORAGE_KEY, String(newValue))

    // Broadcast change to other tabs and components via CustomEvent
    window.dispatchEvent(
      new CustomEvent('sunny-mode-storage', {
        detail: { key: STORAGE_KEY, value: String(newValue) }
      })
    )
  }, [])

  return { active, toggle }
}
