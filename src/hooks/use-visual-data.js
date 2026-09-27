'use client'
import { useEffect, useState } from 'react'

import { toVisualData } from '@/lib/visual-data'

export function useVisualData(initialData) {
  const [data, setData] = useState(initialData ?? null)
  const [isLoading, setIsLoading] = useState(initialData === undefined)
  const [error, setError] = useState(null)
  async function fetchData() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/visual/list')
      if (!response.ok) throw new Error('Media temporarily unavailable')
      const result = await response.json()
      setData(toVisualData(result.media || []))
      setError(null)
    } catch {
      setError('Media temporarily unavailable. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    if (initialData === undefined) fetchData()
  }, [initialData])
  return { data, isLoading, error, refetch: fetchData }
}
