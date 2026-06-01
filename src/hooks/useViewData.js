import { useCallback, useEffect, useRef, useState } from 'react'

import { SUPABASE_TABLE_NAME } from '@/lib/constants'
import supabase from '@/lib/supabase/public'

// ---------------------------------------------------------------------------
// Module-level channel registry — reference-counted shared channel lifecycle
// ---------------------------------------------------------------------------
// Supabase postgres_changes bindings are negotiated ONLY in the initial join.
// Adding handlers after subscribe() via channel.on().subscribe() does NOT
// trigger a new join — the server never learns about the new binding.
//
// Strategy:
//   1. Always defer subscribe() with a microtask so all synchronous mounts
//      in the same React render batch register their handlers first.
//   2. If a new consumer mounts after the channel is already SUBSCRIBED,
//      tear down and rebuild the channel with all accumulated handlers.
// ---------------------------------------------------------------------------

const CHANNEL_NAME = 'supabase_realtime'

/**
 * @type {Map<string, {
 *   channel: object,
 *   refCount: number,
 *   subscribed: boolean,
 *   pending: Array<{ event: string, filter: object, callback: Function }>,
 *   deferredSubscribeId: number | null
 * }>}
 */
const channelRegistry = new Map()

/**
 * Acquire a shared Supabase channel. Creates it if absent, increments refCount.
 */
function acquireChannel(channelName) {
  const entry = channelRegistry.get(channelName)

  if (entry) {
    entry.refCount += 1
    return entry.channel
  }

  const channel = supabase.channel(channelName)
  channelRegistry.set(channelName, {
    channel,
    refCount: 1,
    subscribed: false,
    pending: [],
    deferredSubscribeId: null
  })
  return channel
}

/**
 * Register a handler and schedule subscribe. If the channel is already
 * subscribed (late-joining consumer), rebuild the channel to negotiate
 * all bindings in a fresh join.
 */
function registerAndSubscribe(channelName, event, filter, callback) {
  const entry = channelRegistry.get(channelName)
  if (!entry) return

  if (entry.subscribed) {
    // Channel already subscribed — rebuild with all handlers
    rebuildChannel(channelName, { event, filter, callback })
    return
  }

  // Channel not yet subscribed — add handler and (re-)schedule subscribe
  entry.pending.push({ event, filter, callback })
  scheduleSubscribe(channelName)
}

/**
 * Schedule subscribe() as a microtask. All synchronous mounts register
 * their handlers before the microtask fires, so the initial join includes
 * every binding.
 */
function scheduleSubscribe(channelName) {
  const entry = channelRegistry.get(channelName)
  if (!entry) return

  if (entry.deferredSubscribeId != null) {
    clearTimeout(entry.deferredSubscribeId)
  }

  entry.deferredSubscribeId = setTimeout(() => {
    entry.deferredSubscribeId = null

    if (entry.pending.length === 0) return
    if (entry.subscribed) return

    // Attach all pending handlers to channel
    for (const { event, filter, callback } of entry.pending) {
      entry.channel.on(event, filter, callback)
    }
    entry.pending = []
    entry.subscribed = true
    entry.channel.subscribe()
  }, 0)
}

/**
 * Tear down and rebuild the channel with all existing handlers plus a new one.
 * Called when a new consumer mounts after the channel was already subscribed,
 * because Supabase only negotiates bindings in the initial join.
 */
function rebuildChannel(channelName, newHandler) {
  const oldEntry = channelRegistry.get(channelName)
  if (!oldEntry) return

  // Collect all registered postgres_changes handlers from the old channel
  const oldBindings = oldEntry.channel.bindings?.postgres_changes ?? []
  const oldHandlers = oldBindings.map((b) => ({
    event: 'postgres_changes',
    filter: b.filter,
    callback: b.callback
  }))

  // Tear down old channel
  if (oldEntry.deferredSubscribeId != null) {
    clearTimeout(oldEntry.deferredSubscribeId)
  }
  supabase.removeChannel(oldEntry.channel)

  // Create fresh channel with all handlers
  const newChannel = supabase.channel(channelName)
  for (const { filter, callback } of oldHandlers) {
    newChannel.on('postgres_changes', filter, callback)
  }
  newChannel.on(newHandler.event, newHandler.filter, newHandler.callback)

  channelRegistry.set(channelName, {
    channel: newChannel,
    refCount: oldEntry.refCount,
    subscribed: true,
    pending: [],
    deferredSubscribeId: null
  })

  newChannel.subscribe()
}

/**
 * Unregister a handler. If the channel is not yet subscribed, remove from
 * pending queue. If pending becomes empty, cancel the deferred subscribe.
 */
function unregisterHandler(channelName, callback) {
  const entry = channelRegistry.get(channelName)
  if (!entry) return

  if (!entry.subscribed) {
    entry.pending = entry.pending.filter((h) => h.callback !== callback)

    // Cancel deferred subscribe if no handlers remain
    if (entry.pending.length === 0 && entry.deferredSubscribeId != null) {
      clearTimeout(entry.deferredSubscribeId)
      entry.deferredSubscribeId = null
    }
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
    if (entry.deferredSubscribeId != null) {
      clearTimeout(entry.deferredSubscribeId)
    }
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

    acquireChannel(CHANNEL_NAME)

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

    // Register handler and schedule subscribe. All synchronous mounts in
    // the same render batch accumulate handlers before the microtask fires.
    // Late-joining consumers trigger a channel rebuild.
    registerAndSubscribe(
      CHANNEL_NAME,
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: SUPABASE_TABLE_NAME },
      realtimeCallback
    )

    return () => {
      active = false
      unregisterHandler(CHANNEL_NAME, realtimeCallback)
      releaseChannel(CHANNEL_NAME)
    }
  }, []) // Mount / unmount only

  return { viewData, error, isLoading, refetch: fetchViewData }
}
