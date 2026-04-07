'use client'

/**
 * [INPUT]: 依赖动态加载的 APlayer + MetingJS 脚本（按需加载，非全局），enabled 参数控制初始化
 * [OUTPUT]: 对外提供 useMeting hook，暴露播放控制和状态
 * [POS]: vinyl-player 的音频数据层，桥接 MetingJS Web Component 与 React 状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export const PLAYLIST_ID = process.env.NEXT_PUBLIC_NETEASE_PLAYLIST_ID || '450272643'
const MAX_POLL_ATTEMPTS = 50

// Singleton pattern: scripts only load once globally
let scriptLoadPromise = null
const loadScripts = () => {
  if (scriptLoadPromise) return scriptLoadPromise

  scriptLoadPromise = new Promise((resolve, reject) => {
    // Load APlayer CSS first
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css'
    document.head.appendChild(link)

    // Load APlayer JS
    const aplayer = document.createElement('script')
    aplayer.src = 'https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js'
    aplayer.onload = () => {
      // Then load Meting JS
      const meting = document.createElement('script')
      meting.src = 'https://cdn.jsdelivr.net/npm/meting@2.0.1/dist/Meting.min.js'
      meting.onload = resolve
      meting.onerror = reject
      document.body.appendChild(meting)
    }
    aplayer.onerror = reject
    document.body.appendChild(aplayer)
  })

  return scriptLoadPromise
}

const extractTrack = (audios, index) => {
  const t = audios?.[index]
  return t ? { name: t.name, artist: t.artist, cover: t.cover } : null
}

export function useMeting({ enabled = false } = {}) {
  const containerRef = useRef(null)
  const aplayerRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    // Load scripts dynamically first, then poll for meting element
    loadScripts()
      .then(() => {
        const metingEl = containerRef.current?.querySelector('meting-js')
        if (!metingEl) return

        let attempts = 0
        const poll = setInterval(() => {
          if (++attempts > MAX_POLL_ATTEMPTS) {
            clearInterval(poll)
            return
          }

          const ap = metingEl.aplayer
          if (!ap) return

          clearInterval(poll)
          aplayerRef.current = ap

          if (ap.list?.audios?.length > 0) {
            setCurrentTrack(extractTrack(ap.list.audios, ap.list.index))
          }

          const onPlay = () => setIsPlaying(true)
          const onPause = () => setIsPlaying(false)
          const onSwitch = (e) => setCurrentTrack(extractTrack(ap.list.audios, e.index))

          ap.on('play', onPlay)
          ap.on('pause', onPause)
          ap.on('listswitch', onSwitch)

          setIsReady(true)
        }, 300)
      })
      .catch(console.error)

    return () => {
      const ap = aplayerRef.current
      if (ap && typeof ap.off === 'function') {
        ap.off('play')
        ap.off('pause')
        ap.off('listswitch')
      }
    }
  }, [enabled])

  const toggle = useCallback(() => aplayerRef.current?.toggle(), [])
  const next = useCallback(() => aplayerRef.current?.skipForward(), [])
  const prev = useCallback(() => aplayerRef.current?.skipBack(), [])

  return { containerRef, isReady, isPlaying, currentTrack, toggle, next, prev }
}
