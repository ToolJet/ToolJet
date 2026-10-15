import { useRef } from 'react';
import { sameValue } from './equality';

/**
 * `value`, or the previous one while its content is the same: a hook dependency that changes when the content does —
 * what a `JSON.stringify(value)` key gave — without serializing it (a whole dataset) on every render. Contents are
 * compared only when the reference changes. (A bound literal like `{{[1, 2]}}` resolves to a new array each time, so
 * the reference alone would re-run effects that didn't run before.)
 */
export function useContentStable(value) {
  const stable = useRef(value);
  if (stable.current !== value && !sameValue(stable.current, value)) stable.current = value;
  return stable.current;
}
