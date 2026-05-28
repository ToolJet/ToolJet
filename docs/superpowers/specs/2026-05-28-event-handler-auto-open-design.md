# Event Handler Auto-Open Design

**Issue:** #5065  
**Date:** 2026-05-28  
**File scope:** `frontend/src/AppBuilder/RightSideBar/Inspector/EventManager.jsx` only

## Problem

When a user adds a new event handler via "+ New event handler", they must manually click the event row to open the edit popover. The issue requests that the edit popover opens automatically on creation, with the Action dropdown pre-opened and "Show Alert" pre-selected.

## Desired Behavior

1. User clicks "+ New event handler" → event type selection popover opens
2. User selects an event type (e.g. "On click") → add menu closes, event created with default `actionId: 'show-alert'`
3. Edit event popover opens automatically for the new event
4. Action dropdown inside the popover is open, showing the action list with "Show Alert" pre-selected
5. User closes or selects an action → dropdown behaves normally from that point

## Approach: Ref flag + length-diff in useEffect (Approach A)

Single file change. No store modifications.

## State & Refs Added

```js
const pendingNewEventFocus = useRef(false);
const pendingActionSelectOpen = useRef(false);
const [openActionSelectForNew, setOpenActionSelectForNew] = useState(false);
```

- `pendingNewEventFocus`: ref set synchronously in `addHandler`, cleared in `useEffect` after detection
- `pendingActionSelectOpen`: ref bridging the two useEffects; avoids triggering action Select in same render as Popover open (Radix portal needs stable DOM rect)
- `openActionSelectForNew`: drives the action Select `open` prop for the newly created event only

## `addHandler` Change

Set the flag before firing the async create:

```js
function addHandler(eventId) {
  // ... existing code ...
  pendingNewEventFocus.current = true;  // set before async call
  createAppVersionEventHandlers({ ... });
}
```

## `useEffect` Changes

**Effect 1** — detect new event, open popover:

```js
useEffect(() => {
  if (_.isEqual(currentEvents, events)) return;

  const sortedEvents = (currentEvents || []).slice().sort((a, b) => a.index - b.index);

  if (pendingNewEventFocus.current && sortedEvents.length > events.length) {
    setFocusedEventIndex(sortedEvents.length - 1);
    pendingActionSelectOpen.current = true;  // arm — don't open select yet
    pendingNewEventFocus.current = false;
  }

  setEvents(sortedEvents, moduleId);
}, [JSON.stringify(currentEvents), moduleId]);
```

**Effect 2** — deferred action select open (separate effect watching `focusedEventIndex`):

```js
useEffect(() => {
  if (focusedEventIndex !== null && pendingActionSelectOpen.current) {
    pendingActionSelectOpen.current = false;
    const timer = setTimeout(() => setOpenActionSelectForNew(true), 0);
    return () => clearTimeout(timer);
  }
}, [focusedEventIndex]);
```

`setTimeout(fn, 0)` defers past the current paint — Radix Popover portal is fully mounted and trigger has a stable DOM rect before the Select dropdown positions itself.
```

## Event Row Popover `onOpenChange` Change

Clear `openActionSelectForNew` when popover closes to prevent stale flag from triggering action select on future manual opens:

```jsx
onOpenChange={(showing) => {
  if (showing) {
    setFocusedEventIndex(index);
    lastFocusedEventIndex.current = index;
  } else {
    setFocusedEventIndex(null);
    setOpenActionSelectForNew(false);  // ← new
  }
  if (typeof popOverCallback === 'function') popOverCallback(showing);
}}
```

## Action Select Change

Make the action `RocketSelect` controlled only for the new event; revert to uncontrolled after first interaction:

```jsx
<RocketSelect
  value={event.actionId}
  onValueChange={(value) => {
    setOpenActionSelectForNew(false);  // clear on selection so it doesn't re-open later
    handlerChanged(index, 'actionId', value);
  }}
  open={openActionSelectForNew && index === focusedEventIndex ? true : undefined}
  onOpenChange={(open) => {
    if (!open && openActionSelectForNew) setOpenActionSelectForNew(false);
  }}
>
```

- `open={true}` only when `openActionSelectForNew && index === focusedEventIndex`
- `open={undefined}` for all other events → fully uncontrolled, no behavior change
- Flag cleared on `onOpenChange(false)` (user closes without selecting) OR on `onValueChange` (user selects an action) — prevents re-open on subsequent clicks to the same event row

## Async Flow

```
addHandler()
  └─ pendingNewEventFocus.current = true
  └─ createAppVersionEventHandlers() [fire-and-forget]
       └─ .then() → addEvent() → store update → currentEvents changes
            └─ useEffect fires
                 └─ sortedEvents.length > events.length + flag set
                      └─ setFocusedEventIndex(last index)
                      └─ setOpenActionSelectForNew(true)
                      └─ pendingNewEventFocus.current = false
```

## Edge Cases

- **Two events created simultaneously:** Not possible via UI (add menu closes after one click). Flag is a ref, not a counter, so concurrent creates would only focus the latest — acceptable.
- **External sync adds event:** Flag is false → length diff ignored, no spurious focus.
- **Create fails (network error):** Flag stays true but never triggers (no length increase). Harmless; cleared on next successful create.
- **Duplicate handler:** Uses `createAppVersionEventHandlers` without setting the flag → no auto-open. Intentional — user is duplicating, not creating fresh.
- **User closes popover before setTimeout fires:** Popover `onOpenChange(false)` clears `openActionSelectForNew` synchronously. setTimeout fires after → `setOpenActionSelectForNew(true)` runs, but next render evaluates `openActionSelectForNew && index === focusedEventIndex` as `true && (n === null)` = false — no harm. However to fully prevent stale state, also clear in Popover `onOpenChange` when `!showing`.

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/AppBuilder/RightSideBar/Inspector/EventManager.jsx` | Add ref, state, modify `addHandler`, `useEffect`, action `RocketSelect` |
