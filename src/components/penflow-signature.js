'use client'

import { Penflow } from 'penflow/react'
import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'

export function PenflowSignature() {
  const [playCount, setPlayCount] = useState(0)

  const { ref, inView } = useInView({
    root: null, // Use viewport as root initially
    rootMargin: '0px',
    triggerOnce: false,
    fallbackInView: true
  })

  useEffect(() => {
    if (inView) {
      setPlayCount((count) => count + 1)
    }
  }, [inView])

  return (
    <section ref={ref} className="mt-14 pt-10">
      <div className="mx-auto flex max-w-md justify-center">
        {inView ? (
          <Penflow
            key={playCount}
            text="Zen Yep"
            fontUrl="/fonts/BrittanySignature.ttf"
            color="#222222"
            size={32}
            lineHeight={1.6}
            speed={1}
            className="w-48 max-w-full"
          />
        ) : (
          <div className="h-14 w-48 max-w-full" />
        )}
      </div>
    </section>
  )
}
