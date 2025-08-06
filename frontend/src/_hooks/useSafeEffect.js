/**
 * useSafeEffect - Safe useEffect that prevents infinite re-render loops
 * 
 * This addresses one of the major causes of memory leaks in ToolJet:
 * - Prevents infinite re-renders from unstable dependencies
 * - Deep equality comparison for objects/arrays
 * - Automatic cleanup tracking
 * - Performance optimization
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { isEqual } from 'lodash';

/**
 * Deep equality comparison for dependencies
 */
const usePreviousValue = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

/**
 * Stable dependency array that prevents infinite loops
 */
const useStableDeps = (deps) => {
  const prevDeps = usePreviousValue(deps);

  return useMemo(() => {
    if (!prevDeps) return deps;
    if (deps.length !== prevDeps.length) return deps;

    // Deep equality check for each dependency
    for (let i = 0; i < deps.length; i++) {
      if (!isEqual(deps[i], prevDeps[i])) {
        return deps;
      }
    }

    return prevDeps;
  }, [deps, prevDeps]);
};

/**
 * Safe useEffect that prevents memory leaks from infinite re-renders
 */
export const useSafeEffect = (effect, deps = [], options = {}) => {
  const {
    deep = true,        // Use deep equality for dependencies
    once = false,       // Run only once (ignore deps)
    debounce = 0,       // Debounce the effect
    throttle = 0,       // Throttle the effect
    cleanup = true      // Track cleanup automatically
  } = options;

  const stableDeps = deep ? useStableDeps(deps) : deps;
  const debounceRef = useRef(null);
  const throttleRef = useRef(null);
  const cleanupRef = useRef(null);
  const runCountRef = useRef(0);

  useEffect(() => {
    // If once=true and already ran, skip
    if (once && runCountRef.current > 0) {
      return;
    }

    runCountRef.current++;

    const runEffect = () => {
      // Clean up previous effect if exists
      if (cleanup && cleanupRef.current) {
        try {
          cleanupRef.current();
        } catch (error) {
          console.warn('useSafeEffect cleanup error:', error);
        }
        cleanupRef.current = null;
      }

      try {
        const result = effect();

        // Store cleanup function if returned
        if (cleanup && typeof result === 'function') {
          cleanupRef.current = result;
        }
      } catch (error) {
        console.error('useSafeEffect error:', error);
      }
    };

    // Apply debounce if specified
    if (debounce > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(runEffect, debounce);

      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }

    // Apply throttle if specified
    if (throttle > 0) {
      if (throttleRef.current) {
        return; // Skip if still throttled
      }

      throttleRef.current = setTimeout(() => {
        throttleRef.current = null;
      }, throttle);
    }

    runEffect();

    // Cleanup on unmount
    return () => {
      if (cleanup && cleanupRef.current) {
        try {
          cleanupRef.current();
        } catch (error) {
          console.warn('useSafeEffect unmount cleanup error:', error);
        }
      }

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };

    // Use stable deps or empty array for once
  }, once ? [] : stableDeps);
};

/**
 * Safe useCallback that prevents recreation on every render
 */
export const useSafeCallback = (callback, deps = []) => {
  const stableDeps = useStableDeps(deps);
  return useCallback(callback, stableDeps);
};

/**
 * Safe useMemo that prevents recalculation on every render
 */
export const useSafeMemo = (factory, deps = []) => {
  const stableDeps = useStableDeps(deps);
  return useMemo(factory, stableDeps);
};

/**
 * Hook for safely updating state from async operations
 */
export const useSafeAsyncState = (initialState) => {
  const [state, setState] = useState(initialState);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((newState) => {
    if (mountedRef.current) {
      setState(newState);
    }
  }, []);

  return [state, safeSetState];
};

/**
 * Hook for handling async operations safely
 */
export const useSafeAsync = () => {
  const mountedRef = useRef(true);
  const pendingPromises = useRef(new Set());

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      // Cancel all pending promises
      pendingPromises.current.forEach(promise => {
        if (promise && typeof promise.cancel === 'function') {
          promise.cancel();
        }
      });
      pendingPromises.current.clear();
    };
  }, []);

  const safeAsync = useCallback(async (asyncFn) => {
    if (!mountedRef.current) return;

    let promise;
    try {
      promise = asyncFn();
      pendingPromises.current.add(promise);

      const result = await promise;

      pendingPromises.current.delete(promise);

      return mountedRef.current ? result : undefined;
    } catch (error) {
      if (promise) {
        pendingPromises.current.delete(promise);
      }

      if (mountedRef.current) {
        throw error;
      }
    }
  }, []);

  return { safeAsync, isMounted: () => mountedRef.current };
};

export default useSafeEffect;
