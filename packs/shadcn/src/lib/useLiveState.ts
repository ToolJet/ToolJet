import { useCallback, useRef, useState } from 'react';

/** useState whose latest value is readable at once. An event handler's actions run one after another before React
 *  renders again, so an action that reads state from the last render (toggle: set(!checked)) acted on the old value:
 *  two toggles flipped once and fired twice. Read `ref.current` in action handlers instead of the rendered value. */
export const useLiveState = <T,>(initial: T | (() => T)) => {
  const [value, setValue] = useState(initial);
  const ref = useRef(value);
  const set = useCallback((next: T | ((prev: T) => T)) => {
    const resolved = typeof next === 'function' ? (next as (prev: T) => T)(ref.current) : next;
    ref.current = resolved;
    setValue(resolved);
  }, []);
  return [value, set, ref] as const;
};
