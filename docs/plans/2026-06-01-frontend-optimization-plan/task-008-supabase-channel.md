# Task 008: Supabase Channel Fix

> **depends-on**: [] (no prerequisites)
> **type**: impl
> **priority**: P1

## BDD Scenario

```gherkin
Scenario: Supabase channel lifecycle
  Given the WritingList component mounts
  When it subscribes to Supabase realtime updates
  Then a single global channel should be created
  And the channel should be reused across re-renders
  And the channel should be cleaned up on unmount
  And no memory leaks should occur
```

## Files to Modify

1. `src/hooks/useViewData.js` — Replace global variable with `useRef`-based lifecycle

## Steps

### Step 1: Replace global variable with useRef

In `src/hooks/useViewData.js`, remove the module-level `let globalChannel = null`. Add a `useRef(null)` inside the hook to track the channel instance. This ensures proper lifecycle tied to the component.

### Step 2: Fix cleanup function

The current cleanup function has a race condition: it removes the global channel on unmount, but if multiple instances mount/unmount, they share the same global. With `useRef`, each hook instance manages its own lifecycle. Add a guard to prevent double-subscription: check `if (channelRef.current) return` before creating.

### Step 3: Ensure stable subscription

The subscription setup useEffect should depend on `[]` (mount only). The `setViewData` callback inside the listener uses the functional updater form (already correct), so it doesn't need the state in the dependency array.

## Verification

1. `npm run build` — no build errors
2. Manual: Navigate to /writing, verify view counts load and update in realtime
3. Manual: Navigate away and back — no duplicate subscriptions in Supabase dashboard
4. Manual: Check browser console — no "Channel error" or cleanup warnings

## Acceptance Criteria

- [ ] No module-level `let globalChannel` variable
- [ ] `useRef` tracks channel instance
- [ ] Guard prevents double-subscription
- [ ] Cleanup removes channel on unmount
- [ ] Build succeeds
