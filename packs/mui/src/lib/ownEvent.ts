import { useCallback, useRef } from 'react';

// How many change events one widget fires before the page gets a turn. The host runs an event handler's actions as
// microtasks, so an onChange handler that calls the widget's own toggle (or setValue) ran toggle, onChange, toggle, ...
// without ever yielding: the editor and the app froze. The pack cannot tell that loop from a handler that calls the
// action many times in one frame (the action fuzz calls it 50 times and expects 50 events), so it caps the count above
// any real burst instead: a self-toggling handler runs 100 times, then the page answers again.
const MAX_PER_TASK = 100;

/** Fires a widget's change events, up to MAX_PER_TASK of them before the next task: a handler that changes its own
 *  widget stops there instead of looping. The change itself always applies; only the events past the cap are
 *  skipped. The same file in every pack (keep the copies the same). */
export const useOwnEventGuard = () => {
  const fired = useRef(0);
  return useCallback((fire: () => void) => {
    if (fired.current >= MAX_PER_TASK) return;
    if (fired.current === 0) setTimeout(() => (fired.current = 0), 0);
    fired.current += 1;
    fire();
  }, []);
};
