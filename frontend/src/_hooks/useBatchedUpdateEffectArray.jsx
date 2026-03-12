import { useEffect, useRef } from 'react';

/**
 * Runs multiple side effects in a single batched `useEffect`, skipping the first render.
 *
 * Each item in the `items` array should be an object with:
 * - `dep`: The dependency value to watch for changes.
 * - `sideEffect`: A function `(prev, curr) => void` that runs whenever `dep` changes,
 *    except on the first render.
 *
 * This is similar to having multiple `useUpdateEffect` calls,
 * but merges them into one hook to reduce scheduling overhead.
 *
 * @template T
 * @param {Array<{ dep: T, sideEffect: (prev: T, curr: T) => void }>} items
 *   The list of dependency/side-effect pairs to track.
 *
 * @example
 * useBatchedUpdateEffectArray([
 *   { dep: count, sideEffect: (prev, curr) => console.log('Count changed:', prev, '→', curr) },
 *   { dep: theme, sideEffect: (prev, curr) => console.log('Theme changed:', prev, '→', curr) }
 * ]);
 */
export function useBatchedUpdateEffectArray(items) {
  const firstRender = useRef(true);
  const prevDeps = useRef(items.map((item) => item.dep));

  useEffect(
    () => {
      // Skip running on first render
      if (firstRender.current) {
        firstRender.current = false;
        prevDeps.current = items.map((item) => item.dep);
        return;
      }

      items.forEach((item, index) => {
        const prev = prevDeps.current[index];

        if (prev !== item.dep) {
          item.sideEffect(prev, item.dep);
          prevDeps.current[index] = item.dep;
        }
      });
    },
    items.map((item) => item.dep)
  );
}
