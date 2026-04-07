'use client'

/**
 * [INPUT]: 依赖 useSunnyMode hook, localStorage, Audio API
 * [OUTPUT]: SunnyToggle (iOS风格开关) + SunnyOverlay (阳光百叶窗效果)
 * [POS]: easter-egg/ 的核心彩蛋组件，被 sunny-mode-wrapper 和 page.js 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef } from 'react'
import { useSunnyMode } from '@/hooks/use-sunny-mode'

const SHUTTER_COUNT = 23
const BGM_SRC = '/assets/sunny-bgm.mp3'

/**
 * iOS-style toggle switch for sunny mode
 * Self-contained: reads and toggles sunny mode via useSunnyMode internally
 */
export function SunnyToggle() {
  const { active, toggle } = useSunnyMode()

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={active ? '关闭阳光模式' : '开启阳光模式'}
        onClick={toggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${active ? 'bg-amber-500' : 'bg-gray-200'} `}
      >
        {/* Knob */}
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${active ? 'translate-x-[20px]' : 'translate-x-0.5'} `}
        />
      </button>
      <span className="text-xs text-gray-500 italic">
        {active ? 'the sun is peeking through ☀' : '← psst… try flipping this'}
      </span>
    </div>
  )
}

/**
 * Fixed overlay with horizontal blinds effect
 * Creates a 3D shutter animation with ambient audio
 * Self-contained: reads sunny mode state via useSunnyMode internally
 */
export function SunnyOverlay() {
  const { active } = useSunnyMode()
  const audioRef = useRef(null)

  // Audio playback control
  useEffect(() => {
    if (!active) return

    // Create audio element
    audioRef.current = new Audio(BGM_SRC)
    audioRef.current.volume = 0.4
    audioRef.current.loop = true
    audioRef.current.play().catch(() => {
      // Autoplay might be blocked by browser
    })

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [active])

  if (!active) return null

  // Generate 23 horizontal blinds with 60px gaps
  const blinds = Array.from({ length: SHUTTER_COUNT }, (_, i) => i)

  return (
    <>
      {/* SVG filter definition for wind animation */}
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="wind-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.04" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Overlay container */}
      <div
        className="pointer-events-none fixed inset-0 z-40"
        aria-hidden="true"
        style={{
          perspective: '1000px'
        }}
      >
        {/* Main overlay panel with blinds */}
        <div
          className="absolute transition-opacity duration-800"
          style={{
            opacity: active ? 0.07 : 0,
            top: '-30vh',
            right: 0,
            width: '80vw',
            height: '130vh',
            filter: 'blur(3px)',
            backgroundBlendMode: 'darken',
            transformOrigin: 'top right',
            transformStyle: 'preserve-3d',
            transform: `matrix3d(0.75, -0.0625, 0, 0.0008, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)`
          }}
        >
          {/* Decorative leaves with wind animation */}
          <div
            className="sunny-leaves absolute opacity-30"
            style={{
              bottom: -20,
              right: -700,
              width: 1600,
              height: 1400,
              backgroundImage: 'url(/assets/leaves.png)',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              filter: 'url(#wind-filter)'
            }}
          />

          {/* 23 horizontal blinds */}
          <div className="relative w-full">
            <div className="flex flex-col items-end gap-15">
              {blinds.map((i) => (
                <div
                  key={i}
                  className="sunny-blind h-10 w-full bg-gray-900"
                  style={{
                    animation: `blind-shutter 3s ease-in-out ${i * 0.1}s infinite alternate`
                  }}
                />
              ))}
            </div>
            {/* Vertical slats */}
            <div className="absolute inset-0 flex justify-around">
              <div className="h-full w-5 bg-gray-900" />
              <div className="h-full w-5 bg-gray-900" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blind-shutter {
          0% {
            transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -5, 0, 1);
          }
          100% {
            transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 5, 0, 1);
          }
        }
      `}</style>
    </>
  )
}
