import { useCallback, useEffect, useRef, useState } from 'react'

import { SUPABASE_TABLE_NAME } from '@/lib/constants'
import supabase from '@/lib/supabase/public'

// ---------------------------------------------------------------------------
// Module-level channel registry — reference-counted shared channel lifecycle
// ---------------------------------------------------------------------------
// Problem: useRef per hook instance means each component owns its channel ref.
// When component A unmounts, it removes the channel, killing the subscription
// for still-mounted component B that shares the same channel name.
//
// Solution: Module-level Map tracks channel instances by name. Each hook mount
// increments refCount; each unmount decrements. Channel is removed from
// Supabase only when the last subscriber detaches (refCount hits 0).
// ---------------------------------------------------------------------------

const CHANNEL_NAME = 'supabase_realtime'

/** @type {Map<string, { channel: object, refCount: number }>} */
const channelRegistry = new Map()

/**
 * Acquire a shared Supabase channel. Creates it if absent, increments refCount.
 * Returns the channel instance.
 */
function acquireChannel(channelName) {
  const entry = channelRegistry.get(channelName)

  if (entry) {
    entry.refCount += 1
    return entry.channel
  }

  const channel = supabase.channel(channelName)
  channelRegistry.set(channelName, { channel, refCount: 1 })
  return channel
}

/**
 * Release a shared Supabase channel. Decrements refCount; removes from
 * Supabase and deletes from registry when refCount reaches 0.
 */
function releaseChannel(channelName) {
  const entry = channelRegistry.get(channelName)
  if (!entry) return

  entry.refCount -= 1

  if (entry.refCount <= 0) {
    supabase.removeChannel(entry.channel)
    channelRegistry.delete(channelName)
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useViewData = (slug) => {
  const [viewData, setViewData] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const setViewDataRef = useRef(setViewData)

  // Keep ref in sync so the realtime callback always uses the latest setter
  setViewDataRef.current = setViewData

  // ---- Initial data fetch ------------------------------------------------
  const fetchViewData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const supabaseQuery = supabase.from(SUPABASE_TABLE_NAME).select('slug, view_count')
      if (slug) supabaseQuery.eq('slug', slug)
      const { data: supabaseData, error: queryError } = await supabaseQuery

      if (queryError) throw queryError
      if (supabaseData) setViewData(supabaseData)
    } catch (error) {
      console.error('Error fetching view data from Supabase:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchViewData()
  }, [fetchViewData])

  // ---- Realtime subscription (reference-counted) -------------------------
  useEffect(() => {
    let active = true

    const channel = acquireChannel(CHANNEL_NAME)

    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: SUPABASE_TABLE_NAME
      },
      (payload) => {
        if (!active) return
        if (!payload?.new?.slug) return

        setViewDataRef.current((prev) => {
          if (!prev) return null

          const index = prev.findIndex((item) => item.slug === payload.new.slug)
          if (index === -1) return [...prev, payload.new]

          // Skip if data unchanged
          if (prev[index].view_count === payload.new.view_count) {
            return prev
          }

          const newData = [...prev]
          newData[index] = payload.new
          return newData
        })
      }
    )

    channel.subscribe((status) => {
      if (!active) return
      if (status === 'SUBSCRIBED') {
        console.info('Successfully subscribed to realtime updates')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Failed to subscribe to realtime updates')
        setError('Failed to subscribe to realtime updates')
      }
    })

    return () => {
      active = false
      releaseChannel(CHANNEL_NAME)
    }
  }, []) // Mount / unmount only

  return { viewData, error, isLoading, refetch: fetchViewData }
}
