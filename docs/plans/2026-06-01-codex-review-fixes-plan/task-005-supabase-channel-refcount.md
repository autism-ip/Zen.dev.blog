# Task 005: Fix Supabase shared channel lifecycle with reference counting

> **depends-on**: []
> **type**: impl
> **priority**: P2

## BDD Scenario

```gherkin
Scenario: Channel survives individual component unmount
  Given two components both use useViewData
  And both are subscribed to the same Supabase channel
  When one component unmounts
  Then the channel remains active
  And the still-mounted component continues receiving realtime updates
```

## Files to Modify

1. `src/hooks/useViewData.js` — Replace useRef singleton with module-level reference counting

## Steps

### Step 1: Add module-level channel registry

At the top of `useViewData.js` (outside the hook), add a module-level Map to track channel instances and their subscriber counts.

### Step 2: Refactor channel creation and cleanup

Replace the `useRef(null)` pattern with registry-based reference counting:
- On mount: check if channel exists in registry. If yes, increment `refCount`. If no, create channel, store in registry with `refCount: 1`.
- On unmount: decrement `refCount`. If `refCount === 0`, call `supabase.removeChannel(channel)` and delete from registry.

### Step 3: Verify

Run `npm run build` and `npm run test:run` — must pass.

## Verification

1. `npm run lint` — no errors
2. `npm run build` — exit code 0
3. `npm run test:run` — all tests pass

## Acceptance Criteria

- [ ] Module-level `channelRegistry` Map replaces `useRef` for channel tracking
- [ ] Channel is only removed when last subscriber unmounts (`refCount === 0`)
- [ ] Multiple `useViewData` instances share the same channel safely
- [ ] Build and tests pass
