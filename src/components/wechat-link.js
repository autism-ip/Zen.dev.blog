'use client'

import { MessageCircleIcon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { cn } from '@/lib/utils'

/**
 * [INPUT]: 无外部依赖，使用 lucide WechatIcon
 * [OUTPUT]: 对外提供 WeChatLink 组件——点击展开/收起微信公众号二维码
 * [POS]: components 的社交链接组件，被 menu-content.js 的 Online 区域消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const QR_IMAGE_SRC = '/assets/wechat_official_account.jpg'
const QR_IMAGE_ALT = 'WeChat Official Account QR Code'

export const WeChatLink = () => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div ref={containerRef} className="flex flex-col">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-gray-200',
          isOpen && 'bg-gray-100'
        )}
      >
        <span className="inline-flex items-center gap-2 font-medium">
          <MessageCircleIcon size={16} />
          WeChat
        </span>
        <span className={cn('text-xs text-gray-400 transition-transform duration-200', isOpen && 'rotate-90')}>▸</span>
      </button>
      {isOpen && (
        <div className="overflow-hidden px-2 pb-2">
          <img
            src={QR_IMAGE_SRC}
            alt={QR_IMAGE_ALT}
            width={160}
            height={160}
            className="rounded-lg border border-gray-200"
          />
        </div>
      )}
    </div>
  )
}
