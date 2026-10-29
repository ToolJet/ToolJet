import { useCallback, useRef } from 'react';

/**
 * Returns a function with a stable identity that always delegates to the latest
 * version of `fn`. Use this for callbacks that are placed into CodeMirror
 * `extensions` or other reconfigure-effect dependencies: an identity change there
 * forces react-codemirror to dispatch a full editor reconfigure, which permanently
 * grows style-mod's shared stylesheet and degrades the whole session.
 */
export const useStableCallback = <Args extends unknown[], Return>(
  fn: (...args: Args) => Return
): ((...args: Args) => Return) => {
  const ref = useRef(fn);
  ref.current = fn;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((...args: Args) => ref.current(...args), []);
};
