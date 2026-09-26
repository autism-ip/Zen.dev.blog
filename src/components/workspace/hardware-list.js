'use client'

import { domAnimation, LazyMotion, m } from 'framer-motion'
import { CldImage } from 'next-cloudinary'

// Cloudinary 的 cloud name 是构建期输入：CI 等无 env 环境不存在该值。
// 缺失时跳过这张装饰性照片，否则 next/image 会在预渲染时调用其 loader 并抛错，导致整页构建失败。
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

export function HardwareList({ items }) {
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'laptop':
        return '💻'
      case 'display':
        return '🖥️'
      case 'input':
        return '⌨️'
      case 'audio':
        return '🎧'
      case 'lighting':
        return '💡'
      case 'mouse':
        return '🖱️'
      case 'glasses':
        return '👓'
      default:
        return '⚙️'
    }
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="space-y-8">
        {/* Desk Setup Photo */}
        <div className="flex justify-center">
          <div className="relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-lg shadow-sm">
            {CLOUD_NAME && (
              <CldImage
                src="IMG_3023_seksb4"
                alt="My Desk Setup"
                width={600}
                height={450}
                quality="auto"
                format="auto"
                sizes="(max-width: 768px) 100vw, 33vw"
                className="h-full w-full object-cover"
                crop="fill"
                gravity="center"
              />
            )}

            {/* Decorative elements */}
            <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20" />
            <div className="absolute bottom-4 left-4 h-6 w-6 rounded-full bg-white/30" />
          </div>
        </div>

        {/* Hardware List */}
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <m.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group rounded-lg border bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-base">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                  <p className="truncate text-xs text-gray-600">{item.detail}</p>
                  <p className="text-xs text-gray-500">{item.role}</p>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </LazyMotion>
  )
}
