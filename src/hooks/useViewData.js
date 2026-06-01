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

/** @type {Map<string, { channel: object, refCount: number, subscribeCalled: boolean, pending: Array }>} */
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
  channelRegistry.set(channelName, { channel, refCount: 1, subscribeCalled: false, pending: [] })
  return channel
}

/**
 * Register a handler on a shared channel.
 *
 * - Before subscribe() is called: attach directly via channel.on() so the
 *   handler is included in the initial join payload.
 * - After subscribe() but before SUBSCRIBED: queue in pending to avoid
 *   mutating bindings during the join handshake (causes CHANNEL_ERROR).
 * - After SUBSCRIBED: attach and re-subscribe to send an UPDATE message.
 */
function registerHandler(channelName, event, filter, callback) {
  const entry = channelRegistry.get(channelName)
  if (!entry) return

  if (entry.subscribeCalled) {
    // subscribe() already invoked — queue for flush after SUBSCRIBED
    entry.pending.push({ event, filter, callback })
  } else {
    // subscribe() not yet called — attach directly for initial join payload
    entry.channel.on(event, filter, callback)
  }
}

/**
 * Remove a pending handler before it was flushed (component unmounted early).
 */
function removePendingHandler(channelName, callback) {
  const entry = channelRegistry.get(channelName)
  if (!entry) return
  entry.pending = entry.pending.filter((h) => h.callback !== callback)
}

/**
 * Mark that subscribe() has been called on this channel. Handlers registered
 * after this point will be queued in pending instead of attached directly.
 */
function markSubscribeCalled(channelName) {
  const entry = channelRegistry.get(channelName)
  if (entry) entry.subscribeCalled = true
}

/**
 * Flush pending handlers after channel reaches SUBSCRIBED state.
 * Each handler is added via on().subscribe() which sends an UPDATE
 * subscription message to the server with the new binding.
 */
function flushPendingHandlers(channelName) {
  const entry = channelRegistry.get(channelName)
  if (!entry) return

  const handlers = entry.pending
  entry.pending = []

  for (const { event, filter, callback } of handlers) {
    entry.channel.on(event, filter, callback).subscribe()
  }
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

    const realtimeCallback = (payload) => {
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

    // Register handler — deferred if channel is still joining to avoid
    // mutating bindings during the join handshake (prevents CHANNEL_ERROR).
    registerHandler(
      CHANNEL_NAME,
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: SUPABASE_TABLE_NAME },
      realtimeCallback
    )

    channel.subscribe((status) => {
      if (!active) return
      if (status === 'SUBSCRIBED') {
        console.info('Successfully subscribed to realtime updates')
        flushPendingHandlers(CHANNEL_NAME)
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Failed to subscribe to realtime updates')
        setError('Failed to subscribe to realtime updates')
      }
    })
    // Mark subscribe() as called — handlers registered from now on go to
    // pending to avoid mutating bindings during the join handshake.
    markSubscribeCalled(CHANNEL_NAME)

    return () => {
      active = false
      removePendingHandler(CHANNEL_NAME, realtimeCallback)
      releaseChannel(CHANNEL_NAME)
    }
  }, []) // Mount / unmount only

  return { viewData, error, isLoading, refetch: fetchViewData }
}
