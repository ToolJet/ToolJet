import React, { Suspense, useEffect, createContext, useContext, useCallback, useRef, useState } from 'react';
import { TJLoader } from '@/_ui/TJLoader';
import cx from 'classnames';

const SuspenseCountContext = createContext();

// Added this to track the number of pending Suspense components
// deferCheck: When true, defers the resolution check to handle nested lazy loading (e.g., ModuleContainer -> Table)
export const SuspenseCountProvider = ({ onAllResolved, children, deferCheck = false }) => {
  const pendingCount = useRef(0);
  const hasInitialized = useRef(false);
  const hasResolved = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAndResolve = useCallback(() => {
    if (pendingCount.current === 0 && hasInitialized.current && !hasResolved.current) {
      hasResolved.current = true;
      setIsLoading(false);
      onAllResolved();
    }
  }, [onAllResolved]);

  const increment = useCallback(() => {
    pendingCount.current += 1;
  }, []);

  const decrement = useCallback(() => {
    pendingCount.current -= 1;
    if (deferCheck) {
      // Defer to allow newly mounted component's effects to complete
      setTimeout(() => checkAndResolve(), 0);
    } else {
      checkAndResolve();
    }
  }, [checkAndResolve, deferCheck]);

  // After first render, mark initialized and check if already ready
  useEffect(() => {
    hasInitialized.current = true;
    if (deferCheck) {
      // Defer the check to ensure all child component effects have completed.
      // This fixes a race condition in module preview where cached lazy components
      // don't trigger Suspense fallbacks, causing onAllResolved to fire too early.
      const timeoutId = setTimeout(() => checkAndResolve(), 0);
      return () => clearTimeout(timeoutId);
    } else {
      checkAndResolve();
    }
  }, [checkAndResolve, deferCheck]);

  return (
    <SuspenseCountContext.Provider value={{ increment, decrement, isLoading }}>
      {children}
    </SuspenseCountContext.Provider>
  );
};

// Hook to check if lazy components are still loading
export const useSuspenseLoading = () => {
  const context = useContext(SuspenseCountContext);
  return context?.isLoading ?? false;
};

// Fallback component that tracks mount/unmount
const SuspenseFallbackTracker = ({ fallback }) => {
  const { increment, decrement } = useContext(SuspenseCountContext);

  useEffect(() => {
    increment();
    return () => decrement();
  }, [increment, decrement]);

  return fallback;
};

// Drop-in replacement for Suspense that tracks loading state
export const TrackedSuspense = ({ fallback = null, children }) => {
  const context = useContext(SuspenseCountContext);

  // If no provider, fall back to regular Suspense
  if (!context) {
    return <Suspense fallback={fallback}>{children}</Suspense>;
  }

  return (
    <Suspense fallback={<SuspenseFallbackTracker fallback={fallback} />}>
      {children}
    </Suspense>
  );
};


// Loading overlay shown while lazy components are resolving
export const SuspenseLoadingOverlay = ({ darkMode }) => {
  const isLoading = useSuspenseLoading();

  if (!isLoading) return null;

  return (
    <div
      className={cx('suspense-loading-overlay tw-absolute tw-inset-0 tw-overflow-hidden', { 'theme-dark dark-theme': darkMode })}
    >
      <div className='tw-sticky tw-top-0 tw-h-screen tw-flex tw-items-center tw-justify-center'>
        <div className="suspense-loader-wrapper">
          <TJLoader />
        </div>
      </div>
    </div>
  );
};