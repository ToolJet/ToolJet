import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Manages the auto-open behavior when a new event handler is created:
 * 1. Opens the edit popover for the newly created event
 * 2. Opens the Action dropdown inside that popover with Show Alert pre-selected
 *
 * Flow:
 *   markEventCreationPending()       ← call before createAppVersionEventHandlers
 *   onEventHandlersUpdated(...)      ← call from the useEffect watching currentEvents
 *   [popover opens, then setTimeout] ← deferred so Radix portal has a stable DOM rect
 *   autoOpenActionSelect = true      ← action Select renders open
 *   cancelPendingEventCreation()     ← call when event creation fails
 *   dismissEventPopoverAutoOpen()    ← call on popover close / action select / value pick
 */
export function useNewEventAutoPopoverOpen(focusedEventIndex, setFocusedEventIndex) {
  // Drives the controlled `open` prop on the action RocketSelect for the new event only
  const [autoOpenActionSelect, setAutoOpenActionSelect] = useState(false);

  // Set true in markEventCreationPending; cleared once the new event is detected
  const pendingNewEventFocus = useRef(false);

  // Bridge between the two effects: set after popover focus, consumed by the deferred setTimeout effect
  const pendingActionSelectOpen = useRef(false);

  // Deferred so the Radix Popover portal is fully mounted before the Select dropdown positions itself.
  // setTimeout(fn, 0) pushes past the current paint — trigger has a stable DOM rect by then.
  useEffect(() => {
    if (focusedEventIndex !== null && pendingActionSelectOpen.current) {
      pendingActionSelectOpen.current = false;
      const timer = setTimeout(() => setAutoOpenActionSelect(true), 0);
      return () => clearTimeout(timer);
    }
  }, [focusedEventIndex]);

  /** Call synchronously in addHandler before createAppVersionEventHandlers fires. */
  const markEventCreationPending = useCallback(() => {
    pendingNewEventFocus.current = true;
  }, []);

  const cancelPendingEventCreation = useCallback(() => {
    pendingNewEventFocus.current = false;
    pendingActionSelectOpen.current = false;
    setAutoOpenActionSelect(false);
  }, []);

  /**
   * Call from the useEffect that syncs currentEvents → local events state.
   * Detects the length increase caused by a new event and focuses its popover.
   */
  const onEventHandlersUpdated = useCallback(
    (sortedEvents, prevEvents) => {
      if (pendingNewEventFocus.current && sortedEvents.length > prevEvents.length) {
        setFocusedEventIndex(sortedEvents.length - 1);
        pendingActionSelectOpen.current = true;
        pendingNewEventFocus.current = false;
      }
    },
    [setFocusedEventIndex]
  );

  /**
   * Call in three places to prevent stale auto-open state:
   * - Popover onOpenChange(!showing)
   * - Action Select onOpenChange(!open)
   * - Action Select onValueChange (user picked an action without explicitly closing dropdown)
   */
  const dismissEventPopoverAutoOpen = useCallback(() => {
    setAutoOpenActionSelect(false);
  }, []);

  return {
    autoOpenActionSelect,
    markEventCreationPending,
    cancelPendingEventCreation,
    onEventHandlersUpdated,
    dismissEventPopoverAutoOpen,
  };
}
