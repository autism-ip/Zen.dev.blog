'use client'

import { domAnimation, LazyMotion, m } from 'framer-motion'
import { useState } from 'react'

import { MediaCard } from './media-card'

export function Gallery({ items, onItemClick }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  if (!items || items.length === 0) {
    return null
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="columns-1 gap-1 space-y-1 sm:columns-2 lg:columns-3">
        {items.map((item, index) => (
          <m.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="mb-1 break-inside-avoid"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <MediaCard item={item} isHovered={hoveredIndex === index} onClick={() => onItemClick(item, index)} />
          </m.div>
        ))}
      </div>
    </LazyMotion>
  )
}
