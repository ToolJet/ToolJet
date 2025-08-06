/**
 * useMemoryCleanup - React hook for automatic memory leak prevention
 * 
 * This hook provides automatic cleanup for common memory leak sources:
 * - Event listeners
 * - Observers (Resize, Intersection, Mutation)
 * - Subscriptions
 * - Timers
 * - Component state references
 */

import { useEffect, useRef, useCallback } from 'react';

export const useMemoryCleanup = (componentId) => {
  const cleanupFunctionsRef = useRef([]);
  const componentIdRef = useRef(componentId || `component_${Math.random().toString(36).substr(2, 9)}`);

  /**
   * Add a cleanup function to be called on unmount
   */
  const addCleanup = useCallback((cleanupFn) => {
    if (typeof cleanupFn === 'function') {
      cleanupFunctionsRef.current.push(cleanupFn);
    }
  }, []);

  /**
   * Remove a specific cleanup function
   */
  const removeCleanup = useCallback((cleanupFn) => {
    const index = cleanupFunctionsRef.current.indexOf(cleanupFn);
    if (index > -1) {
      cleanupFunctionsRef.current.splice(index, 1);
    }
  }, []);

  /**
   * Cleanup all registered functions
   */
  const cleanup = useCallback(() => {
    let cleaned = 0;

    cleanupFunctionsRef.current.forEach((cleanupFn, index) => {
      try {
        cleanupFn();
        cleaned++;
      } catch (error) {
        console.warn(`Cleanup function ${index} failed:`, error);
      }
    });

    cleanupFunctionsRef.current = [];

    if (cleaned > 0) {
      console.log(`🧹 Component ${componentIdRef.current}: cleaned ${cleaned} items`);
    }
  }, []);

  /**
   * Safe event listener with automatic cleanup
   */
  const addEventListenerSafe = useCallback((target, eventType, handler, options) => {
    if (!target || typeof target.addEventListener !== 'function') {
      console.warn('Invalid event target provided to addEventListenerSafe');
      return;
    }

    target.addEventListener(eventType, handler, options);

    const cleanupFn = () => {
      if (target && typeof target.removeEventListener === 'function') {
        target.removeEventListener(eventType, handler, options);
      }
    };

    addCleanup(cleanupFn);
    return cleanupFn;
  }, [addCleanup]);

  /**
   * Safe ResizeObserver with automatic cleanup
   */
  const createResizeObserver = useCallback((callback) => {
    if (typeof window === 'undefined' || !window.ResizeObserver) {
      return null;
    }

    const observer = new ResizeObserver(callback);

    const cleanupFn = () => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect ResizeObserver:', error);
      }
    };

    addCleanup(cleanupFn);

    return {
      observer,
      cleanup: cleanupFn
    };
  }, [addCleanup]);

  /**
   * Safe IntersectionObserver with automatic cleanup
   */
  const createIntersectionObserver = useCallback((callback, options) => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      return null;
    }

    const observer = new IntersectionObserver(callback, options);

    const cleanupFn = () => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect IntersectionObserver:', error);
      }
    };

    addCleanup(cleanupFn);

    return {
      observer,
      cleanup: cleanupFn
    };
  }, [addCleanup]);

  /**
   * Safe MutationObserver with automatic cleanup
   */
  const createMutationObserver = useCallback((callback) => {
    if (typeof window === 'undefined' || !window.MutationObserver) {
      return null;
    }

    const observer = new MutationObserver(callback);

    const cleanupFn = () => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect MutationObserver:', error);
      }
    };

    addCleanup(cleanupFn);

    return {
      observer,
      cleanup: cleanupFn
    };
  }, [addCleanup]);

  /**
   * Safe interval with automatic cleanup
   */
  const setIntervalSafe = useCallback((callback, delay) => {
    const intervalId = setInterval(callback, delay);

    const cleanupFn = () => {
      clearInterval(intervalId);
    };

    addCleanup(cleanupFn);
    return cleanupFn;
  }, [addCleanup]);

  /**
   * Safe timeout with automatic cleanup
   */
  const setTimeoutSafe = useCallback((callback, delay) => {
    const timeoutId = setTimeout(callback, delay);

    const cleanupFn = () => {
      clearTimeout(timeoutId);
    };

    addCleanup(cleanupFn);
    return cleanupFn;
  }, [addCleanup]);

  /**
   * Safe subscription handler (for Zustand, RxJS, etc.)
   */
  const addSubscription = useCallback((subscription) => {
    if (!subscription) return;

    let cleanupFn;

    if (typeof subscription === 'function') {
      // It's an unsubscribe function
      cleanupFn = subscription;
    } else if (typeof subscription.unsubscribe === 'function') {
      // It's a subscription object
      cleanupFn = () => subscription.unsubscribe();
    } else if (typeof subscription.disconnect === 'function') {
      // It's an observer-like object
      cleanupFn = () => subscription.disconnect();
    } else if (typeof subscription.close === 'function') {
      // It's a connection-like object
      cleanupFn = () => subscription.close();
    } else {
      console.warn('Unknown subscription type provided to addSubscription');
      return;
    }

    addCleanup(cleanupFn);
    return cleanupFn;
  }, [addCleanup]);

  /**
   * Register component with global memory leak detector
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && window.memoryLeakDetector) {
      window.memoryLeakDetector.registerComponentCleanup(componentIdRef.current, cleanup);
    }

    return () => {
      if (typeof window !== 'undefined' && window.memoryLeakDetector) {
        window.memoryLeakDetector.unregisterComponentCleanup(componentIdRef.current);
      }
    };
  }, [cleanup]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    componentId: componentIdRef.current,
    addCleanup,
    removeCleanup,
    cleanup,
    addEventListenerSafe,
    createResizeObserver,
    createIntersectionObserver,
    createMutationObserver,
    setIntervalSafe,
    setTimeoutSafe,
    addSubscription
  };
};

/**
 * Higher-order component that automatically handles memory cleanup
 */
export const withMemoryCleanup = (WrappedComponent, componentName) => {
  const MemoryCleanupWrapper = (props) => {
    const memoryCleanup = useMemoryCleanup(componentName);

    return (
      <WrappedComponent
        {...props}
        memoryCleanup={memoryCleanup}
      />
    );
  };

  MemoryCleanupWrapper.displayName = `withMemoryCleanup(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;

  return MemoryCleanupWrapper;
};

/**
 * Hook specifically for ToolJet component lifecycle management
 */
export const useToolJetComponentCleanup = (componentId, componentType = 'unknown') => {
  const memoryCleanup = useMemoryCleanup(componentId);
  const storeSubscriptions = useRef(new Set());

  /**
   * Add store subscription with automatic cleanup
   */
  const addStoreSubscription = useCallback((store, selector, callback) => {
    if (!store || typeof store.subscribe !== 'function') {
      console.warn('Invalid store provided to addStoreSubscription');
      return;
    }

    const unsubscribe = store.subscribe(selector, callback);
    storeSubscriptions.current.add(unsubscribe);

    memoryCleanup.addCleanup(() => {
      storeSubscriptions.current.delete(unsubscribe);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });

    return unsubscribe;
  }, [memoryCleanup]);

  /**
   * Cleanup all store subscriptions
   */
  const cleanupStoreSubscriptions = useCallback(() => {
    storeSubscriptions.current.forEach(unsubscribe => {
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.warn('Failed to unsubscribe from store:', error);
      }
    });
    storeSubscriptions.current.clear();
  }, []);

  // Add store cleanup to main cleanup
  useEffect(() => {
    memoryCleanup.addCleanup(cleanupStoreSubscriptions);
  }, [memoryCleanup, cleanupStoreSubscriptions]);

  return {
    ...memoryCleanup,
    addStoreSubscription,
    cleanupStoreSubscriptions,
    componentType
  };
};

export default useMemoryCleanup;
